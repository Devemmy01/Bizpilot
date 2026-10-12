"use client";

import { FileText, Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { formatMoney, formatPercent } from "@/lib/calculations";
import { Card } from "@/components/dashboard/ui/Card";
import { Reveal } from "@/components/dashboard/ui/Reveal";
import { Button } from "@/components/dashboard/ui/Button";
import { EmailPreferencesCard } from "@/components/dashboard/EmailPreferencesCard";
import type {
  DayPerformance,
  ExpenseSplit,
  MonthlyAggregate,
  NotifyPreferences,
  WeeklyAggregate,
} from "@/types/business";

type AnalyticsViewProps = {
  loading: boolean;
  period: "monthly" | "weekly";
  setPeriod: (p: "monthly" | "weekly") => void;
  monthly: MonthlyAggregate[];
  weekly: WeeklyAggregate[];
  bestDays: DayPerformance[];
  lowDays: DayPerformance[];
  expenses: ExpenseSplit | null;
  currency: string;
  onOpenReportModal: () => void;
  notifyPreferences: NotifyPreferences | undefined;
  defaultEmail: string;
  onSaveNotifyPreferences: (prefs: NotifyPreferences) => void;
  savingPreferences: boolean;
};

export function AnalyticsView({
  loading,
  period,
  setPeriod,
  monthly,
  weekly,
  bestDays,
  lowDays,
  expenses,
  currency,
  onOpenReportModal,
  notifyPreferences,
  defaultEmail,
  onSaveNotifyPreferences,
  savingPreferences,
}: AnalyticsViewProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-24 font-semibold text-slate-400">
        <Loader2 size={24} className="animate-spin" />
        <span>Crunching your numbers…</span>
      </div>
    );
  }

  const rows = period === "monthly" ? monthly : weekly;
  const labels = rows.map((r) => r.label);
  const revenues = rows.map((r) => r.totalRevenue);
  const profits = rows.map((r) => r.estimatedProfit);
  const maxVal = Math.max(...revenues, 1);

  return (
    <div className="grid gap-6 py-5">
      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
            {(["monthly", "weekly"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`rounded-lg px-4 py-1.5 text-xs font-bold transition ${
                  period === p ? "bg-white text-ink shadow-sm" : "text-slate-500 hover:text-ink"
                }`}
              >
                {p === "monthly" ? "Monthly" : "Weekly"}
              </button>
            ))}
          </div>
          <Button size="md" icon={<FileText size={15} />} onClick={onOpenReportModal}>
            Generate Report
          </Button>
        </div>
      </Reveal>

      <Reveal delay={60}>
        <Card>
          <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-black text-ink">Revenue vs Profit / Loss</h2>
              <p className="mt-0.5 text-xs text-slate-400">
                {period === "monthly" ? "Monthly" : "Weekly"} performance overview
              </p>
            </div>
            <TrendingUp className="text-ocean" size={20} />
          </div>
          {rows.length === 0 ? (
            <p className="py-10 text-center text-sm font-semibold text-slate-400">
              No entries yet — add daily sales records to see analytics.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <div className="flex min-h-[180px] min-w-[320px] items-end gap-3">
                {rows.map((row, i) => {
                  const revH = Math.max(8, (revenues[i] / maxVal) * 160);
                  const profitH = Math.max(4, (Math.abs(profits[i]) / maxVal) * 160);
                  const isLoss = profits[i] < 0;
                  return (
                    <div key={labels[i]} className="flex min-w-[48px] flex-1 flex-col items-center gap-1">
                      <div className="flex w-full items-end justify-center gap-0.5">
                        <div
                          className="w-5 rounded-t-sm bg-blue-200 transition-all duration-500"
                          style={{ height: `${revH}px` }}
                          title={`Revenue: ${formatMoney(revenues[i], currency)}`}
                        />
                        <div
                          className={`w-5 rounded-t-sm transition-all duration-500 ${isLoss ? "bg-red-400" : "bg-emerald-400"}`}
                          style={{ height: `${profitH}px` }}
                          title={`${isLoss ? "Loss" : "Profit"}: ${formatMoney(Math.abs(profits[i]), currency)}`}
                        />
                      </div>
                      <span className="text-center text-[9px] font-bold leading-tight text-slate-400">
                        {labels[i]}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex items-center gap-4 text-[10px] font-bold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-sm bg-blue-200" />
                  Revenue
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-sm bg-emerald-400" />
                  Profit
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-sm bg-red-400" />
                  Loss
                </span>
              </div>
            </div>
          )}
        </Card>
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-3">
        <Reveal delay={100}>
          <Card>
            <h2 className="mb-4 border-b border-slate-100 pb-3 text-sm font-black text-ink">Expense Breakdown</h2>
            {expenses ? (
              <div className="grid gap-3">
                {[
                  { label: "Cost of Goods", value: expenses.food, pct: expenses.foodPct, color: "bg-amber-400" },
                  { label: "Staff Payroll", value: expenses.staff, pct: expenses.staffPct, color: "bg-blue-400" },
                  { label: "Other Expenses", value: expenses.other, pct: expenses.otherPct, color: "bg-slate-400" },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="mb-1 flex justify-between text-xs font-semibold text-slate-600">
                      <span>{row.label}</span>
                      <span className="font-black text-ink">{row.pct.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${row.color} transition-all duration-700`}
                        style={{ width: `${Math.min(100, row.pct)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[10px] font-semibold text-slate-400">{formatMoney(row.value, currency)}</p>
                  </div>
                ))}
                <div className="mt-2 flex justify-between border-t border-slate-100 pt-2 text-xs font-black text-ink">
                  <span>Total Expenses</span>
                  <span>{formatMoney(expenses.total, currency)}</span>
                </div>
              </div>
            ) : (
              <p className="py-8 text-center text-xs font-semibold text-slate-400">No data yet.</p>
            )}
          </Card>
        </Reveal>

        <Reveal delay={140}>
          <Card>
            <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
              <TrendingUp size={16} className="text-growth" />
              <h2 className="text-sm font-black text-ink">Best Performing Days</h2>
            </div>
            {bestDays.length === 0 ? (
              <p className="py-8 text-center text-xs font-semibold text-slate-400">No data yet.</p>
            ) : (
              <div className="grid gap-2">
                {bestDays.map((d, i) => (
                  <div key={d.date} className="flex items-center gap-3 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-growth text-[10px] font-black text-white">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-black text-ink">{d.label}</p>
                      <p className="text-[10px] font-semibold text-slate-500">
                        {formatMoney(d.totalRevenue, currency)} · {formatPercent(d.profitMargin)} margin
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Reveal>

        <Reveal delay={180}>
          <Card>
            <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
              <TrendingDown size={16} className="text-red-400" />
              <h2 className="text-sm font-black text-ink">Low Performing Days</h2>
            </div>
            {lowDays.length === 0 ? (
              <p className="py-8 text-center text-xs font-semibold text-slate-400">No data yet.</p>
            ) : (
              <div className="grid gap-2">
                {lowDays.map((d, i) => (
                  <div key={d.date} className="flex items-center gap-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-400 text-[10px] font-black text-white">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-black text-ink">{d.label}</p>
                      <p className="text-[10px] font-semibold text-slate-500">
                        {formatMoney(d.totalRevenue, currency)} · {formatPercent(d.profitMargin)} margin
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Reveal>
      </div>

      <Reveal delay={220}>
        <EmailPreferencesCard
          preferences={notifyPreferences}
          defaultEmail={defaultEmail}
          onSave={onSaveNotifyPreferences}
          saving={savingPreferences}
        />
      </Reveal>

      {monthly.length > 0 && (
        <Reveal delay={260}>
          <Card className="overflow-x-auto">
            <h2 className="mb-4 border-b border-slate-100 pb-3 text-sm font-black text-ink">Monthly P&amp;L Summary</h2>
            <table className="w-full min-w-[540px] border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <th className="px-3 py-2.5 text-left">Month</th>
                  <th className="px-3 py-2.5 text-right">Revenue</th>
                  <th className="px-3 py-2.5 text-right">Expenses</th>
                  <th className="px-3 py-2.5 text-right">Profit / Loss</th>
                  <th className="px-3 py-2.5 text-right">Margin</th>
                  <th className="px-3 py-2.5 text-right">Days</th>
                </tr>
              </thead>
              <tbody>
                {monthly.map((m) => {
                  const margin = m.totalRevenue > 0 ? (m.estimatedProfit / m.totalRevenue) * 100 : 0;
                  const isProfit = m.estimatedProfit >= 0;
                  return (
                    <tr key={m.month} className="border-b border-slate-50 font-semibold hover:bg-slate-50">
                      <td className="px-3 py-3 font-black text-ink">{m.label}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-blue-600">{formatMoney(m.totalRevenue, currency)}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-warning">{formatMoney(m.totalExpenses, currency)}</td>
                      <td className={`px-3 py-3 text-right font-black tabular-nums ${isProfit ? "text-growth" : "text-red-500"}`}>
                        {isProfit ? "+" : ""}
                        {formatMoney(m.estimatedProfit, currency)}
                      </td>
                      <td className={`px-3 py-3 text-right text-xs tabular-nums ${isProfit ? "text-growth" : "text-red-500"}`}>
                        {formatPercent(margin)}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-slate-400">{m.entryCount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </Reveal>
      )}
    </div>
  );
}
