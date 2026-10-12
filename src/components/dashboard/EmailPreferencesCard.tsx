"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { Card } from "@/components/dashboard/ui/Card";
import { Button } from "@/components/dashboard/ui/Button";
import type { NotifyPreferences } from "@/types/business";

type EmailPreferencesCardProps = {
  preferences: NotifyPreferences | undefined;
  defaultEmail: string;
  onSave: (prefs: NotifyPreferences) => void;
  saving: boolean;
};

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div>
        <p className="text-sm font-bold text-ink">{label}</p>
        <p className="mt-0.5 text-xs font-medium text-slate-400">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${checked ? "bg-growth" : "bg-slate-200"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export function EmailPreferencesCard({ preferences, defaultEmail, onSave, saving }: EmailPreferencesCardProps) {
  const [notifyEmail, setNotifyEmail] = useState(preferences?.notifyEmail ?? defaultEmail);
  const [weekly, setWeekly] = useState(preferences?.weeklyReportEmail ?? false);
  const [monthly, setMonthly] = useState(preferences?.monthlyReportEmail ?? false);
  const [lowStock, setLowStock] = useState(preferences?.lowStockEmail ?? false);

  return (
    <Card>
      <div className="mb-1 flex items-center gap-2 border-b border-slate-100 pb-3">
        <Mail size={16} className="text-ocean" />
        <h2 className="text-sm font-black text-ink">Email Preferences</h2>
      </div>
      <p className="pt-3 text-xs font-medium leading-relaxed text-slate-400">
        Automatic report and alert emails are sent from a shared test sender, so delivery is only guaranteed to the
        address on file for this Bizpilot instance.
      </p>

      <label className="mt-4 grid gap-1.5">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Notify email</span>
        <input
          type="email"
          value={notifyEmail}
          onChange={(e) => setNotifyEmail(e.target.value)}
          placeholder="owner@bizpilot.co"
          className="h-11 rounded-xl border-slate-200 text-sm focus:border-ocean focus:ring-ocean"
        />
      </label>

      <div className="mt-2 divide-y divide-slate-100">
        <Toggle checked={weekly} onChange={setWeekly} label="Weekly report" hint="Emailed every Monday for the prior week" />
        <Toggle checked={monthly} onChange={setMonthly} label="Monthly report" hint="Emailed on the 1st for the prior month" />
        <Toggle checked={lowStock} onChange={setLowStock} label="Low stock alerts" hint="Emailed when an item drops below threshold" />
      </div>

      <Button
        className="mt-4"
        fullWidth
        variant="secondary"
        loading={saving}
        onClick={() =>
          onSave({
            notifyEmail: notifyEmail.trim(),
            weeklyReportEmail: weekly,
            monthlyReportEmail: monthly,
            lowStockEmail: lowStock,
          })
        }
      >
        Save preferences
      </Button>
    </Card>
  );
}
