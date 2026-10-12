import { NextResponse } from "next/server";
import { verifyFirebaseBearerToken } from "@/lib/firebase/admin";
import { getDb } from "@/lib/mongodb";
import { sendWelcomeEmail } from "@/lib/email/welcome";
import { logNotification } from "@/lib/notifications/log";
import type { NotifyPreferences } from "@/types/business";

export async function GET(request: Request) {
  const decodedToken = await verifyFirebaseBearerToken(
    request.headers.get("authorization"),
  );

  if (!decodedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getDb();
    const business = await db
      .collection("businesses")
      .findOne({ userId: decodedToken.uid });

    return NextResponse.json({ business });
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
    const { name, currency = "NGN" } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Business name is required" }, { status: 400 });
    }

    const db = await getDb();
    const existing = await db
      .collection("businesses")
      .findOne({ userId: decodedToken.uid });

    const result = await db.collection("businesses").findOneAndUpdate(
      { userId: decodedToken.uid },
      {
        $set: {
          name,
          currency,
          updatedAt: new Date().toISOString(),
        },
        $setOnInsert: {
          userId: decodedToken.uid,
          createdAt: new Date().toISOString(),
        },
      },
      { upsert: true, returnDocument: "after" }
    );

    if (!existing) {
      if (decodedToken.email) {
        sendWelcomeEmail(decodedToken.email, name).catch((err) =>
          console.error("Welcome email failed:", err),
        );
      }
      logNotification({
        userId: decodedToken.uid,
        businessId: result?._id?.toString(),
        type: "welcome",
        title: `Welcome to Bizpilot, ${name}`,
        body: "Your command center is set up. Start logging daily sales and expenses to see automatic profit calculations.",
      }).catch((err) => console.error("Welcome notification log failed:", err));
    }

    return NextResponse.json({ business: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const decodedToken = await verifyFirebaseBearerToken(
    request.headers.get("authorization"),
  );

  if (!decodedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { notifyPreferences } = (await request.json()) as {
      notifyPreferences: NotifyPreferences;
    };

    if (!notifyPreferences || typeof notifyPreferences !== "object") {
      return NextResponse.json({ error: "notifyPreferences is required" }, { status: 400 });
    }

    const db = await getDb();
    const result = await db.collection("businesses").findOneAndUpdate(
      { userId: decodedToken.uid },
      {
        $set: {
          notifyPreferences,
          updatedAt: new Date().toISOString(),
        },
      },
      { returnDocument: "after" },
    );

    if (!result) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    return NextResponse.json({ business: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
