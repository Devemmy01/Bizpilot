import webpush from "web-push";
import { getDb } from "@/lib/mongodb";
import { getVapidKeys } from "@/lib/vapid";

export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; url?: string },
) {
  const db = await getDb();
  const subscriptions = await db
    .collection("pushSubscriptions")
    .find({ userId })
    .toArray();

  if (!subscriptions.length) return { sent: 0 };

  const keys = getVapidKeys();
  webpush.setVapidDetails("mailto:reports@bizpilot.co", keys.publicKey, keys.privateKey);

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || "/dashboard",
  });

  await Promise.all(
    subscriptions.map(async (subDoc) => {
      try {
        await webpush.sendNotification(subDoc.subscription, body);
      } catch (err: unknown) {
        const status = err && typeof err === "object" && "statusCode" in err
          ? (err as { statusCode: number }).statusCode
          : null;
        if (status === 410 || status === 404) {
          await db.collection("pushSubscriptions").deleteOne({ _id: subDoc._id });
        }
      }
    }),
  );

  return { sent: subscriptions.length };
}
