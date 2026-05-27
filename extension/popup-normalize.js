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
    const base = `${domain} â€” ${credibility}.`;
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

function buildChecksSummary(raw) {
  const sections = [];

  const sourceText = buildSourceCheckText(raw?.evidence_summary?.source_signal);
  if (sourceText) {
    sections.push(`Source credibility â€” ${sourceText}`);
  }

  const retrievalText = buildArticleRetrievalText(raw?.fetch_metadata);
  if (retrievalText) {
    sections.push(`Article retrieval â€” ${retrievalText}`);
  }

  const languageText = buildLanguageAnalysisText(raw?.model_outputs, raw?.conflict);
  if (languageText) {
    sections.push(`Language analysis â€” ${languageText}`);
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
