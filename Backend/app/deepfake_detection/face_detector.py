from __future__ import annotations

import logging
from typing import Any

from PIL import Image

logger = logging.getLogger(__name__)


def _detect_primary_face(
    detector: Any,
    image: Image.Image,
    min_confidence: float = 0.7,
) -> tuple[list[float] | None, float | None]:
    boxes, probs = detector.detect(image)
    if boxes is None or probs is None:
        return None, None

    valid_indices = [
        i for i, p in enumerate(probs) if p is not None and p >= min_confidence
    ]
    if not valid_indices:
        return None, None

    def ranking(index: int) -> tuple[float, float]:
        box = boxes[index]
        area = max(0.0, float(box[2] - box[0])) * max(0.0, float(box[3] - box[1]))
        return area, float(probs[index])

    best_index = max(valid_indices, key=ranking)
    return boxes[best_index].tolist(), float(probs[best_index])


def _expand_box_to_square(
    box: list[float],
    image_width: int,
    image_height: int,
    scale: float = 1.3,
) -> tuple[int, int, int, int]:
    x1, y1, x2, y2 = box
    width = x2 - x1
    height = y2 - y1
    side = max(width, height) * scale
    center_x = x1 + width / 2.0
    center_y = y1 + height / 2.0

    new_x1 = max(0, int(round(center_x - side / 2.0)))
    new_y1 = max(0, int(round(center_y - side / 2.0)))
    new_x2 = min(image_width, int(round(center_x + side / 2.0)))
    new_y2 = min(image_height, int(round(center_y + side / 2.0)))
    return new_x1, new_y1, new_x2, new_y2


def _crop_from_box(image: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
    return image.crop(box)


class FaceDetector:
    """Wraps MTCNN to detect, expand, and crop the primary face from an image."""

    def __init__(
        self,
        device: str = "cpu",
        min_confidence: float = 0.7,
        expand_scale: float = 1.3,
        min_face_size: int = 40,
    ) -> None:
        from facenet_pytorch import MTCNN

        self._detector = MTCNN(
            keep_all=False,
            min_face_size=min_face_size,
            device=device,
        )
        self._min_confidence = min_confidence
        self._expand_scale = expand_scale

    def crop_face(self, image: Image.Image) -> Image.Image | None:
        """Detect the primary face, expand the bounding box, and return the cropped face.

        Returns None if no face is detected above the confidence threshold.
        """
        box, confidence = _detect_primary_face(
            self._detector, image, min_confidence=self._min_confidence
        )
        if box is None:
            logger.debug("No face detected above confidence threshold.")
            return None

        width, height = image.size
        square_box = _expand_box_to_square(box, width, height, scale=self._expand_scale)
        cropped = _crop_from_box(image, square_box)

        if cropped.size[0] < 1 or cropped.size[1] < 1:
            logger.debug("Cropped face region is too small, falling back.")
            return None

        return cropped
