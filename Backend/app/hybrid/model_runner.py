from __future__ import annotations


def select_lime_source(
    *,
    run_a: bool,
    run_b: bool,
    headline_text: str,
    body_text: str,
) -> tuple[str | None, str | None]:
    if run_b and body_text:
        return "B", body_text
    if run_a and headline_text:
        return "A", headline_text
    return None, None
