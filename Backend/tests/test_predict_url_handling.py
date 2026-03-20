from __future__ import annotations

import sys
import unittest
from pathlib import Path


REPO_BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_BACKEND_ROOT))

import app.main as main_module


class DummyModel:
    def __init__(self):
        self.calls: list[tuple[str, str | None]] = []

    def analyze(self, text, url, input_mode="auto", title_candidates=None):
        self.calls.append((text, url))
        return {
            "final_score": -2,
            "verdict": "LIKELY REAL",
            "risk_level": "Low Risk",
            "steps": [
                {
                    "step": "Source Check",
                    "score_impact": 0,
                    "details": "No URL provided",
                }
            ],
            "article_class": "REAL",
            "uncertainty": None,
            "parse_metadata": {
                "used_mode": input_mode,
                "detected_shape": "short_single_block",
                "headline_word_count": 6,
                "body_word_count": 0,
                "headline_source": "first_line",
            },
            "model_outputs": {
                "model_a": {
                    "ran": True,
                    "label": "REAL",
                    "confidence": 0.95,
                    "score_impact": -2,
                    "input_word_count": 6,
                },
                "model_b": {
                    "ran": False,
                    "label": None,
                    "confidence": None,
                    "score_impact": 0,
                    "input_word_count": 0,
                },
            },
            "conflict": {
                "is_conflict": False,
                "threshold": 0.80,
                "raw_score_before_override": -2,
            },
            "lime_model": None,
            "lime_input_text": None,
        }

    def check_source(self, url):
        return {"score": 0, "reason": "No URL provided"}


class PredictUrlHandlingTests(unittest.TestCase):
    def setUp(self):
        self.previous_model = main_module.model
        self.previous_explainer = main_module.explainer
        self.dummy_model = DummyModel()
        main_module.model = self.dummy_model
        main_module.explainer = object()

    def tearDown(self):
        main_module.model = self.previous_model
        main_module.explainer = self.previous_explainer

    def test_unsupported_url_without_text_returns_uncertain(self):
        response = main_module.predict(
            main_module.PredictRequest(
                text="",
                url="https://youtube.com/",
                explanation_mode="none",
            )
        )

        self.assertEqual(response.verdict, "UNCERTAIN")
        self.assertEqual(response.uncertainty.reason_code, "UNSUPPORTED_URL")
        self.assertFalse(response.fetch_metadata.attempted)
        self.assertEqual(response.fetch_metadata.error_type, "UNSUPPORTED_PAGE")
        self.assertEqual(len(self.dummy_model.calls), 0)

    def test_unsupported_url_with_text_is_ignored(self):
        response = main_module.predict(
            main_module.PredictRequest(
                text="Breaking news headline with enough words for analysis",
                url="https://www.youtube.com/watch?v=abc123",
                explanation_mode="none",
            )
        )

        self.assertEqual(response.verdict, "LIKELY REAL")
        self.assertEqual(self.dummy_model.calls[0][1], None)
        self.assertFalse(response.fetch_metadata.attempted)
        self.assertEqual(response.fetch_metadata.error_type, "UNSUPPORTED_PAGE")
        self.assertEqual(response.steps[0].step, "URL Eligibility")


if __name__ == "__main__":
    unittest.main()
