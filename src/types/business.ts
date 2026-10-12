export type Subscription = {
  status: "active" | "inactive" | "trial";
  plan?: string;
  transactionId?: string;
  expiresAt?: string;
};

export type NotifyPreferences = {
  notifyEmail?: string;
  weeklyReportEmail?: boolean;
  monthlyReportEmail?: boolean;
  lowStockEmail?: boolean;
};

export type Business = {
  _id?: string;
  userId: string;
  name: string;
  currency: string;
  createdAt: string;
  subscription?: Subscription;
  notifyPreferences?: NotifyPreferences;
};

export type BusinessEntryInput = {
  sales: number;
  foodCost: number;
  staffExpenses: number;
  otherExpenses: number;
  inventoryCount?: number;
  lowStockThreshold?: number;
};

export type BusinessMetrics = {
  totalRevenue: number;
  totalExpenses: number;
  estimatedProfit: number;
  profitMargin: number;
};

export type SaleLine = {
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  amount: number;
  staffId?: string;
  staffName?: string;
};

export type BusinessEntry = BusinessEntryInput &
  BusinessMetrics & {
    _id?: string;
    userId: string;
    businessId?: string;
    createdAt: string;
    date: string; // YYYY-MM-DD format
    saleLines?: SaleLine[];
    inventoryApplied?: Record<string, number>; // stock actually deducted per item id by this entry
  };

export type InventoryItem = {
  _id?: string;
  userId: string;
  businessId?: string;
  name: string;
  stock: number;
  threshold: number;
  unit: string;
  costPrice?: number; // cost to acquire one unit — drives the suggested cost of goods
  createdAt: string;
};

export type StaffMember = {
  _id?: string;
  userId: string;
  businessId?: string;
  name: string;
  role: string;
  sales: number;
  tasks: number;
  createdAt: string;
};

export type ReportLog = {
  _id?: string;
  userId: string;
  businessId?: string;
  type: "daily" | "weekly" | "monthly";
  rangeStart: string;
  rangeEnd: string;
  metrics: BusinessMetrics;
  sentToEmail: string;
  createdAt: string;
};

export type NotificationType = "low_stock" | "report_sent" | "welcome";

export type NotificationItem = {
  _id?: string;
  userId: string;
  businessId?: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

// ─── Analytics Types ─────────────────────────────────────────────────────────

export type ReportPeriod = "weekly" | "monthly";

export type MonthlyAggregate = {
  month: string;    // "YYYY-MM"
  label: string;    // "Aug 2026"
  totalRevenue: number;
  totalExpenses: number;
  estimatedProfit: number;
  foodCost: number;
  staffExpenses: number;
  otherExpenses: number;
  entryCount: number;
};

export type WeeklyAggregate = {
  weekStart: string;  // "YYYY-MM-DD" (Monday)
  label: string;      // "Wk 4 Aug"
  totalRevenue: number;
  totalExpenses: number;
  estimatedProfit: number;
  entryCount: number;
};

export type DayPerformance = {
  date: string;
  label: string;
  totalRevenue: number;
  estimatedProfit: number;
  profitMargin: number;
};

export type ExpenseSplit = {
  food: number;
  staff: number;
  other: number;
  total: number;
  foodPct: number;
  staffPct: number;
  otherPct: number;
};

