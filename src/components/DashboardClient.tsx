"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type Auth,
  type User,
} from "firebase/auth";
import {
  buildMonthlyAggregates,
  buildWeeklyAggregates,
  calculateBusinessMetrics,
  calculatePercentageChange,
  filterEntriesByRange,
  getBestDays,
  getExpenseSplit,
  getLowDays,
  toLocalDateString,
} from "@/lib/calculations";
import { isSubscriptionActive } from "@/lib/subscription";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase/client";
import { AuthScreen } from "@/components/dashboard/AuthScreen";
import { OnboardingScreen } from "@/components/dashboard/OnboardingScreen";
import { AppShell } from "@/components/dashboard/AppShell";
import { Toast } from "@/components/dashboard/ui/Toast";
import { ConfirmDialog, type ConfirmRequest } from "@/components/dashboard/ui/ConfirmDialog";
import { OverviewView } from "@/components/dashboard/views/OverviewView";
import type { SaleLineDraft } from "@/components/dashboard/SaleLineEditor";
import { InventoryView } from "@/components/dashboard/views/InventoryView";
import { StaffView } from "@/components/dashboard/views/StaffView";
import { AnalyticsView } from "@/components/dashboard/views/AnalyticsView";
import { ReportsLogView } from "@/components/dashboard/views/ReportsLogView";
import { PaywallModal } from "@/components/dashboard/modals/PaywallModal";
import { ReportModal } from "@/components/dashboard/modals/ReportModal";
import { RestockModal } from "@/components/dashboard/modals/RestockModal";
import { CostPriceModal } from "@/components/dashboard/modals/CostPriceModal";
import { StaffStatsModal } from "@/components/dashboard/modals/StaffStatsModal";
import { NotificationsPanel } from "@/components/dashboard/NotificationsPanel";
import type {
  Business,
  BusinessEntry,
  BusinessEntryInput,
  DayPerformance,
  ExpenseSplit,
  InventoryItem,
  MonthlyAggregate,
  NotificationItem,
  NotifyPreferences,
  ReportPeriod,
  ReportLog,
  SaleLine,
  StaffMember,
  WeeklyAggregate,
} from "@/types/business";

const initialEntryInput: BusinessEntryInput = {
  sales: 0,
  foodCost: 0,
  staffExpenses: 0,
  otherExpenses: 0,
};

// Default starter items for demo mode/sandbox
const defaultDemoInventory = [
  { name: "Rice (50kg)", stock: 18, threshold: 24, unit: "bags" },
  { name: "Bottled water (75cl)", stock: 42, threshold: 30, unit: "packs" },
  { name: "Bread", stock: 140, threshold: 180, unit: "pcs" },
];

const defaultDemoStaff = [
  { name: "Amaka", role: "Cashier", sales: 74000, tasks: 18 },
  { name: "Tunde", role: "Floor lead", sales: 69000, tasks: 22 },
  { name: "Ife", role: "Stock clerk", sales: 57000, tasks: 16 },
];

