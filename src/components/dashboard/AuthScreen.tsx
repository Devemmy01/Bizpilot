"use client";

import { AlertTriangle, Eye, EyeOff, Loader2 } from "lucide-react";
import type { FormEvent } from "react";
import { BizpilotLogo } from "@/components/BizpilotLogo";
import { Reveal } from "@/components/dashboard/ui/Reveal";
import { Toast } from "@/components/dashboard/ui/Toast";

type AuthScreenProps = {
  isDemoMode: boolean;
  authMode: "login" | "register";
  setAuthMode: (mode: "login" | "register") => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean | ((prev: boolean) => boolean)) => void;
  loading: boolean;
  status: string;
  setStatus: (v: string) => void;
  onEmailAuth: (e: FormEvent) => void;
  onGoogleAuth: () => void;
};

export function AuthScreen({
  isDemoMode,
  authMode,
  setAuthMode,
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  loading,
  status,
  setStatus,
  onEmailAuth,
  onGoogleAuth,
}: AuthScreenProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-white p-4">
      {isDemoMode && (
        <Reveal className="mb-4 w-full max-w-md">
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-800 shadow-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <p className="font-bold">Sandbox Mode Activated</p>
              <p className="mt-0.5">
                Firebase env keys not found. Any email and password will instantly sign you in, and data will
                persist in your browser storage.
              </p>
            </div>
          </div>
        </Reveal>
      )}

      <Reveal className="w-full max-w-md" delay={80}>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-soft">
          <div className="mb-8 flex flex-col items-center">
            <BizpilotLogo />
          </div>

          <h2 className="mb-1 text-center text-xl font-black text-ink">
            {authMode === "login" ? "Sign in to your account" : "Get started with Bizpilot"}
          </h2>
          <p className="mb-6 text-center text-sm text-slate-500">
            {authMode === "login"
              ? "Access your dashboard and financial reports"
              : "Remove manual calculations from your store"}
          </p>

          <form onSubmit={onEmailAuth} className="grid gap-4">
            <label className="grid gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Email Address</span>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@bizpilot.co"
                autoComplete="email"
                className="h-12 rounded-xl border-slate-200 text-sm focus:border-ocean focus:ring-ocean"
              />
            </label>

            <label className="grid gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Password</span>
              <div className="relative">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="h-12 w-full rounded-xl border-slate-200 pr-11 text-sm focus:border-ocean focus:ring-ocean"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-ink text-sm font-bold text-white transition hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {authMode === "login" ? "Sign In" : "Register"}
            </button>
          </form>

          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <span className="relative bg-white px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              or
            </span>
          </div>

          <button
            type="button"
            onClick={onGoogleAuth}
            disabled={loading}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-ink transition hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50"
          >
            <svg className="mr-1 h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.48 14.98 1 12 1 7.35 1 3.37 3.65 1.41 7.48l3.79 2.94C6.1 7.43 8.84 5.04 12 5.04z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.44c-.28 1.47-1.11 2.72-2.36 3.56l3.66 2.84c2.14-1.98 3.39-4.89 3.39-8.5z"
              />
              <path
                fill="#FBBC05"
                d="M5.2 14.92c-.24-.72-.38-1.5-.38-2.3c0-.8.14-1.58.38-2.3L1.41 7.38C.51 9.17 0 11.02 0 12.92s.51 3.75 1.41 5.54l3.79-2.94z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.01.68-2.31 1.09-4.3 1.09-3.16 0-5.9-2.39-6.8-5.38L1.41 15.9C3.37 19.73 7.35 23 12 23z"
              />
            </svg>
            Continue with Google
          </button>

          <div className="mt-8 text-center text-sm">
            {authMode === "login" ? (
              <p className="text-slate-600">
                New to Bizpilot?{" "}
                <button
                  type="button"
                  onClick={() => setAuthMode("register")}
                  className="font-bold text-ocean hover:underline"
                >
                  Create an account
                </button>
              </p>
            ) : (
              <p className="text-slate-600">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setAuthMode("login")}
                  className="font-bold text-ocean hover:underline"
                >
                  Sign in instead
                </button>
              </p>
            )}
          </div>
        </div>
      </Reveal>

      <Toast status={status} onClear={() => setStatus("")} />
    </main>
  );
}
