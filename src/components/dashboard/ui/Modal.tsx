"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import type { ReactNode } from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  size?: "sm" | "md";
};

/** Centered dialog on desktop, bottom sheet on mobile — matches native app conventions on small screens. */
export function Modal({ open, onClose, title, subtitle, children, size = "sm" }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full animate-slide-up overflow-hidden rounded-t-3xl bg-white shadow-modal sm:max-w-sm sm:animate-scale-in sm:rounded-2xl ${
          size === "md" ? "sm:max-w-md" : ""
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex justify-center pt-2.5 sm:hidden">
          <span className="h-1 w-10 rounded-full bg-slate-200" />
        </div>
        {title && (
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-5">
            <div>
              <h2 className="text-base font-black text-ink">{title}</h2>
              {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
