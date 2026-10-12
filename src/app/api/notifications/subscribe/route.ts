import { NextResponse } from "next/server";
import { verifyFirebaseBearerToken } from "@/lib/firebase/admin";
import { getDb } from "@/lib/mongodb";
import { getVapidKeys } from "@/lib/vapid";

export async function GET() {
  try {
    const keys = getVapidKeys();
    return NextResponse.json({ publicKey: keys.publicKey });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const decodedToken = await verifyFirebaseBearerToken(
    request.headers.get("authorization"),
  );

  if (!decodedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { subscription } = await request.json();

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: "Subscription object is required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const userId = decodedToken.uid;

    // Upsert subscription mapping
    await db.collection("pushSubscriptions").updateOne(
      { userId, "subscription.endpoint": subscription.endpoint },
      {
        $set: {
          userId,
          subscription,
          updatedAt: new Date().toISOString(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
