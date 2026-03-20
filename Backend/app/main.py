from __future__ import annotations

import re
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from lime.lime_text import LimeTextExplainer
from pydantic import BaseModel
from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS

from app.article_extractor import ExtractionError, fetch_and_extract
from app.model_loader import HybridModelLoader, get_hybrid_model
from app.url_eligibility import classify_url_eligibility


INPUT_TEXT_MIN_LEN = 10
LIME_MAX_FEATURES = 20
LIME_RAW_FEATURES = 40
NEGATION_WORDS = {"no", "not", "nor", "never", "none", "without", "cannot", "can't", "won't", "n't"}


app = FastAPI(title="TruthLens Hybrid Backend", version="2.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model: HybridModelLoader | None = None
explainer: LimeTextExplainer | None = None


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


def _empty_model_outputs(headline_words: int = 0, body_words: int = 0) -> ModelOutputs:
    return ModelOutputs(
        model_a=SingleModelOutput(ran=False, input_word_count=headline_words),
        model_b=SingleModelOutput(ran=False, input_word_count=body_words),
    )


def _is_stopword_feature(term: str) -> bool:
    words = re.findall(r"[a-zA-Z]+'?[a-zA-Z]*", term.lower())
    if not words:
        return False

    if any(word in NEGATION_WORDS for word in words):
        return False

    return all(word in ENGLISH_STOP_WORDS for word in words)


def _filter_lime_features(features: list[tuple[str, float]]) -> list[tuple[str, float]]:
    filtered = [item for item in features if not _is_stopword_feature(item[0])]
    return filtered[:LIME_MAX_FEATURES]


@app.on_event("startup")
def startup():
    global model, explainer
    model = get_hybrid_model()
    explainer = LimeTextExplainer(class_names=["Real", "Fake"])


@app.get("/")
def root():
    return {"message": "TruthLens Hybrid System is running"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    if model is None or explainer is None:
        raise HTTPException(status_code=500, detail="Model not loaded")

    text = (req.text or "").strip()
    original_url = (req.url or "").strip() or None
    analysis_url = original_url
    title_candidates: list[str] = []
    fetch_metadata = FetchMetadata(attempted=False, success=None)
    eligibility_step: StepDetail | None = None

    if original_url:
        eligibility = classify_url_eligibility(original_url)
        if eligibility.is_supported:
            analysis_url = eligibility.normalized_url
            eligibility_step = StepDetail(
                step="URL Eligibility",
                score_impact=0,
                details=eligibility.reason_message,
                metadata={"supported": True, "reason_code": eligibility.reason_code},
            )
        else:
            analysis_url = None
            fetch_metadata = FetchMetadata(
                attempted=False,
                success=False,
                error_type="UNSUPPORTED_PAGE",
                resolved_url=eligibility.normalized_url or original_url,
            )

            if len(text) >= INPUT_TEXT_MIN_LEN:
                eligibility_step = StepDetail(
                    step="URL Eligibility",
                    score_impact=0,
                    details=(
                        f"{eligibility.reason_message} Text analysis will continue without using the page URL."
                    ),
                    metadata={"supported": False, "reason_code": eligibility.reason_code},
                )
            else:
                eligibility_step = StepDetail(
                    step="URL Eligibility",
                    score_impact=0,
                    details=eligibility.reason_message,
                    metadata={"supported": False, "reason_code": eligibility.reason_code},
                )
                return PredictResponse(
                    final_score=0,
                    verdict="UNCERTAIN",
                    risk_level="Needs Review",
                    steps=[
                        eligibility_step,
                        StepDetail(
                            step="Input Parsing",
                            score_impact=0,
                            details="No article text was provided, so URL-only analysis could not continue.",
                        ),
                    ],
                    article_class="UNKNOWN",
                    uncertainty=UncertaintyInfo(
                        reason_code="UNSUPPORTED_URL",
                        reason_message="This page does not look like a supported article page. Paste article text to run text-only analysis.",
                    ),
                    parse_metadata=ParseMetadata(
                        used_mode=req.input_mode,
                        detected_shape="unsupported_url",
                        headline_word_count=0,
                        body_word_count=0,
                        headline_source=None,
                    ),
                    model_outputs=_empty_model_outputs(0, 0),
                    conflict=ConflictInfo(is_conflict=False, threshold=0.80, raw_score_before_override=0),
                    fetch_metadata=fetch_metadata,
                    lime_model=None,
                    lime_input_text=None,
                )

    if len(text) < INPUT_TEXT_MIN_LEN and analysis_url:
        fetch_metadata.attempted = True
        try:
            extracted = fetch_and_extract(analysis_url)
            text = extracted.text.strip()
            title_candidates = extracted.title_candidates
            fetch_metadata.success = True
            fetch_metadata.status_code = extracted.status_code
            fetch_metadata.resolved_url = extracted.resolved_url
            fetch_metadata.error_type = None
        except ExtractionError as exc:
            source_res = model.check_source(analysis_url)
            final_score = int(source_res.get("score", 0))
            steps = [
                StepDetail(
                    step="Source Check",
                    score_impact=final_score,
                    details=str(source_res.get("reason", "Source check unavailable")),
                ),
                StepDetail(
                    step="URL Extraction",
                    score_impact=0,
                    details=exc.message,
                ),
            ]
            if eligibility_step:
                steps.insert(0, eligibility_step)
            return PredictResponse(
                final_score=final_score,
                verdict="UNCERTAIN",
                risk_level="Needs Review",
                steps=steps,
                article_class="UNKNOWN",
                uncertainty=UncertaintyInfo(
                    reason_code="FETCH_FAILED",
                    reason_message=(
                        "Unable to fetch article text from URL (paywall, timeout, access denied, or extraction failed)."
                    ),
                ),
                parse_metadata=ParseMetadata(
                    used_mode=req.input_mode,
                    detected_shape="url_only",
                    headline_word_count=0,
                    body_word_count=0,
                    headline_source=None,
                ),
                model_outputs=_empty_model_outputs(0, 0),
                conflict=ConflictInfo(is_conflict=False, threshold=0.80, raw_score_before_override=final_score),
                fetch_metadata=FetchMetadata(
                    attempted=True,
                    success=False,
                    status_code=exc.status_code,
                    error_type=exc.error_type,
                    resolved_url=exc.resolved_url,
                ),
                lime_model=None,
                lime_input_text=None,
            )

    if len(text) < INPUT_TEXT_MIN_LEN:
        source_res = model.check_source(analysis_url)
        final_score = int(source_res.get("score", 0))
        steps = [
            StepDetail(
                step="Source Check",
                score_impact=final_score,
                details=str(source_res.get("reason", "Source check unavailable")),
            ),
            StepDetail(
                step="Input Parsing",
                score_impact=0,
                details="Not enough text to perform model analysis.",
            ),
        ]
        if eligibility_step:
            steps.insert(0, eligibility_step)
        return PredictResponse(
            final_score=final_score,
            verdict="UNCERTAIN",
            risk_level="Needs Review",
            steps=steps,
            article_class="UNKNOWN",
            uncertainty=UncertaintyInfo(
                reason_code="INSUFFICIENT_TEXT",
                reason_message="Please provide more text or a valid article URL.",
            ),
            parse_metadata=ParseMetadata(
                used_mode=req.input_mode,
                detected_shape="insufficient",
                headline_word_count=0,
                body_word_count=0,
                headline_source=None,
            ),
            model_outputs=_empty_model_outputs(0, 0),
            conflict=ConflictInfo(is_conflict=False, threshold=0.80, raw_score_before_override=final_score),
            fetch_metadata=fetch_metadata,
            lime_model=None,
            lime_input_text=None,
        )

    try:
        report_dict = model.analyze(
            text,
            analysis_url,
            input_mode=req.input_mode,
            title_candidates=title_candidates,
        )
    except Exception as exc:
        print(f"Error during analysis: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))

    explanation_list: list[tuple[str, float]] | None = None
    explanation_html: str | None = None

    should_explain = False
    if req.explanation_mode == "force":
        should_explain = True
    elif req.explanation_mode == "auto" and report_dict.get("verdict") == "UNCERTAIN":
        should_explain = True

    lime_model = report_dict.get("lime_model")
    lime_input_text = (report_dict.get("lime_input_text") or "").strip()

    if should_explain and lime_model in {"A", "B"} and lime_input_text:
        predictor = model.model_article.predict_proba if lime_model == "B" else model.model_headline.predict_proba

        try:
            exp = explainer.explain_instance(
                lime_input_text,
                predictor,
                num_features=LIME_RAW_FEATURES,
                num_samples=100,
            )
            explanation_list = _filter_lime_features(exp.as_list())
            explanation_html = exp.as_html()
        except Exception as exc:
            print(f"LIME Error: {exc}")

    if eligibility_step:
        report_dict["steps"] = [eligibility_step, *report_dict["steps"]]

    return PredictResponse(
        final_score=report_dict["final_score"],
        verdict=report_dict["verdict"],
        risk_level=report_dict["risk_level"],
        steps=report_dict["steps"],
        explanation=explanation_list,
        explanation_html=explanation_html,
        article_class=report_dict.get("article_class"),
        uncertainty=report_dict.get("uncertainty"),
        parse_metadata=report_dict.get("parse_metadata"),
        model_outputs=report_dict.get("model_outputs"),
        conflict=report_dict.get("conflict"),
        fetch_metadata=fetch_metadata,
        lime_model=report_dict.get("lime_model"),
        lime_input_text=report_dict.get("lime_input_text"),
    )
