import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb-client";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";

const getUserQuery = (session: { user?: { id?: string | null; email?: string | null } } | null) => {
  const userId = session?.user?.id ?? null;
  const email = session?.user?.email ?? null;

  if (userId) {
    return { _id: new ObjectId(userId) };
  }

  if (email) {
    return { email };
  }

  return null;
};

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = getUserQuery(session);

  if (!query) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await clientPromise;
  const db = client.db();
  const user = await db.collection("users").findOne(query);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      id: user._id.toString(),
      name: user.name ?? user.fullName ?? "",
      email: user.email ?? "",
      image: user.image ?? null,
      hasPassword: Boolean(user.passwordHash),
    },
  });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = getUserQuery(session);

  if (!query) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await req.json();
  const update: Record<string, unknown> = { updatedAt: new Date() };

  if (typeof name === "string") {
    const trimmed = name.trim();
    if (!trimmed) {
      return NextResponse.json({ error: "Name cannot be empty." }, { status: 400 });
    }
    update.name = trimmed;
    update.fullName = trimmed;
  }

  const client = await clientPromise;
  const db = client.db();
  const result = await db
    .collection("users")
    .findOneAndUpdate(query, { $set: update }, { returnDocument: "after" });

  const user = result.value;

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      id: user._id.toString(),
      name: user.name ?? user.fullName ?? "",
      email: user.email ?? "",
      image: user.image ?? null,
      hasPassword: Boolean(user.passwordHash),
    },
  });
}
