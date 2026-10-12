"use client";

import {
  ArrowUpRight,
  Bell,
  Calculator,
  CheckCircle2,
  DollarSign,
  Mail,
  Receipt,
  Save,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import { formatMoney, formatPercent } from "@/lib/calculations";
import { Reveal } from "@/components/dashboard/ui/Reveal";
import { StatTile } from "@/components/dashboard/ui/StatTile";
import { Panel } from "@/components/dashboard/ui/Panel";
import { Card } from "@/components/dashboard/ui/Card";
import { MoneyInput } from "@/components/dashboard/ui/MoneyInput";
import { ExpenseLine } from "@/components/dashboard/ui/ExpenseLine";
import { Button } from "@/components/dashboard/ui/Button";
import { SaleLineEditor, type SaleLineDraft } from "@/components/dashboard/SaleLineEditor";
import type { BusinessEntryInput, BusinessMetrics, InventoryItem, StaffMember } from "@/types/business";

type ChartDay = { label: string; date: string; sales: number };

type OverviewViewProps = {
  metrics: BusinessMetrics;
  entryInput: BusinessEntryInput;
  updateEntryField: (field: keyof BusinessEntryInput, value: string) => void;
  selectedDate: string;
  setSelectedDate: (v: string) => void;
  saleLines: SaleLineDraft[];
  setSaleLines: (rows: SaleLineDraft[]) => void;
  staffList: StaffMember[];
  suggestedFoodCost: number;
  handleSaveEntry: () => void;
  handleSendReport: () => void;
  loading: boolean;
  chartDays: ChartDay[];
  maxWeekSales: number;
  trendPercentage: number;
  inventoryList: InventoryItem[];
  lowStockCount: number;
  notificationStatus: "default" | "granted" | "denied" | "unsupported";
  toggleNotifications: () => void;
  triggerTestNotification: () => void;
  currency: string;
};

export function OverviewView({
  metrics,
  entryInput,
  updateEntryField,
  selectedDate,
  setSelectedDate,
  saleLines,
  setSaleLines,
  staffList,
  suggestedFoodCost,
  handleSaveEntry,
  handleSendReport,
  loading,
  chartDays,
  maxWeekSales,
  trendPercentage,
  inventoryList,
  lowStockCount,
  notificationStatus,
  toggleNotifications,
  triggerTestNotification,
  currency,
}: OverviewViewProps) {
  return (
    <div className="grid gap-6 py-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total revenue", value: formatMoney(metrics.totalRevenue, currency), tone: "blue" as const, icon: TrendingUp },
          { label: "Total expenses", value: formatMoney(metrics.totalExpenses, currency), tone: "amber" as const, icon: DollarSign },
          { label: "Estimated profit", value: formatMoney(metrics.estimatedProfit, currency), tone: "green" as const, icon: ArrowUpRight },
          { label: "Profit margin", value: formatPercent(metrics.profitMargin), tone: "slate" as const, icon: Calculator },
        ].map((tile, i) => (
          <Reveal key={tile.label} delay={i * 60}>
            <StatTile {...tile} />
          </Reveal>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[400px_1fr]">
        <div className="grid gap-6 content-start">
          <Reveal delay={60}>
            <Card>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-lg font-black tracking-tight text-ink">Sales</h2>
                  <p className="mt-0.5 text-xs font-semibold text-slate-400">Record each item sold</p>
                </div>
                <ShoppingCart className="text-ocean" size={22} />
              </div>

              <div className="mt-5 grid gap-4">
                <label className="grid gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Entry Date</span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="h-12 rounded-xl border-slate-200 text-sm font-semibold focus:border-ocean focus:ring-ocean"
                  />
                </label>

                <SaleLineEditor
                  inventoryList={inventoryList}
                  staffList={staffList}
                  rows={saleLines}
                  onChange={setSaleLines}
                  currency={currency}
                />
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Button variant="success" icon={<Save size={17} />} onClick={handleSaveEntry} disabled={loading}>
                  Save entry
                </Button>
                <Button variant="secondary" icon={<Mail size={17} />} onClick={handleSendReport} disabled={loading}>
                  Email report
                </Button>
              </div>
            </Card>
          </Reveal>

          <Reveal delay={90}>
            <Card>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-lg font-black tracking-tight text-ink">Expenses</h2>
                  <p className="mt-0.5 text-xs font-semibold text-slate-400">Same date as sales above</p>
                </div>
                <Receipt className="text-warning" size={22} />
              </div>

              <div className="mt-5 grid gap-4">
                <div className="grid gap-1.5">
                  <MoneyInput label="Cost of goods sold" value={entryInput.foodCost} currency={currency} onChange={(v) => updateEntryField("foodCost", v)} />
                  {suggestedFoodCost > 0 && suggestedFoodCost !== entryInput.foodCost && (
                    <button
                      type="button"
                      onClick={() => updateEntryField("foodCost", String(suggestedFoodCost))}
                      className="justify-self-start text-[11px] font-bold text-ocean hover:underline"
                    >
                      Suggested from items sold: {formatMoney(suggestedFoodCost, currency)} — apply
                    </button>
                  )}
                </div>
                <MoneyInput label="Staff expenses" value={entryInput.staffExpenses} currency={currency} onChange={(v) => updateEntryField("staffExpenses", v)} />
                <MoneyInput label="Other expenses" value={entryInput.otherExpenses} currency={currency} onChange={(v) => updateEntryField("otherExpenses", v)} />
              </div>
            </Card>
          </Reveal>
        </div>

        <div className="grid gap-6">
          <div className="grid gap-6 md:grid-cols-[1.3fr_0.7fr]">
            <Reveal delay={120}>
              <Panel title="7-Day Sales trend" icon={TrendingUp}>
                <div className="flex min-h-[180px] items-end gap-2.5 pt-4">
                  {chartDays.map((day) => (
                    <div key={day.label} className="flex flex-1 flex-col items-center gap-2">
                      <div className="select-none text-[10px] font-bold text-slate-400">
                        {day.sales > 0 ? formatMoney(day.sales, currency) : ""}
                      </div>
                      <div
                        className="w-full rounded-t-lg bg-ocean transition-all duration-500 ease-out hover:opacity-90"
                        style={{ height: `${Math.max(8, (day.sales / maxWeekSales) * 140)}px` }}
                        title={`${day.date}: ${formatMoney(day.sales, currency)}`}
                      />
                      <span className="mt-1 text-center text-xs font-black text-slate-500">{day.label}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3.5 text-growth">
                  <CheckCircle2 size={20} className="shrink-0" />
                  <p className="text-sm font-bold leading-tight">
                    {trendPercentage >= 0
                      ? `Sales increased ${formatPercent(trendPercentage)} compared to previous records.`
                      : `Sales dipped ${formatPercent(Math.abs(trendPercentage))} compared to previous records.`}
                  </p>
                </div>
              </Panel>
            </Reveal>

            <div className="grid gap-6">
              <Reveal delay={160}>
                <Panel title="Restock alerts" icon={Bell}>
                  <div className="grid max-h-[220px] gap-2.5 overflow-y-auto pr-1">
                    {inventoryList.length === 0 ? (
                      <p className="py-4 text-center text-xs font-semibold text-slate-400">No items registered.</p>
                    ) : (
                      inventoryList.slice(0, 4).map((item) => {
                        const isLow = item.stock < item.threshold;
                        return (
                          <div
                            key={item._id}
                            className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-xs"
                          >
                            <div className="truncate pr-2">
                              <p className="truncate font-bold text-ink">{item.name}</p>
                              <p className="mt-0.5 text-[10px] font-semibold text-slate-500">
                                {item.stock} / {item.threshold} {item.unit}
                              </p>
                            </div>
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${
                                isLow
                                  ? "border border-red-100 bg-red-50 text-red-600"
                                  : "border border-emerald-100 bg-emerald-50 text-growth"
                              }`}
                            >
                              {isLow ? "Low" : "Good"}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <p className="mt-4 flex items-center gap-1.5 text-xs font-black text-red-600">
                    <Bell size={14} />
                    {lowStockCount} items require attention.
                  </p>
                </Panel>
              </Reveal>

              <Reveal delay={200}>
                <Panel title="Notification Center" icon={Bell}>
                  <div className="grid gap-3.5 text-xs">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-ink">Push Notifications</p>
                        <p className="mt-0.5 text-[10px] font-semibold text-slate-500">
                          {notificationStatus === "granted" ? "Subscribed to alerts" : "Get restock & sales reports alerts"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={toggleNotifications}
                        disabled={notificationStatus === "unsupported"}
                        className={`rounded-lg px-3 py-1.5 font-bold transition ${
                          notificationStatus === "granted"
                            ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                        }`}
                      >
                        {notificationStatus === "granted" ? "Enabled" : "Enable"}
                      </button>
                    </div>

                    {notificationStatus === "granted" && (
                      <div className="mt-2 border-t border-slate-100 pt-2.5">
                        <Button variant="primary" size="sm" fullWidth icon={<Bell size={14} />} onClick={triggerTestNotification} disabled={loading}>
                          Send Test Alert
                        </Button>
                      </div>
                    )}
                  </div>
                </Panel>
              </Reveal>
            </div>
          </div>

          <Reveal delay={240}>
            <Panel title="Expense split today" icon={DollarSign}>
              <div className="grid gap-4 sm:grid-cols-3">
                <ExpenseLine label="Cost of goods sold" value={entryInput.foodCost} total={metrics.totalExpenses} currency={currency} />
                <ExpenseLine label="Staff payroll costs" value={entryInput.staffExpenses} total={metrics.totalExpenses} currency={currency} />
                <ExpenseLine label="Other operating expenses" value={entryInput.otherExpenses} total={metrics.totalExpenses} currency={currency} />
              </div>
            </Panel>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
