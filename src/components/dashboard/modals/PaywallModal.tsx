"use client";

import { CheckCircle2, Crown, Loader2, X } from "lucide-react";

type PaywallModalProps = {
  open: boolean;
  onClose: () => void;
  onSubscribe: () => void;
  loading: boolean;
};

const features = [
  "Monthly & weekly P&L bar charts",
  "Expense split breakdown (cost of goods, staff, other)",
  "Top 5 best & worst performing days",
  "Auto-generated emailed reports",
  "Full historical P&L summary table",
];

export function PaywallModal({ open, onClose, onSubscribe, loading }: PaywallModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md animate-scale-in overflow-hidden rounded-2xl bg-white shadow-modal">
        <div className="relative bg-gradient-to-br from-slate-900 to-blue-900 px-8 py-8 text-center">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1 text-white/50 transition hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X size={18} />
          </button>
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400 shadow-lg">
            <Crown size={28} className="text-white" />
          </div>
          <h2 className="text-xl font-black text-white">Unlock Analytics</h2>
          <p className="mt-2 text-sm leading-relaxed text-blue-200">
            Get full P&amp;L charts, expense breakdowns, best &amp; worst day rankings, and weekly/monthly emailed
            reports.
          </p>
        </div>
        <div className="px-8 py-6">
          <ul className="mb-6 grid gap-2.5">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm font-semibold text-slate-700">
                <CheckCircle2 size={15} className="shrink-0 text-growth" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <div className="mb-5 text-center">
            <span className="text-3xl font-black text-ink">$3</span>
            <span className="text-sm font-semibold text-slate-400"> / month</span>
          </div>
          <button
            type="button"
            onClick={onSubscribe}
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-black text-white shadow-md transition hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] disabled:opacity-50"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Processing…" : "Subscribe — $3/month"}
          </button>
          <p className="mt-3 text-center text-[10px] font-semibold text-slate-400">
            Secured by Flutterwave · Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
}
