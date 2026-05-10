from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path


REPO_BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_BACKEND_ROOT))

from app.scoring import check_source


SOURCE_DB_PATH = REPO_BACKEND_ROOT / "app" / "data" / "source_credibility.json"


class SourceCredibilityProvenanceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source_db = json.loads(SOURCE_DB_PATH.read_text(encoding="utf-8"))

    def test_all_entries_include_provenance_fields(self):
        required = {
            "domain",
            "type",
            "credibility",
            "category",
            "rationale",
            "last_reviewed",
            "reference_url",
            "notes",
        }
        for entry in self.source_db:
            missing = [key for key in required if not str(entry.get(key, "")).strip()]
            self.assertEqual(missing, [], f"Missing provenance fields for {entry.get('domain')}")

    def test_exact_domain_match(self):
        result = check_source("https://reuters.com/world/story", self.source_db)

        self.assertEqual(result["source_type"], "REAL")
        self.assertEqual(result["details"]["credibility"], "High")

    def test_subdomain_match(self):
        result = check_source("https://www.bbc.com/news/world-example", self.source_db)

        self.assertEqual(result["source_type"], "REAL")
        self.assertEqual(result["details"]["domain"], "bbc.com")

    def test_unknown_domain_is_neutral(self):
        result = check_source("https://example.com/news/story", self.source_db)

        self.assertEqual(result["score"], 0)
        self.assertIsNone(result["source_type"])

    def test_satire_source_is_separate_from_unknown(self):
        result = check_source("https://www.theonion.com/story", self.source_db)

        self.assertEqual(result["source_type"], "SATIRE")
        self.assertEqual(result["details"]["category"], "Satire")

    def test_spoofed_domain_is_detected(self):
        result = check_source("https://xn--bbc-p98d.com/world/story", self.source_db)

        self.assertEqual(result["source_type"], "FAKE")
        self.assertEqual(result["details"]["category"], "Spoofed domain example")


if __name__ == "__main__":
    unittest.main()
