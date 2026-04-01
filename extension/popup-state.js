import { classifyUrlEligibility } from "./url-eligibility.mjs";

export const DEFAULT_API_BASE_URL = "http://localhost:3000";

export const UI_MODES = {
  EDITING: "editing",
  LOADING: "loading",
  RESULT: "result",
  ERROR: "error",
};

export const state = {
  uiMode: UI_MODES.EDITING,
  apiBaseUrl: DEFAULT_API_BASE_URL,
  bearerToken: "",
  activeTabUrl: "",
  activeTabEligibility: classifyUrlEligibility(""),
  lastPayload: null,
  lastNormalized: null,
  lastRaw: null,
  feedbackSelection: null,
  feedbackSubmitted: false,
  feedbackSubmitting: false,
};
