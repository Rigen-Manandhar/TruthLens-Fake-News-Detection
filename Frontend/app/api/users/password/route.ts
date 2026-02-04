import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
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

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = getUserQuery(session);

  if (!query) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { currentPassword, newPassword } = await req.json();

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: "Current password and new password are required." },
      { status: 400 }
    );
  }

  if (typeof newPassword !== "string" || newPassword.length < 8) {
    return NextResponse.json(
      { error: "New password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const client = await clientPromise;
  const db = client.db();
  const user = await db.collection("users").findOne(query);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (!user.passwordHash) {
    return NextResponse.json(
      { error: "Password is not set for this account." },
      { status: 400 }
    );
  }

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);

  if (!isValid) {
    return NextResponse.json(
      { error: "Current password is incorrect." },
      { status: 401 }
    );
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await db.collection("users").updateOne(query, {
    $set: { passwordHash, updatedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
