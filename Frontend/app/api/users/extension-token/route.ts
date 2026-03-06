import { NextResponse } from "next/server";
import { logAuditEvent } from "@/lib/server/audit";
import { ensureSettingsIndexes } from "@/lib/server/db";
import {
  createExtensionFeedbackToken,
  getExtensionTokenRotatedAt,
  getExtensionTokenVersion,
} from "@/lib/server/extension-feedback-token";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { getClientIp } from "@/lib/server/request-context";
import { getUserContext } from "@/lib/server/user-context";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const context = await getUserContext(req);
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureSettingsIndexes(context.db);

  return NextResponse.json({
    token: createExtensionFeedbackToken(context.user),
    version: getExtensionTokenVersion(context.user),
    rotatedAt: getExtensionTokenRotatedAt(context.user)?.toISOString() ?? null,
  });
}

export async function POST(req: Request) {
  const context = await getUserContext(req);
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureSettingsIndexes(context.db);

  const ip = getClientIp(req);
  const rate = checkRateLimit({
    key: `extension-token:${context.userId}:${ip}`,
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many token rotations. Please try again later." },
      { status: 429 }
    );
  }

  const rotatedAt = new Date();
  const result = await context.db.collection("users").findOneAndUpdate(
    context.query,
    {
      $set: {
        "security.extensionTokenRotatedAt": rotatedAt,
        updatedAt: rotatedAt,
      },
      $inc: {
        "security.extensionTokenVersion": 1,
      },
    },
    { returnDocument: "after" }
  );

  const user = result.value as Record<string, unknown> | null;
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  await logAuditEvent(context.db, {
    userId: context.userId,
    eventType: "security.extension_token_regenerated",
    metadata: { ip },
  });

  return NextResponse.json({
    token: createExtensionFeedbackToken(user),
    version: getExtensionTokenVersion(user),
    rotatedAt: getExtensionTokenRotatedAt(user)?.toISOString() ?? null,
  });
}
