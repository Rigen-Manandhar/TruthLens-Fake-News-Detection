import nodemailer from "nodemailer";

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getRequiredEnv = (name: string) => {
  const value = process.env[name]?.trim();
  return value ? value : null;
};

export function getConfiguredAppOrigin() {
  const nextAuthUrl = getRequiredEnv("NEXTAUTH_URL");
  if (nextAuthUrl) {
    return nextAuthUrl.replace(/\/+$/, "");
  }

  const vercelUrl = getRequiredEnv("VERCEL_URL");
  if (vercelUrl) {
    return `https://${vercelUrl.replace(/\/+$/, "")}`;
  }

  return null;
}

export function getSmtpConfig() {
  const smtpHost = getRequiredEnv("SMTP_HOST");
  const smtpPortRaw = getRequiredEnv("SMTP_PORT");
  const smtpUser = getRequiredEnv("SMTP_USER");
  const smtpPass = getRequiredEnv("SMTP_PASS");
  const fromEmail = getRequiredEnv("CONTACT_FROM_EMAIL") ?? smtpUser;

  if (!smtpHost || !smtpPortRaw || !smtpUser || !smtpPass || !fromEmail) {
    throw new Error("SMTP is not configured correctly.");
  }

  const smtpPort = Number(smtpPortRaw);
  if (!Number.isFinite(smtpPort)) {
    throw new Error("SMTP port is invalid.");
  }

  return {
    host: smtpHost,
    port: smtpPort,
    user: smtpUser,
    pass: smtpPass,
    fromEmail,
  };
}

export function createSmtpTransport() {
  const config = getSmtpConfig();

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
}

export function formatFromAddress(displayName: string) {
  const { fromEmail } = getSmtpConfig();
  return `${displayName} <${fromEmail}>`;
}

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
