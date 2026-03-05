import { NextResponse } from "next/server";
import { ensureSettingsIndexes } from "@/lib/server/db";
import { buildUserSummary } from "@/lib/server/user-shape";
import { getUserContext } from "@/lib/server/user-context";
import { normalizePreferences } from "@/lib/shared/settings";

export const runtime = "nodejs";

export async function PATCH(req: Request) {
  const context = await getUserContext(req);
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureSettingsIndexes(context.db);

  const payload = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const preferences = normalizePreferences(payload);

  const result = await context.db.collection("users").findOneAndUpdate(
    context.query,
    {
      $set: {
        preferences,
        updatedAt: new Date(),
      },
    },
    { returnDocument: "after" }
  );

  const user = result.value as Record<string, unknown> | null;
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const summary = await buildUserSummary(context.db, user);
  return NextResponse.json({ preferences: summary.preferences, user: summary });
}

