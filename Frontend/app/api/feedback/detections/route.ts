import { NextResponse } from "next/server";
import type { Db } from "mongodb";
import clientPromise from "@/lib/mongodb-client";
import { logAuditEvent } from "@/lib/server/audit";
import { ensureSettingsIndexes } from "@/lib/server/db";
import { getUserFromExtensionFeedbackToken } from "@/lib/server/extension-feedback-token";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { getClientIp } from "@/lib/server/request-context";
import { getUserContext } from "@/lib/server/user-context";
import {
  MAX_FEEDBACK_COMMENT_LENGTH,
  isDetectionFeedbackSource,
  isDetectionInputMode,
  type ConflictInfo,
  type DetectionFeedbackSubmission,
  type DetectionPredictionSnapshot,
  type FetchMetadata,
  type ModelOutputs,
  type ParseMetadata,
  type UncertaintyInfo,
} from "@/lib/shared/detection-feedback";

export const runtime = "nodejs";

type AuthContext = {
  authMode: "session" | "extension";
  userId: string;
  db: Db;
  user: Record<string, unknown>;
};

const getBearerToken = (req: Request): string | null => {
  const header = req.headers.get("authorization")?.trim() ?? "";
  if (!header.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  const token = header.slice(7).trim();
  return token || null;
};

const asObject = (value: unknown): Record<string, unknown> | null => {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
};

const normalizeOptionalObject = <T>(value: unknown): T | undefined => {
  return asObject(value) as T | undefined;
};

const normalizePrediction = (
  value: unknown
): DetectionPredictionSnapshot | null => {
  const prediction = asObject(value);
  if (!prediction) {
    return null;
  }

  if (
    typeof prediction.verdict !== "string" ||
    !prediction.verdict.trim() ||
    typeof prediction.riskLevel !== "string" ||
    !prediction.riskLevel.trim() ||
    typeof prediction.finalScore !== "number" ||
    !Number.isFinite(prediction.finalScore)
  ) {
    return null;
  }

  const limeModel =
    prediction.limeModel === "A" || prediction.limeModel === "B"
      ? prediction.limeModel
      : prediction.limeModel === null || prediction.limeModel === undefined
        ? null
        : null;

  return {
    verdict: prediction.verdict.trim(),
    riskLevel: prediction.riskLevel.trim(),
    finalScore: prediction.finalScore,
    uncertainty: normalizeOptionalObject<UncertaintyInfo>(prediction.uncertainty),
    parseMetadata: normalizeOptionalObject<ParseMetadata>(prediction.parseMetadata),
    modelOutputs: normalizeOptionalObject<ModelOutputs>(prediction.modelOutputs),
    conflict: normalizeOptionalObject<ConflictInfo>(prediction.conflict),
    fetchMetadata: normalizeOptionalObject<FetchMetadata>(prediction.fetchMetadata),
    limeModel,
  };
};

const resolveAuthContext = async (req: Request): Promise<AuthContext | null> => {
  const bearerToken = getBearerToken(req);
  if (bearerToken) {
    const client = await clientPromise;
    const db = client.db();
    const bearerContext = await getUserFromExtensionFeedbackToken(db, bearerToken);
    if (!bearerContext) {
      return null;
    }

    return {
      authMode: "extension",
      userId: bearerContext.userId,
      db,
      user: bearerContext.user,
    };
  }

  const sessionContext = await getUserContext(req);
  if (!sessionContext) {
    return null;
  }

  return {
    authMode: "session",
    userId: sessionContext.userId,
    db: sessionContext.db,
    user: sessionContext.user,
  };
};

export async function POST(req: Request) {
  const authContext = await resolveAuthContext(req);
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
  const body = asObject(payload);
  if (!body) {
    return NextResponse.json({ error: "Invalid feedback payload." }, { status: 400 });
  }

  const source = body.source;
  if (!isDetectionFeedbackSource(source)) {
    return NextResponse.json({ error: "Invalid feedback source." }, { status: 400 });
  }

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

  const input = asObject(body.input);
  if (
    !input ||
    typeof input.text !== "string" ||
    typeof input.url !== "string" ||
    !isDetectionInputMode(input.input_mode)
  ) {
    return NextResponse.json({ error: "Invalid prediction input payload." }, { status: 400 });
  }

  const prediction = normalizePrediction(body.prediction);
  if (!prediction) {
    return NextResponse.json({ error: "Invalid prediction snapshot." }, { status: 400 });
  }

  const feedback = asObject(body.feedback);
  if (!feedback || typeof feedback.isCorrect !== "boolean") {
    return NextResponse.json(
      { error: "Feedback must include whether the prediction was correct." },
      { status: 400 }
    );
  }

  const comment =
    typeof feedback.comment === "string"
      ? feedback.comment.trim().slice(0, MAX_FEEDBACK_COMMENT_LENGTH)
      : "";

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
    feedback: {
      isCorrect: feedback.isCorrect,
      comment,
    },
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
