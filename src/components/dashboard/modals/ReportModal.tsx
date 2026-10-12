"use client";

import { FileText } from "lucide-react";
import { Modal } from "@/components/dashboard/ui/Modal";
import { Button } from "@/components/dashboard/ui/Button";
import type { ReportPeriod } from "@/types/business";

type ReportModalProps = {
  open: boolean;
  onClose: () => void;
  period: ReportPeriod;
  onPeriodChange: (period: ReportPeriod) => void;
  onGenerate: () => void;
  generating: boolean;
  recipientEmail: string;
};

export function ReportModal({
  open,
  onClose,
  period,
  onPeriodChange,
  onGenerate,
  generating,
  recipientEmail,
}: ReportModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Generate Report"
      subtitle={`Choose a period — report emailed to ${recipientEmail}`}
    >
      <div className="grid gap-4 px-6 py-5">
        <div className="grid grid-cols-2 gap-3">
          {(["weekly", "monthly"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPeriodChange(p)}
              className={`flex h-20 flex-col items-center justify-center gap-1.5 rounded-xl border-2 text-sm font-bold transition ${
                period === p
                  ? "border-ocean bg-blue-50 text-ocean"
                  : "border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
            >
              <FileText size={20} />
              {p === "weekly" ? "This Week" : "This Month"}
            </button>
          ))}
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold leading-relaxed text-slate-600">
          📊 Your report will include revenue, expenses, profit/loss, and expense breakdown for{" "}
          {period === "weekly" ? "the current week (Mon–today)" : "the current calendar month"}. It will be emailed
          to <strong>{recipientEmail}</strong> and saved to your Reports Log.
        </div>
        <Button onClick={onGenerate} loading={generating} icon={<FileText size={15} />}>
          {generating ? "Generating…" : "Generate & Email Report"}
        </Button>
      </div>
    </Modal>
  );
}
