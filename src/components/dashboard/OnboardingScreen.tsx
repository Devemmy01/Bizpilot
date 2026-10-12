"use client";

import { Loader2 } from "lucide-react";
import type { FormEvent } from "react";
import { BizpilotLogo } from "@/components/BizpilotLogo";
import { Reveal } from "@/components/dashboard/ui/Reveal";
import { Toast } from "@/components/dashboard/ui/Toast";

type OnboardingScreenProps = {
  businessNameInput: string;
  setBusinessNameInput: (v: string) => void;
  currencyInput: string;
  setCurrencyInput: (v: string) => void;
  loading: boolean;
  status: string;
  setStatus: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
  onSignOut: () => void;
};

export function OnboardingScreen({
  businessNameInput,
  setBusinessNameInput,
  currencyInput,
  setCurrencyInput,
  loading,
  status,
  setStatus,
  onSubmit,
  onSignOut,
}: OnboardingScreenProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-white p-4">
      <Reveal className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-soft">
          <div className="mb-6 flex flex-col items-center">
            <BizpilotLogo />
          </div>

          <h2 className="mb-1 text-center text-xl font-black text-ink">Set up your business</h2>
          <p className="mb-6 text-center text-sm text-slate-500">
            Name your store to set up your command center.
          </p>

          <form onSubmit={onSubmit} className="grid gap-4">
            <label className="grid gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Business Name</span>
              <input
                required
                type="text"
                value={businessNameInput}
                onChange={(e) => setBusinessNameInput(e.target.value)}
                placeholder="e.g. Mama Put Cafeteria"
                className="h-12 rounded-xl border-slate-200 text-sm focus:border-ocean focus:ring-ocean"
              />
            </label>

            <label className="grid gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Currency</span>
              <select
                value={currencyInput}
                onChange={(e) => setCurrencyInput(e.target.value)}
                className="h-12 rounded-xl border-slate-200 text-sm focus:border-ocean focus:ring-ocean"
              >
                <option value="NGN">NGN (₦) - Nigerian Naira</option>
                <option value="USD">USD ($) - US Dollar</option>
                <option value="GHS">GHS (₵) - Ghanaian Cedi</option>
              </select>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-growth text-sm font-bold text-white transition hover:bg-emerald-600 active:scale-[0.98] disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Launch Dashboard
            </button>
          </form>

          <button
            type="button"
            onClick={onSignOut}
            className="mt-6 w-full text-center text-xs font-bold text-slate-500 hover:text-red-500 hover:underline"
          >
            Cancel and Sign Out
          </button>
        </div>
      </Reveal>

      <Toast status={status} onClear={() => setStatus("")} />
    </main>
  );
}
