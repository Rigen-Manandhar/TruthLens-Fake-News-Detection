from __future__ import annotations

from pathlib import Path

from app.deepfake_detection.inference import predict_image, predict_video
from app.deepfake_detection.media import (
    IMAGE_EXTENSIONS,
    VIDEO_EXTENSIONS,
    read_image_from_bytes,
    remove_temp_video,
    save_temp_video,
    validate_upload,
)
from app.deepfake_detection.schemas import DeepfakePredictResponse


def build_deepfake_response(file_bytes: bytes, filename: str, model, face_detector=None) -> DeepfakePredictResponse:
    size = len(file_bytes)
    validation = validate_upload(filename, "", size)
    if not validation["ok"]:
        return DeepfakePredictResponse(
            verdict="Error",
            risk_level="Needs Review",
            message=validation["error"],
            media_type="unknown",
        )

    media_type = validation["media_type"]
    temp_video_path: Path | None = None

    try:
        if media_type == "image":
            image = read_image_from_bytes(file_bytes)
            result = predict_image(model, image, face_detector=face_detector)
        else:
            ext = Path(filename).suffix.lower()
            temp_video_path = save_temp_video(file_bytes, suffix=ext)
            result = predict_video(
                model,
                temp_video_path,
                num_frames=10,
                min_gap=3,
                face_detector=face_detector,
            )
    except Exception as exc:
        return DeepfakePredictResponse(
            verdict="Error",
            risk_level="Needs Review",
            message=f"Analysis failed: {exc}",
            media_type=media_type,
        )
    finally:
        if temp_video_path is not None:
            remove_temp_video(temp_video_path)

    fake_prob = float(result.get("fake_probability", 0.0))
    threshold = float(result.get("decision_threshold", 0.5))

    # Verdict bands
    if fake_prob >= threshold + 0.15:
        verdict = "Likely Manipulated"
        risk_level = "High Risk"
        message = (
            "The visual signals in this upload suggest possible manipulation. "
            "Review the source before trusting or sharing."
        )
    elif fake_prob <= threshold - 0.15:
        verdict = "Likely Authentic"
        risk_level = "Low Risk"
        message = (
            "The visual signals suggest this upload is likely authentic, "
            "but this is not a guarantee of truth."
        )
    else:
        verdict = "Needs Review"
        risk_level = "Needs Review"
        message = (
            "The visual signals are inconclusive. "
            "Consider checking the source or looking for other evidence."
        )

    return DeepfakePredictResponse(
        verdict=verdict,
        risk_level=risk_level,
        message=message,
        media_type=media_type,
    )
