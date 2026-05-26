from __future__ import annotations

from urllib.parse import urlparse

from app.scoring import check_source


LIMITATION_TEXT = (
    "TruthLens supports review. It does not prove whether a claim is true or false, "
    "and language-model signals should be checked against reliable evidence."
)

def _domain_from_url(url: str | None) -> str | None:
    if not url:
        return None
    parsed = urlparse(url if url.startswith(("http://", "https://")) else f"https://{url}")
    host = (parsed.hostname or "").lower()
    if host.startswith("www."):
        host = host[4:]
    return host or None


def build_source_signal(url: str | None, source_db: list[dict]) -> dict:
    domain = _domain_from_url(url)
    result = check_source(url, source_db)
    details = result.get("details") if isinstance(result.get("details"), dict) else {}
    known = bool(details)

    return {
        "domain": domain,
        "known": known,
        "source_type": result.get("source_type"),
        "credibility": details.get("credibility"),
        "category": details.get("category"),
        "rationale": details.get("rationale") or result.get("reason"),
        "last_reviewed": details.get("last_reviewed"),
        "reference_url": details.get("reference_url"),
        "notes": details.get("notes"),
    }


def build_evidence_summary(text: str, url: str | None, source_db: list[dict]) -> dict:
    source_signal = build_source_signal(url, source_db)
    evidence_status = "SOURCE_ONLY" if source_signal["known"] else "NOT_CHECKED"

    return {
        "source_signal": source_signal,
        "evidence_status": evidence_status,
        "limitations": LIMITATION_TEXT,
    }
