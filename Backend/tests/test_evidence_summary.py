from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path


REPO_BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_BACKEND_ROOT))

from app.evidence import build_evidence_summary


SOURCE_DB_PATH = REPO_BACKEND_ROOT / "app" / "data" / "source_credibility.json"


class EvidenceSummaryTests(unittest.TestCase):
    def setUp(self):
        self.source_db = json.loads(SOURCE_DB_PATH.read_text(encoding="utf-8"))

    def test_summary_uses_source_signal_for_known_source(self):
        summary = build_evidence_summary(
            "Reuters reported that the central bank announced a 2 percent rate change in 2026.",
            "https://www.reuters.com/world/example-story",
            self.source_db,
        )

        self.assertEqual(summary["evidence_status"], "SOURCE_ONLY")
        self.assertTrue(summary["source_signal"]["known"])
        self.assertEqual(summary["source_signal"]["source_type"], "REAL")
        self.assertNotIn("claim_hints", summary)
        self.assertNotIn("coverage_signal", summary)
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
