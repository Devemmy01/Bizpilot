"use client";

import { Mail } from "lucide-react";
import { formatMoney, formatPercent } from "@/lib/calculations";
import { Card } from "@/components/dashboard/ui/Card";
import { Reveal } from "@/components/dashboard/ui/Reveal";
import { EmptyState } from "@/components/dashboard/ui/EmptyState";
import type { ReportLog } from "@/types/business";

type ReportsLogViewProps = {
  reportsList: ReportLog[];
  currency: string;
};

export function ReportsLogView({ reportsList, currency }: ReportsLogViewProps) {
  return (
    <div className="py-5">
      <Reveal>
        <Card>
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-black tracking-tight text-ink">Emailed Reports Ledger</h2>
              <p className="mt-0.5 text-xs text-slate-400">Historical verification records generated and sent</p>
            </div>
            <Mail className="text-ocean" size={22} />
          </div>

          {reportsList.length === 0 ? (
            <EmptyState
              icon={Mail}
              title="No reports logged yet."
              subtitle="Generate reports on the main Dashboard to distribute email briefs and populate log entries."
            />
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-150 text-xs font-black uppercase tracking-wider text-slate-500">
                      <th className="px-2 py-3">Sent Date</th>
                      <th className="px-2 py-3">Recipient Email</th>
                      <th className="px-2 py-3">Report Type</th>
                      <th className="px-2 py-3">Revenue Sent</th>
                      <th className="px-2 py-3">Expenses Sent</th>
                      <th className="px-2 py-3">Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportsList.map((rep) => (
                      <tr key={rep._id} className="border-b border-slate-100 font-semibold hover:bg-slate-50">
                        <td className="px-2 py-3.5 text-ink">
                          {new Date(rep.createdAt).toLocaleString("en-NG", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-2 py-3.5 text-slate-500">{rep.sentToEmail}</td>
                        <td className="px-2 py-3.5">
                          <span className="inline-block rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider leading-none text-ocean">
                            {rep.type}
                          </span>
                        </td>
                        <td className="px-2 py-3.5 tabular-nums text-growth">{formatMoney(rep.metrics.totalRevenue, currency)}</td>
                        <td className="px-2 py-3.5 tabular-nums text-warning">{formatMoney(rep.metrics.totalExpenses, currency)}</td>
                        <td className="px-2 py-3.5 font-black tabular-nums">{formatPercent(rep.metrics.profitMargin)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 md:hidden">
                {reportsList.map((rep) => (
                  <div key={rep._id} className="rounded-xl border border-slate-200 p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="inline-block rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider leading-none text-ocean">
                        {rep.type}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400">
                        {new Date(rep.createdAt).toLocaleString("en-NG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="mt-2 truncate text-xs font-semibold text-slate-500">{rep.sentToEmail}</p>
                    <div className="mt-2.5 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-[9px] font-black uppercase text-slate-400">Revenue</p>
                        <p className="font-black text-growth tabular-nums">{formatMoney(rep.metrics.totalRevenue, currency)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-slate-400">Expenses</p>
                        <p className="font-black text-warning tabular-nums">{formatMoney(rep.metrics.totalExpenses, currency)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-slate-400">Margin</p>
                        <p className="font-black tabular-nums">{formatPercent(rep.metrics.profitMargin)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </Reveal>
    </div>
  );
}
