from __future__ import annotations

from fastapi import HTTPException

from app.article_extractor import ExtractionError, fetch_and_extract
from app.config import INPUT_TEXT_MIN_LEN, LIME_RAW_FEATURES
from app.explanations import filter_lime_features
from app.schemas import (
    ConflictInfo,
    FetchMetadata,
    ModelOutputs,
    ParseMetadata,
    PredictRequest,
    PredictResponse,
    SingleModelOutput,
    StepDetail,
    UncertaintyInfo,
)
from app.url_eligibility import classify_url_eligibility


def _empty_model_outputs(headline_words: int = 0, body_words: int = 0) -> ModelOutputs:
    return ModelOutputs(
        model_a=SingleModelOutput(ran=False, input_word_count=headline_words),
        model_b=SingleModelOutput(ran=False, input_word_count=body_words),
    )


def build_predict_response(req: PredictRequest, model, explainer) -> PredictResponse:
    if model is None:
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

    if should_explain and explainer is not None and lime_model in {"A", "B"} and lime_input_text:
        predictor = model.model_article.predict_proba if lime_model == "B" else model.model_headline.predict_proba

        try:
            exp = explainer.explain_instance(
                lime_input_text,
                predictor,
                num_features=LIME_RAW_FEATURES,
                num_samples=100,
            )
            explanation_list = filter_lime_features(exp.as_list())
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
