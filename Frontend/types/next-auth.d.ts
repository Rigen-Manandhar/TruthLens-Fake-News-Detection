import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: {
      id?: string;
      sessionId?: string;
      role?: "user" | "admin";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    sessionId?: string;
    role?: "user" | "admin";
    blocked?: boolean;
    sessionVersion?: number;
    tokenVersion?: number;
  }
}

export {};
