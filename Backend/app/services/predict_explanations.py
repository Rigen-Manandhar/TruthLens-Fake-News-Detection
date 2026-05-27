from __future__ import annotations

from app.config import LIME_NUM_SAMPLES_FORCE, LIME_RAW_FEATURES
from app.explanations import build_explanation_summary, filter_lime_features


def build_forced_lime_explanation(model, explainer, report_dict: dict):
    explanation_list: list[tuple[str, float]] | None = None
    explanation_html: str | None = None
    explanation_summary = None

    lime_model = report_dict.get("lime_model")
    lime_input_text = (report_dict.get("lime_input_text") or "").strip()

    if explainer is None or lime_model not in {"A", "B"} or not lime_input_text:
        return explanation_list, explanation_html, explanation_summary

    predictor = model.model_article.predict_proba if lime_model == "B" else model.model_headline.predict_proba

    try:
        exp = explainer.explain_instance(
            lime_input_text,
            predictor,
            num_features=LIME_RAW_FEATURES,
            num_samples=LIME_NUM_SAMPLES_FORCE,
        )
        explanation_list = filter_lime_features(exp.as_list())
        explanation_html = exp.as_html()
        explanation_summary = build_explanation_summary(explanation_list, lime_model)
    except Exception as exc:
        print(f"LIME Error: {exc}")

    return explanation_list, explanation_html, explanation_summary
