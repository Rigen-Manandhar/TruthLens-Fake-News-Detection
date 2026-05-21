from __future__ import annotations

import io
import random

import torch
from PIL import Image
from torchvision import transforms


MEAN = (0.5, 0.5, 0.5)
STD = (0.5, 0.5, 0.5)
CROP_PCT = 0.8975


class JpegCompression:
    """Apply light JPEG recompression for compression robustness."""

    def __init__(self, quality_min: int = 75, quality_max: int = 100) -> None:
        self.quality_min = quality_min
        self.quality_max = quality_max

    def __call__(self, image: Image.Image) -> Image.Image:
        quality = random.randint(self.quality_min, self.quality_max)
        buffer = io.BytesIO()
        image.save(buffer, format="JPEG", quality=quality)
        buffer.seek(0)
        return Image.open(buffer).convert("RGB")


class AddGaussianNoise:
    def __init__(self, std: float = 0.02) -> None:
        self.std = std

    def __call__(self, tensor: torch.Tensor) -> torch.Tensor:
        noise = torch.randn_like(tensor) * self.std
        return torch.clamp(tensor + noise, 0.0, 1.0)


def build_transforms(
    image_size: int,
    is_train: bool,
    enable_augmentation: bool = True,
    augmentation_cfg: dict | None = None,
) -> transforms.Compose:
    cfg = augmentation_cfg or {}
    resize_size = int(round(image_size / CROP_PCT))
    pipeline: list = []

    if is_train:
        pipeline.append(
            transforms.RandomResizedCrop(
                image_size,
                scale=(0.95, 1.0),
                ratio=(0.98, 1.02),
                interpolation=transforms.InterpolationMode.BICUBIC,
            )
        )
    else:
        pipeline.extend(
            [
                transforms.Resize(resize_size, interpolation=transforms.InterpolationMode.BICUBIC),
                transforms.CenterCrop(image_size),
            ]
        )

    if is_train and enable_augmentation:
        pipeline.extend(
            [
                transforms.RandomHorizontalFlip(cfg.get("horizontal_flip_prob", 0.5)),
                transforms.ColorJitter(
                    brightness=cfg.get("color_jitter", {}).get("brightness", 0.1),
                    contrast=cfg.get("color_jitter", {}).get("contrast", 0.1),
                    saturation=cfg.get("color_jitter", {}).get("saturation", 0.1),
                    hue=cfg.get("color_jitter", {}).get("hue", 0.02),
                ),
                transforms.RandomApply(
                    [transforms.GaussianBlur(kernel_size=3, sigma=(0.1, 0.5))],
                    p=cfg.get("gaussian_blur_prob", 0.15),
                ),
                transforms.RandomApply(
                    [
                        JpegCompression(
                            quality_min=cfg.get("jpeg_quality_min", 75),
                            quality_max=cfg.get("jpeg_quality_max", 100),
                        )
                    ],
                    p=cfg.get("jpeg_prob", 0.2),
                ),
            ]
        )

    pipeline.append(transforms.ToTensor())

    if is_train and enable_augmentation:
        pipeline.append(
            transforms.RandomApply(
                [AddGaussianNoise(std=0.02)],
                p=cfg.get("gaussian_noise_prob", 0.1),
            )
        )

    pipeline.append(transforms.Normalize(mean=MEAN, std=STD))
    return transforms.Compose(pipeline)
