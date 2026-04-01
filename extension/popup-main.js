import { classifyUrlEligibility } from "./url-eligibility.mjs";
import { callPredict, getActiveTab, readChromeStorage, submitFeedbackRequest, writeChromeStorage } from "./popup-api.js";
import { bindIfPresent, els, hasRequiredElements } from "./popup-dom.js";
import {
  clearFormError,
  normalizePredictResponse,
  renderError,
  renderFeedbackSection,
  renderResult,
  renderSourceUrlStatus,
  setConfigStatus,
  setFeedbackStatus,
  setFormLocked,
  setUiMode,
  showFormError,
  syncFeedbackControls,
  triggerInvalidShake,
} from "./popup-render.js";
import { DEFAULT_API_BASE_URL, state, UI_MODES } from "./popup-state.js";

function setActiveTabUrl(url) {
  state.activeTabEligibility = classifyUrlEligibility(url);
  state.activeTabUrl = state.activeTabEligibility.normalizedUrl || "";
  els.sourceUrl.value = state.activeTabUrl;
  renderSourceUrlStatus();
}

async function syncActiveTabUrl() {
  const activeTab = await getActiveTab();
  const nextUrl =
    activeTab && typeof activeTab.url === "string" ? activeTab.url : "";

  setActiveTabUrl(nextUrl);
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

function getPayloadFromForm() {
  return {
    text: els.articleText.value.trim(),
    url: state.activeTabEligibility.isSupported ? state.activeTabUrl : "",
    input_mode: els.inputMode.value,
  };
}

function validatePayload(payload) {
  if (!payload.text && !payload.url) {
    if (!state.activeTabEligibility.isSupported) {
      return "This page does not look like a supported article page. Paste article text to run text-only analysis.";
    }
    return "Please enter article text or open a web page with a valid URL to analyze.";
  }
  return "";
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
    await submitFeedbackRequest(state.apiBaseUrl, state.bearerToken, {
      source: "extension",
      input: state.lastPayload,
      prediction: buildPredictionSnapshot(state.lastRaw),
      feedback: {
        isCorrect: state.feedbackSelection,
        comment: els.feedbackComment.value.trim(),
      },
    });

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

async function analyzeWithPayload(payload) {
  state.lastPayload = payload;
  state.lastRaw = null;
  resetFeedbackState();

  clearFormError();
  setFormLocked(true);
  setUiMode(UI_MODES.LOADING);

  try {
    const raw = await callPredict(state.apiBaseUrl, state.bearerToken, payload);
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

  await syncActiveTabUrl();
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
  setActiveTabUrl(state.activeTabUrl);
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

async function onRetry() {
  await syncActiveTabUrl();

  const payload = getPayloadFromForm();
  if (!payload.text && !payload.url) {
    setUiMode(UI_MODES.EDITING);
    showFormError(validatePayload(payload));
    return;
  }

  analyzeWithPayload(payload);
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
  await syncActiveTabUrl();
  bindEvents();
  clearFormError();
  resetFeedbackState();
  renderFeedbackSection();
  setConfigStatus("", "");
  setFormLocked(false);
  setUiMode(UI_MODES.EDITING);
}

init();
