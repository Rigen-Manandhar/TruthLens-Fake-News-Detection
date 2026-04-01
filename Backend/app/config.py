from __future__ import annotations

import os


INPUT_TEXT_MIN_LEN = 10
LIME_MAX_FEATURES = 20
LIME_RAW_FEATURES = 40
NEGATION_WORDS = {"no", "not", "nor", "never", "none", "without", "cannot", "can't", "won't", "n't"}


def get_cors_origins() -> list[str]:
    configured = os.getenv("BACKEND_CORS_ORIGINS", "").strip()
    if not configured:
        return ["http://localhost:3001"]

    origins = [origin.strip() for origin in configured.split(",") if origin.strip()]
    return origins or ["http://localhost:3001"]
