import { NextResponse } from "next/server";
import { logAuditEvent } from "@/lib/server/audit";
import { ensureSettingsIndexes } from "@/lib/server/db";
import { getUserContext } from "@/lib/server/user-context";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const context = await getUserContext(req);
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureSettingsIndexes(context.db);

  const privacy =
    context.user.privacy && typeof context.user.privacy === "object"
      ? (context.user.privacy as Record<string, unknown>)
      : {};

  if (privacy.deletedAt) {
    return NextResponse.json(
      { error: "This account is already permanently deleted." },
      { status: 409 }
    );
  }

  if (!privacy.deletionRequestedAt) {
    return NextResponse.json({ error: "No pending deletion request found." }, { status: 400 });
  }

  await context.db.collection("users").updateOne(context.query, {
    $set: {
      "privacy.deletionRequestedAt": null,
      "privacy.scheduledDeletionAt": null,
      updatedAt: new Date(),
    },
  });

  await context.db.collection("privacy_jobs").updateMany(
    {
      userId: context.userId,
      type: "delete",
      status: { $in: ["pending", "processing"] },
    },
    {
      $set: {
        status: "cancelled",
        updatedAt: new Date(),
      },
    }
  );

  await logAuditEvent(context.db, {
    userId: context.userId,
    eventType: "privacy.deletion_cancelled",
  });

  return NextResponse.json({ ok: true });
}
