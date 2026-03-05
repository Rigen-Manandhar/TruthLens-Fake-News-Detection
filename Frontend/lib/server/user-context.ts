import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { ObjectId, type Db, type Filter, type MongoClient } from "mongodb";
import clientPromise from "@/lib/mongodb-client";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

type SessionUser = {
  id?: string | null;
  email?: string | null;
};

type SessionShape = {
  user?: SessionUser;
};

export type UserContext = {
  client: MongoClient;
  db: Db;
  session: SessionShape;
  query: Filter<Record<string, unknown>>;
  userId: string;
  currentSessionId: string | null;
  user: Record<string, unknown>;
};

export const getUserQueryFromSession = (session: SessionShape | null) => {
  const userId = session?.user?.id ?? null;
  const email = session?.user?.email ?? null;

  if (userId) {
    try {
      return { _id: new ObjectId(userId) };
    } catch {
      return null;
    }
  }

  if (email) {
    return { email };
  }

  return null;
};

const getCurrentSessionId = async (req: Request): Promise<string | null> => {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return null;
  }

  const token = await getToken({
    req: req as Parameters<typeof getToken>[0]["req"],
    secret,
  });

  if (!token || typeof token.sessionId !== "string") {
    return null;
  }

  return token.sessionId;
};

export async function getUserContext(req: Request): Promise<UserContext | null> {
  const session = (await getServerSession(authOptions)) as SessionShape | null;

  if (!session?.user) {
    return null;
  }

  const query = getUserQueryFromSession(session);
  if (!query) {
    return null;
  }

  const client = await clientPromise;
  const db = client.db();
  const user = (await db.collection("users").findOne(query)) as
    | Record<string, unknown>
    | null;

  if (!user || !user._id) {
    return null;
  }

  const currentSessionId = await getCurrentSessionId(req);

  return {
    client,
    db,
    session,
    query,
    userId: String(user._id),
    currentSessionId,
    user,
  };
}

export async function getProviderInfo(db: Db, userId: string) {
  let providers: string[] = [];
  try {
    providers = await db
      .collection("accounts")
      .distinct("provider", { userId: new ObjectId(userId) });
  } catch {
    providers = [];
  }

  const hasGoogle = providers.includes("google");
  return {
    providers,
    hasGoogle,
  };
}

