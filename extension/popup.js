const DEFAULT_API_BASE_URL = "http://localhost:3000";

const UI_MODES = {
  EDITING: "editing",
  LOADING: "loading",
  RESULT: "result",
  ERROR: "error",
};

const els = {
  form: document.getElementById("analysis-form"),
  inputMode: document.getElementById("input-mode"),
  articleText: document.getElementById("article-text"),
  sourceUrl: document.getElementById("source-url"),
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

const state = {
  uiMode: UI_MODES.EDITING,
  apiBaseUrl: DEFAULT_API_BASE_URL,
  bearerToken: "",
  lastPayload: null,
  lastNormalized: null,
  lastRaw: null,
  feedbackSelection: null,
  feedbackSubmitted: false,
  feedbackSubmitting: false,
};

const REQUIRED_ELEMENT_KEYS = [
  "form",
  "inputMode",
  "articleText",
  "sourceUrl",
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

function hasRequiredElements() {
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

function bindIfPresent(node, eventName, handler) {
  if (!node) {
    return;
  }
  node.addEventListener(eventName, handler);
}

function getExtensionChrome() {
  return globalThis.chrome ?? null;
}

function readChromeStorage(keys) {
  return new Promise((resolve) => {
    const extChrome = getExtensionChrome();
    if (!extChrome || !extChrome.storage || !extChrome.storage.sync) {
      resolve({});
      return;
    }

    extChrome.storage.sync.get(keys, (values) => {
      resolve(values || {});
    });
  });
}

function writeChromeStorage(values) {
  return new Promise((resolve) => {
    const extChrome = getExtensionChrome();
    if (!extChrome || !extChrome.storage || !extChrome.storage.sync) {
      resolve(false);
      return;
    }

    extChrome.storage.sync.set(values, () => {
      resolve(!extChrome.runtime || !extChrome.runtime.lastError);
    });
  });
}

async function loadRuntimeConfig() {
  const cfg = await readChromeStorage([
    "truthlensApiBaseUrl",
    "truthlensBearerToken",
  ]);

  if (
    typeof cfg.truthlensApiBaseUrl === "string" &&
    cfg.truthlensApiBaseUrl.trim()
  ) {
    state.apiBaseUrl = cfg.truthlensApiBaseUrl.trim();
  }

  if (
    typeof cfg.truthlensBearerToken === "string" &&
    cfg.truthlensBearerToken.trim()
  ) {
    state.bearerToken = cfg.truthlensBearerToken.trim();
  }

  syncConfigInputs();
}

function syncConfigInputs() {
  els.apiBaseUrl.value = state.apiBaseUrl;
  els.bearerToken.value = state.bearerToken;
}

function endpointFor(pathname) {
  return `${state.apiBaseUrl.replace(/\/$/, "")}${pathname}`;
}

function setPaneVisibility(mode) {
  els.editingPane.hidden = mode !== UI_MODES.EDITING;
  els.loadingPane.hidden = mode !== UI_MODES.LOADING;
  els.resultPane.hidden = mode !== UI_MODES.RESULT;
  els.errorPane.hidden = mode !== UI_MODES.ERROR;
}

function setAnalyzeRail(mode) {
  const isLoading = mode === UI_MODES.LOADING;
  const isEditing = mode === UI_MODES.EDITING;

  els.analyzeBtn.hidden = !isEditing && !isLoading;
  els.analyzeBtn.disabled = isLoading;
  els.analyzeBtn.classList.toggle("loading", isLoading);
  els.analyzeBtnText.textContent = isLoading
    ? "Analyzing..."
    : "Analyze Content";
}

function setSummaryVisibility(showSummary) {
  els.heroSubtitle.hidden = showSummary;
  els.heroResultSummary.hidden = !showSummary;
}

function setUiMode(mode) {
  state.uiMode = mode;
  setPaneVisibility(mode);
  setAnalyzeRail(mode);

  if (mode === UI_MODES.EDITING || mode === UI_MODES.LOADING) {
    setSummaryVisibility(false);
  }

  if (mode === UI_MODES.RESULT) {
    setSummaryVisibility(true);
  }
}

function setConfigStatus(message, tone) {
  els.configStatus.textContent = message || "\u00A0";
  els.configStatus.classList.remove("is-success", "is-error");

  if (tone === "success") {
    els.configStatus.classList.add("is-success");
  } else if (tone === "error") {
    els.configStatus.classList.add("is-error");
  }
}

function setFeedbackStatus(message, tone) {
  els.feedbackStatus.textContent = message || "\u00A0";
  els.feedbackStatus.classList.remove("is-success", "is-error");

  if (tone === "success") {
    els.feedbackStatus.classList.add("is-success");
  } else if (tone === "error") {
    els.feedbackStatus.classList.add("is-error");
  }
}

function applyToneClass(el, tone) {
  el.classList.remove("tone-ok", "tone-warn", "tone-bad");
  if (tone === "ok") {
    el.classList.add("tone-ok");
    return;
  }
  if (tone === "bad") {
    el.classList.add("tone-bad");
    return;
  }
  el.classList.add("tone-warn");
}

function titleCase(raw) {
  return raw
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function getReasonText(raw) {
  if (
    raw?.uncertainty?.reason_message &&
    typeof raw.uncertainty.reason_message === "string"
  ) {
    return raw.uncertainty.reason_message.trim();
  }

  if (typeof raw?.detail === "string" && raw.detail.trim()) {
    return raw.detail.trim();
  }

  return "Hybrid model completed analysis for the submitted content.";
}

function buildChecksSummary(raw) {
  if (!Array.isArray(raw?.steps) || raw.steps.length === 0) {
    return "No detailed check trace was returned.";
  }

  return raw.steps
    .map((step, idx) => {
      const stepName =
        typeof step?.step === "string" && step.step.trim()
          ? step.step.trim()
          : `Check ${idx + 1}`;
      const stepDetail =
        typeof step?.details === "string" && step.details.trim()
          ? `: ${step.details.trim()}`
          : "";
      return `${idx + 1}. ${stepName}${stepDetail}`;
    })
    .join("\n");
}

function buildWhyText(raw, normalized) {
  const parts = [];

  if (raw?.parse_metadata?.used_mode) {
    parts.push(`Input mode used: ${raw.parse_metadata.used_mode}.`);
  }

  if (typeof raw?.parse_metadata?.headline_word_count === "number") {
    const bodyCount =
      typeof raw?.parse_metadata?.body_word_count === "number"
        ? raw.parse_metadata.body_word_count
        : 0;
    parts.push(
      `Processed approximately ${raw.parse_metadata.headline_word_count + bodyCount} words.`
    );
  }

  const modelA = raw?.model_outputs?.model_a;
  const modelB = raw?.model_outputs?.model_b;
  if (modelA?.ran || modelB?.ran) {
    const bits = [];
    if (typeof modelA?.confidence === "number") {
      bits.push(`Model A confidence ${Math.round(modelA.confidence * 100)}%`);
    }
    if (typeof modelB?.confidence === "number") {
      bits.push(`Model B confidence ${Math.round(modelB.confidence * 100)}%`);
    }
    if (bits.length) {
      parts.push(`${bits.join("; ")}.`);
    }
  }

  if (raw?.conflict?.is_conflict) {
    parts.push("Models produced mixed signals, so this result should be reviewed carefully.");
  }

  if (parts.length === 0) {
    parts.push(
      `Verdict is ${normalized.verdictLabel} based on source, text pattern, and model signals.`
    );
  }

  return parts.join(" ");
}

function normalizePredictResponse(raw) {
  const verdictRaw = String(raw?.verdict || "").trim().toUpperCase();

  let verdictLabel = "Needs Review";
  let verdictTone = "warn";

  if (verdictRaw === "LIKELY REAL") {
    verdictLabel = "Likely Real";
    verdictTone = "ok";
  } else if (verdictRaw === "SUSPICIOUS") {
    verdictLabel = "Suspicious";
    verdictTone = "bad";
  } else if (verdictRaw) {
    verdictLabel = titleCase(verdictRaw);
    verdictTone = "warn";
  }

  const riskLabel =
    typeof raw?.risk_level === "string" && raw.risk_level.trim()
      ? raw.risk_level.trim()
      : "Needs Review";
  const reasonText = getReasonText(raw);
  const checksCount = Array.isArray(raw?.steps) ? raw.steps.length : 0;
  const checksSummary = buildChecksSummary(raw);

  const normalized = {
    verdictLabel,
    verdictTone,
    riskLabel,
    reasonText,
    checksCount,
    checksSummary,
    whyText: "",
  };

  normalized.whyText = buildWhyText(raw, normalized);

  return normalized;
}

function setFormLocked(locked) {
  els.articleText.disabled = locked;
  els.sourceUrl.disabled = locked;
  els.inputMode.disabled = locked;
  els.clearBtn.disabled = locked;
}

function showFormError(message) {
  els.formError.textContent = message;
  els.formError.classList.add("is-visible");
}

function clearFormError() {
  els.formError.textContent = "\u00A0";
  els.formError.classList.remove("is-visible");
}

function buildPredictionSnapshot(raw) {
  return {
    verdict: raw?.verdict,
    riskLevel: raw?.risk_level,
    finalScore: raw?.final_score,
    uncertainty: raw?.uncertainty,
    parseMetadata: raw?.parse_metadata,
    modelOutputs: raw?.model_outputs,
    conflict: raw?.conflict,
    fetchMetadata: raw?.fetch_metadata,
    limeModel: raw?.lime_model === "A" || raw?.lime_model === "B" ? raw.lime_model : null,
  };
}

function resetFeedbackState() {
  state.feedbackSelection = null;
  state.feedbackSubmitted = false;
  state.feedbackSubmitting = false;
  els.feedbackComment.value = "";
  setFeedbackStatus("", "");
  syncFeedbackControls();
}

function syncFeedbackControls() {
  const disabled =
    !state.bearerToken || state.feedbackSubmitting || state.feedbackSubmitted;

  els.feedbackCorrectBtn.classList.toggle(
    "is-selected",
    state.feedbackSelection === true
  );
  els.feedbackWrongBtn.classList.toggle(
    "is-selected",
    state.feedbackSelection === false
  );

  els.feedbackCorrectBtn.disabled = disabled;
  els.feedbackWrongBtn.disabled = disabled;
  els.feedbackComment.disabled = disabled;
  els.feedbackSubmitBtn.disabled = disabled || state.feedbackSelection === null;
  els.feedbackSubmitBtn.textContent = state.feedbackSubmitted
    ? "Feedback sent"
    : state.feedbackSubmitting
      ? "Sending..."
      : "Send feedback";
}

function renderFeedbackSection() {
  const hasPrediction = Boolean(state.lastPayload && state.lastRaw);
  els.feedbackSection.hidden = !hasPrediction;
  if (!hasPrediction) {
    return;
  }

  const hasToken = Boolean(state.bearerToken);
  els.feedbackTokenNotice.hidden = hasToken;
  els.feedbackForm.hidden = !hasToken;
  syncFeedbackControls();
}

function triggerInvalidShake() {
  els.inputCard.classList.remove("shake");
  void els.inputCard.offsetWidth;
  els.inputCard.classList.add("shake");
}

function getPayloadFromForm() {
  return {
    text: els.articleText.value.trim(),
    url: els.sourceUrl.value.trim(),
    input_mode: els.inputMode.value,
  };
}

function validatePayload(payload) {
  if (!payload.text && !payload.url) {
    return "Please enter article text or a source URL to analyze.";
  }
  return "";
}

async function callPredict(payload) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (state.bearerToken) {
    headers.Authorization = `Bearer ${state.bearerToken}`;
  }

  const response = await fetch(endpointFor("/api/predict"), {
    method: "POST",
    headers,
    body: JSON.stringify({
      ...payload,
      explanation_mode: "auto",
    }),
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const detail =
      typeof json?.detail === "string" && json.detail.trim()
        ? json.detail.trim()
        : "Prediction request failed.";
    throw new Error(detail);
  }

  return json || {};
}

async function submitFeedback() {
  if (!state.lastPayload || !state.lastRaw) {
    return;
  }

  if (!state.bearerToken) {
    setFeedbackStatus(
      "Configure your feedback token before submitting feedback.",
      "error"
    );
    renderFeedbackSection();
    return;
  }

  if (state.feedbackSelection === null) {
    setFeedbackStatus("Choose whether the prediction was right or wrong.", "error");
    syncFeedbackControls();
    return;
  }

  state.feedbackSubmitting = true;
  setFeedbackStatus("", "");
  syncFeedbackControls();

  try {
    const response = await fetch(endpointFor("/api/feedback/detections"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${state.bearerToken}`,
      },
      body: JSON.stringify({
        source: "extension",
        input: state.lastPayload,
        prediction: buildPredictionSnapshot(state.lastRaw),
        feedback: {
          isCorrect: state.feedbackSelection,
          comment: els.feedbackComment.value.trim(),
        },
      }),
    });

    const json = await response.json().catch(() => null);
    if (!response.ok) {
      const errorMessage =
        typeof json?.error === "string" && json.error.trim()
          ? json.error.trim()
          : "Failed to submit feedback.";
      throw new Error(errorMessage);
    }

    state.feedbackSubmitted = true;
    setFeedbackStatus("Feedback saved to your account.", "success");
  } catch (error) {
    setFeedbackStatus(
      error instanceof Error ? error.message : "Failed to submit feedback.",
      "error"
    );
  } finally {
    state.feedbackSubmitting = false;
    syncFeedbackControls();
  }
}

function renderResult(normalized) {
  state.lastNormalized = normalized;

  applyToneClass(els.resultBadge, normalized.verdictTone);
  applyToneClass(els.heroSummaryChip, normalized.verdictTone);

  els.resultBadge.textContent = normalized.verdictLabel;
  els.resultRisk.textContent = `Risk: ${normalized.riskLabel}`;
  els.resultTitle.textContent = "Analysis complete";
  els.resultMessage.textContent = normalized.reasonText;

  els.resultChecks.textContent = normalized.checksSummary;
  els.resultWhy.textContent = normalized.whyText;

  els.heroSummaryChip.textContent = normalized.verdictLabel;
  els.heroRiskChip.textContent = `Risk: ${normalized.riskLabel}`;
  els.heroReason.textContent = normalized.reasonText;

  els.checksDetails.open = false;
  els.whyDetails.open = false;

  const shouldShowWhy = Boolean(normalized.whyText && normalized.whyText.trim());
  els.whyDetails.hidden = !shouldShowWhy;
  renderFeedbackSection();
}

function renderError(message) {
  els.errorMessage.textContent = message || "Unable to analyze content.";
}

async function analyzeWithPayload(payload) {
  state.lastPayload = payload;
  state.lastRaw = null;
  resetFeedbackState();

  clearFormError();
  setFormLocked(true);
  setUiMode(UI_MODES.LOADING);

  try {
    const raw = await callPredict(payload);
    state.lastRaw = raw;
    const normalized = normalizePredictResponse(raw);
    renderResult(normalized);
    setUiMode(UI_MODES.RESULT);
  } catch (error) {
    state.lastRaw = null;
    const message =
      error instanceof Error ? error.message : "Unable to analyze content.";
    renderError(message);
    setUiMode(UI_MODES.ERROR);
  } finally {
    setFormLocked(false);
  }
}

async function onSubmit(event) {
  event.preventDefault();

  if (state.uiMode === UI_MODES.LOADING) {
    return;
  }

  const payload = getPayloadFromForm();
  const validationMessage = validatePayload(payload);

  if (validationMessage) {
    showFormError(validationMessage);
    triggerInvalidShake();
    setUiMode(UI_MODES.EDITING);
    return;
  }

  await analyzeWithPayload(payload);
}

function onClearFields() {
  if (state.uiMode === UI_MODES.LOADING) {
    return;
  }

  els.articleText.value = "";
  els.sourceUrl.value = "";
  clearFormError();
}

async function onSaveConfig() {
  const nextApiBaseUrl = els.apiBaseUrl.value.trim() || DEFAULT_API_BASE_URL;
  const nextBearerToken = els.bearerToken.value.trim();

  const saved = await writeChromeStorage({
    truthlensApiBaseUrl: nextApiBaseUrl,
    truthlensBearerToken: nextBearerToken,
  });

  if (!saved) {
    setConfigStatus("Failed to save settings.", "error");
    return;
  }

  state.apiBaseUrl = nextApiBaseUrl;
  state.bearerToken = nextBearerToken;
  setConfigStatus("Settings saved.", "success");
  renderFeedbackSection();
}

function onRetry() {
  if (!state.lastPayload) {
    setUiMode(UI_MODES.EDITING);
    return;
  }

  analyzeWithPayload(state.lastPayload);
}

function onBackToForm() {
  setUiMode(UI_MODES.EDITING);
  clearFormError();
}

function onFeedbackChoice(value) {
  if (!state.bearerToken || state.feedbackSubmitting || state.feedbackSubmitted) {
    return;
  }

  state.feedbackSelection = value;
  setFeedbackStatus("", "");
  syncFeedbackControls();
}

function bindEvents() {
  bindIfPresent(els.form, "submit", onSubmit);
  bindIfPresent(els.clearBtn, "click", onClearFields);
  bindIfPresent(els.saveConfigBtn, "click", onSaveConfig);
  bindIfPresent(els.retryBtn, "click", onRetry);
  bindIfPresent(els.editBtn, "click", onBackToForm);
  bindIfPresent(els.editBtnResult, "click", onBackToForm);
  bindIfPresent(els.analyzeAgainBtn, "click", onBackToForm);
  bindIfPresent(els.feedbackCorrectBtn, "click", () => onFeedbackChoice(true));
  bindIfPresent(els.feedbackWrongBtn, "click", () => onFeedbackChoice(false));
  bindIfPresent(els.feedbackSubmitBtn, "click", submitFeedback);
  bindIfPresent(els.articleText, "input", clearFormError);
  bindIfPresent(els.sourceUrl, "input", clearFormError);
}

async function init() {
  if (!hasRequiredElements()) {
    return;
  }

  await loadRuntimeConfig();
  bindEvents();
  clearFormError();
  resetFeedbackState();
  renderFeedbackSection();
  setConfigStatus("", "");
  setFormLocked(false);
  setUiMode(UI_MODES.EDITING);
}

init();
