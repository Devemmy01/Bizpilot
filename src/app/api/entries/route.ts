import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { calculateBusinessMetrics } from "@/lib/calculations";
import { verifyFirebaseBearerToken } from "@/lib/firebase/admin";
import { getDb } from "@/lib/mongodb";
import { crossedLowThreshold, notifyLowStock } from "@/lib/notifications/lowStock";
import type { BusinessEntryInput, SaleLine } from "@/types/business";

export async function GET(request: Request) {
  const decodedToken = await verifyFirebaseBearerToken(
    request.headers.get("authorization"),
  );

  if (!decodedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getDb();
    const entries = await db
      .collection("entries")
      .find({ userId: decodedToken.uid })
      .sort({ date: -1, createdAt: -1 })
      .limit(30)
      .toArray();

    return NextResponse.json({ entries });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const decodedToken = await verifyFirebaseBearerToken(
    request.headers.get("authorization"),
  );

  if (!decodedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { date, businessId, saleLines: rawSaleLines, ...inputData } = body;

    const saleLines: SaleLine[] = Array.isArray(rawSaleLines)
      ? rawSaleLines
          .map((l: Partial<SaleLine>) => ({
            itemId: String(l.itemId ?? ""),
            itemName: String(l.itemName ?? ""),
            quantity: Number(l.quantity ?? 0),
            unit: String(l.unit ?? ""),
            amount: Math.max(0, Number(l.amount ?? 0)),
            staffId: l.staffId ? String(l.staffId) : undefined,
            staffName: l.staffName ? String(l.staffName) : undefined,
          }))
          .filter((l: SaleLine) => l.itemId && l.quantity > 0)
      : [];

    const salesTotal = saleLines.reduce((sum, l) => sum + l.amount, 0);

    // Validate inputs — sales is now derived entirely from itemized sale lines
    const input: BusinessEntryInput = {
      sales: salesTotal,
      foodCost: Number(inputData.foodCost || 0),
      staffExpenses: Number(inputData.staffExpenses || 0),
      otherExpenses: Number(inputData.otherExpenses || 0),
    };

    const metrics = calculateBusinessMetrics(input);

    // Format date as YYYY-MM-DD
    const entryDate = date || new Date().toISOString().split("T")[0];

    const entry = {
      ...input,
      ...metrics,
      userId: decodedToken.uid,
      businessId,
      date: entryDate,
      createdAt: new Date().toISOString(),
      saleLines,
    };

    const db = await getDb();
    const query = { userId: decodedToken.uid, date: entryDate };

    // Re-saving the same date must not double-count: reverse whatever the previous
    // save for this date deducted/credited, then apply the new sale lines as a net delta.
    const previousEntry = await db.collection("entries").findOne(query);
    const previousLines: SaleLine[] = previousEntry?.saleLines ?? [];

    // ── Inventory deduction (quantity sold per item) ──
    const touchedItemIds = new Set<string>([
      ...previousLines.map((l) => l.itemId),
      ...saleLines.map((l) => l.itemId),
    ]);

    const updatedInventory: Record<string, unknown>[] = [];
    // Stock actually deducted per item by this save. Stock never goes below 0, so this can be
    // less than the quantity sold; re-saving gives back exactly this amount, not the sale quantity.
    const inventoryApplied: Record<string, number> = {};

    for (const itemId of touchedItemIds) {
      if (!ObjectId.isValid(itemId)) continue;

      const before = await db
        .collection("inventory")
        .findOne({ _id: new ObjectId(itemId), userId: decodedToken.uid });
      if (!before) continue;

      // Entries saved before inventoryApplied existed fall back to the sold quantity
      const reversedQty = previousEntry?.inventoryApplied
        ? Number(previousEntry.inventoryApplied[itemId] ?? 0)
        : previousLines.filter((l) => l.itemId === itemId).reduce((a, l) => a + l.quantity, 0);
      const newQty = saleLines.filter((l) => l.itemId === itemId).reduce((a, l) => a + l.quantity, 0);
      const available = Math.max(0, Number(before.stock) + reversedQty);
      const applied = Math.min(newQty, available);
      if (applied > 0) inventoryApplied[itemId] = applied;

      const newStock = available - applied;
      if (newStock === Number(before.stock)) continue;

      const after = await db.collection("inventory").findOneAndUpdate(
        { _id: new ObjectId(itemId), userId: decodedToken.uid },
        { $set: { stock: newStock } },
        { returnDocument: "after" },
      );

      if (after) {
        updatedInventory.push({ ...after, _id: after._id.toString() });
        if (
          crossedLowThreshold(
            { stock: Number(before.stock), threshold: Number(before.threshold) },
            { stock: Number(after.stock), threshold: Number(after.threshold) },
          )
        ) {
          notifyLowStock(decodedToken.uid, {
            name: after.name,
            stock: after.stock,
            threshold: after.threshold,
            unit: after.unit,
          }).catch((err) => console.error("Low stock notify failed:", err));
        }
      }
    }

    // ── Staff sales attribution (amount credited per staff member) ──
    const touchedStaffIds = new Set<string>([
      ...previousLines.filter((l) => l.staffId).map((l) => l.staffId as string),
      ...saleLines.filter((l) => l.staffId).map((l) => l.staffId as string),
    ]);

    const updatedStaff: Record<string, unknown>[] = [];

    for (const staffId of touchedStaffIds) {
      if (!ObjectId.isValid(staffId)) continue;

      const beforeStaff = await db
        .collection("staff")
        .findOne({ _id: new ObjectId(staffId), userId: decodedToken.uid });
      if (!beforeStaff) continue;

      const reversedAmount = previousLines
        .filter((l) => l.staffId === staffId)
        .reduce((a, l) => a + l.amount, 0);
      const newAmount = saleLines.filter((l) => l.staffId === staffId).reduce((a, l) => a + l.amount, 0);
      const netDelta = newAmount - reversedAmount;
      if (netDelta === 0) continue;

      const newSales = Math.max(0, Number(beforeStaff.sales) + netDelta);
      const afterStaff = await db.collection("staff").findOneAndUpdate(
        { _id: new ObjectId(staffId), userId: decodedToken.uid },
        { $set: { sales: newSales } },
        { returnDocument: "after" },
      );

      if (afterStaff) {
        updatedStaff.push({ ...afterStaff, _id: afterStaff._id.toString() });
      }
    }

    await db.collection("entries").updateOne(
      query,
      { $set: { ...entry, inventoryApplied } },
      { upsert: true }
    );

    const savedEntry = await db.collection("entries").findOne(query);

    return NextResponse.json({
      entry: savedEntry ? {
        ...savedEntry,
        _id: savedEntry._id.toString(),
      } : entry,
      updatedInventory,
      updatedStaff,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
