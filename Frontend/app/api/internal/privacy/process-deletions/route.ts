import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb-client";
import { ensureSettingsIndexes } from "@/lib/server/db";

export const runtime = "nodejs";

const getMaintenanceKey = () => {
  const key = process.env.MAINTENANCE_API_KEY;
  return typeof key === "string" && key.trim() ? key : null;
};

export async function POST(req: Request) {
  const expectedKey = getMaintenanceKey();
  if (!expectedKey) {
    return NextResponse.json(
      { error: "Maintenance key is not configured." },
      { status: 503 }
    );
  }

  const providedKey = req.headers.get("x-maintenance-key");
  if (!providedKey || providedKey !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await clientPromise;
  const db = client.db();
  await ensureSettingsIndexes(db);

  const now = new Date();
  const usersToDelete = await db
    .collection("users")
    .find({
      "privacy.scheduledDeletionAt": { $lte: now },
      "privacy.deletedAt": null,
    })
    .project({ _id: 1, email: 1 })
    .toArray();

  let deletedCount = 0;

  for (const user of usersToDelete) {
    const userId = String(user._id);
    const objectId = new ObjectId(userId);

    await db.collection("users").deleteOne({ _id: objectId });
    await db.collection("accounts").deleteMany({ userId: objectId });
    await db
      .collection("sessions")
      .deleteMany({ $or: [{ userId: objectId }, { userId }] });
    await db.collection("user_sessions").deleteMany({ userId });
    await db.collection("prediction_feedback").deleteMany({ userId });
    await db.collection("privacy_jobs").updateMany(
      { userId, type: "delete", status: { $in: ["pending", "processing"] } },
      {
        $set: {
          status: "completed",
          completedAt: now,
          updatedAt: now,
        },
      }
    );
    await db.collection("audit_events").insertOne({
      userId,
      eventType: "privacy.hard_deleted",
      actor: "system",
      target: "self",
      metadata: { executedAt: now.toISOString() },
      createdAt: now,
    });

    deletedCount += 1;
  }

  return NextResponse.json({
    ok: true,
    scanned: usersToDelete.length,
    deletedCount,
    executedAt: now.toISOString(),
  });
}
