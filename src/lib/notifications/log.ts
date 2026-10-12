import { getDb } from "@/lib/mongodb";
import type { NotificationType } from "@/types/business";

export async function logNotification(params: {
  userId: string;
  businessId?: string | null;
  type: NotificationType;
  title: string;
  body: string;
}) {
  const db = await getDb();
  await db.collection("notifications").insertOne({
    userId: params.userId,
    businessId: params.businessId ?? null,
    type: params.type,
    title: params.title,
    body: params.body,
    read: false,
    createdAt: new Date().toISOString(),
  });
}
