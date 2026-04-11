from __future__ import annotations

from urllib.parse import urlparse


CONFLICT_EVIDENCE_THRESHOLD = 0.45
LOW_EVIDENCE_THRESHOLD = 0.30
MODEL_B_DOMINANCE_MARGIN = 0.40
MODEL_B_DOMINANCE_EVIDENCE = 0.60
VERDICT_SCORE_THRESHOLD = 0.95


def _round_score_impact(value: float) -> int:
    return int(round(value * 100))


def source_type_to_evidence(label: str | None) -> float:
    upper = (label or "").upper()
    if upper in {"FAKE", "SATIRE"}:
        return 0.90
    if upper == "BIASED":
        return 0.35
    if upper == "REAL":
        return -0.70
    return 0.0


def model_confidence_to_evidence(label: str | None, confidence: float | None) -> float:
    content_class = label_to_class(label or "")
    if content_class not in {"FAKE", "REAL"} or confidence is None:
        return 0.0

    scaled = max((float(confidence) - 0.5) / 0.5, 0.0)
    if scaled <= 0:
        return 0.0

    return scaled if content_class == "FAKE" else -scaled


def build_model_weights(run_a: bool, run_b: bool, body_word_count: int) -> tuple[float, float]:
    headline_weight = 0.0
    article_weight = 0.0

    if run_a and not run_b:
        headline_weight = 1.00
    elif run_b and not run_a:
        article_weight = 1.30 if body_word_count >= 160 else 1.15
    elif run_a and run_b:
        if body_word_count >= 160:
            headline_weight = 0.60
            article_weight = 1.30
        else:
            headline_weight = 0.75
            article_weight = 1.15

    return headline_weight, article_weight


def select_primary_model(run_a: bool, run_b: bool, body_word_count: int) -> str | None:
    if run_b and body_word_count >= 160:
        return "B"
    if run_b:
        return "B"
    if run_a:
        return "A"
    return None


def build_weighted_score(
    source_evidence: float,
    headline_evidence: float,
    body_evidence: float,
    headline_weight: float,
    article_weight: float,
) -> dict:
    headline_contribution = headline_weight * headline_evidence
    article_contribution = article_weight * body_evidence
    weighted_score = source_evidence + headline_contribution + article_contribution

    return {
        "source_score_impact": _round_score_impact(source_evidence),
        "headline_score_impact": _round_score_impact(headline_contribution),
        "article_score_impact": _round_score_impact(article_contribution),
        "weighted_score": weighted_score,
        "final_score": _round_score_impact(weighted_score),
        "headline_contribution": headline_contribution,
        "article_contribution": article_contribution,
    }


def check_source(url: str | None, source_db: list[dict]) -> dict:
    if not url:
        return {"score": 0, "evidence": 0.0, "reason": "No URL provided", "source_type": None}

    try:
        value = url if url.startswith(("http://", "https://")) else f"http://{url}"
        parsed = urlparse(value)
        domain = (parsed.netloc or "").lower()
        if domain.startswith("www."):
            domain = domain[4:]
        domain = domain.split(":", 1)[0]
    except Exception:
        return {"score": 0, "evidence": 0.0, "reason": "Invalid URL", "source_type": None}

    if not domain:
        return {"score": 0, "evidence": 0.0, "reason": "Invalid URL", "source_type": None}

    for entry in source_db:
        entry_domain = str(entry.get("domain", "")).lower().strip()
        if not entry_domain:
            continue
        if domain == entry_domain or domain.endswith(f".{entry_domain}"):
            label = str(entry.get("type", "")).upper()
            msg = f"Domain {domain} found: {label}"
            evidence = source_type_to_evidence(label)

            return {
                "score": _round_score_impact(evidence),
                "evidence": evidence,
                "reason": msg,
                "details": entry,
                "source_type": label,
            }

    return {"score": 0, "evidence": 0.0, "reason": "Domain not in database", "source_type": None}


def label_to_class(label: str) -> str:
    upper = (label or "").upper()
    if "FAKE" in upper or "FALSE" in upper or label == "1" or upper == "LABEL_1":
        return "FAKE"
    if "REAL" in upper or "TRUE" in upper or label == "0" or upper == "LABEL_0":
        return "REAL"
    return "UNKNOWN"


def build_uncertainty(reason_code: str | None, reason_message: str | None) -> dict:
    return {"reason_code": reason_code, "reason_message": reason_message}


def determine_model_runs(used_mode: str, headline_words: int, body_words: int, body_min_words: int):
    run_a = False
    run_b = False

    if used_mode == "headline_only":
        run_a = headline_words > 0
    elif used_mode == "full_article":
        run_b = body_words >= body_min_words
    elif used_mode == "headline_plus_article":
        run_a = headline_words > 0
        run_b = body_words >= body_min_words
    else:
        has_headline = headline_words > 0
        has_body = body_words >= body_min_words
        if has_headline and has_body:
            run_a = True
            run_b = True
        elif has_headline:
            run_a = True
        elif has_body:
            run_b = True

    return run_a, run_b


def resolve_verdict(
    weighted_score: float,
    run_a: bool,
    run_b: bool,
    headline_class: str,
    body_class: str,
    headline_evidence: float,
    body_evidence: float,
    headline_contribution: float,
    article_contribution: float,
    body_word_count: int,
) -> tuple[str, str, dict, dict]:
    if weighted_score >= VERDICT_SCORE_THRESHOLD:
        verdict = "SUSPICIOUS"
        risk_level = "High Risk"
    elif weighted_score <= -VERDICT_SCORE_THRESHOLD:
        verdict = "LIKELY REAL"
        risk_level = "Low Risk"
    else:
        verdict = "UNCERTAIN"
        risk_level = "Needs Review"

    uncertainty = build_uncertainty(None, None)
    conflict = {
        "is_conflict": False,
        "threshold": CONFLICT_EVIDENCE_THRESHOLD,
        "raw_score_before_override": _round_score_impact(weighted_score),
    }

    primary_model = select_primary_model(run_a, run_b, body_word_count)
    primary_evidence = body_evidence if primary_model == "B" else headline_evidence

    if (
        run_a
        and run_b
        and headline_class in {"FAKE", "REAL"}
        and body_class in {"FAKE", "REAL"}
        and headline_class != body_class
        and abs(headline_evidence) >= CONFLICT_EVIDENCE_THRESHOLD
        and abs(body_evidence) >= CONFLICT_EVIDENCE_THRESHOLD
    ):
        if not (
            body_word_count >= 160
            and abs(article_contribution) - abs(headline_contribution) >= MODEL_B_DOMINANCE_MARGIN
            and abs(body_evidence) >= MODEL_B_DOMINANCE_EVIDENCE
        ):
            conflict["is_conflict"] = True
            verdict = "UNCERTAIN"
            risk_level = "Needs Review"
            uncertainty = build_uncertainty(
                "CONFLICT",
                "Model A and Model B strongly disagree on this content.",
            )
    if not conflict["is_conflict"]:
        if abs(primary_evidence) < LOW_EVIDENCE_THRESHOLD:
            verdict = "UNCERTAIN"
            risk_level = "Needs Review"
            uncertainty = build_uncertainty(
                "LOW_CONFIDENCE",
                "The primary model evidence is below the reliability threshold.",
            )
        elif verdict == "UNCERTAIN":
            uncertainty = build_uncertainty(
                "LOW_CONFIDENCE",
                "Signals were mixed and require manual review.",
            )

    return verdict, risk_level, uncertainty, conflict
