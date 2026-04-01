from __future__ import annotations

import re
from typing import TYPE_CHECKING

from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS

from app.config import LIME_MAX_FEATURES, NEGATION_WORDS

if TYPE_CHECKING:
    from lime.lime_text import LimeTextExplainer
else:
    LimeTextExplainer = object


def create_text_explainer():
    try:
        from lime.lime_text import LimeTextExplainer as LimeExplainer
    except ModuleNotFoundError:
        return None

    return LimeExplainer(class_names=["Real", "Fake"])


def _is_stopword_feature(term: str) -> bool:
    words = re.findall(r"[a-zA-Z]+'?[a-zA-Z]*", term.lower())
    if not words:
        return False

    if any(word in NEGATION_WORDS for word in words):
        return False

    return all(word in ENGLISH_STOP_WORDS for word in words)


def filter_lime_features(features: list[tuple[str, float]]) -> list[tuple[str, float]]:
    filtered = [item for item in features if not _is_stopword_feature(item[0])]
    return filtered[:LIME_MAX_FEATURES]
