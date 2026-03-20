from __future__ import annotations

import sys
import unittest
from pathlib import Path


REPO_BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_BACKEND_ROOT))

from app.url_eligibility import classify_url_eligibility


class UrlEligibilityTests(unittest.TestCase):
    def test_rejects_youtube_homepage(self):
        result = classify_url_eligibility("https://youtube.com/")
        self.assertFalse(result.is_supported)
        self.assertEqual(result.reason_code, "UNSUPPORTED_HOST")

    def test_rejects_root_homepage(self):
        result = classify_url_eligibility("https://example.com/")
        self.assertFalse(result.is_supported)
        self.assertEqual(result.reason_code, "UNSUPPORTED_PATH")

    def test_accepts_article_like_url(self):
        result = classify_url_eligibility("https://www.nytimes.com/2026/03/20/world/example-story")
        self.assertTrue(result.is_supported)
        self.assertEqual(result.reason_code, "SUPPORTED")

    def test_rejects_non_http_scheme(self):
        result = classify_url_eligibility("chrome://extensions")
        self.assertFalse(result.is_supported)
        self.assertEqual(result.reason_code, "UNSUPPORTED_SCHEME")


if __name__ == "__main__":
    unittest.main()
