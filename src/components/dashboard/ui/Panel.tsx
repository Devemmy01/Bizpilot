import { Card } from "@/components/dashboard/ui/Card";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type PanelProps = {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function Panel({ title, icon: Icon, children, action, className = "" }: PanelProps) {
  return (
    <Card className={`flex flex-col justify-between ${className}`}>
      <div>
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <h2 className="text-base font-black tracking-tight text-ink">{title}</h2>
          {action ?? <Icon size={18} className="text-ocean" />}
        </div>
        {children}
      </div>
    </Card>
  );
}
