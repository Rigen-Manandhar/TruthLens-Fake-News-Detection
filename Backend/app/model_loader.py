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

        # Read classification config from base model to ensure correct dimensions (e.g. 514 vs 512 embeddings)
        # We attempt to load from adapter_path first only if config.json exists, otherwise base.
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
            ignore_mismatched_sizes=True
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



class HybridModelLoader:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.repo_root = Path(__file__).resolve().parents[1]
        load_dotenv(self.repo_root / ".env")
        
        # Load Source Credibility DB
        self.source_cred_path = self.repo_root / "app" / "data" / "source_credibility.json"
        self.source_db = self._load_source_db()

        headline_model_path = self._resolve_model_dir(
            env_var="HEADLINE_MODEL_PATH",
            fallback_dirs=["model_a", "roberta-lora-liar"],
        )
        article_model_path = self._resolve_model_dir(
            env_var="ARTICLE_MODEL_PATH",
            fallback_dirs=["model_b", "roberta-lora-diverse"],
        )

        # Load Models
        print(f"Loading Headline Model from: {headline_model_path}")
        self.model_headline = InferenceModel(headline_model_path)
        
        print(f"Loading Article Model from: {article_model_path}")
        self.model_article = InferenceModel(article_model_path)

    def _resolve_model_dir(self, env_var: str, fallback_dirs: list[str]) -> Path:
        def is_valid_adapter_dir(path: Path) -> bool:
            return (path / "adapter_config.json").exists()

        configured = os.getenv(env_var, "").strip()
        if configured:
            configured_path = Path(configured)
            if not configured_path.is_absolute():
                configured_path = self.repo_root / configured_path
            if is_valid_adapter_dir(configured_path):
                return configured_path
            raise FileNotFoundError(
                f"{env_var} points to '{configured_path}', but adapter_config.json was not found."
            )

        tried_paths = []
        for dirname in fallback_dirs:
            candidate = self.repo_root / "model" / dirname
            tried_paths.append(str(candidate))
            if is_valid_adapter_dir(candidate):
                return candidate

        raise FileNotFoundError(
            f"Could not resolve a valid model directory for {env_var}. "
            f"Tried: {', '.join(tried_paths)}"
        )

    def _load_source_db(self):
        import json
        if not self.source_cred_path.exists():
            print(f"Warning: Source DB not found at {self.source_cred_path}")
            return []
        try:
            with open(self.source_cred_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading source DB: {e}")
            return []

    def check_source(self, url: str) -> dict:
        from urllib.parse import urlparse
        if not url:
            return {"score": 0, "reason": "No URL provided"}
        
        try:
            # Add http if missing to help urlparse
            if not url.startswith(('http://', 'https://')):
                url = 'http://' + url
            parsed = urlparse(url)
            domain = parsed.netloc.lower()
            # Strip www.
            if domain.startswith("www."):
                domain = domain[4:]
        except:
            return {"score": 0, "reason": "Invalid URL"}

        for entry in self.source_db:
            # Simple substring match or exact match? JSON has plain domains "cnn.com"
            # It implies exact or subdomain match. Let's do exact for now.
            if entry["domain"] == domain:
                score = 0
                label = entry.get("type", "").upper()
                msg = f"Domain {domain} found: {label}"
                
                # Logic: Fake/Satire -> +3, Biased -> +1, Real -> -2
                if label in ["FAKE", "SATIRE"]:
                    score = 3
                elif label == "BIASED":
                    score = 1
                elif label == "REAL":
                    score = -2
                
                return {"score": score, "reason": msg, "details": entry}
        
        return {"score": 0, "reason": "Domain not in database"}

    def analyze(self, text: str, url: str = None) -> dict:
        total_score = 0
        steps = []

        # Step 1: Source Check
        source_res = self.check_source(url)
        total_score += source_res["score"]
        steps.append({
            "step": "Source Check",
            "score_impact": source_res["score"],
            "details": source_res["reason"]
        })

        # Step 2: Headline Check (First Line or First Sentence)
        # Try splitting by newline first to get the "Title"
        lines = text.strip().split('\n', 1)
        if len(lines) > 0 and 5 < len(lines[0]) < 200:
            first_sentence = lines[0].strip()
        else:
            # Fallback to period splitting
            first_sentence = text
            if "." in text:
                first_sentence = text.split('.', 1)[0] + "."
        
        # Guard against empty text
        if not first_sentence.strip():
            first_sentence = "Empty text"
            
        label_hl, conf_hl = self.model_headline.predict(first_sentence)
        
        hl_score = 0
        label_hl_upper = label_hl.upper()
        is_fake_hl = (
            "FAKE" in label_hl_upper
            or "FALSE" in label_hl_upper
            or label_hl == "0"
            or label_hl_upper == "LABEL_0"
        )
        is_real_hl = (
            "REAL" in label_hl_upper
            or "TRUE" in label_hl_upper
            or label_hl == "1"
            or label_hl_upper == "LABEL_1"
        )
        
        # Logic:
        # Headline Model (~65% Acc) captures nuance/clickbait; treat as primary signal.
        # FAKE (>60%) -> +2 (Stronger warning)
        # REAL (>60%) -> -2 (Stronger positive signal)
        if is_fake_hl and conf_hl > 0.60:
            hl_score = 2
        elif is_real_hl and conf_hl > 0.60:
            hl_score = -2
        
        total_score += hl_score
        steps.append({
            "step": "Headline Check",
            "score_impact": hl_score,
            "details": f"Label: {label_hl}, Conf: {conf_hl:.2f}",
            "sentence_preview": first_sentence[:100]
        })

        # Step 3: Article Check (Full Text)
        label_full, conf_full = self.model_article.predict(text)
        art_score = 0
        
        label_full_upper = label_full.upper()
        is_fake_full = (
            "FAKE" in label_full_upper
            or "FALSE" in label_full_upper
            or label_full == "0"
            or label_full_upper == "LABEL_0"
        )
        is_real_full = (
            "REAL" in label_full_upper
            or "TRUE" in label_full_upper
            or label_full == "1"
            or label_full_upper == "LABEL_1"
        )

        if is_fake_full:
            article_class = "FAKE"
        elif is_real_full:
            article_class = "REAL"
        else:
            article_class = "UNKNOWN"
        
        # Logic:
        # Article Model (~99% Acc) can be keyword-biased; treat as secondary signal.
        # FAKE (>85%) -> +1 (Moderate signal)
        # REAL (>97%) -> -1 (Moderate signal)
        if is_fake_full and conf_full > 0.85:
            art_score = 1
        elif is_real_full and conf_full > 0.97:
            art_score = -1

        # Only let the article model reinforce the headline signal.
        if hl_score > 0 and art_score < 0:
            art_score = 0
        elif hl_score < 0 and art_score > 0:
            art_score = 0
            
        total_score += art_score
        steps.append({
            "step": "Article Check",
            "score_impact": art_score,
            "details": f"Label: {label_full}, Conf: {conf_full:.2f}"
        })

        # Final Verdict
        if total_score >= 2:
            verdict = "SUSPICIOUS"
            risk = "High Risk"
        elif total_score <= -2:
            verdict = "LIKELY REAL"
            risk = "Low Risk"
        else:
            verdict = "UNCERTAIN"
            risk = "Medium Risk"

        return {
            "final_score": total_score,
            "verdict": verdict,
            "risk_level": risk,
            "steps": steps,
            "article_class": article_class
        }

original_loader = None

def get_hybrid_model():
    global original_loader
    if original_loader is None:
        original_loader = HybridModelLoader()
    return original_loader
