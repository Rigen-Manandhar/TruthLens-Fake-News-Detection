from __future__ import annotations

from dataclasses import dataclass
from urllib.parse import urlparse


UNSUPPORTED_HOST_SUFFIXES = (
    "youtube.com",
    "google.com",
    "gmail.com",
    "facebook.com",
    "instagram.com",
    "x.com",
    "twitter.com",
    "tiktok.com",
    "linkedin.com",
    "reddit.com",
    "pinterest.com",
    "mail.yahoo.com",
    "docs.google.com",
    "drive.google.com",
)

UNSUPPORTED_EXACT_PATHS = {
    "/",
    "/feed",
    "/shorts",
    "/search",
    "/results",
    "/explore",
    "/home",
    "/channel",
    "/login",
    "/signin",
    "/signup",
    "/settings",
    "/profile",
    "/account",
}

UNSUPPORTED_PREFIXES = (
    "/feed/",
    "/search/",
    "/results/",
    "/explore/",
    "/home/",
    "/channel/",
    "/login/",
    "/signin/",
    "/signup/",
    "/settings/",
    "/profile/",
    "/account/",
)

UNSUPPORTED_SPECIAL_PREFIXES = (
    "/watch",
    "/@",
)


@dataclass(frozen=True)
class UrlEligibility:
    is_supported: bool
    normalized_url: str | None
    reason_code: str
    reason_message: str


def _normalize_path(path: str) -> str:
    normalized = (path or "").strip()
    if not normalized:
        return "/"
    if not normalized.startswith("/"):
        normalized = f"/{normalized}"
    if len(normalized) > 1 and normalized.endswith("/"):
        normalized = normalized[:-1]
    return normalized or "/"


def _is_unsupported_host(hostname: str) -> bool:
    host = (hostname or "").strip().lower()
    if not host:
        return False
    if host.startswith("www."):
        host = host[4:]

    return any(host == suffix or host.endswith(f".{suffix}") for suffix in UNSUPPORTED_HOST_SUFFIXES)


def _looks_like_article_path(path: str) -> bool:
    normalized = _normalize_path(path)
    if normalized == "/":
        return False
    if normalized in UNSUPPORTED_EXACT_PATHS:
        return False
    if normalized.startswith(UNSUPPORTED_SPECIAL_PREFIXES):
        return False
    if any(normalized.startswith(prefix) for prefix in UNSUPPORTED_PREFIXES):
        return False

    segments = [segment for segment in normalized.split("/") if segment]
    if len(segments) >= 2:
        return True

    segment = segments[0] if segments else ""
    if len(segment) >= 16 and ("-" in segment or "_" in segment):
        return True

    return False


def classify_url_eligibility(url: str | None) -> UrlEligibility:
    candidate = (url or "").strip()
    if not candidate:
        return UrlEligibility(
            is_supported=False,
            normalized_url=None,
            reason_code="MISSING_URL",
            reason_message="No page URL was provided.",
        )

    parsed = urlparse(candidate)
    if parsed.scheme.lower() not in {"http", "https"}:
        return UrlEligibility(
            is_supported=False,
            normalized_url=None,
            reason_code="UNSUPPORTED_SCHEME",
            reason_message="Only regular web page URLs can be analyzed automatically.",
        )

    hostname = (parsed.hostname or "").strip().lower()
    if not hostname:
        return UrlEligibility(
            is_supported=False,
            normalized_url=None,
            reason_code="INVALID_HOST",
            reason_message="The page URL is missing a valid hostname.",
        )

    normalized_url = parsed.geturl()
    path = _normalize_path(parsed.path)

    if _is_unsupported_host(hostname):
        return UrlEligibility(
            is_supported=False,
            normalized_url=normalized_url,
            reason_code="UNSUPPORTED_HOST",
            reason_message="This site is treated as a non-article platform, so its page URL is ignored.",
        )

    if not _looks_like_article_path(path):
        return UrlEligibility(
            is_supported=False,
            normalized_url=normalized_url,
            reason_code="UNSUPPORTED_PATH",
            reason_message="This page URL does not look like an article page, so it is ignored.",
        )

    return UrlEligibility(
        is_supported=True,
        normalized_url=normalized_url,
        reason_code="SUPPORTED",
        reason_message="This page URL looks eligible for article analysis.",
    )
