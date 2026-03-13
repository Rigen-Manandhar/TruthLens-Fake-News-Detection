from __future__ import annotations

from urllib.parse import urlparse


CONFLICT_CONFIDENCE_THRESHOLD = 0.80
LOW_CONFIDENCE_THRESHOLD = 0.65


def check_source(url: str | None, source_db: list[dict]) -> dict:
    if not url:
        return {"score": 0, "reason": "No URL provided"}

    try:
        value = url if url.startswith(("http://", "https://")) else f"http://{url}"
        parsed = urlparse(value)
        domain = (parsed.netloc or "").lower()
        if domain.startswith("www."):
            domain = domain[4:]
        domain = domain.split(":", 1)[0]
    except Exception:
        return {"score": 0, "reason": "Invalid URL"}

    if not domain:
        return {"score": 0, "reason": "Invalid URL"}

    for entry in source_db:
        entry_domain = str(entry.get("domain", "")).lower().strip()
        if not entry_domain:
            continue
        if domain == entry_domain or domain.endswith(f".{entry_domain}"):
            score = 0
            label = str(entry.get("type", "")).upper()
            msg = f"Domain {domain} found: {label}"

            if label in {"FAKE", "SATIRE"}:
                score = 3
            elif label == "BIASED":
                score = 1
            elif label == "REAL":
                score = -2

            return {"score": score, "reason": msg, "details": entry}

    return {"score": 0, "reason": "Domain not in database"}


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
    total_score: int,
    run_a: bool,
    run_b: bool,
    headline_class: str,
    body_class: str,
    headline_conf: float | None,
    body_conf: float | None,
) -> tuple[str, str, dict, dict]:
    if total_score >= 2:
        verdict = "SUSPICIOUS"
        risk_level = "High Risk"
    elif total_score <= -2:
        verdict = "LIKELY REAL"
        risk_level = "Low Risk"
    else:
        verdict = "UNCERTAIN"
        risk_level = "Needs Review"

    uncertainty = build_uncertainty(None, None)
    conflict = {
        "is_conflict": False,
        "threshold": CONFLICT_CONFIDENCE_THRESHOLD,
        "raw_score_before_override": total_score,
    }

    if (
        run_a
        and run_b
        and headline_class in {"FAKE", "REAL"}
        and body_class in {"FAKE", "REAL"}
        and headline_class != body_class
        and headline_conf is not None
        and body_conf is not None
        and headline_conf >= CONFLICT_CONFIDENCE_THRESHOLD
        and body_conf >= CONFLICT_CONFIDENCE_THRESHOLD
    ):
        conflict["is_conflict"] = True
        verdict = "UNCERTAIN"
        risk_level = "Needs Review"
        uncertainty = build_uncertainty(
            "CONFLICT",
            "Model A and Model B strongly disagree on this content.",
        )
    else:
        primary_conf = body_conf if run_b else headline_conf
        if primary_conf is not None and primary_conf < LOW_CONFIDENCE_THRESHOLD:
            verdict = "UNCERTAIN"
            risk_level = "Needs Review"
            uncertainty = build_uncertainty(
                "LOW_CONFIDENCE",
                "The primary model confidence is below the reliability threshold.",
            )
        elif verdict == "UNCERTAIN":
            uncertainty = build_uncertainty(
                "LOW_CONFIDENCE",
                "Signals were mixed and require manual review.",
            )

    return verdict, risk_level, uncertainty, conflict
