export type DetectionInputMode =
  | "auto"
  | "headline_only"
  | "full_article"
  | "headline_plus_article";

export type DetectionExplanationMode = "auto" | "none";

export type UserPreferences = {
  newsCountry: string;
  newsCategories: string[];
  detectionInputMode: DetectionInputMode;
  detectionExplanationMode: DetectionExplanationMode;
};

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  newsCountry: "us",
  newsCategories: [],
  detectionInputMode: "auto",
  detectionExplanationMode: "auto",
};

export const NEWS_CATEGORY_OPTIONS = [
  "business",
  "entertainment",
  "general",
  "health",
  "science",
  "sports",
  "technology",
] as const;

const DETECTION_INPUT_MODES: DetectionInputMode[] = [
  "auto",
  "headline_only",
  "full_article",
  "headline_plus_article",
];

const DETECTION_EXPLANATION_MODES: DetectionExplanationMode[] = ["auto", "none"];

const normalizeCountry = (raw: unknown): string => {
  if (typeof raw !== "string") {
    return DEFAULT_USER_PREFERENCES.newsCountry;
  }

  const country = raw.trim().toLowerCase();
  if (!/^[a-z]{2}$/.test(country)) {
    return DEFAULT_USER_PREFERENCES.newsCountry;
  }

  return country;
};

const normalizeCategories = (raw: unknown): string[] => {
  if (!Array.isArray(raw)) {
    return DEFAULT_USER_PREFERENCES.newsCategories;
  }

  const allowed = new Set<string>(NEWS_CATEGORY_OPTIONS);
  const categories = raw
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().toLowerCase())
    .filter((item) => allowed.has(item));

  return Array.from(new Set(categories));
};

const normalizeDetectionInputMode = (raw: unknown): DetectionInputMode => {
  if (typeof raw === "string" && DETECTION_INPUT_MODES.includes(raw as DetectionInputMode)) {
    return raw as DetectionInputMode;
  }

  return DEFAULT_USER_PREFERENCES.detectionInputMode;
};

const normalizeDetectionExplanationMode = (
  raw: unknown
): DetectionExplanationMode => {
  if (
    typeof raw === "string" &&
    DETECTION_EXPLANATION_MODES.includes(raw as DetectionExplanationMode)
  ) {
    return raw as DetectionExplanationMode;
  }

  return DEFAULT_USER_PREFERENCES.detectionExplanationMode;
};

export const normalizePreferences = (input: unknown): UserPreferences => {
  const source = input && typeof input === "object" ? input : {};
  const objectSource = source as Record<string, unknown>;

  return {
    newsCountry: normalizeCountry(objectSource.newsCountry),
    newsCategories: normalizeCategories(objectSource.newsCategories),
    detectionInputMode: normalizeDetectionInputMode(objectSource.detectionInputMode),
    detectionExplanationMode: normalizeDetectionExplanationMode(
      objectSource.detectionExplanationMode
    ),
  };
};

