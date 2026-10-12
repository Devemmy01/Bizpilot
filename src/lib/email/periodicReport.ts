import {
  formatMoney,
  type buildMonthlyAggregates,
  type buildWeeklyAggregates,
  type getExpenseSplit,
} from "@/lib/calculations";
import { escapeHtml } from "@/lib/email/shell";

export function buildPeriodicReportHtml(params: {
  businessName: string;
  period: string;
  rangeStart: string;
  rangeEnd: string;
  monthly: ReturnType<typeof buildMonthlyAggregates>;
  weekly: ReturnType<typeof buildWeeklyAggregates>;
  split: ReturnType<typeof getExpenseSplit>;
  currency: string;
}): string {
  const fmt = (n: number) => formatMoney(n, params.currency || "NGN");

  const monthRows = params.monthly
    .map(
      (m) => `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">${m.label}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right">${fmt(m.totalRevenue)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right">${fmt(m.totalExpenses)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;color:${m.estimatedProfit >= 0 ? "#059669" : "#dc2626"}">${fmt(m.estimatedProfit)}</td>
      </tr>`,
    )
    .join("");

  const weekRows = params.weekly
    .map(
      (w) => `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">${w.label}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right">${fmt(w.totalRevenue)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right">${fmt(w.totalExpenses)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;color:${w.estimatedProfit >= 0 ? "#059669" : "#dc2626"}">${fmt(w.estimatedProfit)}</td>
      </tr>`,
    )
    .join("");

  const s = params.split;
  const totalRevenue = params.monthly.reduce((a, m) => a + m.totalRevenue, 0);
  const totalProfit = params.monthly.reduce((a, m) => a + m.estimatedProfit, 0);

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Bizpilot ${escapeHtml(params.period)} Report</title></head>
<body style="margin:0;padding:0;font-family:'Inter',Arial,sans-serif;background:#f8fafc">
  <div style="max-width:680px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <div style="background:linear-gradient(135deg,#0f172a,#1e40af);padding:32px 40px">
      <p style="margin:0;color:#93c5fd;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase">Bizpilot Analytics</p>
      <h1 style="margin:8px 0 0;color:#fff;font-size:24px;font-weight:900">${escapeHtml(params.businessName)}</h1>
      <p style="margin:6px 0 0;color:#bfdbfe;font-size:13px">${escapeHtml(params.period)} Report · ${escapeHtml(params.rangeStart)} → ${escapeHtml(params.rangeEnd)}</p>
    </div>
    <div style="padding:32px 40px">
      <div style="display:flex;gap:16px;margin-bottom:28px">
        <div style="flex:1;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px">
          <p style="margin:0;font-size:11px;font-weight:700;color:#059669;text-transform:uppercase;letter-spacing:.06em">Total Revenue</p>
          <p style="margin:6px 0 0;font-size:20px;font-weight:900;color:#064e3b">${fmt(totalRevenue)}</p>
        </div>
        <div style="flex:1;background:${totalProfit >= 0 ? "#f0fdf4" : "#fef2f2"};border:1px solid ${totalProfit >= 0 ? "#bbf7d0" : "#fecaca"};border-radius:8px;padding:16px">
          <p style="margin:0;font-size:11px;font-weight:700;color:${totalProfit >= 0 ? "#059669" : "#dc2626"};text-transform:uppercase;letter-spacing:.06em">Net Profit</p>
          <p style="margin:6px 0 0;font-size:20px;font-weight:900;color:${totalProfit >= 0 ? "#064e3b" : "#7f1d1d"}">${fmt(totalProfit)}</p>
        </div>
        <div style="flex:1;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px">
          <p style="margin:0;font-size:11px;font-weight:700;color:#1d4ed8;text-transform:uppercase;letter-spacing:.06em">Total Expenses</p>
          <p style="margin:6px 0 0;font-size:20px;font-weight:900;color:#1e3a8a">${fmt(s.total)}</p>
        </div>
      </div>

      <h2 style="font-size:14px;font-weight:800;color:#0f172a;margin:0 0 12px;text-transform:uppercase;letter-spacing:.06em">Monthly Breakdown</h2>
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:24px">
        <thead>
          <tr style="background:#f8fafc">
            <th style="padding:10px 12px;text-align:left;font-weight:700;color:#64748b;border-bottom:2px solid #e2e8f0">Month</th>
            <th style="padding:10px 12px;text-align:right;font-weight:700;color:#64748b;border-bottom:2px solid #e2e8f0">Revenue</th>
            <th style="padding:10px 12px;text-align:right;font-weight:700;color:#64748b;border-bottom:2px solid #e2e8f0">Expenses</th>
            <th style="padding:10px 12px;text-align:right;font-weight:700;color:#64748b;border-bottom:2px solid #e2e8f0">Profit / Loss</th>
          </tr>
        </thead>
        <tbody>${monthRows}</tbody>
      </table>

      <h2 style="font-size:14px;font-weight:800;color:#0f172a;margin:0 0 12px;text-transform:uppercase;letter-spacing:.06em">Weekly Breakdown</h2>
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:24px">
        <thead>
          <tr style="background:#f8fafc">
            <th style="padding:10px 12px;text-align:left;font-weight:700;color:#64748b;border-bottom:2px solid #e2e8f0">Week</th>
            <th style="padding:10px 12px;text-align:right;font-weight:700;color:#64748b;border-bottom:2px solid #e2e8f0">Revenue</th>
            <th style="padding:10px 12px;text-align:right;font-weight:700;color:#64748b;border-bottom:2px solid #e2e8f0">Expenses</th>
            <th style="padding:10px 12px;text-align:right;font-weight:700;color:#64748b;border-bottom:2px solid #e2e8f0">Profit / Loss</th>
          </tr>
        </thead>
        <tbody>${weekRows}</tbody>
      </table>

      <h2 style="font-size:14px;font-weight:800;color:#0f172a;margin:0 0 12px;text-transform:uppercase;letter-spacing:.06em">Expense Breakdown</h2>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <tbody>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">📦 Cost of goods</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right">${fmt(s.food)} (${s.foodPct.toFixed(1)}%)</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">👥 Staff Payroll</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right">${fmt(s.staff)} (${s.staffPct.toFixed(1)}%)</td></tr>
          <tr><td style="padding:8px 12px">🧾 Other Expenses</td><td style="padding:8px 12px;text-align:right">${fmt(s.other)} (${s.otherPct.toFixed(1)}%)</td></tr>
        </tbody>
      </table>
    </div>
    <div style="padding:20px 40px;background:#f8fafc;border-top:1px solid #e2e8f0">
      <p style="margin:0;font-size:11px;color:#94a3b8;text-align:center">Generated by Bizpilot · Pilot your business</p>
    </div>
  </div>
</body>
</html>`;
}
