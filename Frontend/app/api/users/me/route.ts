import { NextResponse } from "next/server";
import { ensureSettingsIndexes } from "@/lib/server/db";
import { normalizeSessionId, touchUserSession } from "@/lib/server/sessions";
import { buildUserSummary } from "@/lib/server/user-shape";
import { getUserContext } from "@/lib/server/user-context";
import { normalizePreferences } from "@/lib/shared/settings";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const context = await getUserContext(req);
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureSettingsIndexes(context.db);
  const security =
    context.user.security && typeof context.user.security === "object"
      ? (context.user.security as Record<string, unknown>)
      : {};
  const sessionVersion =
    typeof security.sessionVersion === "number" ? security.sessionVersion : 1;
  const currentSessionId = normalizeSessionId(context.currentSessionId);
  await touchUserSession({
    db: context.db,
    req,
    userId: context.userId,
    sessionId: currentSessionId,
    sessionVersion,
  });

  const summary = await buildUserSummary(context.db, context.user);
  return NextResponse.json({ user: summary });
}

export async function PATCH(req: Request) {
  const context = await getUserContext(req);
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureSettingsIndexes(context.db);

  const payload = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const update: Record<string, unknown> = { updatedAt: new Date() };

  if (typeof payload.name === "string") {
    const trimmed = payload.name.trim();
    if (!trimmed) {
      return NextResponse.json({ error: "Name cannot be empty." }, { status: 400 });
    }
    update.name = trimmed;
    update.fullName = trimmed;
  }

  if (payload.preferences !== undefined) {
    update.preferences = normalizePreferences(payload.preferences);
  }

  const result = await context.db.collection("users").findOneAndUpdate(
    context.query,
    { $set: update },
    { returnDocument: "after" }
  );

  const user = result.value as Record<string, unknown> | null;
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const summary = await buildUserSummary(context.db, user);
  return NextResponse.json({ user: summary });
}
