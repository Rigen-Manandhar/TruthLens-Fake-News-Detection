from __future__ import annotations

import torch
import torch.nn as nn
import timm


class XceptionClassifier(nn.Module):
    def __init__(self, pretrained: bool = True) -> None:
        super().__init__()
        self.backbone = timm.create_model("legacy_xception", pretrained=pretrained, num_classes=1)

    def forward(self, inputs: torch.Tensor) -> torch.Tensor:
        return self.backbone(inputs)

    def freeze_backbone(self) -> None:
        for parameter in self.backbone.parameters():
            parameter.requires_grad = False

        classifier = self.backbone.get_classifier()
        if hasattr(classifier, "parameters"):
            for parameter in classifier.parameters():
                parameter.requires_grad = True

    def unfreeze_all(self) -> None:
        for parameter in self.backbone.parameters():
            parameter.requires_grad = True
