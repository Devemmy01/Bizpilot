import { NextResponse } from "next/server";
import { verifyFirebaseBearerToken } from "@/lib/firebase/admin";
import { getDb } from "@/lib/mongodb";
import {
  buildMonthlyAggregates,
  buildWeeklyAggregates,
  getBestDays,
  getLowDays,
  getExpenseSplit,
} from "@/lib/calculations";
import { hasActiveSubscription } from "@/lib/subscription";
import type { BusinessEntry } from "@/types/business";

export async function GET(request: Request) {
  const decodedToken = await verifyFirebaseBearerToken(
    request.headers.get("authorization"),
  );

  if (!decodedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const rangeStart = searchParams.get("rangeStart");
    const rangeEnd = searchParams.get("rangeEnd");

    const db = await getDb();

    if (!(await hasActiveSubscription(db, decodedToken.uid))) {
      return NextResponse.json({ error: "An active Analytics subscription is required" }, { status: 403 });
    }

    const query: Record<string, unknown> = { userId: decodedToken.uid };
    if (rangeStart) query["date"] = { $gte: rangeStart };
    if (rangeEnd)   query["date"] = { ...(query["date"] as object ?? {}), $lte: rangeEnd };

    const raw = await db
      .collection("entries")
      .find(query)
      .sort({ date: 1 })
      .toArray();

    const entries = raw.map((e) => ({
      ...e,
      _id: e._id.toString(),
    })) as unknown as BusinessEntry[];

    const monthly = buildMonthlyAggregates(entries);
    const weekly  = buildWeeklyAggregates(entries);
    const bestDays = getBestDays(entries, 5);
    const lowDays  = getLowDays(entries, 5);
    const expenseSplit = getExpenseSplit(entries);

    // Cumulative P&L (running total of profit over time)
    let running = 0;
    const cumulativePL = entries.map((e) => {
      running += e.estimatedProfit;
      return { date: e.date, value: running };
    });

    return NextResponse.json({
      monthly,
      weekly,
      bestDays,
      lowDays,
      expenseSplit,
      cumulativePL,
      totalEntries: entries.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
