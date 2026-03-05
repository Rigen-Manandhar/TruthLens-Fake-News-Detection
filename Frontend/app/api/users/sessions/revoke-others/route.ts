import { NextResponse } from "next/server";
import { logAuditEvent } from "@/lib/server/audit";
import { ensureSettingsIndexes } from "@/lib/server/db";
import { hasRecentReauth } from "@/lib/server/reauth";
import { revokeOtherSessions } from "@/lib/server/sessions";
import { getUserContext } from "@/lib/server/user-context";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const context = await getUserContext(req);
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureSettingsIndexes(context.db);

  if (!hasRecentReauth(context.user)) {
    return NextResponse.json(
      { error: "Please re-authenticate before revoking all sessions." },
      { status: 403 }
    );
  }

  const revokedCount = await revokeOtherSessions(
    context.db,
    context.userId,
    context.currentSessionId
  );

  await logAuditEvent(context.db, {
    userId: context.userId,
    eventType: "sessions.revoke_others",
    metadata: { revokedCount },
  });

  return NextResponse.json({ ok: true, revokedCount });
}

