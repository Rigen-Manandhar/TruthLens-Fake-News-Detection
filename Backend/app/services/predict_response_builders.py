from __future__ import annotations

from app.schemas import (
    ConflictInfo,
    FetchMetadata,
    ModelOutputs,
    ParseMetadata,
    PredictResponse,
    SingleModelOutput,
    StepDetail,
    UncertaintyInfo,
)


def empty_model_outputs(headline_words: int = 0, body_words: int = 0) -> ModelOutputs:
    return ModelOutputs(
        model_a=SingleModelOutput(ran=False, input_word_count=headline_words),
        model_b=SingleModelOutput(ran=False, input_word_count=body_words),
    )


def build_uncertain_response(
    *,
    final_score: int,
    steps: list[StepDetail],
    reason_code: str,
    reason_message: str,
    used_mode: str,
    detected_shape: str,
    headline_word_count: int,
    body_word_count: int,
    headline_source: str | None,
    fetch_metadata: FetchMetadata,
    evidence_summary: dict,
    raw_score_before_override: int | None = None,
) -> PredictResponse:
    return PredictResponse(
        final_score=final_score,
        verdict="UNCERTAIN",
        risk_level="Needs Review",
        steps=steps,
        article_class="UNKNOWN",
        uncertainty=UncertaintyInfo(
            reason_code=reason_code,
            reason_message=reason_message,
        ),
        parse_metadata=ParseMetadata(
            used_mode=used_mode,
            detected_shape=detected_shape,
            headline_word_count=headline_word_count,
            body_word_count=body_word_count,
            headline_source=headline_source,
        ),
        model_outputs=empty_model_outputs(headline_word_count, body_word_count),
        conflict=ConflictInfo(
            is_conflict=False,
            threshold=0.80,
            raw_score_before_override=(
                final_score if raw_score_before_override is None else raw_score_before_override
            ),
        ),
        fetch_metadata=fetch_metadata,
        evidence_summary=evidence_summary,
        lime_model=None,
        lime_input_text=None,
    )
