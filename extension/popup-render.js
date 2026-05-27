import { els } from "./popup-dom.js";
import { state, UI_MODES } from "./popup-state.js";

const NBSP = "\u00A0";

export function renderSourceUrlStatus() {
  const { isSupported, reasonMessage } = state.activeTabEligibility;
  els.sourceUrlStatus.textContent = reasonMessage || NBSP;
  els.sourceUrlStatus.classList.remove("is-success", "is-warning");
  els.sourceUrlStatus.classList.add(isSupported ? "is-success" : "is-warning");
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
    ? "Assessing..."
    : "Assess Risk";
}

function setSummaryVisibility(showSummary) {
  els.heroSubtitle.hidden = showSummary;
  els.heroResultSummary.hidden = !showSummary;
}

export function setUiMode(mode) {
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

export function setConfigStatus(message, tone) {
  els.configStatus.textContent = message || NBSP;
  els.configStatus.classList.remove("is-success", "is-error");

  if (tone === "success") {
    els.configStatus.classList.add("is-success");
  } else if (tone === "error") {
    els.configStatus.classList.add("is-error");
  }
}

export function setFeedbackStatus(message, tone) {
  els.feedbackStatus.textContent = message || NBSP;
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

export function setFormLocked(locked) {
  els.articleText.disabled = locked;
  els.sourceUrl.disabled = locked;
  els.inputMode.disabled = locked;
  els.clearBtn.disabled = locked;
}

export function showFormError(message) {
  els.formError.textContent = message;
  els.formError.classList.add("is-visible");
}

export function clearFormError() {
  els.formError.textContent = NBSP;
  els.formError.classList.remove("is-visible");
}

export function syncFeedbackControls() {
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

export function renderFeedbackSection() {
  const hasPrediction = Boolean(state.lastPayload && state.lastRaw);
  const hideForTooShort = Boolean(state.lastNormalized?.isTooShort);
  els.feedbackSection.hidden = !hasPrediction || hideForTooShort;
  if (!hasPrediction || hideForTooShort) {
    return;
  }

  const hasToken = Boolean(state.bearerToken);
  els.feedbackTokenNotice.hidden = hasToken;
  els.feedbackForm.hidden = !hasToken;
  syncFeedbackControls();
}

export function triggerInvalidShake() {
  els.inputCard.classList.remove("shake");
  void els.inputCard.offsetWidth;
  els.inputCard.classList.add("shake");
}

function renderReasonCallout(normalized) {
  if (!normalized.reasonLabel) {
    els.resultReason.hidden = true;
    els.resultReasonLabelText.textContent = "";
    els.resultReasonText.textContent = "";
    return;
  }

  els.resultReason.hidden = false;
  els.resultReasonLabelText.textContent = normalized.reasonLabel;
  els.resultReasonText.textContent = normalized.reasonMessage || "";
  els.resultReasonText.hidden = !normalized.reasonMessage;
}

export function renderResult(normalized) {
  state.lastNormalized = normalized;

  applyToneClass(els.resultBadge, normalized.verdictTone);
  applyToneClass(els.heroSummaryChip, normalized.verdictTone);

  els.resultBadge.textContent = normalized.verdictLabel;
  els.resultRisk.textContent = `Risk: ${normalized.riskLabel}`;
  els.resultTitle.textContent = "Analysis complete";
  els.resultMessage.textContent = normalized.resultMessage;

  renderReasonCallout(normalized);

  els.resultChecks.textContent = normalized.checksSummary;
  els.resultWhy.textContent = normalized.analysisDetails;

  els.heroSummaryChip.textContent = normalized.verdictLabel;
  els.heroRiskChip.textContent = `Risk: ${normalized.riskLabel}`;
  els.heroReason.textContent = normalized.heroReason;

  els.checksDetails.open = false;
  els.whyDetails.open = false;

  const shouldShowAnalysisDetails = Boolean(
    normalized.analysisDetails && normalized.analysisDetails.trim()
  );
  els.whyDetails.hidden = !shouldShowAnalysisDetails;
  renderFeedbackSection();
}

export function renderError(message) {
  els.errorMessage.textContent = message || "Unable to analyze content.";
}
