from __future__ import annotations

import ipaddress
import socket
from dataclasses import dataclass
from html.parser import HTMLParser
from urllib.parse import urlparse

import httpx
import trafilatura


USER_AGENT = "TruthLensBot/1.0 (+https://truthlens.local)"


@dataclass
class ExtractionResult:
    text: str
    title_candidates: list[str]
    status_code: int | None
    resolved_url: str | None


class ExtractionError(Exception):
    def __init__(
        self,
        *,
        error_type: str,
        message: str,
        status_code: int | None = None,
        resolved_url: str | None = None,
    ):
        super().__init__(message)
        self.error_type = error_type
        self.message = message
        self.status_code = status_code
        self.resolved_url = resolved_url


class _TitleCandidateParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.candidates: list[str] = []
        self._in_title = False
        self._in_h1 = False
        self._buffer: list[str] = []

    def handle_starttag(self, tag: str, attrs):
        attrs_map = {str(k).lower(): (str(v) if v is not None else "") for k, v in attrs}
        tag = tag.lower()

        if tag == "meta":
            property_name = attrs_map.get("property", "").lower()
            name = attrs_map.get("name", "").lower()
            if property_name in {"og:title"} or name in {"twitter:title"}:
                self._add_candidate(attrs_map.get("content", ""))
            return

        if tag == "title":
            self._in_title = True
            self._buffer = []
            return

        if tag == "h1":
            self._in_h1 = True
            self._buffer = []

    def handle_endtag(self, tag: str):
        tag = tag.lower()
        if tag == "title" and self._in_title:
            self._in_title = False
            self._add_candidate("".join(self._buffer))
            self._buffer = []
            return

        if tag == "h1" and self._in_h1:
            self._in_h1 = False
            self._add_candidate("".join(self._buffer))
            self._buffer = []

    def handle_data(self, data: str):
        if self._in_title or self._in_h1:
            self._buffer.append(data)

    def _add_candidate(self, value: str):
        candidate = " ".join(value.strip().split())
        if not candidate:
            return
        if candidate not in self.candidates:
            self.candidates.append(candidate)


def _normalize_url(url: str) -> str:
    candidate = (url or "").strip()
    if not candidate:
        raise ExtractionError(error_type="INVALID_URL", message="URL is required for extraction.")

    parsed = urlparse(candidate)
    if not parsed.scheme:
        candidate = f"https://{candidate}"
        parsed = urlparse(candidate)

    if parsed.scheme not in {"http", "https"}:
        raise ExtractionError(
            error_type="INVALID_URL",
            message="Only http/https URLs are supported.",
        )

    if not parsed.hostname:
        raise ExtractionError(error_type="INVALID_URL", message="Invalid URL hostname.")

    return candidate


def _is_disallowed_host(host: str) -> bool:
    blocked = {"localhost", "127.0.0.1", "::1", "0.0.0.0"}
    host_lower = host.lower()
    if host_lower in blocked:
        return True
    if host_lower.endswith(".local"):
        return True
    return False


def _enforce_public_host(url: str):
    parsed = urlparse(url)
    host = parsed.hostname
    if not host:
        raise ExtractionError(error_type="INVALID_URL", message="Invalid URL hostname.")

    if _is_disallowed_host(host):
        raise ExtractionError(
            error_type="BLOCKED_HOST",
            message="Blocked URL host for security reasons.",
            resolved_url=url,
        )

    try:
        records = socket.getaddrinfo(host, parsed.port or (443 if parsed.scheme == "https" else 80))
    except socket.gaierror as exc:
        raise ExtractionError(
            error_type="DNS_ERROR",
            message="Could not resolve URL hostname.",
            resolved_url=url,
        ) from exc

    for record in records:
        ip_raw = record[4][0]
        try:
            ip_obj = ipaddress.ip_address(ip_raw)
        except ValueError:
            continue

        if (
            ip_obj.is_private
            or ip_obj.is_loopback
            or ip_obj.is_link_local
            or ip_obj.is_multicast
            or ip_obj.is_reserved
            or ip_obj.is_unspecified
        ):
            raise ExtractionError(
                error_type="BLOCKED_IP",
                message="Resolved URL points to a non-public IP address.",
                resolved_url=url,
            )


def _extract_title_candidates(html: str) -> list[str]:
    parser = _TitleCandidateParser()
    parser.feed(html)
    parser.close()
    return parser.candidates[:5]


def fetch_and_extract(url: str) -> ExtractionResult:
    normalized_url = _normalize_url(url)
    _enforce_public_host(normalized_url)

    timeout = httpx.Timeout(connect=5.0, read=8.0, write=8.0, pool=5.0)

    try:
        with httpx.Client(
            follow_redirects=True,
            timeout=timeout,
            max_redirects=5,
            headers={"User-Agent": USER_AGENT},
        ) as client:
            response = client.get(normalized_url)
    except httpx.TimeoutException as exc:
        raise ExtractionError(
            error_type="TIMEOUT",
            message="Timed out while fetching the article URL.",
            resolved_url=normalized_url,
        ) from exc
    except httpx.HTTPError as exc:
        raise ExtractionError(
            error_type="NETWORK_ERROR",
            message="Failed to fetch article URL.",
            resolved_url=normalized_url,
        ) from exc

    resolved_url = str(response.url)
    _enforce_public_host(resolved_url)

    if response.status_code >= 400:
        raise ExtractionError(
            error_type="HTTP_ERROR",
            message=f"Source returned HTTP {response.status_code}.",
            status_code=response.status_code,
            resolved_url=resolved_url,
        )

    html = response.text or ""
    extracted = trafilatura.extract(
        html,
        include_comments=False,
        include_tables=False,
        favor_precision=True,
    )

    text = (extracted or "").strip()
    if len(text.split()) < 20:
        raise ExtractionError(
            error_type="NO_CONTENT",
            message="Could not extract enough article text from URL.",
            status_code=response.status_code,
            resolved_url=resolved_url,
        )

    title_candidates = _extract_title_candidates(html)

    return ExtractionResult(
        text=text,
        title_candidates=title_candidates,
        status_code=response.status_code,
        resolved_url=resolved_url,
    )
