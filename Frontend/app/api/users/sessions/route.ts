import { NextResponse } from "next/server";
import { ensureSettingsIndexes } from "@/lib/server/db";
import { normalizeSessionId, touchUserSession, listUserSessions } from "@/lib/server/sessions";
import { getUserContext } from "@/lib/server/user-context";

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

  const sessions = await listUserSessions(context.db, context.userId, currentSessionId);
  return NextResponse.json({ sessions });
}

