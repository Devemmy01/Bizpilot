import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { PWARegistration } from "@/components/PWARegistration";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  manifest: "/manifest.json",
  title: {
    default: "Bizpilot — Pilot Your Business",
    template: "%s | Bizpilot",
  },
  description:
    "Bizpilot helps supermarkets and retail stores track daily sales, expenses, inventory, and staff activity — with automatic profit and margin calculations.",
  keywords: [
    "small business management",
    "supermarket inventory",
    "profit calculator",
    "expense tracker",
    "Nigeria business app",
  ],
  openGraph: {
    title: "Bizpilot — Pilot Your Business",
    description:
      "Automated business calculations, reports, and alerts for supermarket and retail store owners.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#09244b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <PWARegistration />
        {children}
      </body>
    </html>
  );
}
