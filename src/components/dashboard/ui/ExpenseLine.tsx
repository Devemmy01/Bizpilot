import { formatMoney } from "@/lib/calculations";

type ExpenseLineProps = {
  label: string;
  value: number;
  total: number;
  currency: string;
};

export function ExpenseLine({ label, value, total, currency }: ExpenseLineProps) {
  const percentage = total > 0 ? (value / total) * 100 : 0;

  return (
    <div className="rounded-xl border border-slate-150 bg-slate-50 p-4">
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1.5 text-lg font-black text-ink tabular-nums">{formatMoney(value, currency)}</p>
      <div className="mt-3">
        <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>Expense Share</span>
          <span>{percentage.toFixed(1)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-warning transition-all duration-700 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
