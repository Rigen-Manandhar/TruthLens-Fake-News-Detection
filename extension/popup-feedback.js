export function buildPredictionSnapshot(raw) {
  return {
    verdict: raw?.verdict,
    riskLevel: raw?.risk_level ?? "Needs Review",
    finalScore: raw?.final_score,
    uncertainty: raw?.uncertainty,
    parseMetadata: raw?.parse_metadata,
    modelOutputs: raw?.model_outputs,
    conflict: raw?.conflict,
    fetchMetadata: raw?.fetch_metadata,
    evidenceSummary: raw?.evidence_summary,
    explanationSummary: raw?.explanation_summary,
    limeModel: raw?.lime_model === "A" || raw?.lime_model === "B" ? raw.lime_model : null,
  };
}

export function buildFeedbackSubmission({ source, input, prediction, isCorrect, comment }) {
  return {
    source,
    input,
    prediction,
    feedback: {
      isCorrect,
      comment,
    },
  };
}
