from __future__ import annotations

import os
import sys
from pathlib import Path

import torch

# Allow imports from the sibling deepfake package by adding its src path.
_DEEPFAKE_ROOT = Path(__file__).resolve().parents[2] / "deepfake"
if str(_DEEPFAKE_ROOT) not in sys.path:
    sys.path.insert(0, str(_DEEPFAKE_ROOT))

from src.models.xception_classifier import XceptionClassifier
from src.utils.common import get_device
from src.utils.transforms import build_transforms


def _resolve_checkpoint_path() -> Path:
    repo_root = Path(__file__).resolve().parents[2]
    env_path = os.getenv("DEEPFAKE_CHECKPOINT_PATH", "").strip()
    if env_path:
        candidate = Path(env_path)
        if not candidate.is_absolute():
            candidate = repo_root / candidate
        if candidate.exists():
            return candidate
    fallback = repo_root / "deepfake" / "checkpoints" / "best_auc.pt"
    if fallback.exists():
        return fallback
    raise FileNotFoundError(f"Deepfake checkpoint not found. Searched: {candidate if env_path else fallback}")


def _load_checkpoint(checkpoint_path: Path) -> dict:
    # PyTorch 2.6 defaults to weights_only=True, but this checkpoint is a trusted
    # local artifact that includes the full exported training metadata.
    try:
        return torch.load(str(checkpoint_path), map_location="cpu", weights_only=False)
    except TypeError:
        return torch.load(str(checkpoint_path), map_location="cpu")


class DeepfakeModelLoader:
    def __init__(self):
        self.device = get_device("auto")
        self.checkpoint_path = _resolve_checkpoint_path()
        print(f"Loading Deepfake model from: {self.checkpoint_path}")

        checkpoint = _load_checkpoint(self.checkpoint_path)
        config = checkpoint.get("config", {})
        data_cfg = config.get("data", {})
        self.image_size = int(data_cfg.get("image_size", 299))
        self.threshold = float(checkpoint.get("threshold", 0.5))

        self.model = XceptionClassifier(pretrained=False)
        self.model.load_state_dict(checkpoint["model_state_dict"])
        self.model.to(self.device)
        self.model.eval()

        self.transform = build_transforms(
            image_size=self.image_size,
            is_train=False,
            enable_augmentation=False,
        )

    @torch.inference_mode()
    def predict(self, image_rgb) -> dict:
        from PIL import Image

        if isinstance(image_rgb, Image.Image):
            pil_image = image_rgb.convert("RGB")
        else:
            raise TypeError("Expected PIL Image.")

        tensor = self.transform(pil_image).unsqueeze(0).to(self.device)
        logit = float(self.model(tensor).squeeze().cpu().item())
        prob = 1.0 / (1.0 + torch.exp(torch.tensor(-logit))).item()
        label = "fake" if prob >= self.threshold else "real"
        return {
            "label": label,
            "fake_probability": prob,
            "real_probability": 1.0 - prob,
            "decision_threshold": self.threshold,
        }
