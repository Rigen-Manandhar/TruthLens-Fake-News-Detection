from __future__ import annotations

import re


HEADLINE_ONLY_WORD_CUTOFF = 30
BODY_MIN_WORDS_FOR_B = 80

_DASH_CLASS = r"(?:-|\u2013|\u2014|:)"
_LEADING_CITY = r"[A-Z][A-Za-z\s,\.\-']{2,80}"
_LEADING_ALL_CAPS = r"[A-Z][A-Z\s,\.\-']{2,80}"
_AGENCY = r"(Reuters|AP|AFP)"

DATELINE_PATTERNS = [
    re.compile(rf"^{_LEADING_ALL_CAPS}\({_AGENCY}\)\s*{_DASH_CLASS}", re.IGNORECASE),
    re.compile(
        rf"^{_LEADING_CITY},\s*{_LEADING_CITY}\({_AGENCY}\)\s*{_DASH_CLASS}",
        re.IGNORECASE,
    ),
    re.compile(rf"^{_AGENCY}\s*{_DASH_CLASS}", re.IGNORECASE),
]

DATELINE_PREFIX_PATTERNS = [
    re.compile(rf"^{_LEADING_ALL_CAPS}\({_AGENCY}\)\s*{_DASH_CLASS}\s*", re.IGNORECASE),
    re.compile(
        rf"^{_LEADING_CITY},\s*{_LEADING_CITY}\({_AGENCY}\)\s*{_DASH_CLASS}\s*",
        re.IGNORECASE,
    ),
    re.compile(rf"^{_AGENCY}\s*{_DASH_CLASS}\s*", re.IGNORECASE),
]

DELIMITER_PATTERN = re.compile(r"\s(?:\u2014|\||:)\s")


def normalize_ws(text: str) -> str:
    return " ".join((text or "").strip().split())


def word_count(text: str | None) -> int:
    if not text:
      return 0
    return len(re.findall(r"\b\w+\b", text))


def truncate_words(text: str, limit: int) -> str:
    words = (text or "").split()
    if len(words) <= limit:
        return " ".join(words)
    return " ".join(words[:limit]).strip()


def is_dateline_like(text: str) -> bool:
    sample = (text or "").strip()
    if not sample:
        return False
    return any(pattern.match(sample) for pattern in DATELINE_PATTERNS)


def strip_dateline_prefix(text: str) -> str:
    stripped = (text or "").strip()
    if not stripped:
        return ""

    for pattern in DATELINE_PREFIX_PATTERNS:
        stripped = pattern.sub("", stripped, count=1)

    return normalize_ws(stripped)


def is_plausible_headline(text: str) -> bool:
    sample = normalize_ws(text)
    words = word_count(sample)
    if words < 4 or words > 35:
        return False
    if len(sample) > 220:
        return False
    if sample.endswith((";", ",")):
        return False
    return True


def delimiter_candidate(text: str) -> str | None:
    sample = normalize_ws(text)
    if not sample:
        return None

    delimiter_match = DELIMITER_PATTERN.search(sample)
    if delimiter_match:
        candidate = sample[: delimiter_match.start()].strip()
        words = word_count(candidate)
        if 8 <= words <= 15:
            return candidate

    words = sample.split()
    if len(words) >= 8:
        return " ".join(words[:15])

    return None


def build_headline_candidates(
    text: str,
    lines: list[str],
    paragraphs: list[str],
    title_candidates: list[str] | None,
) -> list[tuple[str, str]]:
    candidates: list[tuple[str, str]] = []
    seen: set[str] = set()

    def add_candidate(value: str, source: str):
        normalized = normalize_ws(value)
        if not normalized:
            return
        key = normalized.lower()
        if key in seen:
            return
        seen.add(key)
        candidates.append((normalized, source))

    for candidate in title_candidates or []:
        add_candidate(candidate, "explicit_title")

    if lines:
        add_candidate(lines[0], "first_line")

    if paragraphs:
        add_candidate(paragraphs[0], "first_paragraph")

    first_sentence = re.split(r"(?<=[.!?])\s+", normalize_ws(text), maxsplit=1)[0].strip()
    if first_sentence and word_count(first_sentence) <= 20:
        add_candidate(first_sentence, "first_sentence")

    delimiter = delimiter_candidate(text)
    if delimiter:
        add_candidate(delimiter, "delimiter_chunk")

    return candidates


