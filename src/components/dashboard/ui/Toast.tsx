"use client";

import { useEffect } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, X } from "lucide-react";
import { isErrorStatus, isWarnStatus, translateStatus } from "@/lib/statusMessages";

type ToastProps = {
  status: string;
  onClear: () => void;
};

export function Toast({ status, onClear }: ToastProps) {
  useEffect(() => {
    if (!status) return;
    const timer = setTimeout(onClear, 6000);
    return () => clearTimeout(timer);
  }, [status, onClear]);

  if (!status) return null;

  const translated = translateStatus(status);
  const error = isErrorStatus(status);
  const warn = isWarnStatus(status);

  const toneClass = error
    ? "bg-red-50/95 border-red-200 text-red-800"
    : warn
      ? "bg-amber-50/95 border-amber-200 text-amber-800"
      : "bg-emerald-50/95 border-emerald-200 text-emerald-800";

  const Icon = error ? AlertTriangle : warn ? AlertCircle : CheckCircle2;

  return (
    <div
      className="fixed inset-x-4 z-[60] flex justify-center animate-slide-up sm:inset-x-auto sm:right-6 sm:justify-end"
      style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <div
        className={`flex w-full max-w-md items-start gap-2.5 rounded-2xl border px-4 py-3.5 text-sm font-semibold shadow-modal backdrop-blur ${toneClass}`}
      >
        <Icon size={17} className="mt-0.5 shrink-0" />
        <span className="flex-1 leading-snug">{translated}</span>
        <button
          type="button"
          onClick={onClear}
          className="mt-0.5 shrink-0 opacity-50 transition hover:opacity-100"
          aria-label="Dismiss message"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
