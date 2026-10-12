import { Card } from "@/components/dashboard/ui/Card";
import type { LucideIcon } from "lucide-react";

type StatTileProps = {
  label: string;
  value: string;
  tone: "blue" | "green" | "amber" | "slate";
  icon: LucideIcon;
  hint?: string;
};

const toneClasses = {
  blue: "bg-blue-50 text-ocean border-blue-100",
  green: "bg-emerald-50 text-growth border-emerald-100",
  amber: "bg-amber-50 text-warning border-amber-100",
  slate: "bg-slate-100 text-ink border-slate-200",
};

export function StatTile({ label, value, tone, icon: Icon, hint }: StatTileProps) {
  return (
    <Card interactive className="group">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
        <span
          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-transform duration-300 group-hover:scale-110 ${toneClasses[tone]}`}
        >
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-4 text-2xl font-black tracking-tight text-ink tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs font-semibold text-slate-400">{hint}</p>}
    </Card>
  );
}
