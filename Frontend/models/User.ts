import { type InferSchemaType, Schema, model, models } from "mongoose";
import {
  DEFAULT_USER_PREFERENCES,
  NEWS_CATEGORY_OPTIONS,
} from "@/lib/shared/settings";
import type { UserRole } from "@/lib/shared/admin";

const PreferencesSchema = new Schema(
  {
    newsCountry: {
      type: String,
      trim: true,
      lowercase: true,
      default: DEFAULT_USER_PREFERENCES.newsCountry,
    },
    newsCategories: {
      type: [
        {
          type: String,
          enum: NEWS_CATEGORY_OPTIONS,
        },
      ],
      default: () => [...DEFAULT_USER_PREFERENCES.newsCategories],
    },
    detectionInputMode: {
      type: String,
      enum: ["auto", "headline_only", "full_article", "headline_plus_article"],
      default: DEFAULT_USER_PREFERENCES.detectionInputMode,
    },
    detectionExplanationMode: {
      type: String,
      enum: ["auto", "none"],
      default: DEFAULT_USER_PREFERENCES.detectionExplanationMode,
    },
  },
  { _id: false }
);

const SecuritySchema = new Schema(
  {
    hasPassword: {
      type: Boolean,
      default: false,
    },
    lastPasswordChangedAt: {
      type: Date,
      default: null,
    },
    sessionVersion: {
      type: Number,
      default: 1,
    },
    reauthUntil: {
      type: Date,
      default: null,
    },
    extensionTokenVersion: {
      type: Number,
      default: 1,
    },
    extensionTokenRotatedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const PrivacySchema = new Schema(
  {
    deletionRequestedAt: {
      type: Date,
      default: null,
    },
    scheduledDeletionAt: {
      type: Date,
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const UserSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      default: "",
    },
    fullName: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"] as UserRole[],
      default: "user",
    },
    passwordHash: {
      type: String,
      default: null,
    },
    image: {
      type: String,
      default: null,
    },
    emailVerified: {
      type: Date,
      default: null,
    },
    preferences: {
      type: PreferencesSchema,
      default: () => ({
        ...DEFAULT_USER_PREFERENCES,
        newsCategories: [...DEFAULT_USER_PREFERENCES.newsCategories],
      }),
    },
    security: {
      type: SecuritySchema,
      default: () => ({
        hasPassword: false,
        lastPasswordChangedAt: null,
        sessionVersion: 1,
        reauthUntil: null,
        extensionTokenVersion: 1,
        extensionTokenRotatedAt: null,
      }),
    },
    privacy: {
      type: PrivacySchema,
      default: () => ({
        deletionRequestedAt: null,
        scheduledDeletionAt: null,
        deletedAt: null,
      }),
    },
  },
  {
    collection: "users",
    timestamps: true,
  }
);

export type UserDocument = InferSchemaType<typeof UserSchema>;

const User = models.User || model("User", UserSchema);

export default User;