export function DashboardClient() {
  // Authentication & Mode State
  const [auth] = useState<Auth | null>(() => getFirebaseAuth());
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  // Lazy init: demo mode is active immediately when Firebase isn't configured
  const [isDemoMode, setIsDemoMode] = useState(() => !isFirebaseConfigured);
  const [demoUserEmail, setDemoUserEmail] = useState<string | null>(() => {
    if (!isFirebaseConfigured && typeof window !== "undefined") {
      return localStorage.getItem("bizpilot_demo_user");
    }
    return null;
  });

  // App Data States
  const [business, setBusiness] = useState<Business | null>(null);
  const [entriesList, setEntriesList] = useState<BusinessEntry[]>([]);
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [reportsList, setReportsList] = useState<ReportLog[]>([]);
  const [notificationsList, setNotificationsList] = useState<NotificationItem[]>([]);
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);
  // Demo mode has no backend to persist read-state, so dismissed synthetic notification ids
  // are tracked client-side only for the current session.
  const [dismissedDemoNotificationIds, setDismissedDemoNotificationIds] = useState<Set<string>>(new Set());

  // Form States
  const [selectedDate, setSelectedDate] = useState<string>(() => toLocalDateString(new Date()));
  // manualEntryInput holds user edits for a specific date
  const [manualEntryInput, setManualEntryInput] = useState<BusinessEntryInput>(initialEntryInput);
  // Which date the manual edits belong to (plain state — no refs in derived values)
  const [manualEntryDate, setManualEntryDate] = useState<string | null>(null);
  // Same pattern as manualEntryInput/manualEntryDate, tracked separately since sale lines
  // and expense fields are independent edits that can each be "dirty" on their own.
  const [manualSaleLines, setManualSaleLines] = useState<SaleLineDraft[]>([]);
  const [manualSaleLinesDate, setManualSaleLinesDate] = useState<string | null>(null);
  const [businessNameInput, setBusinessNameInput] = useState("");
  const [currencyInput, setCurrencyInput] = useState("NGN");

  // Sub-forms management
  const [newItemName, setNewItemName] = useState("");
  const [newItemStock, setNewItemStock] = useState("");
  const [newItemThreshold, setNewItemThreshold] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("pcs");
  const [newItemCostPrice, setNewItemCostPrice] = useState("");
  const [showAddInventory, setShowAddInventory] = useState(false);

  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffRole, setNewStaffRole] = useState("");
  const [newStaffSales, setNewStaffSales] = useState("");
  const [newStaffTasks, setNewStaffTasks] = useState("");
  const [showAddStaff, setShowAddStaff] = useState(false);

  // UI state
  const [status, setStatus] = useState("");
  // Start loading only if Firebase is actually configured (otherwise demo mode is already ready)
  const [loading, setLoading] = useState(() => isFirebaseConfigured);
  const [activeTab, setActiveTab] = useState("Dashboard");

  // Modal-driven flows that replace native prompt()/confirm() dialogs
  const [restockTarget, setRestockTarget] = useState<InventoryItem | null>(null);
  const [costPriceTarget, setCostPriceTarget] = useState<InventoryItem | null>(null);
  const [staffStatsTarget, setStaffStatsTarget] = useState<StaffMember | null>(null);
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null);
  const [savingPreferences, setSavingPreferences] = useState(false);

  // PWA and Notifications State
  const [installable, setInstallable] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<"default" | "granted" | "denied" | "unsupported">("default");

  // Analytics State
  const [analyticsMonthly, setAnalyticsMonthly] = useState<MonthlyAggregate[]>([]);
  const [analyticsWeekly, setAnalyticsWeekly] = useState<WeeklyAggregate[]>([]);
  const [analyticsBestDays, setAnalyticsBestDays] = useState<DayPerformance[]>([]);
  const [analyticsLowDays, setAnalyticsLowDays] = useState<DayPerformance[]>([]);
  const [analyticsExpenses, setAnalyticsExpenses] = useState<ExpenseSplit | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsPeriod, setAnalyticsPeriod] = useState<"monthly" | "weekly">("monthly");

  // Report Generation State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>("monthly");
  const [reportGenerating, setReportGenerating] = useState(false);

  // Subscription / Paywall State
  const [showPaywall, setShowPaywall] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  // Determine current active user email
  const activeEmail = user ? user.email : demoUserEmail;

  // Load all data — plain async function declared before effects so it is accessible
  async function loadAllData() {
    setLoading(true);
    setStatus("");
    try {
      if (isDemoMode) {
        const emailKey = activeEmail || "demo@bizpilot.co";
        const bizData = localStorage.getItem(`bizpilot_business_${emailKey}`);
        setBusiness(bizData ? JSON.parse(bizData) : null);

        const entriesData = localStorage.getItem(`bizpilot_entries_${emailKey}`);
        setEntriesList(entriesData ? JSON.parse(entriesData) : []);

        const invData = localStorage.getItem(`bizpilot_inventory_${emailKey}`);
        if (invData) {
          setInventoryList(JSON.parse(invData));
        } else {
          const starterInv = defaultDemoInventory.map((item, idx) => ({
            ...item,
            _id: `inv-mock-${idx}`,
            userId: "demo-user",
            createdAt: new Date().toISOString(),
          }));
          localStorage.setItem(`bizpilot_inventory_${emailKey}`, JSON.stringify(starterInv));
          setInventoryList(starterInv);
        }

        const staffData = localStorage.getItem(`bizpilot_staff_${emailKey}`);
        if (staffData) {
          setStaffList(JSON.parse(staffData));
        } else {
          const starterStaff = defaultDemoStaff.map((member, idx) => ({
            ...member,
            _id: `staff-mock-${idx}`,
            userId: "demo-user",
            createdAt: new Date().toISOString(),
          }));
          localStorage.setItem(`bizpilot_staff_${emailKey}`, JSON.stringify(starterStaff));
          setStaffList(starterStaff);
        }

        const repData = localStorage.getItem(`bizpilot_reports_${emailKey}`);
        setReportsList(repData ? JSON.parse(repData) : []);
      } else {
        if (!user) return;
        const token = await user.getIdToken();
        const headers = { Authorization: `Bearer ${token}` };

        const bizRes = await fetch("/api/business", { headers });
        if (bizRes.ok) {
          const { business: biz } = await bizRes.json();
          setBusiness(biz);
          if (biz) setBusinessNameInput(biz.name);
        }

        const entriesRes = await fetch("/api/entries", { headers });
        if (entriesRes.ok) {
          const { entries } = await entriesRes.json();
          setEntriesList(entries || []);
        }

        const invRes = await fetch("/api/inventory", { headers });
        if (invRes.ok) {
          const { items } = await invRes.json();
          setInventoryList(items || []);
        }

        const staffRes = await fetch("/api/staff", { headers });
        if (staffRes.ok) {
          const { staff } = await staffRes.json();
          setStaffList(staff || []);
        }

        const reportsRes = await fetch("/api/reports", { headers });
        if (reportsRes.ok) {
          const { reports } = await reportsRes.json();
          setReportsList(reports || []);
        }

        const notificationsRes = await fetch("/api/notifications/list", { headers });
        if (notificationsRes.ok) {
          const { notifications } = await notificationsRes.json();
          setNotificationsList(notifications || []);
        }
      }
    } catch (err: unknown) {
      console.error("Error loading data:", err);
      setStatus("Failed to load some data. Check console.");
    } finally {
      setLoading(false);
    }
  }

  // 1. Auth listener effect (Firebase only)
  useEffect(() => {
    if (!auth) {
      // Demo mode — loading is already false from lazy init; nothing to do
      return;
    }

    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsDemoMode(false);
        setDemoUserEmail(null);
      } else {
        setBusiness(null);
        setEntriesList([]);
        setInventoryList([]);
        setStaffList([]);
        setReportsList([]);
        setNotificationsList([]);
      }
      setLoading(false);
    });
  }, [auth]);

  // 2. Load all data when active user changes (loadAllData sets state internally — intentional)
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { if (activeEmail) void loadAllData(); }, [activeEmail]);

  // 3. PWA Install & Push Support initialization
  useEffect(() => {
    if (typeof window === "undefined") return;

    if ((window as unknown as { deferredPrompt: unknown }).deferredPrompt) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInstallable(true);
    }

    const handleInstallable = () => {
      setInstallable(true);
    };

    window.addEventListener("bizpilot-installable", handleInstallable);

    if ("Notification" in window && "serviceWorker" in navigator) {
      setPushSupported(true);
      setNotificationStatus(Notification.permission);
    } else {
      setNotificationStatus("unsupported");
    }

    return () => {
      window.removeEventListener("bizpilot-installable", handleInstallable);
    };
  }, []);

  // 4. Load Flutterwave inline script
  useEffect(() => {
    if (typeof window === "undefined") return;
    const existing = document.getElementById("flutterwave-inline");
    if (existing) return;
    const script = document.createElement("script");
    script.id = "flutterwave-inline";
    script.src = "https://checkout.flutterwave.com/v3.js";
    script.async = true;
    document.head.appendChild(script);
  }, []);


  // Look up any saved entry for the currently selected date
  const savedEntryForDate = useMemo(
    () => entriesList.find((e) => e.date === selectedDate),
    [entriesList, selectedDate],
  );

  // saleLines: mirrors entryInput's dirty/fallback pattern below, one itemized line per item sold
  const saleLines = useMemo<SaleLineDraft[]>(() => {
    if (manualSaleLinesDate === selectedDate) return manualSaleLines;
    if (savedEntryForDate?.saleLines?.length) {
      return savedEntryForDate.saleLines.map((l) => ({
        itemId: l.itemId,
        quantity: String(l.quantity),
        unit: l.unit,
        amount: String(l.amount),
        staffId: l.staffId ?? "",
      }));
    }
    return [];
  }, [manualSaleLinesDate, selectedDate, manualSaleLines, savedEntryForDate]);

  function updateSaleLines(rows: SaleLineDraft[]) {
    setManualSaleLinesDate(selectedDate);
    setManualSaleLines(rows);
  }

  // entryInput: use manual edits for this date, fall back to saved entry, then empty defaults.
  // `sales` is always derived live from the sale lines above — there is no direct sales input.
  // Wrapped in useMemo so metrics (which depends on entryInput) does not recompute every render
  const entryInput = useMemo<BusinessEntryInput>(() => {
    const base =
      manualEntryDate === selectedDate
        ? manualEntryInput
        : savedEntryForDate
          ? {
              sales: savedEntryForDate.sales,
              foodCost: savedEntryForDate.foodCost,
              staffExpenses: savedEntryForDate.staffExpenses,
              otherExpenses: savedEntryForDate.otherExpenses,
            }
          : initialEntryInput;

    const salesFromLines = saleLines.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
    return { ...base, sales: salesFromLines };
  }, [manualEntryDate, selectedDate, manualEntryInput, savedEntryForDate, saleLines]);

  // Calculated values & statistics
  const metrics = useMemo(() => calculateBusinessMetrics(entryInput), [entryInput]);

  // Suggested Food/material cost — quantity sold × each item's cost price. Shown as a
  // one-click suggestion rather than silently overwriting whatever the user has typed.
  const suggestedFoodCost = useMemo(() => {
    return saleLines.reduce((sum, row) => {
      const item = inventoryList.find((i) => i._id === row.itemId);
      const qty = Number(row.quantity) || 0;
      return sum + qty * (item?.costPrice ?? 0);
    }, 0);
  }, [saleLines, inventoryList]);

  // Sales Trend derived from actual entries for the last 7 calendar days
  const chartDays = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = toLocalDateString(d);
      const label = d.toLocaleDateString("en-NG", { weekday: "short" });
      const entryForDay = entriesList.find((e) => e.date === dateStr);
      days.push({
        label,
        date: dateStr,
        sales: entryForDay ? entryForDay.sales : 0,
      });
    }
    return days;
  }, [entriesList]);

  const maxWeekSales = useMemo(() => {
    const maxVal = Math.max(...chartDays.map((day) => day.sales));
    return maxVal > 0 ? maxVal : 1; // avoid divide by zero
  }, [chartDays]);

  // Prior month average or historical average to calculate percentage change
  const trendPercentage = useMemo(() => {
    if (entriesList.length < 2) return 0;
    // Calculate current entry sales vs previous entry sales
    const sorted = [...entriesList].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const current = sorted[0]?.sales || 0;
    const previous = sorted[1]?.sales || 0;
    return calculatePercentageChange(current, previous);
  }, [entriesList]);

  const lowStockItems = useMemo(() => {
    return inventoryList.filter((item) => item.stock < item.threshold);
  }, [inventoryList]);

  // Demo mode has no backend notification log, so synthesize one from local low-stock state
  const demoNotifications = useMemo<NotificationItem[]>(() => {
    if (!isDemoMode) return [];
    const welcomeId = "demo-welcome";
    const items: NotificationItem[] = [
      {
        _id: welcomeId,
        userId: "demo-user",
        type: "welcome",
        title: "Welcome to Bizpilot Sandbox",
        body: "You're exploring Bizpilot in local sandbox mode — data stays in this browser only.",
        read: dismissedDemoNotificationIds.has(welcomeId),
        createdAt: new Date().toISOString(),
      },
      ...lowStockItems.map((item) => {
        const id = `demo-low-${item._id}`;
        return {
          _id: id,
          userId: "demo-user",
          type: "low_stock" as const,
          title: "Low stock alert",
          body: `${item.name} is down to ${item.stock} ${item.unit} (threshold ${item.threshold}).`,
          read: dismissedDemoNotificationIds.has(id),
          createdAt: new Date().toISOString(),
        };
      }),
    ];
    return items;
  }, [isDemoMode, lowStockItems, dismissedDemoNotificationIds]);

  const notifications = isDemoMode ? demoNotifications : notificationsList;
  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  function markNotificationRead(id: string) {
    if (isDemoMode) {
      setDismissedDemoNotificationIds((prev) => new Set(prev).add(id));
      return;
    }
    setNotificationsList((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    if (!user) return;
    user
      .getIdToken()
      .then((token) =>
        fetch("/api/notifications/read", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ id }),
        }),
      )
      .catch((err) => console.error("Failed to mark notification read:", err));
  }

  function markAllNotificationsRead() {
    if (isDemoMode) {
      setDismissedDemoNotificationIds(new Set(demoNotifications.map((n) => n._id!)));
      return;
    }
    setNotificationsList((prev) => prev.map((n) => ({ ...n, read: true })));
    if (!user) return;
    user
      .getIdToken()
      .then((token) =>
        fetch("/api/notifications/read", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ all: true }),
        }),
      )
      .catch((err) => console.error("Failed to mark all notifications read:", err));
  }

  // Form field changes helper — marks the current date as manually edited
  function updateEntryField(field: keyof BusinessEntryInput, value: string) {
    setManualEntryDate(selectedDate);
    setManualEntryInput((current) => ({
      ...current,
      [field]: Math.max(0, Number(value)),
    }));
  }

  // PWA & Notification Handlers
  const handleInstallClick = async () => {
    interface BeforeInstallPromptEvent extends Event {
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
    }
    const win = window as unknown as { deferredPrompt?: BeforeInstallPromptEvent | null };
    const promptEvent = win.deferredPrompt;
    if (!promptEvent) return;

    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    console.log(`PWA install outcome: ${outcome}`);

    win.deferredPrompt = null;
    setInstallable(false);
  };

  const subscribeUserToPush = async () => {
    try {
      const reg = navigator.serviceWorker && await navigator.serviceWorker.ready;
      if (!reg) {
        setStatus("Service Worker not active yet.");
        return;
      }

      const keyRes = await fetch("/api/notifications/subscribe");
      if (!keyRes.ok) throw new Error("Failed to get VAPID public key");
      const { publicKey } = await keyRes.json();

      const padding = "=".repeat((4 - (publicKey.length % 4)) % 4);
      const base64 = (publicKey + padding).replace(/\-/g, "+").replace(/_/g, "/");
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: outputArray,
      });

      if (!user) return;
      const token = await user.getIdToken();
      const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

      const res = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers,
        body: JSON.stringify({ subscription }),
      });

      if (res.ok) {
        setStatus("Alerts successfully enabled on this device!");
      } else {
        throw new Error("Failed to save subscription on server");
      }
    } catch (err) {
      console.error("Subscription error:", err);
      setStatus("Could not register notifications on this device.");
    }
  };

  const toggleNotifications = async () => {
    if (notificationStatus === "unsupported") return;

    if (notificationStatus === "granted") {
      setStatus("Notifications are already enabled.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationStatus(permission);

      if (permission === "granted") {
        if (isDemoMode) {
          setStatus("Alerts enabled for this sandbox session.");
          return;
        }
        await subscribeUserToPush();
      } else {
        setStatus("Notification permission denied.");
      }
    } catch (err) {
      console.error("Error setting up notifications:", err);
      setStatus("Failed to enable notifications.");
    }
  };

  const triggerTestNotification = async () => {
    setLoading(true);
    try {
      if (isDemoMode) {
        const reg = navigator.serviceWorker && await navigator.serviceWorker.ready;
        if (reg) {
          reg.showNotification("Bizpilot Demo Alert", {
            body: "This is a simulated push alert for testing low stock/financial entries!",
            icon: "/bizpilot-mark.svg",
            badge: "/bizpilot-mark.svg",
          });
          setStatus("Test alert simulated successfully!");
        } else {
          setStatus("Service Worker not active.");
        }
      } else {
        if (!user) return;
        const token = await user.getIdToken();
        const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

        const res = await fetch("/api/notifications/send", {
          method: "POST",
          headers,
          body: JSON.stringify({
            title: "Bizpilot Alert",
            body: "Your daily sales report has been verified.",
            url: "/dashboard",
          }),
        });

        if (res.ok) {
          setStatus("Test push alert dispatched via cloud!");
        } else {
          const bodyData = await res.json().catch(() => ({}));
          throw new Error(bodyData.error || "Send failed");
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatus(`Failed to send test alert: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  // Auth Operations
  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setStatus("Please fill in email and password.");
      return;
    }

    setLoading(true);
    setStatus("");

    if (isDemoMode) {
      // Mock Login in Demo Mode
      localStorage.setItem("bizpilot_demo_user", email);
      setDemoUserEmail(email);
      setStatus("Logged in to Sandbox Mode.");
      setLoading(false);
    } else {
      if (!auth) return;
      try {
        if (authMode === "login") {
          await signInWithEmailAndPassword(auth, email, password);
          setStatus("Signed in successfully.");
        } else {
          await createUserWithEmailAndPassword(auth, email, password);
          setStatus("Account registered and signed in.");
        }
      } catch (err: unknown) {
        console.error(err);
        const msg = err instanceof Error ? err.message : "Auth action failed.";
        setStatus(msg);
        setLoading(false);
      }
    }
  }

  async function handleGoogleAuth() {
    setLoading(true);
    setStatus("");
    if (isDemoMode) {
      // Mock Google sign in
      const mockEmail = "google-sandbox@bizpilot.co";
      localStorage.setItem("bizpilot_demo_user", mockEmail);
      setDemoUserEmail(mockEmail);
      setStatus("Signed in to Google Sandbox.");
      setLoading(false);
    } else {
      if (!auth) return;
      try {
        await signInWithPopup(auth, new GoogleAuthProvider());
        setStatus("Signed in with Google.");
      } catch (err: unknown) {
        console.error(err);
        const msg = err instanceof Error ? err.message : "Google Authentication failed.";
        setStatus(msg);
        setLoading(false);
      }
    }
  }

  async function handleSignOut() {
    setLoading(true);
    if (isDemoMode) {
      localStorage.removeItem("bizpilot_demo_user");
      setDemoUserEmail(null);
      setBusiness(null);
      setEntriesList([]);
      setInventoryList([]);
      setStaffList([]);
      setReportsList([]);
      setStatus("Logged out of Sandbox.");
      setLoading(false);
    } else {
      if (!auth) return;
      try {
        await signOut(auth);
        setStatus("Signed out.");
      } catch (err) {
        console.error(err);
      }
    }
  }

  // Business Onboarding
  async function handleRegisterBusiness(e: React.FormEvent) {
    e.preventDefault();
    if (!businessNameInput.trim()) {
      setStatus("Please enter a business name.");
      return;
    }

    setLoading(true);
    setStatus("");

    try {
      if (isDemoMode) {
        const newBiz: Business = {
          name: businessNameInput.trim(),
          currency: currencyInput,
          userId: "demo-user",
          createdAt: new Date().toISOString(),
        };
        const emailKey = activeEmail || "demo@bizpilot.co";
        localStorage.setItem(`bizpilot_business_${emailKey}`, JSON.stringify(newBiz));
        setBusiness(newBiz);
        setStatus("Business configured locally.");
      } else {
        if (!user) return;
        const token = await user.getIdToken();
        const response = await fetch("/api/business", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: businessNameInput.trim(), currency: currencyInput }),
        });

        if (response.ok) {
          const data = await response.json().catch(() => null);
          if (data && data.business) {
            setBusiness(data.business);
            setStatus("Business created successfully.");
          } else {
            setStatus("Could not register business (Invalid response format).");
          }
        } else {
          const errData = await response.json().catch(() => ({}));
          setStatus(errData?.error || "Could not register business.");
        }
      }
    } catch (err: unknown) {
      console.error(err);
      setStatus("Business creation error.");
    } finally {
      setLoading(false);
    }
  }

  // Daily Entry Save
  async function handleSaveEntry() {
    if (!activeEmail) return;
    setLoading(true);
    setStatus("");

    const parsedSaleLines: SaleLine[] = saleLines
      .map((row) => {
        const item = inventoryList.find((i) => i._id === row.itemId);
        const staff = staffList.find((s) => s._id === row.staffId);
        return {
          itemId: row.itemId,
          itemName: item?.name ?? "",
          quantity: Number(row.quantity) || 0,
          unit: row.unit || item?.unit || "",
          amount: Math.max(0, Number(row.amount) || 0),
          staffId: row.staffId || undefined,
          staffName: staff?.name,
        };
      })
      .filter((l) => l.itemId && l.quantity > 0);

    try {
      if (isDemoMode) {
        const calculated = calculateBusinessMetrics(entryInput);
        const newEntry: BusinessEntry = {
          ...entryInput,
          ...calculated,
          userId: "demo-user",
          date: selectedDate,
          createdAt: new Date().toISOString(),
          saleLines: parsedSaleLines,
        };

        // Reverse whatever the previous save for this date deducted/credited, then apply the
        // new sale lines, so re-saving the same date doesn't double-count.
        const previousEntry = entriesList.find((e) => e.date === selectedDate);
        const previousLines = previousEntry?.saleLines ?? [];

        // Mirrors /api/entries: record the stock actually deducted so a re-save gives back
        // exactly that, even when a sale exceeded the stock on hand.
        const inventoryApplied: Record<string, number> = {};
        const updatedInventoryList = inventoryList.map((item) => {
          const itemId = item._id ?? "";
          const reversedQty = previousEntry?.inventoryApplied
            ? (previousEntry.inventoryApplied[itemId] ?? 0)
            : previousLines.filter((l) => l.itemId === itemId).reduce((a, l) => a + l.quantity, 0);
          const newQty = parsedSaleLines.filter((l) => l.itemId === itemId).reduce((a, l) => a + l.quantity, 0);
          const available = Math.max(0, item.stock + reversedQty);
          const applied = Math.min(newQty, available);
          if (applied > 0) inventoryApplied[itemId] = applied;
          const newStock = available - applied;
          return newStock !== item.stock ? { ...item, stock: newStock } : item;
        });
        newEntry.inventoryApplied = inventoryApplied;
        localStorage.setItem(`bizpilot_inventory_${activeEmail}`, JSON.stringify(updatedInventoryList));
        setInventoryList(updatedInventoryList);

        const updatedStaffList = staffList.map((member) => {
          const reversedAmount = previousLines
            .filter((l) => l.staffId === member._id)
            .reduce((a, l) => a + l.amount, 0);
          const newAmount = parsedSaleLines.filter((l) => l.staffId === member._id).reduce((a, l) => a + l.amount, 0);
          const netDelta = newAmount - reversedAmount;
          return netDelta !== 0 ? { ...member, sales: Math.max(0, member.sales + netDelta) } : member;
        });
        localStorage.setItem(`bizpilot_staff_${activeEmail}`, JSON.stringify(updatedStaffList));
        setStaffList(updatedStaffList);

        const updated = [...entriesList].filter((e) => e.date !== selectedDate);
        updated.push(newEntry);
        updated.sort((a, b) => b.date.localeCompare(a.date));

        localStorage.setItem(`bizpilot_entries_${activeEmail}`, JSON.stringify(updated));
        setEntriesList(updated);
        setStatus(`Saved entry locally for ${selectedDate}.`);
      } else {
        if (!user) return;
        const token = await user.getIdToken();
        const response = await fetch("/api/entries", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...entryInput,
            date: selectedDate,
            businessId: business?._id,
            saleLines: parsedSaleLines,
          }),
        });

        if (response.ok) {
          const data = await response.json().catch(() => null);
          if (data && data.entry) {
            const saved = data.entry;
            const updated = [...entriesList].filter((e) => e.date !== selectedDate);
            updated.push(saved);
            updated.sort((a, b) => b.date.localeCompare(a.date));
            setEntriesList(updated);

            if (Array.isArray(data.updatedInventory) && data.updatedInventory.length) {
              const byId = new Map(data.updatedInventory.map((i: InventoryItem) => [i._id, i]));
              setInventoryList((prev) => prev.map((item) => (byId.has(item._id) ? (byId.get(item._id) as InventoryItem) : item)));
            }

            if (Array.isArray(data.updatedStaff) && data.updatedStaff.length) {
              const byId = new Map(data.updatedStaff.map((s: StaffMember) => [s._id, s]));
              setStaffList((prev) => prev.map((member) => (byId.has(member._id) ? (byId.get(member._id) as StaffMember) : member)));
            }

            setStatus(`Entry saved successfully for ${selectedDate}.`);
          } else {
            setStatus("Could not save entry (Invalid response format).");
          }
        } else {
          setStatus("Could not save entry.");
        }
      }
    } catch (err) {
      console.error(err);
      setStatus("Error saving entry.");
    } finally {
      setLoading(false);
    }
  }

  // Send Report
  async function handleSendReport() {
    if (!activeEmail) return;
    setLoading(true);
    setStatus("");

    try {
      if (isDemoMode) {
        // Simulate email sending in demo mode
        const newReportLog: ReportLog = {
          userId: "demo-user",
          businessId: "demo-business",
          type: "daily",
          rangeStart: selectedDate,
          rangeEnd: selectedDate,
          metrics,
          sentToEmail: activeEmail,
          createdAt: new Date().toISOString(),
        };

        const updated = [newReportLog, ...reportsList];
        localStorage.setItem(`bizpilot_reports_${activeEmail}`, JSON.stringify(updated));
        setReportsList(updated);
        setStatus("Demo Report simulated successfully! (Email not sent in Sandbox Mode).");
      } else {
        if (!user) return;
        const token = await user.getIdToken();
        const response = await fetch("/api/reports/email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            to: activeEmail,
            date: selectedDate,
            metrics,
            type: "daily",
          }),
        });

        if (response.ok) {
          setStatus("Report dispatched successfully via Resend.");
          // Refresh reports
          const reportsRes = await fetch("/api/reports", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (reportsRes.ok) {
            const { reports } = await reportsRes.json();
            setReportsList(reports || []);
          }
        } else {
          const errData = await response.json().catch(() => ({}));
          setStatus(errData.error || "Could not email report.");
        }
      }
    } catch (err) {
      console.error(err);
      setStatus("Error sending report.");
    } finally {
      setLoading(false);
    }
  }

  // Analytics loader — computes from local entriesList client-side (demo) or fetches from API
  async function loadAnalytics() {
    setAnalyticsLoading(true);
    try {
      if (isDemoMode) {
        setAnalyticsMonthly(buildMonthlyAggregates(entriesList));
        setAnalyticsWeekly(buildWeeklyAggregates(entriesList));
        setAnalyticsBestDays(getBestDays(entriesList));
        setAnalyticsLowDays(getLowDays(entriesList));
        setAnalyticsExpenses(getExpenseSplit(entriesList));
      } else {
        if (!user) return;
        const token = await user.getIdToken();
        const res = await fetch("/api/analytics", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 403) {
          setShowPaywall(true);
        } else if (res.ok) {
          const data = await res.json();
          setAnalyticsMonthly(data.monthly ?? []);
          setAnalyticsWeekly(data.weekly ?? []);
          setAnalyticsBestDays(data.bestDays ?? []);
          setAnalyticsLowDays(data.lowDays ?? []);
          setAnalyticsExpenses(data.expenseSplit ?? null);
        }
      }
    } catch (err) {
      console.error("Analytics load error:", err);
    } finally {
      setAnalyticsLoading(false);
    }
  }


  // 5. Load analytics when the Analytics tab is activated (placed after declaration)
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { if (activeTab === "Analytics") void loadAnalytics(); }, [activeTab]);

  async function handleGenerateReport() {
    if (!activeEmail) return;
    setReportGenerating(true);
    setStatus("");

    try {
      // Build date range based on period selection
      const now = new Date();
      let rangeStart: string;
      const rangeEnd: string = toLocalDateString(now);

      if (reportPeriod === "weekly") {
        const day = (now.getDay() + 6) % 7;
        const monday = new Date(now);
        monday.setDate(now.getDate() - day);
        rangeStart = toLocalDateString(monday);
      } else {
        // Monthly: first day of current month
        rangeStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      }

      if (isDemoMode) {
        // Client-side only in demo mode
        const filtered = filterEntriesByRange(entriesList, rangeStart, rangeEnd);
        const monthly = buildMonthlyAggregates(filtered);
        const totalRevenue  = monthly.reduce((a, m) => a + m.totalRevenue, 0);
        const totalExpenses = monthly.reduce((a, m) => a + m.totalExpenses, 0);
        const totalProfit   = monthly.reduce((a, m) => a + m.estimatedProfit, 0);
        const newReport: ReportLog = {
          userId: "demo-user",
          type: reportPeriod,
          rangeStart,
          rangeEnd,
          metrics: {
            totalRevenue,
            totalExpenses,
            estimatedProfit: totalProfit,
            profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
          },
          sentToEmail: activeEmail,
          createdAt: new Date().toISOString(),
        };
        const updated = [newReport, ...reportsList];
        localStorage.setItem(`bizpilot_reports_${activeEmail}`, JSON.stringify(updated));
        setReportsList(updated);
        setStatus(`${reportPeriod === "weekly" ? "Weekly" : "Monthly"} analytics report simulated! (Email not sent in Sandbox Mode).`);
      } else {
        if (!user) return;
        const token = await user.getIdToken();
        const res = await fetch("/api/reports/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            period: reportPeriod,
            rangeStart,
            rangeEnd,
            email: activeEmail,
          }),
        });
        if (res.ok) {
          const { report } = await res.json();
          setReportsList((prev) => [report, ...prev]);
          setStatus(`${reportPeriod === "weekly" ? "Weekly" : "Monthly"} analytics report emailed to ${activeEmail}!`);
        } else {
          const errData = await res.json().catch(() => ({}));
          setStatus(errData.error || "Could not generate report.");
        }
      }
    } catch (err) {
      console.error(err);
      setStatus("Error generating report.");
    } finally {
      setReportGenerating(false);
      setShowReportModal(false);
    }
  }

  // Check if the user has an active analytics subscription
  const isSubscribed = isDemoMode || isSubscriptionActive(business?.subscription);

  // Trigger Flutterwave inline checkout
  async function handleSubscribe() {
    setSubscriptionLoading(true);
    let checkoutOpened = false;
    try {
      if (isDemoMode) {
        // Instantly grant subscription in demo mode
        const updatedBusiness = {
          ...business,
          subscription: { status: "active" as const, expiresAt: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString() },
        };
        if (business && activeEmail) {
          localStorage.setItem(`bizpilot_business_${activeEmail}`, JSON.stringify(updatedBusiness));
          setBusiness(updatedBusiness as typeof business);
        }
        setShowPaywall(false);
        setStatus("Demo subscription activated! Analytics tab is now unlocked.");
        return;
      }

      if (!user) return;
      const token = await user.getIdToken();
      const res = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: user.email, name: business?.name }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setStatus(errData.error || "Could not initiate checkout.");
        return;
      }
      const { config } = await res.json();

      // Load and invoke Flutterwave inline
      const FlutterwaveCheckout = (window as unknown as { FlutterwaveCheckout?: (c: unknown) => void }).FlutterwaveCheckout;
      if (!FlutterwaveCheckout) {
        setStatus("Payment provider not loaded. Please refresh and try again.");
        return;
      }

      checkoutOpened = true;
      FlutterwaveCheckout({
        ...config,
        callback: async (response: { transaction_id?: number; status: string }) => {
          if (response.status !== "successful" || !response.transaction_id) return;
          try {
            // Fresh token: the user may have spent a while in the payment modal
            const verifyToken = await user.getIdToken();
            const verifyRes = await fetch("/api/subscription/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${verifyToken}` },
              body: JSON.stringify({ transactionId: response.transaction_id }),
            });
            if (verifyRes.ok) {
              const { subscription } = await verifyRes.json();
              setBusiness((prev) => prev ? { ...prev, subscription } : prev);
              setShowPaywall(false);
              setStatus("Subscription activated! Analytics tab is now unlocked.");
            } else {
              const errData = await verifyRes.json().catch(() => ({}));
              setStatus(`Payment received but verification failed: ${errData.error || "unknown error"}. Contact support.`);
            }
          } catch (err) {
            console.error(err);
            setStatus("Payment received but verification failed. Contact support.");
          }
        },
        onclose: () => setSubscriptionLoading(false),
      });
    } catch (err) {
      console.error(err);
      setStatus("Subscription error. Please try again.");
    } finally {
      if (!checkoutOpened) setSubscriptionLoading(false);
    }
  }

  // Email / notification preferences
  async function handleSaveNotifyPreferences(prefs: NotifyPreferences) {
    setSavingPreferences(true);
    try {
      if (isDemoMode) {
        const updatedBusiness = business ? { ...business, notifyPreferences: prefs } : business;
        if (updatedBusiness && activeEmail) {
          localStorage.setItem(`bizpilot_business_${activeEmail}`, JSON.stringify(updatedBusiness));
          setBusiness(updatedBusiness);
        }
        setStatus("Preferences saved locally.");
        return;
      }

      if (!user) return;
      const token = await user.getIdToken();
      const res = await fetch("/api/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ notifyPreferences: prefs }),
      });

      if (res.ok) {
        const { business: updated } = await res.json();
        setBusiness(updated);
        setStatus("Email preferences saved.");
      } else {
        setStatus("Could not save email preferences.");
      }
    } catch (err) {
      console.error(err);
      setStatus("Error saving preferences.");
    } finally {
      setSavingPreferences(false);
    }
  }

  // Inventory Management CRUD
  async function handleAddInventoryItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItemName.trim() || !newItemStock || !newItemThreshold || !newItemUnit) {
      setStatus("Please fill in all inventory item fields.");
      return;
    }

    setLoading(true);
    setStatus("");

    try {
      const stockNum = Number(newItemStock);
      const thresholdNum = Number(newItemThreshold);
      const costPriceNum = newItemCostPrice ? Number(newItemCostPrice) : 0;

      if (isDemoMode) {
        const newItem: InventoryItem = {
          _id: `inv-${Date.now()}`,
          userId: "demo-user",
          name: newItemName.trim(),
          stock: stockNum,
          threshold: thresholdNum,
          unit: newItemUnit,
          costPrice: costPriceNum,
          createdAt: new Date().toISOString(),
        };

        const updated = [...inventoryList, newItem];
        localStorage.setItem(`bizpilot_inventory_${activeEmail}`, JSON.stringify(updated));
        setInventoryList(updated);
        setNewItemName("");
        setNewItemStock("");
        setNewItemThreshold("");
        setNewItemCostPrice("");
        setShowAddInventory(false);
        setStatus("Inventory item added to local store.");
      } else {
        if (!user) return;
        const token = await user.getIdToken();
        const response = await fetch("/api/inventory", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: newItemName.trim(),
            stock: stockNum,
            threshold: thresholdNum,
            unit: newItemUnit,
            costPrice: costPriceNum,
            businessId: business?._id,
          }),
        });

        if (response.ok) {
          const { item } = await response.json();
          setInventoryList([...inventoryList, item]);
          setNewItemName("");
          setNewItemStock("");
          setNewItemThreshold("");
          setNewItemCostPrice("");
          setShowAddInventory(false);
          setStatus("Inventory item created in DB.");
        } else {
          setStatus("Could not add inventory item.");
        }
      }
    } catch (err) {
      console.error(err);
      setStatus("Error creating item.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteInventoryItem(id: string) {
    setLoading(true);
    setStatus("");

    try {
      if (isDemoMode) {
        const updated = inventoryList.filter((item) => item._id !== id);
        localStorage.setItem(`bizpilot_inventory_${activeEmail}`, JSON.stringify(updated));
        setInventoryList(updated);
        setStatus("Item removed locally.");
      } else {
        if (!user) return;
        const token = await user.getIdToken();
        const response = await fetch(`/api/inventory?id=${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          setInventoryList(inventoryList.filter((item) => item._id !== id));
          setStatus("Item deleted from DB.");
        } else {
          setStatus("Could not delete item.");
        }
      }
    } catch (err) {
      console.error(err);
      setStatus("Error deleting item.");
    } finally {
      setLoading(false);
    }
  }

  function requestDeleteInventoryItem(item: InventoryItem) {
    setConfirmRequest({
      title: "Remove this item?",
      message: `${item.name} will be removed from your stock register. This can't be undone.`,
      onConfirm: () => deleteInventoryItem(item._id!),
    });
  }

  async function submitRestock(amount: number) {
    if (!restockTarget) return;
    const id = restockTarget._id!;
    const newStock = restockTarget.stock + amount;
    setLoading(true);
    setStatus("");

    try {
      if (isDemoMode) {
        const updated = inventoryList.map((item) =>
          item._id === id ? { ...item, stock: newStock } : item
        );
        localStorage.setItem(`bizpilot_inventory_${activeEmail}`, JSON.stringify(updated));
        setInventoryList(updated);
        setStatus("Stock updated locally.");
      } else {
        if (!user) return;
        const token = await user.getIdToken();
        const response = await fetch("/api/inventory", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ _id: id, stock: newStock }),
        });

        if (response.ok) {
          const { item } = await response.json();
          setInventoryList(inventoryList.map((i) => (i._id === id ? item : i)));
          setStatus("Stock updated in DB.");
        } else {
          setStatus("Could not update stock.");
        }
      }
    } catch (err) {
      console.error(err);
      setStatus("Error updating stock.");
    } finally {
      setLoading(false);
      setRestockTarget(null);
    }
  }

  async function submitCostPrice(costPrice: number) {
    if (!costPriceTarget) return;
    const id = costPriceTarget._id!;
    setLoading(true);
    setStatus("");

    try {
      if (isDemoMode) {
        const updated = inventoryList.map((item) => (item._id === id ? { ...item, costPrice } : item));
        localStorage.setItem(`bizpilot_inventory_${activeEmail}`, JSON.stringify(updated));
        setInventoryList(updated);
        setStatus("Cost price updated locally.");
      } else {
        if (!user) return;
        const token = await user.getIdToken();
        const response = await fetch("/api/inventory", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ _id: id, costPrice }),
        });

        if (response.ok) {
          const { item } = await response.json();
          setInventoryList(inventoryList.map((i) => (i._id === id ? item : i)));
          setStatus("Cost price updated.");
        } else {
          setStatus("Could not update cost price.");
        }
      }
    } catch (err) {
      console.error(err);
      setStatus("Error updating cost price.");
    } finally {
      setLoading(false);
      setCostPriceTarget(null);
    }
  }

  async function handleAddStaffMember(e: React.FormEvent) {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffRole.trim()) {
      setStatus("Please fill in staff name and role.");
      return;
    }

    setLoading(true);
    setStatus("");

    try {
      const salesNum = newStaffSales ? Number(newStaffSales) : 0;
      const tasksNum = newStaffTasks ? Number(newStaffTasks) : 0;

      if (isDemoMode) {
        const newMember: StaffMember = {
          _id: `staff-${Date.now()}`,
          userId: "demo-user",
          name: newStaffName.trim(),
          role: newStaffRole.trim(),
          sales: salesNum,
          tasks: tasksNum,
          createdAt: new Date().toISOString(),
        };

        const updated = [...staffList, newMember];
        localStorage.setItem(`bizpilot_staff_${activeEmail}`, JSON.stringify(updated));
        setStaffList(updated);
        setNewStaffName("");
        setNewStaffRole("");
        setNewStaffSales("");
        setNewStaffTasks("");
        setShowAddStaff(false);
        setStatus("Staff member added locally.");
      } else {
        if (!user) return;
        const token = await user.getIdToken();
        const response = await fetch("/api/staff", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: newStaffName.trim(),
            role: newStaffRole.trim(),
            sales: salesNum,
            tasks: tasksNum,
            businessId: business?._id,
          }),
        });

        if (response.ok) {
          const { member } = await response.json();
          setStaffList([...staffList, member]);
          setNewStaffName("");
          setNewStaffRole("");
          setNewStaffSales("");
          setNewStaffTasks("");
          setShowAddStaff(false);
          setStatus("Staff member added in DB.");
        } else {
          setStatus("Could not add staff member.");
        }
      }
    } catch (err) {
      console.error(err);
      setStatus("Error adding staff.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteStaffMember(id: string) {
    setLoading(true);
    setStatus("");

    try {
      if (isDemoMode) {
        const updated = staffList.filter((m) => m._id !== id);
        localStorage.setItem(`bizpilot_staff_${activeEmail}`, JSON.stringify(updated));
        setStaffList(updated);
        setStatus("Staff member removed locally.");
      } else {
        if (!user) return;
        const token = await user.getIdToken();
        const response = await fetch(`/api/staff?id=${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          setStaffList(staffList.filter((m) => m._id !== id));
          setStatus("Staff deleted from DB.");
        } else {
          setStatus("Could not delete staff.");
        }
      }
    } catch (err) {
      console.error(err);
      setStatus("Error deleting staff.");
    } finally {
      setLoading(false);
    }
  }

  function requestDeleteStaffMember(member: StaffMember) {
    setConfirmRequest({
      title: "Remove this staff member?",
      message: `${member.name} will be removed from your roster. This can't be undone.`,
      onConfirm: () => deleteStaffMember(member._id!),
    });
  }

  async function submitStaffStats(sales: number, tasks: number) {
    if (!staffStatsTarget) return;
    const id = staffStatsTarget._id!;
    setLoading(true);
    setStatus("");

    try {
      if (isDemoMode) {
        const updated = staffList.map((m) =>
          m._id === id ? { ...m, sales, tasks } : m
        );
        localStorage.setItem(`bizpilot_staff_${activeEmail}`, JSON.stringify(updated));
        setStaffList(updated);
        setStatus("Staff stats updated locally.");
      } else {
        if (!user) return;
        const token = await user.getIdToken();
        const response = await fetch("/api/staff", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ _id: id, sales, tasks }),
        });

        if (response.ok) {
          const { member } = await response.json();
          setStaffList(staffList.map((m) => (m._id === id ? member : m)));
          setStatus("Staff stats updated in DB.");
        } else {
          setStatus("Could not update staff.");
        }
      }
    } catch (err) {
      console.error(err);
      setStatus("Error updating staff.");
    } finally {
      setLoading(false);
      setStaffStatsTarget(null);
    }
  }

  // --- UI Renders ---

  if (loading && !activeEmail) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-6">
        <Loader2 className="h-12 w-12 animate-spin text-ocean" />
        <p className="text-sm font-semibold text-slate-600">Syncing with Bizpilot...</p>
      </main>
    );
  }

  if (!activeEmail) {
    return (
      <AuthScreen
        isDemoMode={isDemoMode}
        authMode={authMode}
        setAuthMode={setAuthMode}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        loading={loading}
        status={status}
        setStatus={setStatus}
        onEmailAuth={handleEmailAuth}
        onGoogleAuth={handleGoogleAuth}
      />
    );
  }

  if (!business) {
    return (
      <OnboardingScreen
        businessNameInput={businessNameInput}
        setBusinessNameInput={setBusinessNameInput}
        currencyInput={currencyInput}
        setCurrencyInput={setCurrencyInput}
        loading={loading}
        status={status}
        setStatus={setStatus}
        onSubmit={handleRegisterBusiness}
        onSignOut={handleSignOut}
      />
    );
  }

  return (
    <AppShell
      isDemoMode={isDemoMode}
      business={business}
      activeEmail={activeEmail}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      isSubscribed={!!isSubscribed}
      setShowPaywall={setShowPaywall}
      pushSupported={pushSupported}
      notificationStatus={notificationStatus}
      toggleNotifications={toggleNotifications}
      loading={loading}
      loadAllData={loadAllData}
      handleSignOut={handleSignOut}
      installable={installable}
      handleInstallClick={handleInstallClick}
      setInstallable={setInstallable}
      unreadNotifications={unreadNotificationsCount}
      onOpenNotifications={() => setShowNotificationsPanel(true)}
    >
      <Toast status={status} onClear={() => setStatus("")} />

      {activeTab === "Dashboard" && (
        <OverviewView
          metrics={metrics}
          entryInput={entryInput}
          updateEntryField={updateEntryField}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          saleLines={saleLines}
          setSaleLines={updateSaleLines}
          staffList={staffList}
          suggestedFoodCost={suggestedFoodCost}
          handleSaveEntry={handleSaveEntry}
          handleSendReport={handleSendReport}
          loading={loading}
          chartDays={chartDays}
          maxWeekSales={maxWeekSales}
          trendPercentage={trendPercentage}
          inventoryList={inventoryList}
          lowStockCount={lowStockItems.length}
          notificationStatus={notificationStatus}
          toggleNotifications={toggleNotifications}
          triggerTestNotification={triggerTestNotification}
          currency={business.currency}
        />
      )}

      {activeTab === "Inventory" && (
        <InventoryView
          inventoryList={inventoryList}
          showAddInventory={showAddInventory}
          setShowAddInventory={setShowAddInventory}
          newItemName={newItemName}
          setNewItemName={setNewItemName}
          newItemStock={newItemStock}
          setNewItemStock={setNewItemStock}
          newItemThreshold={newItemThreshold}
          setNewItemThreshold={setNewItemThreshold}
          newItemUnit={newItemUnit}
          setNewItemUnit={setNewItemUnit}
          newItemCostPrice={newItemCostPrice}
          setNewItemCostPrice={setNewItemCostPrice}
          handleAddInventoryItem={handleAddInventoryItem}
          loading={loading}
          currency={business.currency}
          onRestock={setRestockTarget}
          onEditCostPrice={setCostPriceTarget}
          onDelete={requestDeleteInventoryItem}
        />
      )}

      {activeTab === "Staff Roster" && (
        <StaffView
          staffList={staffList}
          showAddStaff={showAddStaff}
          setShowAddStaff={setShowAddStaff}
          newStaffName={newStaffName}
          setNewStaffName={setNewStaffName}
          newStaffRole={newStaffRole}
          setNewStaffRole={setNewStaffRole}
          newStaffSales={newStaffSales}
          setNewStaffSales={setNewStaffSales}
          newStaffTasks={newStaffTasks}
          setNewStaffTasks={setNewStaffTasks}
          handleAddStaffMember={handleAddStaffMember}
          loading={loading}
          currency={business.currency}
          onUpdateStats={setStaffStatsTarget}
          onDelete={requestDeleteStaffMember}
        />
      )}

      {activeTab === "Analytics" && (
        <AnalyticsView
          loading={analyticsLoading}
          period={analyticsPeriod}
          setPeriod={setAnalyticsPeriod}
          monthly={analyticsMonthly}
          weekly={analyticsWeekly}
          bestDays={analyticsBestDays}
          lowDays={analyticsLowDays}
          expenses={analyticsExpenses}
          currency={business.currency}
          onOpenReportModal={() => setShowReportModal(true)}
          notifyPreferences={business.notifyPreferences}
          defaultEmail={activeEmail}
          onSaveNotifyPreferences={handleSaveNotifyPreferences}
          savingPreferences={savingPreferences}
        />
      )}

      {activeTab === "Reports Log" && <ReportsLogView reportsList={reportsList} currency={business.currency} />}

      <PaywallModal
        open={showPaywall}
        onClose={() => setShowPaywall(false)}
        onSubscribe={handleSubscribe}
        loading={subscriptionLoading}
      />

      <ReportModal
        open={showReportModal}
        onClose={() => setShowReportModal(false)}
        period={reportPeriod}
        onPeriodChange={setReportPeriod}
        onGenerate={handleGenerateReport}
        generating={reportGenerating}
        recipientEmail={activeEmail}
      />

      <RestockModal
        item={restockTarget}
        onClose={() => setRestockTarget(null)}
        onSubmit={submitRestock}
        loading={loading}
      />

      <CostPriceModal
        item={costPriceTarget}
        currency={business.currency}
        onClose={() => setCostPriceTarget(null)}
        onSubmit={submitCostPrice}
        loading={loading}
      />

      <StaffStatsModal
        member={staffStatsTarget}
        onClose={() => setStaffStatsTarget(null)}
        onSubmit={submitStaffStats}
        loading={loading}
      />

      <ConfirmDialog request={confirmRequest} onClose={() => setConfirmRequest(null)} />

      <NotificationsPanel
        open={showNotificationsPanel}
        onClose={() => setShowNotificationsPanel(false)}
        notifications={notifications}
        onMarkRead={markNotificationRead}
        onMarkAllRead={markAllNotificationsRead}
      />
    </AppShell>
  );
}
