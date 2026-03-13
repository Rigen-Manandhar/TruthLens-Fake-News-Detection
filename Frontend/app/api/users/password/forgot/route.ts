import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb-client";
import { logAuditEvent } from "@/lib/server/audit";
import {
  createSmtpTransport,
  EMAIL_REGEX,
  escapeHtml,
  formatFromAddress,
  getConfiguredAppOrigin,
} from "@/lib/server/email";
import {
  generatePasswordResetToken,
  getPasswordResetCollection,
} from "@/lib/server/password-reset";
import { ensureSettingsIndexes } from "@/lib/server/db";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { getClientIp } from "@/lib/server/request-context";

export const runtime = "nodejs";

const GENERIC_RESPONSE = {
  message: "If an account exists for that email, we've sent a reset link.",
};

export async function POST(req: Request) {
  const payload = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const ip = getClientIp(req);
  const rate = checkRateLimit({
    key: `password-forgot:${email}:${ip}`,
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });

  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 }
    );
  }

  let transporter;
  let appOrigin;

  try {
    transporter = createSmtpTransport();
    appOrigin = getConfiguredAppOrigin();
    if (!appOrigin) {
      throw new Error("NEXTAUTH_URL or VERCEL_URL must be configured.");
    }
  } catch (error) {
    console.error("Password reset email is not configured correctly.", error);
    return NextResponse.json(
      { error: "Password reset email is not configured for this environment." },
      { status: 500 }
    );
  }

  try {
    const client = await clientPromise;
    const db = client.db();

    await ensureSettingsIndexes(db);

    const user = (await db.collection("users").findOne({
      email,
    })) as Record<string, unknown> | null;

    const privacy =
      user?.privacy && typeof user.privacy === "object"
        ? (user.privacy as Record<string, unknown>)
        : {};

    if (
      !user ||
      privacy.deletionRequestedAt ||
      privacy.deletedAt ||
      !user._id
    ) {
      return NextResponse.json(GENERIC_RESPONSE);
    }

    const userId = String(user._id);
    const { rawToken, tokenHash, expiresAt } = generatePasswordResetToken();
    const now = new Date();

    await getPasswordResetCollection(db).updateMany(
      { userId, purpose: "password_reset", usedAt: null },
      { $set: { usedAt: now } }
    );

    await getPasswordResetCollection(db).insertOne({
      userId,
      email,
      tokenHash,
      purpose: "password_reset",
      expiresAt,
      usedAt: null,
      createdAt: now,
      requestedIp: ip,
    });

    const resetLink = `${appOrigin}/reset-password?token=${encodeURIComponent(rawToken)}`;
    const subject = "Reset your TruthLens password";

    await transporter.sendMail({
      from: formatFromAddress("TruthLens"),
      to: email,
      subject,
      text: [
        "We received a request to reset your TruthLens password.",
        "",
        `Reset your password: ${resetLink}`,
        "",
        "This link expires in 30 minutes and can only be used once.",
        "If you didn't request this, you can ignore this email.",
      ].join("\n"),
      html: `
        <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.6;color:#17130f">
          <h2 style="margin:0 0 16px;">Reset your TruthLens password</h2>
          <p style="margin:0 0 12px;">
            We received a request to reset the password for <strong>${escapeHtml(email)}</strong>.
          </p>
          <p style="margin:0 0 18px;">
            This link expires in <strong>30 minutes</strong> and can only be used once.
          </p>
          <p style="margin:0 0 18px;">
            <a
              href="${escapeHtml(resetLink)}"
              style="display:inline-block;padding:12px 20px;border-radius:999px;background:#12100d;color:#f7f1e6;text-decoration:none;font-weight:600;"
            >
              Reset password
            </a>
          </p>
          <p style="margin:0 0 8px;color:#5a4f43;">
            If the button does not work, copy and paste this link into your browser:
          </p>
          <p style="margin:0 0 18px;word-break:break-all;color:#0e7c66;">${escapeHtml(
            resetLink
          )}</p>
          <p style="margin:0;color:#5a4f43;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    await logAuditEvent(db, {
      userId,
      eventType: "password.reset.requested",
      metadata: { ip },
    });

    return NextResponse.json(GENERIC_RESPONSE);
  } catch (error) {
    console.error("Failed to create password reset request.", error);
    return NextResponse.json(
      { error: "Unable to process the reset request. Please try again later." },
      { status: 500 }
    );
  }
}
