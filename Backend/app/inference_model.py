from __future__ import annotations

from pathlib import Path

import torch
from peft import PeftConfig, PeftModel
from transformers import AutoConfig, AutoModelForSequenceClassification, AutoTokenizer


class InferenceModel:
    def __init__(self, adapter_path: Path, max_len: int = 256):
        self.adapter_path = adapter_path
        self.max_len = max_len
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        peft_cfg = PeftConfig.from_pretrained(str(adapter_path))
        base_model_name = peft_cfg.base_model_name_or_path

        try:
            if (adapter_path / "config.json").exists():
                hf_cfg = AutoConfig.from_pretrained(str(adapter_path))
            else:
                hf_cfg = AutoConfig.from_pretrained(base_model_name)
        except Exception:
            hf_cfg = AutoConfig.from_pretrained(base_model_name)

        self.tokenizer = AutoTokenizer.from_pretrained(str(adapter_path), use_fast=True)

        base = AutoModelForSequenceClassification.from_pretrained(
            base_model_name,
            config=hf_cfg,
            ignore_mismatched_sizes=True,
        )

        self.model = PeftModel.from_pretrained(base, str(adapter_path))
        self.model.to(self.device)
        self.model.eval()

    @torch.inference_mode()
    def predict(self, text: str) -> tuple[str, float]:
        inputs = self.tokenizer(
            text.strip(),
            return_tensors="pt",
            truncation=True,
            padding=True,
            max_length=self.max_len,
        ).to(self.device)

        outputs = self.model(**inputs)
        probs = torch.softmax(outputs.logits, dim=-1)[0]
        pred_id = int(torch.argmax(probs).item())
        confidence = float(probs[pred_id].item())

        id2label = getattr(self.model.config, "id2label", None) or {}
        label = id2label.get(pred_id, str(pred_id))

        return label, confidence

    @torch.inference_mode()
    def predict_proba(self, texts: list[str]):
        inputs = self.tokenizer(
            texts,
            return_tensors="pt",
            truncation=True,
            padding=True,
            max_length=self.max_len,
        ).to(self.device)

        outputs = self.model(**inputs)
        probs = torch.softmax(outputs.logits, dim=-1)
        return probs.cpu().numpy()
