import jwt from "jsonwebtoken";
import type { NextResponse } from "next/server";

const AUTH_SECRET = (() => {
  const value = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!value) {
    throw new Error("AUTH_SECRET or NEXTAUTH_SECRET is not defined");
  }
  return value;
})();

export type AuthPayload = {
  sub: string;
  email: string;
};

export type ExtensionFeedbackTokenPayload = AuthPayload & {
  type: "extension_feedback";
  version: number;
};

export function signAuthToken(payload: AuthPayload) {
  return jwt.sign(payload, AUTH_SECRET, { expiresIn: "7d" });
}

export function verifyAuthToken(token: string): AuthPayload | null {
  try {
    const decoded = jwt.verify(token, AUTH_SECRET);

    if (typeof decoded === "string" || !decoded) {
      return null;
    }

    const payload = decoded as jwt.JwtPayload;

    if (typeof payload.sub !== "string" || typeof payload.email !== "string") {
      return null;
    }

    return { sub: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

export function signExtensionFeedbackToken(payload: {
  sub: string;
  email: string;
  version: number;
}) {
  return jwt.sign(
    {
      sub: payload.sub,
      email: payload.email,
      type: "extension_feedback",
      version: payload.version,
    },
    AUTH_SECRET,
    { expiresIn: "30d" }
  );
}

export function verifyExtensionFeedbackToken(
  token: string
): ExtensionFeedbackTokenPayload | null {
  try {
    const decoded = jwt.verify(token, AUTH_SECRET);

    if (typeof decoded === "string" || !decoded) {
      return null;
    }

    const payload = decoded as jwt.JwtPayload;

    if (
      payload.type !== "extension_feedback" ||
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.version !== "number"
    ) {
      return null;
    }

    return {
      sub: payload.sub,
      email: payload.email,
      type: "extension_feedback",
      version: payload.version,
    };
  } catch {
    return null;
  }
}

export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: "auth_token",
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set({
    name: "auth_token",
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
