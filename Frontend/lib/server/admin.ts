import { createHmac, timingSafeEqual } from "crypto";
import { ObjectId, type Db } from "mongodb";
import type { UserContext } from "./user-context";
import { getUserContext } from "./user-context";
import {
  normalizeUserRole,
} from "./user-role";
import {
  EXPORT_URL_TTL_MS,
  createJobId,
} from "./privacy";
import type {
  AdminDashboardResponse,
  AdminExportFeedback,
  AdminExportPayload,
  AdminExportUser,
  AdminRecentFeedback,
  AdminRecentUser,
} from "@/lib/shared/admin";

const ADMIN_EXPORT_TYPE = "admin_export";

const EXPORT_SIGNING_SECRET = (() => {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret || !secret.trim()) {
    throw new Error("AUTH_SECRET or NEXTAUTH_SECRET is required for admin export signing.");
  }
  return secret;
})();

type AdminAuthResult =
  | { kind: "unauthorized" }
  | { kind: "forbidden"; context: UserContext }
  | { kind: "authorized"; context: UserContext };

const toIso = (value: unknown): string | null => {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }
  return null;
};

const toObjectId = (value: string) => {
  try {
    return new ObjectId(value);
  } catch {
    return null;
  }
};

export async function getAdminAuthResult(req: Request): Promise<AdminAuthResult> {
  const context = await getUserContext(req);
  if (!context) {
    return { kind: "unauthorized" };
  }

  if (normalizeUserRole(context.user.role) !== "admin") {
    return { kind: "forbidden", context };
  }

  return { kind: "authorized", context };
}

export async function buildAdminDashboardPayload(db: Db): Promise<AdminDashboardResponse> {
  const activeUsersQuery = { "privacy.deletedAt": null };

  const [
    totalUsers,
    totalFeedback,
    correctFeedback,
    wrongFeedback,
    latestUser,
    latestFeedback,
    recentUsersRaw,
    recentFeedbackRaw,
    feedbackSourceRows,
  ] = await Promise.all([
    db.collection("users").countDocuments(activeUsersQuery),
    db.collection("prediction_feedback").countDocuments({}),
    db.collection("prediction_feedback").countDocuments({ "feedback.isCorrect": true }),
    db.collection("prediction_feedback").countDocuments({ "feedback.isCorrect": false }),
    db.collection("users").find(activeUsersQuery).sort({ createdAt: -1 }).limit(1).next(),
    db.collection("prediction_feedback").find({}).sort({ createdAt: -1 }).limit(1).next(),
    db.collection("users").find(activeUsersQuery).sort({ createdAt: -1 }).limit(8).toArray(),
    db.collection("prediction_feedback").find({}).sort({ createdAt: -1 }).limit(12).toArray(),
    db.collection("prediction_feedback").aggregate<{ _id: string | null; count: number }>([
      {
        $group: {
          _id: "$source",
          count: { $sum: 1 },
        },
      },
    ]).toArray(),
  ]);

  const feedbackUserIds = Array.from(
    new Set(
      recentFeedbackRaw
        .map((entry) => (typeof entry.userId === "string" ? entry.userId : ""))
        .filter(Boolean)
    )
  );
  const feedbackObjectIds = feedbackUserIds
    .map(toObjectId)
    .filter((value): value is ObjectId => value !== null);

  const feedbackUsers = feedbackObjectIds.length
    ? await db.collection("users").find({ _id: { $in: feedbackObjectIds } }).toArray()
    : [];

  const userMap = new Map<string, Record<string, unknown>>(
    feedbackUsers.map((user) => [String(user._id), user as Record<string, unknown>])
  );

  const recentUsers: AdminRecentUser[] = recentUsersRaw.map((user) => ({
    id: String(user._id),
    name: typeof user.name === "string" && user.name.trim()
      ? user.name
      : typeof user.fullName === "string" && user.fullName.trim()
        ? user.fullName
        : "Unnamed user",
    email: typeof user.email === "string" ? user.email : "",
    role: normalizeUserRole(user.role),
    createdAt: toIso(user.createdAt),
    updatedAt: toIso(user.updatedAt),
  }));

  const recentFeedback: AdminRecentFeedback[] = recentFeedbackRaw.map((entry) => {
    const userId = typeof entry.userId === "string" ? entry.userId : "";
    const user = userMap.get(userId);
    const prediction =
      entry.prediction && typeof entry.prediction === "object"
        ? (entry.prediction as Record<string, unknown>)
        : {};
    const input =
      entry.input && typeof entry.input === "object"
        ? (entry.input as Record<string, unknown>)
        : {};
    const feedback =
      entry.feedback && typeof entry.feedback === "object"
        ? (entry.feedback as Record<string, unknown>)
        : {};

    return {
      id: String(entry._id),
      userId,
      userName:
        user && typeof user.name === "string" && user.name.trim()
          ? user.name
          : user && typeof user.fullName === "string" && user.fullName.trim()
            ? user.fullName
            : "Unknown user",
      userEmail:
        user && typeof user.email === "string" ? user.email : "Unknown email",
      source: typeof entry.source === "string" ? entry.source : "unknown",
      isCorrect: feedback.isCorrect === true,
      comment: typeof feedback.comment === "string" ? feedback.comment : "",
      verdict: typeof prediction.verdict === "string" ? prediction.verdict : "UNKNOWN",
      riskLevel:
        typeof prediction.riskLevel === "string"
          ? prediction.riskLevel
          : "Needs Review",
      finalScore:
        typeof prediction.finalScore === "number" ? prediction.finalScore : null,
      inputMode:
        typeof input.inputMode === "string" ? input.inputMode : "unknown",
      url: typeof input.url === "string" ? input.url : "",
      createdAt: toIso(entry.createdAt),
    };
  });

  const feedbackSources = {
    web: 0,
    extension: 0,
    other: 0,
  };

  for (const row of feedbackSourceRows) {
    if (row._id === "web") {
      feedbackSources.web = row.count;
    } else if (row._id === "extension") {
      feedbackSources.extension = row.count;
    } else {
      feedbackSources.other += row.count;
    }
  }

  return {
    metrics: {
      totalUsers,
      totalFeedback,
      correctFeedback,
      wrongFeedback,
    },
    feedbackBreakdown: {
      total: totalFeedback,
      correct: correctFeedback,
      wrong: wrongFeedback,
      correctRate: totalFeedback > 0 ? correctFeedback / totalFeedback : null,
    },
    activitySummary: {
      latestSignupAt: latestUser ? toIso(latestUser.createdAt) : null,
      latestFeedbackAt: latestFeedback ? toIso(latestFeedback.createdAt) : null,
      feedbackSources,
    },
    recentUsers,
    recentFeedback,
  };
}

