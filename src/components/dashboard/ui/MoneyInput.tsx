type MoneyInputProps = {
  label: string;
  value: number;
  onChange: (value: string) => void;
  currency?: string;
};

export function MoneyInput({ label, value, onChange, currency = "NGN" }: MoneyInputProps) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
      <div className="flex h-12 items-center rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 transition-colors duration-150 focus-within:border-ocean focus-within:bg-white focus-within:ring-2 focus-within:ring-ocean/15">
        <span className="text-xs font-black text-slate-400 select-none">{currency}</span>
        <input
          value={value === 0 ? "" : value}
          onChange={(event) => onChange(event.target.value)}
          type="number"
          inputMode="decimal"
          min="0"
          placeholder="0"
          className="h-full flex-1 border-0 bg-transparent text-right text-base font-black text-ink focus:ring-0"
        />
      </div>
    </label>
  );
}
