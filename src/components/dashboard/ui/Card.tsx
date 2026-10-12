import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
  interactive?: boolean;
};

const paddingClasses = { none: "", sm: "p-4", md: "p-5", lg: "p-6" };

export function Card({ children, padding = "md", interactive = false, className = "", ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/70 bg-white shadow-card ${
        interactive ? "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover" : ""
      } ${paddingClasses[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
