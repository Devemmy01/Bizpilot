import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { sendEmail } from "@/lib/resend";
import {
  buildMonthlyAggregates,
  buildWeeklyAggregates,
  filterEntriesByRange,
  formatMoney,
  getExpenseSplit,
  toLocalDateString,
} from "@/lib/calculations";
import { buildPeriodicReportHtml } from "@/lib/email/periodicReport";
import { logNotification } from "@/lib/notifications/log";
import { isSubscriptionActive } from "@/lib/subscription";
import type { Business, BusinessEntry } from "@/types/business";

function previousWeekRange(now: Date) {
  const end = new Date(now);
  end.setDate(end.getDate() - 1); // yesterday
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  return {
    rangeStart: toLocalDateString(start),
    rangeEnd: toLocalDateString(end),
  };
}

function previousMonthRange(now: Date) {
  const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastOfPrevMonth = new Date(firstOfThisMonth.getTime() - 1);
  const firstOfPrevMonth = new Date(lastOfPrevMonth.getFullYear(), lastOfPrevMonth.getMonth(), 1);
  return {
    rangeStart: toLocalDateString(firstOfPrevMonth),
    rangeEnd: toLocalDateString(lastOfPrevMonth),
  };
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period");

  if (period !== "weekly" && period !== "monthly") {
    return NextResponse.json({ error: "period must be 'weekly' or 'monthly'" }, { status: 400 });
  }

  const prefKey = period === "weekly" ? "weeklyReportEmail" : "monthlyReportEmail";
  const { rangeStart, rangeEnd } = period === "weekly" ? previousWeekRange(new Date()) : previousMonthRange(new Date());

  const db = await getDb();
  const businesses = await db
    .collection<Business>("businesses")
    .find({ [`notifyPreferences.${prefKey}`]: true })
    .toArray();

  const results: { businessId: string; sent: boolean; error?: string }[] = [];

  for (const business of businesses) {
    // Scheduled reports are part of the paid Analytics plan
    if (!isSubscriptionActive(business.subscription)) {
      results.push({ businessId: String(business._id), sent: false, error: "No active subscription" });
      continue;
    }

    const to = business.notifyPreferences?.notifyEmail;
    if (!to) {
      results.push({ businessId: String(business._id), sent: false, error: "No notifyEmail set" });
      continue;
    }

    try {
      const raw = await db
        .collection("entries")
        .find({ userId: business.userId, date: { $gte: rangeStart, $lte: rangeEnd } })
        .sort({ date: 1 })
        .toArray();
      const entries = raw.map((e) => ({ ...e, _id: e._id.toString() })) as unknown as BusinessEntry[];
      const filtered = filterEntriesByRange(entries, rangeStart, rangeEnd);

      const monthly = buildMonthlyAggregates(filtered);
      const weekly = buildWeeklyAggregates(filtered);
      const split = getExpenseSplit(filtered);
      const totalRevenue = monthly.reduce((a, m) => a + m.totalRevenue, 0);
      const totalExpenses = monthly.reduce((a, m) => a + m.totalExpenses, 0);
      const totalProfit = monthly.reduce((a, m) => a + m.estimatedProfit, 0);
      const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

      const html = buildPeriodicReportHtml({
        businessName: business.name,
        period: period === "weekly" ? "Weekly" : "Monthly",
        rangeStart,
        rangeEnd,
        monthly,
        weekly,
        split,
        currency: business.currency ?? "NGN",
      });

      await sendEmail({
        to,
        subject: `Bizpilot ${period === "weekly" ? "Weekly" : "Monthly"} Report — ${business.name}`,
        html,
      });

      await db.collection("reports").insertOne({
        userId: business.userId,
        businessId: business._id ?? null,
        type: period,
        rangeStart,
        rangeEnd,
        metrics: { totalRevenue, totalExpenses, estimatedProfit: totalProfit, profitMargin },
        sentToEmail: to,
        createdAt: new Date().toISOString(),
      });

      logNotification({
        userId: business.userId,
        businessId: business._id,
        type: "report_sent",
        title: `${period === "weekly" ? "Weekly" : "Monthly"} report sent`,
        body: `Emailed to ${to} — revenue ${formatMoney(totalRevenue, business.currency)}, profit ${formatMoney(totalProfit, business.currency)}.`,
      }).catch((err) => console.error("Report notification log failed:", err));

      results.push({ businessId: String(business._id), sent: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      results.push({ businessId: String(business._id), sent: false, error: message });
    }
  }

  return NextResponse.json({ period, rangeStart, rangeEnd, count: results.length, results });
}
