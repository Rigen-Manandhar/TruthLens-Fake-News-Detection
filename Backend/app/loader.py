from __future__ import annotations

from app.hybrid_model import HybridModelLoader


original_loader = None


def get_hybrid_model():
    global original_loader
    if original_loader is None:
        original_loader = HybridModelLoader()
    return original_loader
