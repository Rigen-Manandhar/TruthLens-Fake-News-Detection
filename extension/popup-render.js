import { els } from "./popup-dom.js";
import { state, UI_MODES } from "./popup-state.js";

export function renderSourceUrlStatus() {
  const { isSupported, reasonMessage } = state.activeTabEligibility;
  els.sourceUrlStatus.textContent = reasonMessage || "\u00A0";
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
    ? "Analyzing..."
    : "Analyze Content";
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
  els.configStatus.textContent = message || "\u00A0";
  els.configStatus.classList.remove("is-success", "is-error");

  if (tone === "success") {
    els.configStatus.classList.add("is-success");
  } else if (tone === "error") {
    els.configStatus.classList.add("is-error");
  }
}

export function setFeedbackStatus(message, tone) {
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

export function normalizePredictResponse(raw) {
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
  els.formError.textContent = "\u00A0";
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
  els.feedbackSection.hidden = !hasPrediction;
  if (!hasPrediction) {
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

export function renderResult(normalized) {
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

export function renderError(message) {
  els.errorMessage.textContent = message || "Unable to analyze content.";
}
