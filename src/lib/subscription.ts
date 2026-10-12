import type { Db } from "mongodb";
import type { Business, Subscription } from "@/types/business";

export const SUBSCRIPTION_PLAN = "analytics-monthly";
export const SUBSCRIPTION_PRICE = 3;
export const SUBSCRIPTION_CURRENCY = "USD";
export const SUBSCRIPTION_DAYS = 31;

export function isSubscriptionActive(subscription: Subscription | undefined) {
  if (subscription?.status !== "active") return false;
  return !subscription.expiresAt || new Date(subscription.expiresAt) > new Date();
}

export async function hasActiveSubscription(db: Db, userId: string) {
  const business = await db
    .collection<Business>("businesses")
    .findOne({ userId }, { projection: { subscription: 1 } });
  return isSubscriptionActive(business?.subscription);
}
