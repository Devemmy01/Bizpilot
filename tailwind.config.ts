import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#09244b",
        ocean: "#0f66d8",
        growth: "#2fb65d",
        paper: "#f7fafc",
        warning: "#f5a524",
      },
      boxShadow: {
        soft: "0 16px 50px rgba(9, 36, 75, 0.08)",
        card: "0 1px 2px rgba(9, 36, 75, 0.04), 0 12px 32px rgba(9, 36, 75, 0.06)",
        "card-hover": "0 1px 2px rgba(9, 36, 75, 0.05), 0 20px 40px rgba(9, 36, 75, 0.1)",
        nav: "0 -8px 30px rgba(9, 36, 75, 0.08)",
        modal: "0 24px 70px rgba(9, 36, 75, 0.25)",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(100%)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fade-in 0.35s ease-out both",
        "scale-in": "scale-in 0.22s cubic-bezier(0.16, 1, 0.3, 1) both",
        "slide-up": "slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) both",
        shimmer: "shimmer 1.8s infinite linear",
      },
    },
  },
  plugins: [forms],
};

export default config;
