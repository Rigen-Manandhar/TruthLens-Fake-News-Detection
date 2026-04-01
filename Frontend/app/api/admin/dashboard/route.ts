import { NextResponse } from "next/server";
import { ensureSettingsIndexes } from "@/lib/server/db";
import { buildAdminDashboardPayload } from "@/lib/server/admin/dashboard";
import { getAdminAuthResult } from "@/lib/server/admin/auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = await getAdminAuthResult(req);
  if (auth.kind === "unauthorized") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (auth.kind === "forbidden") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await ensureSettingsIndexes(auth.context.db);
  const payload = await buildAdminDashboardPayload(auth.context.db);

  return NextResponse.json(payload);
}
