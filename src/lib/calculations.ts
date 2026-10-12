import type { BusinessEntry, BusinessEntryInput, BusinessMetrics, MonthlyAggregate, WeeklyAggregate } from "@/types/business";

export function calculateBusinessMetrics(
  input: BusinessEntryInput,
): BusinessMetrics {
  const totalRevenue = normalizeMoney(input.sales);
  const totalExpenses =
    normalizeMoney(input.foodCost) +
    normalizeMoney(input.staffExpenses) +
    normalizeMoney(input.otherExpenses);
  const estimatedProfit = totalRevenue - totalExpenses;
  const profitMargin =
    totalRevenue > 0 ? (estimatedProfit / totalRevenue) * 100 : 0;

  return {
    totalRevenue,
    totalExpenses,
    estimatedProfit,
    profitMargin,
  };
}

export function calculatePercentageChange(current: number, previous: number) {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }

  return ((current - previous) / previous) * 100;
}

export function normalizeMoney(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.round(value * 100) / 100);
}

/** Like normalizeMoney, but keeps the sign — profit can legitimately be a loss. */
export function normalizeSignedMoney(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.round(value * 100) / 100;
}

export function formatMoney(value: number, currency = "NGN") {
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    // Unknown currency code — fall back to the code as a prefix
    return `${currency} ${Math.round(value).toLocaleString("en-NG")}`;
  }
}

export function formatNaira(value: number) {
  return formatMoney(value, "NGN");
}

/** YYYY-MM-DD in the runtime's local timezone (toISOString() would give the UTC date). */
export function toLocalDateString(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

// ─── Analytics Helpers ──────────────────────────────────────────────────────

/** Group entries into calendar months and aggregate totals. */
export function buildMonthlyAggregates(entries: BusinessEntry[]): MonthlyAggregate[] {
  const map = new Map<string, MonthlyAggregate>();

  for (const e of entries) {
    const key = e.date.slice(0, 7); // "YYYY-MM"
    const label = new Date(e.date + "T00:00:00").toLocaleDateString("en-NG", {
      month: "short",
      year: "numeric",
    });

    const existing = map.get(key) ?? {
      month: key,
      label,
      totalRevenue: 0,
      totalExpenses: 0,
      estimatedProfit: 0,
      foodCost: 0,
      staffExpenses: 0,
      otherExpenses: 0,
      entryCount: 0,
    };

    existing.totalRevenue += normalizeMoney(e.totalRevenue);
    existing.totalExpenses += normalizeMoney(e.totalExpenses);
    existing.estimatedProfit += normalizeSignedMoney(e.estimatedProfit);
    existing.foodCost += normalizeMoney(e.foodCost);
    existing.staffExpenses += normalizeMoney(e.staffExpenses);
    existing.otherExpenses += normalizeMoney(e.otherExpenses);
    existing.entryCount += 1;

    map.set(key, existing);
  }

  return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
}

/** Group entries into ISO weeks (Mon–Sun) and aggregate totals. */
export function buildWeeklyAggregates(entries: BusinessEntry[]): WeeklyAggregate[] {
  const map = new Map<string, WeeklyAggregate>();

  for (const e of entries) {
    const d = new Date(e.date + "T00:00:00");
    // ISO week: shift so Monday=0
    const day = (d.getDay() + 6) % 7;
    const monday = new Date(d);
    monday.setDate(d.getDate() - day);
    const key = toLocalDateString(monday);
    const label = `Wk ${monday.toLocaleDateString("en-NG", { day: "numeric", month: "short" })}`;

    const existing = map.get(key) ?? {
      weekStart: key,
      label,
      totalRevenue: 0,
      totalExpenses: 0,
      estimatedProfit: 0,
      entryCount: 0,
    };

    existing.totalRevenue += normalizeMoney(e.totalRevenue);
    existing.totalExpenses += normalizeMoney(e.totalExpenses);
    existing.estimatedProfit += normalizeSignedMoney(e.estimatedProfit);
    existing.entryCount += 1;

    map.set(key, existing);
  }

  return Array.from(map.values()).sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

/** Return the top N best-performing days (highest revenue). */
export function getBestDays(entries: BusinessEntry[], n = 5) {
  return [...entries]
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, n)
    .map((e) => ({
      date: e.date,
      label: new Date(e.date + "T00:00:00").toLocaleDateString("en-NG", {
        weekday: "short",
        day: "numeric",
        month: "short",
      }),
      totalRevenue: e.totalRevenue,
      estimatedProfit: e.estimatedProfit,
      profitMargin: e.profitMargin,
    }));
}

/** Return the N lowest-performing days (lowest revenue, excluding zero-entry days). */
export function getLowDays(entries: BusinessEntry[], n = 5) {
  return [...entries]
    .filter((e) => e.totalRevenue > 0)
    .sort((a, b) => a.totalRevenue - b.totalRevenue)
    .slice(0, n)
    .map((e) => ({
      date: e.date,
      label: new Date(e.date + "T00:00:00").toLocaleDateString("en-NG", {
        weekday: "short",
        day: "numeric",
        month: "short",
      }),
      totalRevenue: e.totalRevenue,
      estimatedProfit: e.estimatedProfit,
      profitMargin: e.profitMargin,
    }));
}

/** Compute total expense split as percentages across all entries. */
export function getExpenseSplit(entries: BusinessEntry[]) {
  let food = 0, staff = 0, other = 0;
  for (const e of entries) {
    food += normalizeMoney(e.foodCost);
    staff += normalizeMoney(e.staffExpenses);
    other += normalizeMoney(e.otherExpenses);
  }
  const total = food + staff + other || 1;
  return {
    food,
    staff,
    other,
    total,
    foodPct: (food / total) * 100,
    staffPct: (staff / total) * 100,
    otherPct: (other / total) * 100,
  };
}

/** Filter entries to a date range (inclusive). */
export function filterEntriesByRange(
  entries: BusinessEntry[],
  rangeStart: string,
  rangeEnd: string,
) {
  return entries.filter((e) => e.date >= rangeStart && e.date <= rangeEnd);
}
