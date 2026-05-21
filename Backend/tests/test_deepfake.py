from __future__ import annotations

import sys
import unittest
from io import BytesIO
from pathlib import Path

REPO_BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_BACKEND_ROOT))

from app.deepfake_detection.media import (
    MAX_IMAGE_BYTES,
    MAX_VIDEO_BYTES,
    validate_upload,
)
from app.deepfake_detection.service import build_deepfake_response


def make_test_png() -> bytes:
    from PIL import Image

    buffer = BytesIO()
    Image.new("RGB", (8, 8), color=(255, 255, 255)).save(buffer, format="PNG")
    return buffer.getvalue()


class MockModel:
    def __init__(self, threshold: float = 0.5):
        self.threshold = threshold

    def predict(self, image_rgb):
        return {
            "label": "real",
            "fake_probability": 0.2,
            "real_probability": 0.8,
            "decision_threshold": self.threshold,
        }


class DeepfakeMediaValidationTests(unittest.TestCase):
    def test_valid_image_jpg(self):
        result = validate_upload("photo.jpg", "image/jpeg", 1024)
        self.assertTrue(result["ok"])
        self.assertEqual(result["media_type"], "image")

    def test_valid_image_png(self):
        result = validate_upload("photo.png", "image/png", 1024)
        self.assertTrue(result["ok"])
        self.assertEqual(result["media_type"], "image")

    def test_valid_video_mp4(self):
        result = validate_upload("clip.mp4", "video/mp4", 1024)
        self.assertTrue(result["ok"])
        self.assertEqual(result["media_type"], "video")

    def test_rejects_unsupported_type(self):
        result = validate_upload("document.pdf", "application/pdf", 1024)
        self.assertFalse(result["ok"])
        self.assertIn("Unsupported", result["error"])

    def test_rejects_oversized_image(self):
        result = validate_upload("huge.jpg", "image/jpeg", MAX_IMAGE_BYTES + 1)
        self.assertFalse(result["ok"])
        self.assertIn("exceeds", result["error"])

    def test_rejects_oversized_video(self):
        result = validate_upload("huge.mp4", "video/mp4", MAX_VIDEO_BYTES + 1)
        self.assertFalse(result["ok"])
        self.assertIn("exceeds", result["error"])


class DeepfakeVerdictMappingTests(unittest.TestCase):
    def test_strong_fake_returns_likely_manipulated(self):
        model = MockModel(threshold=0.5)

        # Patch predict to return strong fake signal
        def fake_predict(image_rgb):
            return {
                "label": "fake",
                "fake_probability": 0.85,
                "real_probability": 0.15,
                "decision_threshold": 0.5,
            }

        model.predict = fake_predict

        response = build_deepfake_response(make_test_png(), "test.png", model)
        self.assertEqual(response.verdict, "Likely Manipulated")
        self.assertEqual(response.risk_level, "High Risk")
        self.assertEqual(response.media_type, "image")

    def test_strong_real_returns_likely_authentic(self):
        model = MockModel(threshold=0.5)

        def real_predict(image_rgb):
            return {
                "label": "real",
                "fake_probability": 0.1,
                "real_probability": 0.9,
                "decision_threshold": 0.5,
            }

        model.predict = real_predict

        response = build_deepfake_response(make_test_png(), "test.png", model)
        self.assertEqual(response.verdict, "Likely Authentic")
        self.assertEqual(response.risk_level, "Low Risk")
        self.assertEqual(response.media_type, "image")

    def test_borderline_returns_needs_review(self):
        model = MockModel(threshold=0.5)

        def borderline_predict(image_rgb):
            return {
                "label": "real",
                "fake_probability": 0.52,
                "real_probability": 0.48,
                "decision_threshold": 0.5,
            }

        model.predict = borderline_predict

        response = build_deepfake_response(make_test_png(), "test.png", model)
        self.assertEqual(response.verdict, "Needs Review")
        self.assertEqual(response.risk_level, "Needs Review")

    def test_unsupported_file_type(self):
        model = MockModel()
        response = build_deepfake_response(b"data", "file.txt", model)
        self.assertEqual(response.verdict, "Error")
        self.assertIn("Unsupported", response.message)


class MockFaceDetector:
    """Returns a cropped image when face_found is True, None otherwise."""

    def __init__(self, face_found: bool = True):
        self.face_found = face_found

    def crop_face(self, image):
        if not self.face_found:
            return None
        w, h = image.size
        crop_size = min(w, h) // 2
        left = (w - crop_size) // 2
        top = (h - crop_size) // 2
        return image.crop((left, top, left + crop_size, top + crop_size))


class MockFaceDetectorWithCount:
    """Tracks how many times crop_face was called."""

    def __init__(self, face_found: bool = True):
        self.face_found = face_found
        self.call_count = 0

    def crop_face(self, image):
        self.call_count += 1
        if not self.face_found:
            return None
        w, h = image.size
        crop_size = min(w, h) // 2
        left = (w - crop_size) // 2
        top = (h - crop_size) // 2
        return image.crop((left, top, left + crop_size, top + crop_size))


class FaceDetectorIntegrationTests(unittest.TestCase):
    def test_face_detection_found_image(self):
        model = MockModel(threshold=0.5)
        detector = MockFaceDetector(face_found=True)
        response = build_deepfake_response(
            make_test_png(), "test.png", model, face_detector=detector
        )
        self.assertEqual(response.verdict, "Likely Authentic")
        self.assertEqual(response.media_type, "image")

    def test_face_detection_not_found_fallback(self):
        model = MockModel(threshold=0.5)
        detector = MockFaceDetector(face_found=False)
        response = build_deepfake_response(
            make_test_png(), "test.png", model, face_detector=detector
        )
        self.assertEqual(response.verdict, "Likely Authentic")
        self.assertEqual(response.media_type, "image")

    def test_no_face_detector_passed(self):
        model = MockModel(threshold=0.5)
        response = build_deepfake_response(
            make_test_png(), "test.png", model
        )
        self.assertEqual(response.verdict, "Likely Authentic")
        self.assertEqual(response.media_type, "image")


if __name__ == "__main__":
    unittest.main()
