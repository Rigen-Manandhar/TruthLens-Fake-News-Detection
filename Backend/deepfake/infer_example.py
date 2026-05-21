"""
Minimal example: load the exported deepfake model in a new project.

Setup in your new environment:
    pip install torch torchvision timm>=1.0.0 Pillow numpy opencv-python facenet-pytorch>=2.6.0

Then run:
    python infer_example.py --checkpoint checkpoints/best_auc.pt --input path/to/image.jpg
"""
from __future__ import annotations

import argparse
from pathlib import Path

import torch
from PIL import Image

from src.models.xception_classifier import XceptionClassifier
from src.utils.common import get_device
from src.utils.transforms import build_transforms


def _load_checkpoint(checkpoint_path: str) -> dict:
    try:
        return torch.load(checkpoint_path, map_location="cpu", weights_only=False)
    except TypeError:
        return torch.load(checkpoint_path, map_location="cpu")


def predict_image(checkpoint_path: str, image_path: str, device: str = "auto") -> dict:
    checkpoint = _load_checkpoint(checkpoint_path)
    config = checkpoint.get("config", {})
    data_cfg = config.get("data", {})
    image_size = int(data_cfg.get("image_size", 299))
    threshold = float(checkpoint.get("threshold", 0.5))

    dev = get_device(device if device != "auto" else config.get("project", {}).get("device", "auto"))
    model = XceptionClassifier(pretrained=False)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.to(dev)
    model.eval()

    transform = build_transforms(image_size=image_size, is_train=False, enable_augmentation=False)
    image = Image.open(image_path).convert("RGB")
    tensor = transform(image).unsqueeze(0).to(dev)

    with torch.inference_mode():
        logit = float(model(tensor).squeeze().cpu().item())

    prob = 1.0 / (1.0 + torch.exp(torch.tensor(-logit))).item()
    label = "fake" if prob >= threshold else "real"

    return {
        "label": label,
        "fake_probability": prob,
        "real_probability": 1.0 - prob,
        "decision_threshold": threshold,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Minimal deepfake inference example.")
    parser.add_argument("--checkpoint", type=str, required=True, help="Path to .pt checkpoint.")
    parser.add_argument("--input", type=str, required=True, help="Path to image file.")
    parser.add_argument("--device", type=str, default="auto", help="auto, cpu, or cuda.")
    args = parser.parse_args()

    result = predict_image(args.checkpoint, args.input, device=args.device)
    for key, value in result.items():
        print(f"{key}: {value}")


if __name__ == "__main__":
    main()
