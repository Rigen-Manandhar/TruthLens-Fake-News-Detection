from __future__ import annotations

import os
import re
from urllib.parse import urlparse

import httpx

from app.scoring import check_source


LIMITATION_TEXT = (
    "TruthLens supports review. It does not prove whether a claim is true or false, "
    "and language-model signals should be checked against reliable evidence."
)

FACTUAL_VERBS = {
    "announced",
    "approved",
    "banned",
    "caused",
    "confirmed",
    "declared",
    "denied",
    "found",
    "reported",
    "said",
    "signed",
    "warned",
}


def _sentence_split(text: str) -> list[str]:
    normalized = " ".join((text or "").strip().split())
    if not normalized:
        return []

    return [
        sentence.strip()
        for sentence in re.split(r"(?<=[.!?])\s+", normalized)
        if sentence.strip()
    ]


def _claim_score(sentence: str, index: int) -> int:
    score = max(0, 4 - index)
    if re.search(r"\b\d{2,4}\b|\$|%|\b\d+(?:\.\d+)?\b", sentence):
        score += 4
    if re.search(r'"[^"]+"|\'[^\']+\'', sentence):
        score += 3
    if re.search(r"\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,}\b", sentence):
        score += 3
    lowered = sentence.lower()
    if any(re.search(rf"\b{re.escape(verb)}\b", lowered) for verb in FACTUAL_VERBS):
        score += 2
    if 8 <= len(sentence.split()) <= 45:
        score += 2
    return score


def extract_claim_hints(text: str, limit: int = 3) -> list[str]:
    candidates = []
    for index, sentence in enumerate(_sentence_split(text)[:12]):
        words = sentence.split()
        if len(words) < 5:
            continue
        candidates.append((_claim_score(sentence, index), index, sentence[:280]))

    candidates.sort(key=lambda item: (-item[0], item[1]))
    return [sentence for _, _, sentence in candidates[:limit]]


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


def _trusted_domains(source_db: list[dict]) -> list[str]:
    domains = []
    for entry in source_db:
        if str(entry.get("type", "")).upper() == "REAL" and entry.get("domain"):
            domains.append(str(entry["domain"]).strip().lower())
    return sorted(set(domains))


def build_coverage_signal(claim_hints: list[str], source_db: list[dict]) -> dict:
    api_key = os.getenv("NEWS_API_KEY", "").strip()
    if not api_key:
        return {
            "checked": False,
            "status": "NOT_CONFIGURED",
            "query": None,
            "trusted_match_count": 0,
            "total_results": None,
            "matched_sources": [],
            "message": "NEWS_API_KEY is not configured, so trusted-source coverage was not checked.",
        }

    if not claim_hints:
        return {
            "checked": False,
            "status": "NO_CLAIMS",
            "query": None,
            "trusted_match_count": 0,
            "total_results": None,
            "matched_sources": [],
            "message": "No clear factual claim hints were extracted for coverage checking.",
        }

    query = claim_hints[0][:180]
    trusted_domains = _trusted_domains(source_db)

    params = {
        "q": query,
        "language": "en",
        "pageSize": "10",
        "sortBy": "relevancy",
        "apiKey": api_key,
    }
    if trusted_domains:
        params["domains"] = ",".join(trusted_domains[:20])

    try:
        response = httpx.get("https://newsapi.org/v2/everything", params=params, timeout=6.0)
        response.raise_for_status()
        payload = response.json()
    except Exception as exc:
        return {
            "checked": True,
            "status": "ERROR",
            "query": query,
            "trusted_match_count": 0,
            "total_results": None,
            "matched_sources": [],
            "message": f"Coverage check failed: {exc}",
        }

    articles = payload.get("articles") if isinstance(payload, dict) else []
    matched_sources: list[str] = []
    if isinstance(articles, list):
        for article in articles:
            source = article.get("source") if isinstance(article, dict) else None
            name = source.get("name") if isinstance(source, dict) else None
            if isinstance(name, str) and name and name not in matched_sources:
                matched_sources.append(name)

    trusted_match_count = len(matched_sources)
    status = "SUPPORTED_HINTS_FOUND" if trusted_match_count > 0 else "NO_COVERAGE_FOUND"
    return {
        "checked": True,
        "status": status,
        "query": query,
        "trusted_match_count": trusted_match_count,
        "total_results": payload.get("totalResults") if isinstance(payload, dict) else None,
        "matched_sources": matched_sources[:5],
        "message": (
            "Trusted-source coverage was found for a claim hint. This supports review but does not prove truth."
            if trusted_match_count > 0
            else "No trusted-source coverage was found for the top claim hint."
        ),
    }


def build_evidence_summary(text: str, url: str | None, source_db: list[dict]) -> dict:
    claim_hints = extract_claim_hints(text)
    source_signal = build_source_signal(url, source_db)
    coverage_signal = build_coverage_signal(claim_hints, source_db)

    if coverage_signal["status"] == "SUPPORTED_HINTS_FOUND":
        evidence_status = "SUPPORTED_HINTS_FOUND"
    elif coverage_signal["status"] == "NO_COVERAGE_FOUND":
        evidence_status = "NO_COVERAGE_FOUND"
    elif source_signal["known"]:
        evidence_status = "SOURCE_ONLY"
    else:
        evidence_status = "NOT_CHECKED"

    return {
        "claim_hints": claim_hints,
        "source_signal": source_signal,
        "coverage_signal": coverage_signal,
        "evidence_status": evidence_status,
        "limitations": LIMITATION_TEXT,
    }
