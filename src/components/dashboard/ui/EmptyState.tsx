import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export function EmptyState({ icon: Icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center py-14 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
        <Icon size={30} />
      </div>
      <p className="font-bold text-slate-500">{title}</p>
      {subtitle && <p className="mt-1 max-w-xs text-xs font-medium text-slate-400">{subtitle}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
