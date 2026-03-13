import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb-client";
import { logAuditEvent } from "@/lib/server/audit";
import { ensureSettingsIndexes } from "@/lib/server/db";
import {
  getPasswordResetCollection,
  hashPasswordResetToken,
} from "@/lib/server/password-reset";
import { validatePasswordStrength } from "@/lib/server/password-policy";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { getClientIp } from "@/lib/server/request-context";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rate = checkRateLimit({
    key: `password-reset:${ip}`,
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });

  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 }
    );
  }

  const payload = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const token = typeof payload.token === "string" ? payload.token.trim() : "";
  const newPassword = typeof payload.newPassword === "string" ? payload.newPassword : "";

  if (!token || !newPassword) {
    return NextResponse.json(
      { error: "Reset token and new password are required." },
      { status: 400 }
    );
  }

  const passwordError = validatePasswordStrength(newPassword);
  if (passwordError) {
    return NextResponse.json({ error: passwordError }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();

    await ensureSettingsIndexes(db);

    const tokenHash = hashPasswordResetToken(token);
    const now = new Date();
    const resetRecord = await getPasswordResetCollection(db).findOne({
      tokenHash,
      purpose: "password_reset",
      usedAt: null,
      expiresAt: { $gt: now },
    });

    if (!resetRecord) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired." },
        { status: 400 }
      );
    }

    const user = await db.collection("users").findOne({
      _id: new ObjectId(resetRecord.userId),
    });

    const privacy =
      user?.privacy && typeof user.privacy === "object"
        ? (user.privacy as Record<string, unknown>)
        : {};

    if (!user || privacy.deletionRequestedAt || privacy.deletedAt) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          passwordHash,
          "security.hasPassword": true,
          "security.lastPasswordChangedAt": now,
          updatedAt: now,
        },
        $inc: {
          "security.sessionVersion": 1,
        },
      }
    );

    await getPasswordResetCollection(db).updateOne(
      { tokenHash },
      { $set: { usedAt: now } }
    );

    await getPasswordResetCollection(db).updateMany(
      {
        userId: resetRecord.userId,
        purpose: "password_reset",
        usedAt: null,
      },
      { $set: { usedAt: now } }
    );

    await db.collection("user_sessions").updateMany(
      { userId: resetRecord.userId, isRevoked: { $ne: true } },
      { $set: { isRevoked: true, revokedAt: now } }
    );

    await logAuditEvent(db, {
      userId: resetRecord.userId,
      eventType: "password.reset.completed",
      metadata: { ip },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to reset password.", error);
    return NextResponse.json(
      { error: "Unable to reset your password right now. Please try again later." },
      { status: 500 }
    );
  }
}
