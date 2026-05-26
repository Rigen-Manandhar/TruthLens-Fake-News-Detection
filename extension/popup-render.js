import { els } from "./popup-dom.js";
import { state, UI_MODES } from "./popup-state.js";

const LEVEL_DESCRIPTIONS = {
  high: "The available signals show lower misinformation risk, but this is not a guarantee that every claim is true.",
  low: "The available signals show higher misinformation risk. Review the source and evidence before trusting or sharing.",
  mixed: "The system does not have enough reliable evidence to make a strong risk judgment.",
};

const REASON_LABELS = {
  CONFLICT: "Conflict",
  LOW_CONFIDENCE: "Low confidence",
  INSUFFICIENT_TEXT: "Insufficient text",
  FETCH_FAILED: "Fetch failed",
  UNSUPPORTED_URL: "Unsupported URL",
};

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

function mapVerdictToLevel(verdictRaw) {
  if (verdictRaw === "LIKELY REAL") return "high";
  if (verdictRaw === "SUSPICIOUS") return "low";
  return "mixed";
}

function mapLevelToTone(level) {
  if (level === "high") return "ok";
  if (level === "low") return "bad";
  return "warn";
}

function mapVerdictToDisplayLabel(verdictRaw) {
  if (verdictRaw === "LIKELY REAL") return "Lower Risk";
  if (verdictRaw === "SUSPICIOUS") return "Higher Risk";
  return "Needs Review";
}

function buildSourceCheckText(sourceSignal) {
  if (!sourceSignal) return "";

  if (sourceSignal.known) {
    const domain = sourceSignal.domain ?? "Source";
    const credibility = sourceSignal.credibility ?? "credibility noted";
    const rationale =
      typeof sourceSignal.rationale === "string"
        ? sourceSignal.rationale.trim()
        : "";
    const base = `${domain} — ${credibility}.`;
    return rationale ? `${base} ${rationale}` : base;
  }

  const domain = sourceSignal.domain ?? "No URL";
  return `${domain} is not in our source database, so no source-based signal was applied.`;
}

function buildArticleRetrievalText(fetchMetadata) {
  if (!fetchMetadata?.attempted) return "";
  return fetchMetadata.success
    ? "The article text was successfully retrieved from the URL."
    : "Article retrieval was attempted but unsuccessful.";
}

function buildLanguageAnalysisText(modelOutputs, conflict) {
  const headlineRan = Boolean(modelOutputs?.model_a?.ran);
  const articleRan = Boolean(modelOutputs?.model_b?.ran);

  if (!headlineRan && !articleRan) return "";

  let lead;
  if (headlineRan && articleRan) {
    lead = "Both the headline and the article body were analyzed for language patterns.";
  } else if (headlineRan) {
    lead = "The headline was analyzed for language patterns.";
  } else {
    lead = "The article body was analyzed for language patterns.";
  }

  let text = `${lead} Language signals are indicators, not proof of truth or falsehood.`;
  if (conflict?.is_conflict) {
    text += " The signals were inconclusive, so this result is treated as review-needed.";
  }
  return text;
}

function buildCoverageText(coverageSignal, claimHints) {
  if (!coverageSignal?.checked) return "";

  const message =
    typeof coverageSignal.message === "string" && coverageSignal.message.trim()
      ? coverageSignal.message.trim()
      : "Trusted-source coverage was checked.";

  if (Array.isArray(claimHints) && claimHints.length > 0) {
    const hintLines = claimHints
      .map((hint) => `  \u2022 ${hint}`)
      .join("\n");
    return `${message}\n${hintLines}`;
  }

  return message;
}

function buildChecksSummary(raw) {
  const sections = [];

  const sourceText = buildSourceCheckText(raw?.evidence_summary?.source_signal);
  if (sourceText) {
    sections.push(`Source credibility — ${sourceText}`);
  }

  const retrievalText = buildArticleRetrievalText(raw?.fetch_metadata);
  if (retrievalText) {
    sections.push(`Article retrieval — ${retrievalText}`);
  }

  const languageText = buildLanguageAnalysisText(raw?.model_outputs, raw?.conflict);
  if (languageText) {
    sections.push(`Language analysis — ${languageText}`);
  }

  const coverageText = buildCoverageText(
    raw?.evidence_summary?.coverage_signal,
    raw?.evidence_summary?.claim_hints
  );
  if (coverageText) {
    sections.push(`Claim cross-reference — ${coverageText}`);
  }

  if (sections.length === 0) {
    if (Array.isArray(raw?.steps) && raw.steps.length > 0) {
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
    return "No checks were returned for this submission.";
  }

  return sections.join("\n\n");
}

function buildAnalysisDetails(raw) {
  const parts = [];

  if (raw?.parse_metadata?.used_mode) {
    parts.push(`Input mode used: ${raw.parse_metadata.used_mode}.`);
  }

  if (typeof raw?.parse_metadata?.headline_word_count === "number") {
    const bodyCount =
      typeof raw?.parse_metadata?.body_word_count === "number"
        ? raw.parse_metadata.body_word_count
        : 0;
    const total = raw.parse_metadata.headline_word_count + bodyCount;
    parts.push(`Processed approximately ${total} words.`);
  }

  const modelA = raw?.model_outputs?.model_a;
  const modelB = raw?.model_outputs?.model_b;
  const confidenceBits = [];
  if (modelA?.ran && typeof modelA.confidence === "number") {
    confidenceBits.push(
      `Model A language signal confidence ${Math.round(modelA.confidence * 100)}%`
    );
  }
  if (modelB?.ran && typeof modelB.confidence === "number") {
    confidenceBits.push(
      `Model B language signal confidence ${Math.round(modelB.confidence * 100)}%`
    );
  }
  if (confidenceBits.length) {
    parts.push(`${confidenceBits.join("; ")}.`);
  }

  return parts.join(" ");
}

export function normalizePredictResponse(raw) {
  const verdictRaw = String(raw?.verdict || "").trim().toUpperCase();
  const reasonCode =
    typeof raw?.uncertainty?.reason_code === "string"
      ? raw.uncertainty.reason_code
      : null;
  const reasonMessage =
    typeof raw?.uncertainty?.reason_message === "string"
      ? raw.uncertainty.reason_message.trim()
      : "";
  const isTooShort = reasonCode === "INSUFFICIENT_TEXT";

  const level = mapVerdictToLevel(verdictRaw);
  const verdictTone = mapLevelToTone(level);

  const verdictLabel = isTooShort
    ? "Too short"
    : mapVerdictToDisplayLabel(verdictRaw);

  const riskLabel = isTooShort
    ? "Too short"
    : typeof raw?.risk_level === "string" && raw.risk_level.trim()
      ? raw.risk_level.trim()
      : "Needs Review";

  const reasonLabel = reasonCode ? REASON_LABELS[reasonCode] ?? reasonCode : null;

  const resultMessage = LEVEL_DESCRIPTIONS[level];
  const heroReason = reasonMessage || resultMessage;

  return {
    verdictLabel,
    verdictTone,
    riskLabel,
    level,
    isTooShort,
    resultMessage,
    heroReason,
    reasonLabel,
    reasonMessage,
    checksSummary: buildChecksSummary(raw),
    analysisDetails: buildAnalysisDetails(raw),
  };
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