def select_headline(candidates: list[tuple[str, str]]) -> tuple[str | None, str | None]:
    for candidate, source in candidates:
        if is_dateline_like(candidate):
            stripped = strip_dateline_prefix(candidate)
            if stripped and is_plausible_headline(stripped) and not is_dateline_like(stripped):
                return stripped, f"{source}_dateline_stripped"
            continue

        if is_plausible_headline(candidate):
            return candidate, source

    return None, None


def extract_body(text: str, headline: str | None, headline_source: str | None) -> str:
    cleaned_text = (text or "").strip()
    if not cleaned_text:
        return ""
    if not headline:
        return cleaned_text

    lines = [line.strip() for line in cleaned_text.splitlines() if line.strip()]
    paragraphs = [paragraph.strip() for paragraph in re.split(r"\n\s*\n+", cleaned_text) if paragraph.strip()]

    if headline_source in {"first_line", "first_line_dateline_stripped"} and len(lines) > 1:
        return "\n".join(lines[1:]).strip()

    if headline_source in {"first_paragraph", "first_paragraph_dateline_stripped"} and len(paragraphs) > 1:
        return "\n\n".join(paragraphs[1:]).strip()

    lowered_text = cleaned_text.lower()
    lowered_headline = headline.lower()
    if lowered_text.startswith(lowered_headline):
        trimmed = cleaned_text[len(headline) :].lstrip(" \n\t-|:\u2013\u2014")
        return trimmed.strip()

    return cleaned_text


def parse_input(
    text: str,
    input_mode: str = "auto",
    title_candidates: list[str] | None = None,
) -> dict:
    cleaned_text = (text or "").strip()
    lines = [line.strip() for line in cleaned_text.splitlines() if line.strip()]
    paragraphs = [paragraph.strip() for paragraph in re.split(r"\n\s*\n+", cleaned_text) if paragraph.strip()]

    normalized_mode = (input_mode or "auto").lower()
    if normalized_mode not in {"auto", "headline_only", "full_article", "headline_plus_article"}:
        normalized_mode = "auto"

    total_words = word_count(cleaned_text)
    if len(paragraphs) > 1:
        detected_shape = "multi_paragraph"
    elif len(lines) > 1:
        detected_shape = "line_breaks"
    elif total_words <= HEADLINE_ONLY_WORD_CUTOFF:
        detected_shape = "short_single_block"
    else:
        detected_shape = "single_block"

    candidates = build_headline_candidates(cleaned_text, lines, paragraphs, title_candidates)
    selected_headline, headline_source = select_headline(candidates)
    extracted_body = extract_body(cleaned_text, selected_headline, headline_source)

    headline_text: str | None = None
    body_text: str | None = None

    if normalized_mode == "headline_only":
        headline_text = selected_headline or truncate_words(cleaned_text, HEADLINE_ONLY_WORD_CUTOFF)
    elif normalized_mode == "full_article":
        body_text = cleaned_text
    elif normalized_mode == "headline_plus_article":
        headline_text = selected_headline
        body_text = extracted_body or cleaned_text
        if headline_text and body_text and body_text.strip().lower() == headline_text.strip().lower():
            body_text = cleaned_text
    else:
        if detected_shape == "short_single_block":
            headline_text = selected_headline or truncate_words(cleaned_text, HEADLINE_ONLY_WORD_CUTOFF)
        else:
            headline_text = selected_headline
            if headline_text:
                body_text = extracted_body
                if body_text and body_text.strip().lower() == headline_text.strip().lower():
                    body_text = None
            else:
                body_text = cleaned_text

    headline_text = normalize_ws(headline_text or "")
    body_text = (body_text or "").strip()

    return {
        "used_mode": normalized_mode,
        "detected_shape": detected_shape,
        "headline_text": headline_text or None,
        "body_text": body_text or None,
        "headline_source": headline_source,
        "headline_word_count": word_count(headline_text),
        "body_word_count": word_count(body_text),
    }
