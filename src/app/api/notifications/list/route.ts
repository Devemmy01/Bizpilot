import { NextResponse } from "next/server";
import { verifyFirebaseBearerToken } from "@/lib/firebase/admin";
import { getDb } from "@/lib/mongodb";

export async function GET(request: Request) {
  const decodedToken = await verifyFirebaseBearerToken(
    request.headers.get("authorization"),
  );

  if (!decodedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getDb();
    const notifications = await db
      .collection("notifications")
      .find({ userId: decodedToken.uid })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({ notifications });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
