import { getDb } from "@/lib/mongodb";
import { sendPushToUser } from "@/lib/notifications/push";
import { logNotification } from "@/lib/notifications/log";
import { sendLowStockEmail } from "@/lib/email/lowStock";
import type { Business } from "@/types/business";

export function crossedLowThreshold(
  before: { stock: number; threshold: number },
  after: { stock: number; threshold: number },
) {
  return before.stock >= before.threshold && after.stock < after.threshold;
}

export async function notifyLowStock(
  userId: string,
  item: { name: string; stock: number; threshold: number; unit: string },
) {
  const db = await getDb();
  const business = await db.collection<Business>("businesses").findOne({ userId });
  const businessName = business?.name ?? "Your business";

  const title = "Low stock alert";
  const body = `${item.name} is down to ${item.stock} ${item.unit} (threshold ${item.threshold}).`;

  sendPushToUser(userId, { title, body, url: "/dashboard" }).catch((err) =>
    console.error("Low stock push failed:", err),
  );

  logNotification({ userId, businessId: business?._id, type: "low_stock", title, body }).catch((err) =>
    console.error("Low stock notification log failed:", err),
  );

  const notifyEmail = business?.notifyPreferences?.notifyEmail;
  if (business?.notifyPreferences?.lowStockEmail && notifyEmail) {
    sendLowStockEmail(notifyEmail, businessName, item).catch((err) =>
      console.error("Low stock email failed:", err),
    );
  }
}
