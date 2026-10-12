"use client";

import { useEffect } from "react";

export function PWARegistration() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Register the service worker
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("Service Worker registered with scope:", reg.scope);
        })
        .catch((err) => {
          console.error("Service Worker registration failed:", err);
        });

      // Intercept the browser's default install prompt
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        // Save the event on the global window object
        (window as unknown as { deferredPrompt: Event }).deferredPrompt = e;
        // Broadcast custom installable event
        window.dispatchEvent(new CustomEvent("bizpilot-installable"));
      };

      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

      return () => {
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      };
    }
  }, []);

  return null;
}
