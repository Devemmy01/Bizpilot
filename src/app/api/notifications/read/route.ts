import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { verifyFirebaseBearerToken } from "@/lib/firebase/admin";
import { getDb } from "@/lib/mongodb";

export async function POST(request: Request) {
  const decodedToken = await verifyFirebaseBearerToken(
    request.headers.get("authorization"),
  );

  if (!decodedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, all } = await request.json();
    const db = await getDb();

    if (all) {
      await db
        .collection("notifications")
        .updateMany({ userId: decodedToken.uid, read: false }, { $set: { read: true } });
      return NextResponse.json({ success: true });
    }

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "A valid notification id is required" }, { status: 400 });
    }

    const result = await db
      .collection("notifications")
      .updateOne({ _id: new ObjectId(id), userId: decodedToken.uid }, { $set: { read: true } });

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
