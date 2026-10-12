"use client";

import {
  AlertTriangle,
  BarChart3,
  Bell,
  Boxes,
  Crown,
  Inbox,
  Lock,
  LogOut,
  Mail,
  RefreshCcw,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { BizpilotLogo } from "@/components/BizpilotLogo";
import type { Business } from "@/types/business";

const NAV_ITEMS = [
  { label: "Dashboard", mobileLabel: "Home", icon: BarChart3 },
  { label: "Inventory", mobileLabel: "Stock", icon: Boxes },
  { label: "Staff Roster", mobileLabel: "Staff", icon: Users },
  { label: "Analytics", mobileLabel: "Insights", icon: TrendingUp, premium: true },
  { label: "Reports Log", mobileLabel: "Reports", icon: Mail },
];

type AppShellProps = {
  isDemoMode: boolean;
  business: Business;
  activeEmail: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSubscribed: boolean;
  setShowPaywall: (v: boolean) => void;
  pushSupported: boolean;
  notificationStatus: "default" | "granted" | "denied" | "unsupported";
  toggleNotifications: () => void;
  loading: boolean;
  loadAllData: () => void;
  handleSignOut: () => void;
  installable: boolean;
  handleInstallClick: () => void;
  setInstallable: (v: boolean) => void;
  unreadNotifications: number;
  onOpenNotifications: () => void;
  children: ReactNode;
};

function NotificationBellButton({ count, onClick, className = "" }: { count: number; onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 ${className}`}
      aria-label={count > 0 ? `${count} unread notifications` : "Notifications"}
      title="Notifications"
    >
      <Inbox size={16} />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black leading-none text-white">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}

export function AppShell({
  isDemoMode,
  business,
  activeEmail,
  activeTab,
  setActiveTab,
  isSubscribed,
  setShowPaywall,
  pushSupported,
  notificationStatus,
  toggleNotifications,
  loading,
  loadAllData,
  handleSignOut,
  installable,
  handleInstallClick,
  setInstallable,
  unreadNotifications,
  onOpenNotifications,
  children,
}: AppShellProps) {
  return (
    <main className="min-h-screen bg-paper text-ink">
      {isDemoMode && (
        <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-center text-xs font-bold tracking-wide text-white shadow-sm">
          <AlertTriangle size={15} className="shrink-0" />
          <span>Local Sandbox Active: Data is isolated to this browser. Authenticated features are simulated.</span>
        </div>
      )}

      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[280px_1fr]">
        {/* Desktop sidebar */}
        <aside className="hidden border-slate-200 bg-white px-5 py-5 lg:flex lg:flex-col lg:justify-between lg:border-r">
          <div>
            <BizpilotLogo />
            <nav className="mt-8 grid gap-1.5">
              {NAV_ITEMS.map((item) => {
                const isActive = activeTab === item.label;
                const locked = item.premium && !isSubscribed;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      if (locked) {
                        setShowPaywall(true);
                        return;
                      }
                      setActiveTab(item.label);
                    }}
                    className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-bold transition-all duration-150 ${
                      isActive
                        ? "bg-ink text-white shadow-sm"
                        : locked
                          ? "text-slate-400 hover:bg-amber-50 hover:text-amber-700"
                          : "text-slate-600 hover:bg-slate-100 hover:text-ink"
                    }`}
                  >
                    <item.icon size={18} />
                    {item.label}
                    {locked && <Lock size={12} className="ml-auto text-amber-400" />}
                    {item.premium && isSubscribed && <Crown size={12} className="ml-auto text-amber-400" />}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="mt-8 border-t border-slate-150 pt-4">
            <div
              className={`mb-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold ${
                isSubscribed
                  ? "border border-amber-200 bg-amber-50 text-amber-700"
                  : "border border-slate-200 bg-slate-50 text-slate-500"
              }`}
            >
              <Crown size={13} className={isSubscribed ? "text-amber-500" : "text-slate-400"} />
              {isSubscribed ? "Analytics Plan · Active" : "Free Plan"}
              {!isSubscribed && (
                <button
                  type="button"
                  onClick={() => setShowPaywall(true)}
                  className="ml-auto text-[10px] font-black text-blue-600 hover:underline"
                >
                  Upgrade
                </button>
              )}
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-600">
                <ShieldCheck size={16} className="shrink-0 text-growth" />
                Active Owner
              </div>
              <p className="mt-1.5 truncate text-sm font-semibold text-ink">{activeEmail}</p>
              <button
                type="button"
                onClick={handleSignOut}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-700 hover:underline"
              >
                <LogOut size={13} />
                Sign Out
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/85 px-4 py-3 backdrop-blur-md lg:hidden">
          <BizpilotLogo compact />
          <div className="flex items-center gap-2">
            <NotificationBellButton count={unreadNotifications} onClick={onOpenNotifications} className="h-9 w-9" />
            {pushSupported && (
              <button
                type="button"
                onClick={toggleNotifications}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition ${
                  notificationStatus === "granted"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                    : "border-slate-200 bg-white text-slate-500"
                }`}
                aria-label="Toggle push alerts"
              >
                <Bell size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={loadAllData}
              disabled={loading}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 disabled:opacity-50"
              aria-label="Refresh dashboard"
            >
              <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </header>

        {/* Content body */}
        <section className="mx-auto w-full px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-8 lg:pt-5">
          <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-growth">{business.name}</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-ink sm:text-3xl">{activeTab}</h1>
            </div>

            <div className="hidden items-center gap-3 lg:flex">
              <NotificationBellButton count={unreadNotifications} onClick={onOpenNotifications} className="h-10 w-10" />
              {pushSupported && (
                <button
                  type="button"
                  onClick={toggleNotifications}
                  disabled={notificationStatus === "unsupported"}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition duration-150 ${
                    notificationStatus === "granted"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                  }`}
                  title={notificationStatus === "granted" ? "Push alerts enabled" : "Enable push alerts"}
                >
                  <Bell size={13} className={notificationStatus === "granted" ? "text-emerald-500" : "text-slate-400"} />
                  {notificationStatus === "granted" ? "Alerts Active" : "Enable Alerts"}
                </button>
              )}
              <span className="select-none rounded-xl border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">
                Currency: {business.currency}
              </span>
              <button
                type="button"
                onClick={loadAllData}
                disabled={loading}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                title="Force refresh data"
              >
                <RefreshCcw size={17} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          </header>

          {installable && (
            <div className="mt-4 flex flex-col items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 p-4 text-white shadow-lg sm:flex-row">
              <div className="flex items-center gap-3">
                <div className="shrink-0 rounded-lg bg-white/10 p-2.5">
                  <Bell size={22} className="animate-pulse text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">Install Bizpilot App</h4>
                  <p className="mt-0.5 text-xs text-blue-100">
                    Run Bizpilot instantly from your home screen with offline capability and instant push alerts.
                  </p>
                </div>
              </div>
              <div className="flex w-full shrink-0 items-center gap-2.5 font-bold sm:w-auto">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="w-full rounded-xl bg-white px-4 py-2 text-xs text-blue-700 shadow-sm transition hover:bg-blue-50 sm:w-auto"
                >
                  Install Now
                </button>
                <button
                  type="button"
                  onClick={() => setInstallable(false)}
                  className="px-2 py-1 text-xs text-blue-200 hover:text-white"
                >
                  Later
                </button>
              </div>
            </div>
          )}

          {children}
        </section>
      </div>

      {/* Mobile bottom tab bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-slate-200 bg-white/90 shadow-nav backdrop-blur-md lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.label;
          const locked = item.premium && !isSubscribed;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                if (locked) {
                  setShowPaywall(true);
                  return;
                }
                setActiveTab(item.label);
              }}
              className="flex flex-1 flex-col items-center gap-1 py-2.5 transition-transform duration-150 active:scale-90"
            >
              <span
                className={`relative flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                  isActive ? "bg-ink text-white" : locked ? "text-slate-300" : "text-slate-400"
                }`}
              >
                <item.icon size={17} />
                {locked && <Lock size={9} className="absolute -right-0.5 -top-0.5 text-amber-500" />}
              </span>
              <span
                className={`text-[10px] font-bold ${
                  isActive ? "text-ink" : locked ? "text-slate-300" : "text-slate-400"
                }`}
              >
                {item.mobileLabel}
              </span>
            </button>
          );
        })}
      </nav>
    </main>
  );
}
