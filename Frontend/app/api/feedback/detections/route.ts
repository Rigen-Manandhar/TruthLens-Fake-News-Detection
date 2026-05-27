import { NextResponse } from "next/server";
import { logAuditEvent } from "@/lib/server/audit";
import { ensureSettingsIndexes } from "@/lib/server/db";
import { resolveDetectionFeedbackAuth } from "@/lib/server/feedback/detection-auth";
import { normalizeDetectionFeedbackSubmission } from "@/lib/server/feedback/detection-validation";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { getClientIp } from "@/lib/server/request-context";
import {
  MAX_FEEDBACK_COMMENT_LENGTH,
  type DetectionFeedbackSubmission,
} from "@/lib/shared/detection-feedback";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const authContext = await resolveDetectionFeedbackAuth(req);
  if (!authContext) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureSettingsIndexes(authContext.db);

  const ip = getClientIp(req);
  const rate = checkRateLimit({
    key: `feedback:${authContext.authMode}:${authContext.userId}:${ip}`,
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many feedback submissions. Please try again later." },
      { status: 429 }
    );
  }

  const payload = (await req.json().catch(() => null)) as DetectionFeedbackSubmission | null;
  const normalized = normalizeDetectionFeedbackSubmission(
    payload,
    MAX_FEEDBACK_COMMENT_LENGTH
  );
  if (!normalized.ok) {
    return NextResponse.json({ error: normalized.error }, { status: 400 });
  }

  const { source, input, prediction, feedback } = normalized.value;

  if (authContext.authMode === "session" && source !== "web") {
    return NextResponse.json(
      { error: "Session-authenticated feedback must use the web source." },
      { status: 403 }
    );
  }

  if (authContext.authMode === "extension" && source !== "extension") {
    return NextResponse.json(
      { error: "Bearer-authenticated feedback must use the extension source." },
      { status: 403 }
    );
  }

  const now = new Date();
  await authContext.db.collection("prediction_feedback").insertOne({
    userId: authContext.userId,
    source,
    input: {
      text: input.text,
      url: input.url,
      inputMode: input.input_mode,
    },
    prediction,
    feedback,
    createdAt: now,
    updatedAt: now,
  });

  await logAuditEvent(authContext.db, {
    userId: authContext.userId,
    eventType: "feedback.detection_submitted",
    metadata: {
      source,
      isCorrect: feedback.isCorrect,
      verdict: prediction.verdict,
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
