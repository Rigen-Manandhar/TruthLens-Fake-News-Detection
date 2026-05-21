from __future__ import annotations

from pathlib import Path
from typing import Any

import cv2
import numpy as np
from PIL import Image


VIDEO_EXTENSIONS = (".mp4", ".avi", ".mov", ".mkv", ".webm")
IMAGE_EXTENSIONS = (".jpg", ".jpeg", ".png", ".bmp", ".webp")


def resolve_media_path(base_dir: str | Path, name: str, extensions: tuple[str, ...]) -> Path | None:
    base = Path(base_dir)
    candidate = base / name
    if candidate.exists():
        return candidate.resolve()

    stem = Path(name).stem
    for extension in extensions:
        candidate = base / f"{stem}{extension}"
        if candidate.exists():
            return candidate.resolve()
    return None


def select_uniform_indices(total_frames: int, num_frames: int, min_gap: int = 1) -> list[int]:
    if total_frames <= 0:
        return []

    if num_frames >= total_frames:
        indices = list(range(total_frames))
    else:
        indices = np.linspace(0, total_frames - 1, num=num_frames, dtype=int).tolist()

    selected: list[int] = []
    previous = -min_gap
    for index in indices:
        if index - previous >= min_gap:
            selected.append(index)
            previous = index
    return sorted(set(selected))


def sample_video_frames(
    video_path: str | Path,
    num_frames: int,
    min_frame_gap: int = 1,
) -> list[dict[str, Any]]:
    capture = cv2.VideoCapture(str(video_path))
    if not capture.isOpened():
        raise RuntimeError(f"Unable to open video: {video_path}")

    total_frames = int(capture.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = float(capture.get(cv2.CAP_PROP_FPS) or 25.0)
    indices = select_uniform_indices(total_frames, num_frames, min_gap=min_frame_gap)

    frames: list[dict[str, Any]] = []
    for frame_idx in indices:
        capture.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
        success, frame = capture.read()
        if not success:
            continue

        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        frames.append(
            {
                "frame_idx": int(frame_idx),
                "timestamp_sec": float(frame_idx / fps) if fps > 0 else 0.0,
                "image": Image.fromarray(frame_rgb),
            }
        )

    capture.release()
    return frames


def detect_primary_face(
    detector: Any,
    image: Image.Image,
    min_confidence: float = 0.9,
) -> tuple[list[float] | None, float | None]:
    boxes, probs = detector.detect(image)
    if boxes is None or probs is None:
        return None, None

    valid_indices = [index for index, prob in enumerate(probs) if prob is not None and prob >= min_confidence]
    if not valid_indices:
        return None, None

    def ranking(index: int) -> tuple[float, float]:
        box = boxes[index]
        area = max(0.0, float(box[2] - box[0])) * max(0.0, float(box[3] - box[1]))
        return area, float(probs[index])

    best_index = max(valid_indices, key=ranking)
    return boxes[best_index].tolist(), float(probs[best_index])


def expand_box_to_square(
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


def crop_from_box(image: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
    return image.crop(box)
