import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
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
    const staff = await db
      .collection("staff")
      .find({ userId: decodedToken.uid })
      .toArray();

    return NextResponse.json({ staff });
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
    const { name, role, sales, tasks, businessId } = await request.json();

    if (!name || !role) {
      return NextResponse.json(
        { error: "Name and role are required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const member = {
      userId: decodedToken.uid,
      businessId,
      name,
      role,
      sales: sales !== undefined ? Number(sales) : 0,
      tasks: tasks !== undefined ? Number(tasks) : 0,
      createdAt: new Date().toISOString(),
    };

    const result = await db.collection("staff").insertOne(member);

    return NextResponse.json({
      member: {
        ...member,
        _id: result.insertedId.toString(),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const decodedToken = await verifyFirebaseBearerToken(
    request.headers.get("authorization"),
  );

  if (!decodedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { _id, name, role, sales, tasks } = await request.json();

    if (!_id || !ObjectId.isValid(String(_id))) {
      return NextResponse.json({ error: "A valid Staff member ID is required" }, { status: 400 });
    }

    const db = await getDb();
    const updateData: Record<string, string | number> = {};
    if (name !== undefined) updateData.name = String(name);
    if (role !== undefined) updateData.role = String(role);
    if (sales !== undefined) updateData.sales = Number(sales);
    if (tasks !== undefined) updateData.tasks = Number(tasks);

    const result = await db.collection("staff").findOneAndUpdate(
      { _id: new ObjectId(_id), userId: decodedToken.uid },
      { $set: updateData },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    return NextResponse.json({ member: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const decodedToken = await verifyFirebaseBearerToken(
    request.headers.get("authorization"),
  );

  if (!decodedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    let id = url.searchParams.get("id");

    if (!id) {
      // Try body
      const body = await request.json().catch(() => ({}));
      id = body.id || body._id;
    }

    if (!id || !ObjectId.isValid(String(id))) {
      return NextResponse.json({ error: "A valid Staff member ID is required" }, { status: 400 });
    }

    const db = await getDb();
    const result = await db
      .collection("staff")
      .deleteOne({ _id: new ObjectId(id), userId: decodedToken.uid });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
