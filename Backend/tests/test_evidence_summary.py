from __future__ import annotations

import json
import os
import sys
import unittest
from pathlib import Path


REPO_BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_BACKEND_ROOT))

from app.evidence import build_evidence_summary, extract_claim_hints


SOURCE_DB_PATH = REPO_BACKEND_ROOT / "app" / "data" / "source_credibility.json"


class EvidenceSummaryTests(unittest.TestCase):
    def setUp(self):
        self.previous_news_key = os.environ.pop("NEWS_API_KEY", None)
        self.source_db = json.loads(SOURCE_DB_PATH.read_text(encoding="utf-8"))

    def tearDown(self):
        if self.previous_news_key is not None:
            os.environ["NEWS_API_KEY"] = self.previous_news_key

    def test_extracts_check_worthy_claim_hints(self):
        text = (
            "The government announced a new policy in 2026. "
            "Officials said the plan will affect 2 million households. "
            "This is a short opinion sentence."
        )

        hints = extract_claim_hints(text)

        self.assertGreaterEqual(len(hints), 1)
        self.assertTrue(any("2026" in hint or "2 million" in hint for hint in hints))

    def test_summary_returns_not_checked_without_news_api_key(self):
        summary = build_evidence_summary(
            "Reuters reported that the central bank announced a 2 percent rate change in 2026.",
            "https://www.reuters.com/world/example-story",
            self.source_db,
        )

        self.assertEqual(summary["coverage_signal"]["status"], "NOT_CONFIGURED")
        self.assertEqual(summary["evidence_status"], "SOURCE_ONLY")
        self.assertTrue(summary["source_signal"]["known"])
        self.assertEqual(summary["source_signal"]["source_type"], "REAL")
        self.assertIn("does not prove", summary["limitations"])

    def test_unknown_source_stays_neutral(self):
        summary = build_evidence_summary(
            "A local official said the bridge project will cost 12 million dollars.",
            "https://unknown-example-source.test/news/bridge-project",
            self.source_db,
        )

        self.assertFalse(summary["source_signal"]["known"])
        self.assertEqual(summary["evidence_status"], "NOT_CHECKED")


if __name__ == "__main__":
    unittest.main()
