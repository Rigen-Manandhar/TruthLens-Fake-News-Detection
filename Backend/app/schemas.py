from __future__ import annotations

from typing import Literal

from pydantic import BaseModel


class PredictRequest(BaseModel):
    text: str = ""
    url: str | None = None
    input_mode: Literal["auto", "headline_only", "full_article", "headline_plus_article"] = "auto"
    explanation_mode: Literal["none", "auto", "force"] = "auto"


class StepDetail(BaseModel):
    step: str
    score_impact: int
    details: str
    sentence_preview: str | None = None
    input_preview: str | None = None
    metadata: dict | None = None


class UncertaintyInfo(BaseModel):
    reason_code: Literal["CONFLICT", "LOW_CONFIDENCE", "INSUFFICIENT_TEXT", "FETCH_FAILED", "UNSUPPORTED_URL"] | None = None
    reason_message: str | None = None


class ParseMetadata(BaseModel):
    used_mode: str
    detected_shape: str
    headline_word_count: int
    body_word_count: int
    headline_source: str | None = None


class SingleModelOutput(BaseModel):
    ran: bool
    label: str | None = None
    confidence: float | None = None
    score_impact: int = 0
    input_word_count: int = 0


class ModelOutputs(BaseModel):
    model_a: SingleModelOutput
    model_b: SingleModelOutput


class ConflictInfo(BaseModel):
    is_conflict: bool = False
    threshold: float | None = None
    raw_score_before_override: int | None = None


class FetchMetadata(BaseModel):
    attempted: bool = False
    success: bool | None = None
    status_code: int | None = None
    error_type: str | None = None
    resolved_url: str | None = None


class PredictResponse(BaseModel):
    final_score: int
    verdict: str
    risk_level: str
    steps: list[StepDetail]
    explanation: list[tuple[str, float]] | None = None
    explanation_html: str | None = None
    article_class: str | None = None
    uncertainty: UncertaintyInfo | None = None
    parse_metadata: ParseMetadata | None = None
    model_outputs: ModelOutputs | None = None
    conflict: ConflictInfo | None = None
    fetch_metadata: FetchMetadata | None = None
    lime_model: Literal["A", "B"] | None = None
    lime_input_text: str | None = None
