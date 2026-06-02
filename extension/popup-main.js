import { classifyUrlEligibility } from "./url-eligibility.mjs";
import { callPredict, getActiveTab, readChromeStorage, writeChromeStorage } from "./popup-api.js";
import { bindIfPresent, els, hasRequiredElements } from "./popup-dom.js";
import { normalizePredictResponse } from "./popup-normalize.js";
import {
  clearFormError,
  renderError,
  renderResult,
  renderSourceUrlStatus,
  setConfigStatus,
  setFormLocked,
  setUiMode,
  showFormError,
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
  const cfg = await readChromeStorage(["truthlensApiBaseUrl"]);

  if (
    typeof cfg.truthlensApiBaseUrl === "string" &&
    cfg.truthlensApiBaseUrl.trim()
  ) {
    state.apiBaseUrl = cfg.truthlensApiBaseUrl.trim();
  }

  syncConfigInputs();
}

function syncConfigInputs() {
  els.apiBaseUrl.value = state.apiBaseUrl;
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

async function analyzeWithPayload(payload) {
  state.lastPayload = payload;
  state.lastRaw = null;

  clearFormError();
  setFormLocked(true);
  setUiMode(UI_MODES.LOADING);

  try {
    const raw = await callPredict(state.apiBaseUrl, payload);
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

  const saved = await writeChromeStorage({
    truthlensApiBaseUrl: nextApiBaseUrl,
  });

  if (!saved) {
    setConfigStatus("Failed to save settings.", "error");
    return;
  }

  state.apiBaseUrl = nextApiBaseUrl;
  setConfigStatus("Settings saved.", "success");
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

function bindEvents() {
  bindIfPresent(els.form, "submit", onSubmit);
  bindIfPresent(els.clearBtn, "click", onClearFields);
  bindIfPresent(els.saveConfigBtn, "click", onSaveConfig);
  bindIfPresent(els.retryBtn, "click", onRetry);
  bindIfPresent(els.editBtn, "click", onBackToForm);
  bindIfPresent(els.editBtnResult, "click", onBackToForm);
  bindIfPresent(els.analyzeAgainBtn, "click", onBackToForm);
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
  setConfigStatus("", "");
  setFormLocked(false);
  setUiMode(UI_MODES.EDITING);
}

init();
