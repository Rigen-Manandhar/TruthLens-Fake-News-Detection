import { ObjectId } from "mongodb";

export const toIso = (value: unknown): string | null => {
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

export const toObjectId = (value: string) => {
  try {
    return new ObjectId(value);
  } catch {
    return null;
  }
};
