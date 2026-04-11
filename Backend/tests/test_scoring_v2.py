from __future__ import annotations

import sys
import unittest
from pathlib import Path


REPO_BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_BACKEND_ROOT))

from app.scoring import (
    build_model_weights,
    build_weighted_score,
    check_source,
    model_confidence_to_evidence,
    resolve_verdict,
)


class ScoringV2Tests(unittest.TestCase):
    def test_headline_only_strong_fake_becomes_suspicious(self):
        headline_evidence = model_confidence_to_evidence("FAKE", 0.99)
        headline_weight, article_weight = build_model_weights(True, False, 0)
        scoring = build_weighted_score(0.0, headline_evidence, 0.0, headline_weight, article_weight)

        verdict, risk_level, uncertainty, conflict = resolve_verdict(
            scoring["weighted_score"],
            True,
            False,
            "FAKE",
            "UNKNOWN",
            headline_evidence,
            0.0,
            scoring["headline_contribution"],
            scoring["article_contribution"],
            0,
        )

        self.assertEqual(verdict, "SUSPICIOUS")
        self.assertEqual(risk_level, "High Risk")
        self.assertFalse(conflict["is_conflict"])
        self.assertIsNone(uncertainty["reason_code"])

    def test_headline_only_strong_real_becomes_likely_real(self):
        headline_evidence = model_confidence_to_evidence("REAL", 0.99)
        headline_weight, article_weight = build_model_weights(True, False, 0)
        scoring = build_weighted_score(0.0, headline_evidence, 0.0, headline_weight, article_weight)

        verdict, _, _, _ = resolve_verdict(
            scoring["weighted_score"],
            True,
            False,
            "REAL",
            "UNKNOWN",
            headline_evidence,
            0.0,
            scoring["headline_contribution"],
            scoring["article_contribution"],
            0,
        )

        self.assertEqual(verdict, "LIKELY REAL")

    def test_article_only_long_body_fake_becomes_suspicious(self):
        body_evidence = model_confidence_to_evidence("FAKE", 0.95)
        headline_weight, article_weight = build_model_weights(False, True, 220)
        scoring = build_weighted_score(0.0, 0.0, body_evidence, headline_weight, article_weight)

        verdict, _, _, _ = resolve_verdict(
            scoring["weighted_score"],
            False,
            True,
            "UNKNOWN",
            "FAKE",
            0.0,
            body_evidence,
            scoring["headline_contribution"],
            scoring["article_contribution"],
            220,
        )

        self.assertEqual(verdict, "SUSPICIOUS")

    def test_article_only_long_body_real_becomes_likely_real(self):
        body_evidence = model_confidence_to_evidence("REAL", 0.97)
        headline_weight, article_weight = build_model_weights(False, True, 220)
        scoring = build_weighted_score(0.0, 0.0, body_evidence, headline_weight, article_weight)

        verdict, _, _, _ = resolve_verdict(
            scoring["weighted_score"],
            False,
            True,
            "UNKNOWN",
            "REAL",
            0.0,
            body_evidence,
            scoring["headline_contribution"],
            scoring["article_contribution"],
            220,
        )

        self.assertEqual(verdict, "LIKELY REAL")

    def test_real_source_plus_strong_fake_article_returns_uncertain_not_likely_real(self):
        source_res = check_source(
            "https://www.reuters.com/world/example-story",
            [{"domain": "reuters.com", "type": "REAL"}],
        )
        body_evidence = model_confidence_to_evidence("FAKE", 0.95)
        headline_weight, article_weight = build_model_weights(False, True, 220)
        scoring = build_weighted_score(
            float(source_res["evidence"]), 0.0, body_evidence, headline_weight, article_weight
        )

        verdict, _, uncertainty, _ = resolve_verdict(
            scoring["weighted_score"],
            False,
            True,
            "UNKNOWN",
            "FAKE",
            0.0,
            body_evidence,
            scoring["headline_contribution"],
            scoring["article_contribution"],
            220,
        )

        self.assertEqual(verdict, "UNCERTAIN")
        self.assertEqual(uncertainty["reason_code"], "LOW_CONFIDENCE")

    def test_fake_source_plus_strong_real_article_returns_uncertain_not_suspicious(self):
        source_res = check_source(
            "https://fake-news.example.com/world/story",
            [{"domain": "fake-news.example.com", "type": "FAKE"}],
        )
        body_evidence = model_confidence_to_evidence("REAL", 0.97)
        headline_weight, article_weight = build_model_weights(False, True, 220)
        scoring = build_weighted_score(
            float(source_res["evidence"]), 0.0, body_evidence, headline_weight, article_weight
        )

        verdict, _, uncertainty, _ = resolve_verdict(
            scoring["weighted_score"],
            False,
            True,
            "UNKNOWN",
            "REAL",
            0.0,
            body_evidence,
            scoring["headline_contribution"],
            scoring["article_contribution"],
            220,
        )

        self.assertEqual(verdict, "UNCERTAIN")
        self.assertEqual(uncertainty["reason_code"], "LOW_CONFIDENCE")

    def test_medium_body_disagreement_returns_uncertain(self):
        headline_evidence = model_confidence_to_evidence("REAL", 0.90)
        body_evidence = model_confidence_to_evidence("FAKE", 0.94)
        headline_weight, article_weight = build_model_weights(True, True, 120)
        scoring = build_weighted_score(0.0, headline_evidence, body_evidence, headline_weight, article_weight)

        verdict, _, uncertainty, conflict = resolve_verdict(
            scoring["weighted_score"],
            True,
            True,
            "REAL",
            "FAKE",
            headline_evidence,
            body_evidence,
            scoring["headline_contribution"],
            scoring["article_contribution"],
            120,
        )

        self.assertEqual(verdict, "UNCERTAIN")
        self.assertTrue(conflict["is_conflict"])
        self.assertEqual(uncertainty["reason_code"], "CONFLICT")

    def test_long_body_stronger_model_b_can_win_disagreement_with_supportive_source(self):
        headline_evidence = model_confidence_to_evidence("REAL", 0.80)
        body_evidence = model_confidence_to_evidence("FAKE", 0.98)
        headline_weight, article_weight = build_model_weights(True, True, 220)
        source_res = check_source(
            "https://biased.example.com/story",
            [{"domain": "biased.example.com", "type": "BIASED"}],
        )
        scoring = build_weighted_score(
            float(source_res["evidence"]),
            headline_evidence,
            body_evidence,
            headline_weight,
            article_weight,
        )

        verdict, _, uncertainty, conflict = resolve_verdict(
            scoring["weighted_score"],
            True,
            True,
            "REAL",
            "FAKE",
            headline_evidence,
            body_evidence,
            scoring["headline_contribution"],
            scoring["article_contribution"],
            220,
        )

        self.assertEqual(verdict, "SUSPICIOUS")
        self.assertFalse(conflict["is_conflict"])
        self.assertIsNone(uncertainty["reason_code"])

    def test_borderline_primary_evidence_returns_low_confidence(self):
        headline_evidence = model_confidence_to_evidence("FAKE", 0.60)
        headline_weight, article_weight = build_model_weights(True, False, 0)
        scoring = build_weighted_score(0.0, headline_evidence, 0.0, headline_weight, article_weight)

        verdict, _, uncertainty, _ = resolve_verdict(
            scoring["weighted_score"],
            True,
            False,
            "FAKE",
            "UNKNOWN",
            headline_evidence,
            0.0,
            scoring["headline_contribution"],
            scoring["article_contribution"],
            0,
        )

        self.assertEqual(verdict, "UNCERTAIN")
        self.assertEqual(uncertainty["reason_code"], "LOW_CONFIDENCE")


if __name__ == "__main__":
    unittest.main()
