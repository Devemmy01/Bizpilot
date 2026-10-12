import { MongoServerError } from "mongodb";
import { NextResponse } from "next/server";
import { verifyFirebaseBearerToken } from "@/lib/firebase/admin";
import { getDb } from "@/lib/mongodb";
import { verifyFlutterwaveTransaction, isTransactionValid } from "@/lib/flutterwave";
import {
  isSubscriptionActive,
  SUBSCRIPTION_CURRENCY,
  SUBSCRIPTION_DAYS,
  SUBSCRIPTION_PLAN,
  SUBSCRIPTION_PRICE,
} from "@/lib/subscription";
import type { Business } from "@/types/business";

export async function POST(request: Request) {
  const decodedToken = await verifyFirebaseBearerToken(
    request.headers.get("authorization"),
  );

  if (!decodedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { transactionId } = await request.json();

    if (!transactionId) {
      return NextResponse.json({ error: "transactionId is required" }, { status: 400 });
    }

    const tx = await verifyFlutterwaveTransaction(String(transactionId));

    if (!tx) {
      return NextResponse.json({ error: "Could not verify transaction" }, { status: 400 });
    }

    if (!isTransactionValid(tx, SUBSCRIPTION_PRICE, SUBSCRIPTION_CURRENCY)) {
      return NextResponse.json({ error: "Transaction amount or currency mismatch" }, { status: 400 });
    }

    // The tx_ref is minted by /api/subscription/checkout for this user only
    if (!tx.tx_ref?.startsWith(`biz-sub-${decodedToken.uid}-`)) {
      return NextResponse.json({ error: "Transaction does not belong to this account" }, { status: 403 });
    }

    const db = await getDb();

    // Each transaction can be redeemed exactly once (unique index makes this race-safe)
    const payments = db.collection("payments");
    await payments.createIndex({ transactionId: 1 }, { unique: true });
    try {
      await payments.insertOne({
        transactionId: String(tx.id),
        txRef: tx.tx_ref,
        userId: decodedToken.uid,
        amount: tx.amount,
        currency: tx.currency,
        plan: SUBSCRIPTION_PLAN,
        createdAt: new Date().toISOString(),
      });
    } catch (error: unknown) {
      if (error instanceof MongoServerError && error.code === 11000) {
        return NextResponse.json({ error: "This transaction has already been used" }, { status: 409 });
      }
      throw error;
    }

    // Renewing early extends the current period rather than discarding the remaining days
    const business = await db
      .collection<Business>("businesses")
      .findOne({ userId: decodedToken.uid }, { projection: { subscription: 1 } });
    const current = business?.subscription;
    const startFrom =
      isSubscriptionActive(current) && current?.expiresAt
        ? new Date(current.expiresAt).getTime()
        : Date.now();
    const expiresAt = new Date(startFrom + SUBSCRIPTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

    await db.collection("businesses").updateOne(
      { userId: decodedToken.uid },
      {
        $set: {
          "subscription.status": "active",
          "subscription.plan": SUBSCRIPTION_PLAN,
          "subscription.transactionId": String(tx.id),
          "subscription.expiresAt": expiresAt,
        },
      },
    );

    return NextResponse.json({
      success: true,
      subscription: { status: "active", plan: SUBSCRIPTION_PLAN, expiresAt },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
