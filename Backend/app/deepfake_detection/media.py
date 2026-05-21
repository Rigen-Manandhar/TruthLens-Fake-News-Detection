from __future__ import annotations

import os
import tempfile
from io import BytesIO
from pathlib import Path

from PIL import Image

VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".webm"}
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

MAX_IMAGE_BYTES = 10 * 1024 * 1024
MAX_VIDEO_BYTES = 75 * 1024 * 1024
VIDEO_SAMPLE_FRAMES = 10
VIDEO_MIN_FRAME_GAP = 3


def _file_extension(filename: str) -> str:
    return Path(filename).suffix.lower()


def validate_upload(filename: str, content_type: str, size: int) -> dict:
    ext = _file_extension(filename)
    if ext in IMAGE_EXTENSIONS:
        if size > MAX_IMAGE_BYTES:
            return {"ok": False, "error": f"Image exceeds {MAX_IMAGE_BYTES // (1024 * 1024)} MB limit."}
        return {"ok": True, "media_type": "image"}
    if ext in VIDEO_EXTENSIONS:
        if size > MAX_VIDEO_BYTES:
            return {"ok": False, "error": f"Video exceeds {MAX_VIDEO_BYTES // (1024 * 1024)} MB limit."}
        return {"ok": True, "media_type": "video"}
    return {"ok": False, "error": "Unsupported file type. Please upload an image or video."}


def _select_uniform_indices(total_frames: int, num_frames: int, min_gap: int = 1) -> list[int]:
    import numpy as np

    if total_frames <= 0:
        return []
    if num_frames >= total_frames:
        indices = list(range(total_frames))
    else:
        indices = np.linspace(0, total_frames - 1, num=num_frames, dtype=int).tolist()
    selected: list[int] = []
    previous = -min_gap
    for idx in indices:
        if idx - previous >= min_gap:
            selected.append(idx)
            previous = idx
    return sorted(set(selected))


def sample_video_frames(video_path: str | Path, num_frames: int = VIDEO_SAMPLE_FRAMES, min_gap: int = VIDEO_MIN_FRAME_GAP) -> list[Image.Image]:
    import cv2

    capture = cv2.VideoCapture(str(video_path))
    if not capture.isOpened():
        raise RuntimeError("Unable to open video file.")

    total_frames = int(capture.get(cv2.CAP_PROP_FRAME_COUNT))
    if total_frames <= 0:
        capture.release()
        raise RuntimeError("Video has no frames.")

    indices = _select_uniform_indices(total_frames, num_frames, min_gap=min_gap)
    frames: list[Image.Image] = []
    for frame_idx in indices:
        capture.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
        success, frame = capture.read()
        if not success:
            continue
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        frames.append(Image.fromarray(rgb))

    capture.release()
    if not frames:
        raise RuntimeError("Could not extract any frames from the video.")
    return frames


def read_image_from_bytes(data: bytes) -> Image.Image:
    return Image.open(BytesIO(data)).convert("RGB")


def save_temp_video(data: bytes, suffix: str) -> Path:
    fd, path = tempfile.mkstemp(suffix=suffix)
    try:
        os.write(fd, data)
        os.close(fd)
        return Path(path)
    except Exception:
        os.close(fd)
        raise


def remove_temp_video(path: Path) -> None:
    try:
        if path.exists():
            os.remove(path)
    except Exception:
        pass
