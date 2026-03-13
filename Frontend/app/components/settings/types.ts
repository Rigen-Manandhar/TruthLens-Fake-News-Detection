import type { UserPreferences } from "@/lib/shared/settings";

export type AccountProfile = {
  id: string;
  name: string;
  email: string;
  hasPassword: boolean;
  providerInfo: {
    providers: string[];
    googleConnected: boolean;
    passwordLogin: boolean;
  };
  preferences: UserPreferences;
  securitySummary: {
    reauthUntil: string | null;
    reauthRequired: boolean;
    sessionCount: number;
  };
  deletionStatus: {
    deletionRequestedAt: string | null;
    scheduledDeletionAt: string | null;
  };
};

export type SessionItem = {
  sessionId: string;
  deviceLabel: string;
  ipPreview: string;
  createdAt: string;
  lastSeenAt: string;
  isCurrent: boolean;
};

export type ExportJob = {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  downloadUrl: string | null;
  expiresAt: string | null;
};
