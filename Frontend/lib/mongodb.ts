import mongoose from "mongoose";

const MONGO_URL = process.env.MONGO_URL;

if (!MONGO_URL) {
  throw new Error("MONGO_URL is not defined");
}

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

const cached = global.mongoose ?? { conn: null, promise: null };

export default async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGO_URL).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  cached.conn = await cached.promise;
  global.mongoose = cached;

  return cached.conn;
}