export async function buildAdminExportPayload(db: Db): Promise<AdminExportPayload> {
  const summary = await buildAdminDashboardPayload(db);
  const usersRaw = await db
    .collection("users")
    .find({ "privacy.deletedAt": null })
    .sort({ createdAt: -1 })
    .toArray();
  const feedbackRaw = await db
    .collection("prediction_feedback")
    .find({})
    .sort({ createdAt: -1 })
    .toArray();

  const userMap = new Map<string, Record<string, unknown>>(
    usersRaw.map((user) => [String(user._id), user as Record<string, unknown>])
  );

  const users: AdminExportUser[] = usersRaw.map((user) => ({
    id: String(user._id),
    name:
      typeof user.name === "string" && user.name.trim()
        ? user.name
        : typeof user.fullName === "string" && user.fullName.trim()
          ? user.fullName
          : "Unnamed user",
    email: typeof user.email === "string" ? user.email : "",
    role: normalizeUserRole(user.role),
    createdAt: toIso(user.createdAt),
    updatedAt: toIso(user.updatedAt),
  }));

  const feedback: AdminExportFeedback[] = feedbackRaw.map((entry) => {
    const userId = typeof entry.userId === "string" ? entry.userId : "";
    const user = userMap.get(userId);
    const prediction =
      entry.prediction && typeof entry.prediction === "object"
        ? (entry.prediction as Record<string, unknown>)
        : {};
    const input =
      entry.input && typeof entry.input === "object"
        ? (entry.input as Record<string, unknown>)
        : {};
    const feedbackValue =
      entry.feedback && typeof entry.feedback === "object"
        ? (entry.feedback as Record<string, unknown>)
        : {};

    return {
      id: String(entry._id),
      userId,
      userName:
        user && typeof user.name === "string" && user.name.trim()
          ? user.name
          : user && typeof user.fullName === "string" && user.fullName.trim()
            ? user.fullName
            : "Unknown user",
      userEmail:
        user && typeof user.email === "string" ? user.email : "Unknown email",
      source: typeof entry.source === "string" ? entry.source : "unknown",
      input: {
        text: typeof input.text === "string" ? input.text : "",
        url: typeof input.url === "string" ? input.url : "",
        inputMode: typeof input.inputMode === "string" ? input.inputMode : "unknown",
      },
      prediction: {
        verdict: typeof prediction.verdict === "string" ? prediction.verdict : "UNKNOWN",
        riskLevel:
          typeof prediction.riskLevel === "string"
            ? prediction.riskLevel
            : "Needs Review",
        finalScore:
          typeof prediction.finalScore === "number" ? prediction.finalScore : null,
      },
      feedback: {
        isCorrect: feedbackValue.isCorrect === true,
        comment: typeof feedbackValue.comment === "string" ? feedbackValue.comment : "",
      },
      createdAt: toIso(entry.createdAt),
      updatedAt: toIso(entry.updatedAt),
    };
  });

  return {
    exportedAt: new Date().toISOString(),
    summary,
    users,
    feedback,
  };
}

export function buildAdminExportDownloadUrl(jobId: string, userId: string, expiresAt: Date) {
  const expiresAtMs = expiresAt.getTime();
  const sig = createHmac("sha256", EXPORT_SIGNING_SECRET)
    .update(`${jobId}:${userId}:${expiresAtMs}:${ADMIN_EXPORT_TYPE}`)
    .digest("hex");

  const params = new URLSearchParams({
    download: "1",
    exp: String(expiresAtMs),
    sig,
  });

  return `/api/admin/export/${jobId}?${params.toString()}`;
}

export function verifyAdminExportDownloadUrlSignature(input: {
  jobId: string;
  userId: string;
  expiresAtMs: number;
  signature: string;
}) {
  const expected = createHmac("sha256", EXPORT_SIGNING_SECRET)
    .update(`${input.jobId}:${input.userId}:${input.expiresAtMs}:${ADMIN_EXPORT_TYPE}`)
    .digest("hex");

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(input.signature);

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

export {
  ADMIN_EXPORT_TYPE,
  EXPORT_URL_TTL_MS,
  createJobId,
};
