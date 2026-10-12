import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "success" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-ink text-white hover:bg-slate-800 active:bg-slate-900 shadow-sm",
  secondary: "bg-white text-ink border border-slate-200 hover:bg-slate-50 active:bg-slate-100",
  success: "bg-growth text-white hover:bg-emerald-600 active:bg-emerald-700 shadow-sm",
  danger: "bg-red-500 text-white hover:bg-red-600 active:bg-red-700 shadow-sm",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100 active:bg-slate-200",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-xs gap-1.5",
  md: "h-11 px-4 text-sm gap-2",
  lg: "h-12 px-5 text-sm gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  icon,
  loading = false,
  fullWidth = false,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-xl font-bold transition-all duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {loading ? <Loader2 className="animate-spin shrink-0" size={size === "sm" ? 14 : 16} /> : icon}
      {children}
    </button>
  );
}
