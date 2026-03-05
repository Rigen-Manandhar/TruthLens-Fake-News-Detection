import { NextResponse } from "next/server";
import { logAuditEvent } from "@/lib/server/audit";
import { ensureSettingsIndexes } from "@/lib/server/db";
import { revokeSession } from "@/lib/server/sessions";
import { getUserContext } from "@/lib/server/user-context";

export const runtime = "nodejs";

export async function DELETE(
  req: Request,
  contextParams: { params: Promise<{ sessionId: string }> }
) {
  const context = await getUserContext(req);
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureSettingsIndexes(context.db);

  const { sessionId } = await contextParams.params;
  if (!sessionId || sessionId.length < 8) {
    return NextResponse.json({ error: "Invalid session id." }, { status: 400 });
  }

  const revoked = await revokeSession(context.db, context.userId, sessionId);
  if (!revoked) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  await logAuditEvent(context.db, {
    userId: context.userId,
    eventType: "sessions.revoke_one",
    metadata: { sessionId },
  });

  return NextResponse.json({ ok: true });
}

