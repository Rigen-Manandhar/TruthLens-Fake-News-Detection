from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from app.deepfake_detection.media import sample_video_frames

logger = logging.getLogger(__name__)


def predict_image(model, image_rgb, face_detector=None) -> dict:
    if face_detector is not None:
        cropped = face_detector.crop_face(image_rgb)
        if cropped is not None:
            image_rgb = cropped
        else:
            logger.info("No face detected in image, using full image for analysis.")
    return model.predict(image_rgb)


def predict_video(model, video_path: str | Path, num_frames: int = 10, min_gap: int = 3, face_detector=None) -> dict:
    frames = sample_video_frames(video_path, num_frames=num_frames, min_gap=min_gap)
    fake_probs: list[float] = []
    for idx, frame in enumerate(frames):
        if face_detector is not None:
            cropped = face_detector.crop_face(frame)
            if cropped is not None:
                frame = cropped
            else:
                logger.info("No face detected in video frame %d, using full frame.", idx)
        result = model.predict(frame)
        fake_probs.append(result["fake_probability"])

    if not fake_probs:
        raise RuntimeError("No frames could be analyzed.")

    avg_fake = sum(fake_probs) / len(fake_probs)
    max_fake = max(fake_probs)

    # Use average as primary signal, but if max is very high, elevate concern
    composite = avg_fake * 0.7 + max_fake * 0.3

    label = "fake" if composite >= model.threshold else "real"
    return {
        "label": label,
        "fake_probability": composite,
        "real_probability": 1.0 - composite,
        "decision_threshold": model.threshold,
        "frames_analyzed": len(fake_probs),
    }
