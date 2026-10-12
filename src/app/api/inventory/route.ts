import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { verifyFirebaseBearerToken } from "@/lib/firebase/admin";
import { getDb } from "@/lib/mongodb";
import { crossedLowThreshold, notifyLowStock } from "@/lib/notifications/lowStock";

export async function GET(request: Request) {
  const decodedToken = await verifyFirebaseBearerToken(
    request.headers.get("authorization"),
  );

  if (!decodedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getDb();
    const items = await db
      .collection("inventory")
      .find({ userId: decodedToken.uid })
      .toArray();

    return NextResponse.json({ items });
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
    const { name, stock, threshold, unit, costPrice, businessId } = await request.json();

    if (!name || stock === undefined || threshold === undefined || !unit) {
      return NextResponse.json(
        { error: "Name, stock, threshold, and unit are required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const item = {
      userId: decodedToken.uid,
      businessId,
      name,
      stock: Number(stock),
      threshold: Number(threshold),
      unit,
      costPrice: costPrice !== undefined ? Math.max(0, Number(costPrice)) : 0,
      createdAt: new Date().toISOString(),
    };

    const result = await db.collection("inventory").insertOne(item);

    if (item.stock < item.threshold) {
      notifyLowStock(decodedToken.uid, item).catch((err) =>
        console.error("Low stock notify failed:", err),
      );
    }

    return NextResponse.json({
      item: {
        ...item,
        _id: result.insertedId.toString(),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const decodedToken = await verifyFirebaseBearerToken(
    request.headers.get("authorization"),
  );

  if (!decodedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { _id, name, stock, threshold, unit, costPrice } = await request.json();

    if (!_id || !ObjectId.isValid(String(_id))) {
      return NextResponse.json({ error: "A valid Item ID is required" }, { status: 400 });
    }

    const db = await getDb();
    const before = await db
      .collection("inventory")
      .findOne({ _id: new ObjectId(_id), userId: decodedToken.uid });

    if (!before) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const updateData: Record<string, string | number> = {};
    if (name !== undefined) updateData.name = String(name);
    if (stock !== undefined) updateData.stock = Number(stock);
    if (threshold !== undefined) updateData.threshold = Number(threshold);
    if (unit !== undefined) updateData.unit = String(unit);
    if (costPrice !== undefined) updateData.costPrice = Math.max(0, Number(costPrice));

    const result = await db.collection("inventory").findOneAndUpdate(
      { _id: new ObjectId(_id), userId: decodedToken.uid },
      { $set: updateData },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (
      crossedLowThreshold(
        { stock: Number(before.stock), threshold: Number(before.threshold) },
        { stock: Number(result.stock), threshold: Number(result.threshold) },
      )
    ) {
      notifyLowStock(decodedToken.uid, {
        name: result.name,
        stock: result.stock,
        threshold: result.threshold,
        unit: result.unit,
      }).catch((err) => console.error("Low stock notify failed:", err));
    }

    return NextResponse.json({ item: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const decodedToken = await verifyFirebaseBearerToken(
    request.headers.get("authorization"),
  );

  if (!decodedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    let id = url.searchParams.get("id");

    if (!id) {
      // Try body
      const body = await request.json().catch(() => ({}));
      id = body.id || body._id;
    }

    if (!id || !ObjectId.isValid(String(id))) {
      return NextResponse.json({ error: "A valid Item ID is required" }, { status: 400 });
    }

    const db = await getDb();
    const result = await db
      .collection("inventory")
      .deleteOne({ _id: new ObjectId(id), userId: decodedToken.uid });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
