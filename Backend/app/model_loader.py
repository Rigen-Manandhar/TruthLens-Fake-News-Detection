from __future__ import annotations

import os
from pathlib import Path

import torch
from dotenv import load_dotenv
from peft import PeftConfig, PeftModel
from transformers import AutoTokenizer, AutoModelForSequenceClassification, AutoConfig


class InferenceModel:
    def __init__(self, adapter_path: Path, max_len: int = 256):
        self.adapter_path = adapter_path
        self.max_len = max_len
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        # Read base model name from adapter_config.json
        peft_cfg = PeftConfig.from_pretrained(str(adapter_path))
        base_model_name = peft_cfg.base_model_name_or_path

        # Read classification config from your adapter folder's config.json (id2label etc.)
        hf_cfg = AutoConfig.from_pretrained(str(adapter_path))

        self.tokenizer = AutoTokenizer.from_pretrained(str(adapter_path), use_fast=True)

        base = AutoModelForSequenceClassification.from_pretrained(
            base_model_name,
            config=hf_cfg
        )

        self.model = PeftModel.from_pretrained(base, str(adapter_path))
        self.model.to(self.device)
        self.model.eval()

    @torch.inference_mode()
    def predict(self, text: str) -> tuple[str, float]:
        text = text.strip()

        inputs = self.tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            padding=True,
            max_length=self.max_len,
        ).to(self.device)

        outputs = self.model(**inputs)
        probs = torch.softmax(outputs.logits, dim=-1)[0]
        pred_id = int(torch.argmax(probs).item())
        confidence = float(probs[pred_id].item())

        # Use label names from config if present
        id2label = getattr(self.model.config, "id2label", None) or {}
        label = id2label.get(pred_id, str(pred_id))

        return label, confidence

    @torch.inference_mode()
    def predict_proba(self, texts: list[str]):
        # LIME passes a list of strings
        inputs = self.tokenizer(
            texts,
            return_tensors="pt",
            truncation=True,
            padding=True,
            max_length=self.max_len,
        ).to(self.device)

        outputs = self.model(**inputs)
        probs = torch.softmax(outputs.logits, dim=-1)
        # Return numpy array of shape (n_samples, n_classes)
        return probs.cpu().numpy()


def load_inference_model() -> InferenceModel:
    load_dotenv()

    # Resolve adapter path relative to repo root
    repo_root = Path(__file__).resolve().parents[1]
    adapter_env = os.getenv("ADAPTER_PATH", "model/roberta-lora-fake-news")
    adapter_path = (repo_root / adapter_env).resolve()

    max_len = int(os.getenv("MAX_LEN", "256"))

    if not adapter_path.exists():
        raise FileNotFoundError(f"Adapter path not found: {adapter_path}")

    return InferenceModel(adapter_path=adapter_path, max_len=max_len)
