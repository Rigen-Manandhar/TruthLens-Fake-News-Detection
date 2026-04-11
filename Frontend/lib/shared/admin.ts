export type UserRole = "user" | "admin";

export type AdminDashboardMetrics = {
  totalUsers: number;
  totalFeedback: number;
  correctFeedback: number;
  wrongFeedback: number;
};

export type AdminFeedbackBreakdown = {
  total: number;
  correct: number;
  wrong: number;
  correctRate: number | null;
};

export type AdminRecentUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string | null;
  updatedAt: string | null;
};

export type AdminRecentFeedback = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  source: string;
  isCorrect: boolean;
  comment: string;
  verdict: string;
  riskLevel: string;
  finalScore: number | null;
  inputMode: string;
  url: string;
  createdAt: string | null;
};

export type AdminActivitySummary = {
  latestSignupAt: string | null;
  latestFeedbackAt: string | null;
  feedbackSources: {
    web: number;
    extension: number;
    other: number;
  };
};

export type AdminDashboardResponse = {
  metrics: AdminDashboardMetrics;
  feedbackBreakdown: AdminFeedbackBreakdown;
  activitySummary: AdminActivitySummary;
  recentUsers: AdminRecentUser[];
  recentFeedback: AdminRecentFeedback[];
};
