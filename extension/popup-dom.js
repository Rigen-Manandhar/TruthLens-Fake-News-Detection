export const els = {
  form: document.getElementById("analysis-form"),
  inputMode: document.getElementById("input-mode"),
  articleText: document.getElementById("article-text"),
  sourceUrl: document.getElementById("source-url"),
  sourceUrlStatus: document.getElementById("source-url-status"),
  apiBaseUrl: document.getElementById("api-base-url"),
  bearerToken: document.getElementById("bearer-token"),
  saveConfigBtn: document.getElementById("save-config-btn"),
  configStatus: document.getElementById("config-status"),
  clearBtn: document.getElementById("clear-btn"),
  formError: document.getElementById("form-error"),
  analyzeBtn: document.getElementById("analyze-btn"),
  analyzeBtnText: document.getElementById("analyze-btn-text"),
  editingPane: document.getElementById("editing-pane"),
  loadingPane: document.getElementById("loading-pane"),
  resultPane: document.getElementById("result-pane"),
  errorPane: document.getElementById("error-pane"),
  heroSubtitle: document.getElementById("hero-subtitle"),
  heroResultSummary: document.getElementById("hero-result-summary"),
  heroSummaryChip: document.getElementById("hero-summary-chip"),
  heroRiskChip: document.getElementById("hero-risk-chip"),
  heroReason: document.getElementById("hero-reason"),
  resultBadge: document.getElementById("result-badge"),
  resultRisk: document.getElementById("result-risk"),
  resultTitle: document.getElementById("result-title"),
  resultMessage: document.getElementById("result-message"),
  resultChecks: document.getElementById("result-checks"),
  resultWhy: document.getElementById("result-why"),
  checksDetails: document.getElementById("checks-details"),
  whyDetails: document.getElementById("why-details"),
  feedbackSection: document.getElementById("feedback-section"),
  feedbackTokenNotice: document.getElementById("feedback-token-notice"),
  feedbackForm: document.getElementById("feedback-form"),
  feedbackCorrectBtn: document.getElementById("feedback-correct-btn"),
  feedbackWrongBtn: document.getElementById("feedback-wrong-btn"),
  feedbackComment: document.getElementById("feedback-comment"),
  feedbackStatus: document.getElementById("feedback-status"),
  feedbackSubmitBtn: document.getElementById("feedback-submit-btn"),
  errorMessage: document.getElementById("error-message"),
  retryBtn: document.getElementById("retry-btn"),
  editBtn: document.getElementById("edit-btn"),
  editBtnResult: document.getElementById("edit-btn-result"),
  analyzeAgainBtn: document.getElementById("analyze-again-btn"),
  inputCard: document.querySelector(".input-card"),
};

const REQUIRED_ELEMENT_KEYS = [
  "form",
  "inputMode",
  "articleText",
  "sourceUrl",
  "sourceUrlStatus",
  "apiBaseUrl",
  "bearerToken",
  "saveConfigBtn",
  "configStatus",
  "clearBtn",
  "formError",
  "analyzeBtn",
  "analyzeBtnText",
  "editingPane",
  "loadingPane",
  "resultPane",
  "errorPane",
  "heroSubtitle",
  "heroResultSummary",
  "heroSummaryChip",
  "heroRiskChip",
  "heroReason",
  "resultBadge",
  "resultRisk",
  "resultTitle",
  "resultMessage",
  "resultChecks",
  "resultWhy",
  "checksDetails",
  "whyDetails",
  "feedbackSection",
  "feedbackTokenNotice",
  "feedbackForm",
  "feedbackCorrectBtn",
  "feedbackWrongBtn",
  "feedbackComment",
  "feedbackStatus",
  "feedbackSubmitBtn",
  "errorMessage",
  "retryBtn",
  "editBtn",
  "editBtnResult",
  "analyzeAgainBtn",
  "inputCard",
];

export function hasRequiredElements() {
  const missing = REQUIRED_ELEMENT_KEYS.filter((key) => !els[key]);
  if (missing.length) {
    console.error(
      "TruthLens popup: missing required DOM elements:",
      missing.join(", ")
    );
    return false;
  }
  return true;
}

export function bindIfPresent(node, eventName, handler) {
  if (!node) {
    return;
  }
  node.addEventListener(eventName, handler);
}
