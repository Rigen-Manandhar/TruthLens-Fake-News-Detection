from __future__ import annotations

from fastapi import HTTPException

from app.article_extractor import ExtractionError, fetch_and_extract
from app.config import INPUT_TEXT_MIN_WORDS
from app.evidence import build_evidence_summary
from app.parsing import HEADLINE_MAX_CHARS, word_count
from app.schemas import (
    FetchMetadata,
    PredictRequest,
    PredictResponse,
    StepDetail,
)
from app.services.predict_explanations import build_forced_lime_explanation
from app.services.predict_response_builders import build_uncertain_response
from app.url_eligibility import classify_url_eligibility


def build_predict_response(req: PredictRequest, model, explainer) -> PredictResponse:
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")

    text = (req.text or "").strip()
    pasted_text = text
    original_url = (req.url or "").strip() or None
    analysis_url = original_url
    source_db = getattr(model, "source_db", [])
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

            if word_count(text) >= INPUT_TEXT_MIN_WORDS:
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
                return build_uncertain_response(
                    final_score=0,
                    steps=[
                        eligibility_step,
                        StepDetail(
                            step="Input Parsing",
                            score_impact=0,
                            details="Text too short for a proper review. Paste article text to run text-only analysis.",
                        ),
                    ],
                    reason_code="UNSUPPORTED_URL",
                    reason_message="This page does not look like a supported article page. Paste article text to run text-only analysis.",
                    used_mode=req.input_mode,
                    detected_shape="unsupported_url",
                    headline_word_count=0,
                    body_word_count=0,
                    headline_source=None,
                    fetch_metadata=fetch_metadata,
                    evidence_summary=build_evidence_summary(text, original_url, source_db),
                )

    if req.input_mode == "headline_only" and pasted_text and len(pasted_text) > HEADLINE_MAX_CHARS:
        source_res = model.check_source(analysis_url)
        final_score = int(source_res.get("score", 0))
        headline_words = word_count(pasted_text)
        steps = [
            StepDetail(
                step="Source Check",
                score_impact=final_score,
                details=str(source_res.get("reason", "Source check unavailable")),
            ),
            StepDetail(
                step="Input Parsing",
                score_impact=0,
                details=(
                    "Headline-only input is too long for Model A. "
                    f"Maximum length is {HEADLINE_MAX_CHARS} characters."
                ),
            ),
        ]
        if eligibility_step:
            steps.insert(0, eligibility_step)
        return build_uncertain_response(
            final_score=final_score,
            steps=steps,
            reason_code="INPUT_TOO_LONG",
            reason_message=(
                "Headline-only mode expects a short headline or claim. "
                f"Please keep the pasted text within {HEADLINE_MAX_CHARS} characters "
                "or switch to Full article / Auto assess."
            ),
            used_mode=req.input_mode,
            detected_shape="headline_too_long",
            headline_word_count=headline_words,
            body_word_count=0,
            headline_source=None,
            fetch_metadata=fetch_metadata,
            evidence_summary=build_evidence_summary(pasted_text, analysis_url, source_db),
        )

    if word_count(text) < INPUT_TEXT_MIN_WORDS and analysis_url:
        fetch_metadata.attempted = True
        try:
            extracted = fetch_and_extract(analysis_url)
            text = extracted.text.strip()
            title_candidates = extracted.title_candidates
            fetch_metadata.success = True
            fetch_metadata.status_code = extracted.status_code
            fetch_metadata.resolved_url = extracted.resolved_url
            fetch_metadata.error_type = None
            if word_count(text) < INPUT_TEXT_MIN_WORDS:
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
                        details="Text too short for a proper review. The article was retrieved but does not contain enough analyzable text.",
                    ),
                ]
                if eligibility_step:
                    steps.insert(0, eligibility_step)
                return build_uncertain_response(
                    final_score=final_score,
                    steps=steps,
                    reason_code="INSUFFICIENT_TEXT",
                    reason_message=(
                        "Text too short for a proper review. "
                        "The article was retrieved but does not contain enough text. "
                        "Please paste the full article text manually."
                    ),
                    used_mode=req.input_mode,
                    detected_shape="insufficient",
                    headline_word_count=0,
                    body_word_count=0,
                    headline_source=None,
                    fetch_metadata=fetch_metadata,
                    evidence_summary=build_evidence_summary(text, analysis_url, source_db),
                )
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
            return build_uncertain_response(
                final_score=final_score,
                steps=steps,
                reason_code="FETCH_FAILED",
                reason_message=(
                    "Unable to fetch article text from URL (paywall, timeout, access denied, or extraction failed)."
                ),
                used_mode=req.input_mode,
                detected_shape="url_only",
                headline_word_count=0,
                body_word_count=0,
                headline_source=None,
                fetch_metadata=FetchMetadata(
                    attempted=True,
                    success=False,
                    status_code=exc.status_code,
                    error_type=exc.error_type,
                    resolved_url=exc.resolved_url,
                ),
                evidence_summary=build_evidence_summary(text, analysis_url, source_db),
            )

    if word_count(text) < INPUT_TEXT_MIN_WORDS:
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
                details="Text too short for a proper review. Please provide more text or a valid article URL.",
            ),
        ]
        if eligibility_step:
            steps.insert(0, eligibility_step)
        return build_uncertain_response(
            final_score=final_score,
            steps=steps,
            reason_code="INSUFFICIENT_TEXT",
            reason_message=(
                "Text too short for a proper review. "
                "Please provide more text or a valid article URL."
            ),
            used_mode=req.input_mode,
            detected_shape="insufficient",
            headline_word_count=0,
            body_word_count=0,
            headline_source=None,
            fetch_metadata=fetch_metadata,
            evidence_summary=build_evidence_summary(text, analysis_url, source_db),
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

    should_explain = req.explanation_mode == "force"
    explanation_list, explanation_html, explanation_summary = (
        build_forced_lime_explanation(model, explainer, report_dict)
        if should_explain
        else (None, None, None)
    )

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
        evidence_summary=build_evidence_summary(text, analysis_url, source_db),
        explanation_summary=explanation_summary,
        lime_model=report_dict.get("lime_model"),
        lime_input_text=report_dict.get("lime_input_text"),
    )
