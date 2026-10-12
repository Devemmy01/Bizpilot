import { NextResponse } from "next/server";
import { formatMoney, formatPercent } from "@/lib/calculations";
import { verifyFirebaseBearerToken } from "@/lib/firebase/admin";
import { escapeHtml } from "@/lib/email/shell";
import { isAllowedRecipient } from "@/lib/email/recipients";
import { sendEmail } from "@/lib/resend";
import { getDb } from "@/lib/mongodb";
import { logNotification } from "@/lib/notifications/log";
import type { Business, BusinessMetrics } from "@/types/business";

type EmailReportRequest = {
  to: string;
  date?: string;
  type?: "daily" | "weekly" | "monthly";
  metrics: BusinessMetrics;
};

export async function POST(request: Request) {
  const decodedToken = await verifyFirebaseBearerToken(
    request.headers.get("authorization"),
  );

  if (!decodedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { to, date, type = "daily", metrics } = (await request.json()) as EmailReportRequest;

    if (!to || !metrics) {
      return NextResponse.json(
        { error: "Recipient and metrics are required" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const business = await db.collection<Business>("businesses").findOne({ userId: decodedToken.uid });

    if (!isAllowedRecipient(to, decodedToken.email, business)) {
      return NextResponse.json(
        { error: "Reports can only be sent to your account email or your saved notification email" },
        { status: 400 },
      );
    }

    const businessName = business?.name || "Your business";
    const businessId = business?._id?.toString();
    const currency = business?.currency || "NGN";
    const fmt = (n: number) => formatMoney(n, currency);
    const reportDate =
      date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : new Date().toISOString().split("T")[0];

    const subjectType = type.charAt(0).toUpperCase() + type.slice(1);
    let data;
    try {
      data = await sendEmail({
      to,
      subject: `${businessName} ${type} Bizpilot report`,
      html: `
        <div style="font-family:Arial,sans-serif;color:#09244b;line-height:1.5;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;border-radius:8px;padding:24px;">
          <div style="display:flex;align-items:center;margin-bottom:20px;">
            <h1 style="color:#0f66d8;margin:0;font-size:24px;">Bizpilot</h1>
            <span style="font-size:14px;color:#64748b;margin-left:auto;font-weight:600;">${subjectType} Report</span>
          </div>
          <p style="font-size:16px;color:#475569;">Hello,</p>
          <p style="font-size:16px;color:#475569;">Here is the automated summary report for <strong>${escapeHtml(businessName)}</strong> for ${new Date(reportDate + "T00:00:00").toLocaleDateString("en-NG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.</p>
          
          <div style="background-color:#f8fafc;border-radius:6px;padding:20px;margin:24px 0;">
            <h3 style="margin-top:0;color:#09244b;border-bottom:1px solid #e2e8f0;padding-bottom:10px;">Metrics Summary</h3>
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="padding:8px 0;color:#64748b;font-weight:600;">Total Revenue:</td>
                <td style="padding:8px 0;text-align:right;color:#0f66d8;font-weight:bold;font-size:16px;">${fmt(metrics.totalRevenue)}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#64748b;font-weight:600;">Total Expenses:</td>
                <td style="padding:8px 0;text-align:right;color:#f5a524;font-weight:bold;font-size:16px;">${fmt(metrics.totalExpenses)}</td>
              </tr>
              <tr style="border-top:1px solid #e2e8f0;">
                <td style="padding:12px 0 8px;color:#64748b;font-weight:600;">Estimated Net Profit:</td>
                <td style="padding:12px 0 8px;text-align:right;color:${metrics.estimatedProfit >= 0 ? "#2fb65d" : "#dc2626"};font-weight:bold;font-size:18px;">${fmt(metrics.estimatedProfit)}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#64748b;font-weight:600;">Profit Margin:</td>
                <td style="padding:8px 0;text-align:right;color:#09244b;font-weight:bold;font-size:16px;">${formatPercent(metrics.profitMargin)}</td>
              </tr>
            </table>
          </div>
          
          <p style="font-size:14px;color:#94a3b8;margin-top:30px;text-align:center;border-top:1px solid #f1f5f9;padding-top:20px;">
            This email was generated automatically by Bizpilot. Pilot your business.
          </p>
        </div>
      `,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return NextResponse.json({ error: message }, { status: 502 });
    }

    // Log the sent report in MongoDB
    try {
      await db.collection("reports").insertOne({
        userId: decodedToken.uid,
        businessId,
        type,
        rangeStart: reportDate,
        rangeEnd: reportDate,
        metrics,
        sentToEmail: to,
        createdAt: new Date().toISOString(),
      });
    } catch (dbError) {
      console.error("Failed to log sent report to MongoDB:", dbError);
      // Don't fail the API request if only logging failed, since email was sent successfully
    }

    logNotification({
      userId: decodedToken.uid,
      businessId,
      type: "report_sent",
      title: `${subjectType} report sent`,
      body: `Emailed to ${to} — revenue ${fmt(metrics.totalRevenue)}, profit ${fmt(metrics.estimatedProfit)}.`,
    }).catch((err) => console.error("Report notification log failed:", err));

    return NextResponse.json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
