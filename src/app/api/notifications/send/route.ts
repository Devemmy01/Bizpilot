import { NextResponse } from "next/server";
import { verifyFirebaseBearerToken } from "@/lib/firebase/admin";
import { sendPushToUser } from "@/lib/notifications/push";

export async function POST(request: Request) {
  const decodedToken = await verifyFirebaseBearerToken(
    request.headers.get("authorization"),
  );

  if (!decodedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, body, url } = await request.json();

    if (!title || !body) {
      return NextResponse.json(
        { error: "Title and body are required" },
        { status: 400 }
      );
    }

    // Only ever push to the caller's own devices
    const { sent } = await sendPushToUser(decodedToken.uid, { title, body, url });

    if (!sent) {
      return NextResponse.json(
        { message: "No registered subscriptions for this user" },
        { status: 200 }
      );
    }

    return NextResponse.json({ success: true, count: sent });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
