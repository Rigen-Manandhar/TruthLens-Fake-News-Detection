from __future__ import annotations


def build_initial_model_outputs(headline_words: int, body_words: int) -> dict:
    return {
        "model_a": {
            "ran": False,
            "label": None,
            "confidence": None,
            "score_impact": 0,
            "input_word_count": headline_words,
        },
        "model_b": {
            "ran": False,
            "label": None,
            "confidence": None,
            "score_impact": 0,
            "input_word_count": body_words,
        },
    }


def set_model_output(
    model_outputs: dict,
    *,
    key: str,
    label: str | None,
    confidence: float | None,
    score_impact: int,
    input_word_count: int,
):
    model_outputs[key] = {
        "ran": True,
        "label": label,
        "confidence": confidence,
        "score_impact": score_impact,
        "input_word_count": input_word_count,
    }
