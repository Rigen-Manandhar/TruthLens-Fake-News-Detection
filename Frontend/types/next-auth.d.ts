import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: {
      id?: string;
      sessionId?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    sessionId?: string;
    blocked?: boolean;
    sessionVersion?: number;
    tokenVersion?: number;
  }
}

export {};
