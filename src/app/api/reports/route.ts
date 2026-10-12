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
    const reports = await db
      .collection("reports")
      .find({ userId: decodedToken.uid })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ reports });
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
    const { type, rangeStart, rangeEnd, metrics, sentToEmail, businessId } =
      await request.json();

    if (!type || !metrics || !sentToEmail) {
      return NextResponse.json(
        { error: "Type, metrics, and sentToEmail are required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const reportLog = {
      userId: decodedToken.uid,
      businessId,
      type,
      rangeStart: rangeStart || new Date().toISOString(),
      rangeEnd: rangeEnd || new Date().toISOString(),
      metrics,
      sentToEmail,
      createdAt: new Date().toISOString(),
    };

    const result = await db.collection("reports").insertOne(reportLog);

    return NextResponse.json({
      report: {
        ...reportLog,
        _id: result.insertedId.toString(),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
