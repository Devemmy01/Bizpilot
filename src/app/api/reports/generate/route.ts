import { NextResponse } from "next/server";
import { verifyFirebaseBearerToken } from "@/lib/firebase/admin";
import { getDb } from "@/lib/mongodb";
import { sendEmail } from "@/lib/resend";
import {
  buildMonthlyAggregates,
  buildWeeklyAggregates,
  formatMoney,
  getExpenseSplit,
  filterEntriesByRange,
} from "@/lib/calculations";
import { buildPeriodicReportHtml } from "@/lib/email/periodicReport";
import { isAllowedRecipient } from "@/lib/email/recipients";
import { logNotification } from "@/lib/notifications/log";
import { isSubscriptionActive } from "@/lib/subscription";
import type { Business, BusinessEntry } from "@/types/business";

export async function POST(request: Request) {
  const decodedToken = await verifyFirebaseBearerToken(
    request.headers.get("authorization"),
  );

  if (!decodedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { period, rangeStart, rangeEnd, email } = await request.json();

    if (!period || !rangeStart || !rangeEnd || !email) {
      return NextResponse.json(
        { error: "period, rangeStart, rangeEnd, and email are required" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const business = await db.collection<Business>("businesses").findOne({ userId: decodedToken.uid });

    if (!isSubscriptionActive(business?.subscription)) {
      return NextResponse.json({ error: "An active Analytics subscription is required" }, { status: 403 });
    }

    if (!isAllowedRecipient(String(email), decodedToken.email, business)) {
      return NextResponse.json(
        { error: "Reports can only be sent to your account email or your saved notification email" },
        { status: 400 },
      );
    }

    const businessName = business?.name || "Your Business";
    const currency = business?.currency || "NGN";
    const periodLabel = period === "weekly" ? "Weekly" : "Monthly";

    const raw = await db
      .collection("entries")
      .find({ userId: decodedToken.uid, date: { $gte: rangeStart, $lte: rangeEnd } })
      .sort({ date: 1 })
      .toArray();

    const entries = raw.map((e) => ({ ...e, _id: e._id.toString() })) as unknown as BusinessEntry[];
    const filtered = filterEntriesByRange(entries, rangeStart, rangeEnd);

    const monthly = buildMonthlyAggregates(filtered);
    const weekly  = buildWeeklyAggregates(filtered);
    const split   = getExpenseSplit(filtered);

    const totalRevenue  = monthly.reduce((a, m) => a + m.totalRevenue, 0);
    const totalExpenses = monthly.reduce((a, m) => a + m.totalExpenses, 0);
    const totalProfit   = monthly.reduce((a, m) => a + m.estimatedProfit, 0);
    const profitMargin  = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    const html = buildPeriodicReportHtml({
      businessName,
      period: periodLabel,
      rangeStart,
      rangeEnd,
      monthly,
      weekly,
      split,
      currency,
    });

    try {
      await sendEmail({
        to: email,
        subject: `Bizpilot ${periodLabel} Report — ${businessName}`,
        html,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return NextResponse.json({ error: message }, { status: 502 });
    }

    // Log to reports collection
    const reportLog = {
      userId: decodedToken.uid,
      businessId: business?._id ?? null,
      type: period as "weekly" | "monthly",
      rangeStart,
      rangeEnd,
      metrics: { totalRevenue, totalExpenses, estimatedProfit: totalProfit, profitMargin },
      sentToEmail: email,
      createdAt: new Date().toISOString(),
    };

    const result = await db.collection("reports").insertOne(reportLog);

    logNotification({
      userId: decodedToken.uid,
      businessId: business?._id?.toString(),
      type: "report_sent",
      title: `${periodLabel} report sent`,
      body: `Emailed to ${email} — revenue ${formatMoney(totalRevenue, currency)}, profit ${formatMoney(totalProfit, currency)}.`,
    }).catch((err) => console.error("Report notification log failed:", err));

    return NextResponse.json({
      success: true,
      report: { ...reportLog, _id: result.insertedId.toString() },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
