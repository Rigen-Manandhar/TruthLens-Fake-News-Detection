from __future__ import annotations

import os
import re
from pathlib import Path
from urllib.parse import urlparse

import torch
from dotenv import load_dotenv
from peft import PeftConfig, PeftModel
from transformers import AutoConfig, AutoModelForSequenceClassification, AutoTokenizer


HEADLINE_ONLY_WORD_CUTOFF = 30
BODY_MIN_WORDS_FOR_B = 80
CONFLICT_CONFIDENCE_THRESHOLD = 0.80
LOW_CONFIDENCE_THRESHOLD = 0.65


DATELINE_PATTERNS = [
    re.compile(r"^[A-Z][A-Z\s,\.\-']{2,80}\((Reuters|AP|AFP)\)\s*[-—:]", re.IGNORECASE),
    re.compile(
        r"^[A-Z][A-Za-z\s,\.\-']{2,80},\s*[A-Z][A-Za-z\s,\.\-']{2,80}\((Reuters|AP|AFP)\)\s*[-—:]",
        re.IGNORECASE,
    ),
    re.compile(r"^(Reuters|AP|AFP)\s*[-—:]", re.IGNORECASE),
]


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


class HybridModelLoader:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.repo_root = Path(__file__).resolve().parents[1]
        load_dotenv(self.repo_root / ".env")

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
            with open(self.source_cred_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as exc:
            print(f"Error loading source DB: {exc}")
            return []

    def _normalize_ws(self, text: str) -> str:
        return " ".join((text or "").strip().split())

    def _word_count(self, text: str | None) -> int:
        if not text:
            return 0
        return len(re.findall(r"\b\w+\b", text))

    def _truncate_words(self, text: str, limit: int) -> str:
        words = (text or "").split()
        if len(words) <= limit:
            return " ".join(words)
        return " ".join(words[:limit]).strip()

    def _is_dateline_like(self, text: str) -> bool:
        sample = (text or "").strip()
        if not sample:
            return False
        for pattern in DATELINE_PATTERNS:
            if pattern.match(sample):
                return True
        return False

    def _strip_dateline_prefix(self, text: str) -> str:
        sample = (text or "").strip()
        if not sample:
            return ""

        stripped = re.sub(
            r"^[A-Z][A-Z\s,\.\-']{2,80}\((Reuters|AP|AFP)\)\s*[-—:]\s*",
            "",
            sample,
            flags=re.IGNORECASE,
        )
        stripped = re.sub(
            r"^[A-Z][A-Za-z\s,\.\-']{2,80},\s*[A-Z][A-Za-z\s,\.\-']{2,80}\((Reuters|AP|AFP)\)\s*[-—:]\s*",
            "",
            stripped,
            flags=re.IGNORECASE,
        )
        stripped = re.sub(
            r"^(Reuters|AP|AFP)\s*[-—:]\s*",
            "",
            stripped,
            flags=re.IGNORECASE,
        )
        return self._normalize_ws(stripped)

    def _is_plausible_headline(self, text: str) -> bool:
        sample = self._normalize_ws(text)
        words = self._word_count(sample)
        if words < 4 or words > 35:
            return False
        if len(sample) > 220:
            return False
        if sample.endswith((";", ",")):
            return False
        return True

    def _delimiter_candidate(self, text: str) -> str | None:
        sample = self._normalize_ws(text)
        if not sample:
            return None

        delimiter_match = re.search(r"\s(?:—|\||:)\s", sample)
        if delimiter_match:
            candidate = sample[: delimiter_match.start()].strip()
            words = self._word_count(candidate)
            if 8 <= words <= 15:
                return candidate

        words = sample.split()
        if len(words) >= 8:
            candidate = " ".join(words[:15])
            return candidate

        return None

    def _build_headline_candidates(
        self,
        text: str,
        lines: list[str],
        paragraphs: list[str],
        title_candidates: list[str] | None,
    ) -> list[tuple[str, str]]:
        candidates: list[tuple[str, str]] = []
        seen: set[str] = set()

        def add_candidate(value: str, source: str):
            normalized = self._normalize_ws(value)
            if not normalized:
                return
            key = normalized.lower()
            if key in seen:
                return
            seen.add(key)
            candidates.append((normalized, source))

        for candidate in title_candidates or []:
            add_candidate(candidate, "explicit_title")

        if lines:
            add_candidate(lines[0], "first_line")

        if paragraphs:
            add_candidate(paragraphs[0], "first_paragraph")

        first_sentence = re.split(r"(?<=[.!?])\s+", self._normalize_ws(text), maxsplit=1)[0].strip()
        if first_sentence and self._word_count(first_sentence) <= 20:
            add_candidate(first_sentence, "first_sentence")

        delimiter = self._delimiter_candidate(text)
        if delimiter:
            add_candidate(delimiter, "delimiter_chunk")

        return candidates

    def _select_headline(self, candidates: list[tuple[str, str]]) -> tuple[str | None, str | None]:
        for candidate, source in candidates:
            if self._is_dateline_like(candidate):
                stripped = self._strip_dateline_prefix(candidate)
                if stripped and self._is_plausible_headline(stripped) and not self._is_dateline_like(stripped):
                    return stripped, f"{source}_dateline_stripped"
                continue

            if self._is_plausible_headline(candidate):
                return candidate, source

        return None, None

    def _extract_body(self, text: str, headline: str | None, headline_source: str | None) -> str:
        cleaned_text = (text or "").strip()
        if not cleaned_text:
            return ""
        if not headline:
            return cleaned_text

        lines = [line.strip() for line in cleaned_text.splitlines() if line.strip()]
        paragraphs = [p.strip() for p in re.split(r"\n\s*\n+", cleaned_text) if p.strip()]

        if headline_source in {"first_line", "first_line_dateline_stripped"} and len(lines) > 1:
            return "\n".join(lines[1:]).strip()

        if headline_source in {"first_paragraph", "first_paragraph_dateline_stripped"} and len(paragraphs) > 1:
            return "\n\n".join(paragraphs[1:]).strip()

        lowered_text = cleaned_text.lower()
        lowered_headline = headline.lower()
        if lowered_text.startswith(lowered_headline):
            trimmed = cleaned_text[len(headline) :].lstrip(" \n\t-—:|")
            return trimmed.strip()

        return cleaned_text

    def parse_input(
        self,
        text: str,
        input_mode: str = "auto",
        title_candidates: list[str] | None = None,
    ) -> dict:
        cleaned_text = (text or "").strip()
        lines = [line.strip() for line in cleaned_text.splitlines() if line.strip()]
        paragraphs = [p.strip() for p in re.split(r"\n\s*\n+", cleaned_text) if p.strip()]

        normalized_mode = (input_mode or "auto").lower()
        if normalized_mode not in {"auto", "headline_only", "full_article", "headline_plus_article"}:
            normalized_mode = "auto"

        total_words = self._word_count(cleaned_text)
        if len(paragraphs) > 1:
            detected_shape = "multi_paragraph"
        elif len(lines) > 1:
            detected_shape = "line_breaks"
        elif total_words <= HEADLINE_ONLY_WORD_CUTOFF:
            detected_shape = "short_single_block"
        else:
            detected_shape = "single_block"

        candidates = self._build_headline_candidates(cleaned_text, lines, paragraphs, title_candidates)
        selected_headline, headline_source = self._select_headline(candidates)
        extracted_body = self._extract_body(cleaned_text, selected_headline, headline_source)

        headline_text: str | None = None
        body_text: str | None = None

        if normalized_mode == "headline_only":
            headline_text = selected_headline or self._truncate_words(cleaned_text, HEADLINE_ONLY_WORD_CUTOFF)
            body_text = None
        elif normalized_mode == "full_article":
            headline_text = None
            body_text = cleaned_text
        elif normalized_mode == "headline_plus_article":
            headline_text = selected_headline
            body_text = extracted_body or cleaned_text
            if headline_text and body_text and body_text.strip().lower() == headline_text.strip().lower():
                body_text = cleaned_text
        else:
            if detected_shape == "short_single_block":
                headline_text = selected_headline or self._truncate_words(cleaned_text, HEADLINE_ONLY_WORD_CUTOFF)
                body_text = None
            else:
                headline_text = selected_headline
                if headline_text:
                    body_text = extracted_body
                    if body_text and body_text.strip().lower() == headline_text.strip().lower():
                        body_text = None
                else:
                    body_text = cleaned_text

        headline_text = self._normalize_ws(headline_text or "")
        body_text = (body_text or "").strip()

        if not headline_text:
            headline_text = None
        if not body_text:
            body_text = None

        return {
            "used_mode": normalized_mode,
            "detected_shape": detected_shape,
            "headline_text": headline_text,
            "body_text": body_text,
            "headline_source": headline_source,
            "headline_word_count": self._word_count(headline_text),
            "body_word_count": self._word_count(body_text),
        }

    def check_source(self, url: str | None) -> dict:
        if not url:
            return {"score": 0, "reason": "No URL provided"}

        try:
            value = url if url.startswith(("http://", "https://")) else f"http://{url}"
            parsed = urlparse(value)
            domain = (parsed.netloc or "").lower()
            if domain.startswith("www."):
                domain = domain[4:]
            domain = domain.split(":", 1)[0]
        except Exception:
            return {"score": 0, "reason": "Invalid URL"}

        if not domain:
            return {"score": 0, "reason": "Invalid URL"}

        for entry in self.source_db:
            entry_domain = str(entry.get("domain", "")).lower().strip()
            if not entry_domain:
                continue
            if domain == entry_domain or domain.endswith(f".{entry_domain}"):
                score = 0
                label = str(entry.get("type", "")).upper()
                msg = f"Domain {domain} found: {label}"

                if label in {"FAKE", "SATIRE"}:
                    score = 3
                elif label == "BIASED":
                    score = 1
                elif label == "REAL":
                    score = -2

                return {"score": score, "reason": msg, "details": entry}

        return {"score": 0, "reason": "Domain not in database"}

    def _label_to_class(self, label: str) -> str:
        upper = (label or "").upper()
        # Numeric fallback mapping:
        # label 0 / LABEL_0 => REAL
        # label 1 / LABEL_1 => FAKE
        # This follows the training convention used by the adapters.
        if "FAKE" in upper or "FALSE" in upper or label == "1" or upper == "LABEL_1":
            return "FAKE"
        if "REAL" in upper or "TRUE" in upper or label == "0" or upper == "LABEL_0":
            return "REAL"
        return "UNKNOWN"

    def _build_uncertainty(self, reason_code: str | None, reason_message: str | None) -> dict:
        return {"reason_code": reason_code, "reason_message": reason_message}

    def analyze(
        self,
        text: str,
        url: str | None = None,
        input_mode: str = "auto",
        title_candidates: list[str] | None = None,
    ) -> dict:
        total_score = 0
        steps: list[dict] = []

        source_res = self.check_source(url)
        total_score += int(source_res.get("score", 0))
        steps.append(
            {
                "step": "Source Check",
                "score_impact": int(source_res.get("score", 0)),
                "details": str(source_res.get("reason", "")),
            }
        )

        parsed = self.parse_input(text, input_mode=input_mode, title_candidates=title_candidates)
        steps.append(
            {
                "step": "Input Parsing",
                "score_impact": 0,
                "details": (
                    f"Mode: {parsed['used_mode']}, Shape: {parsed['detected_shape']}, "
                    f"Headline words: {parsed['headline_word_count']}, Body words: {parsed['body_word_count']}"
                ),
            }
        )

        model_outputs = {
            "model_a": {
                "ran": False,
                "label": None,
                "confidence": None,
                "score_impact": 0,
                "input_word_count": parsed["headline_word_count"],
            },
            "model_b": {
                "ran": False,
                "label": None,
                "confidence": None,
                "score_impact": 0,
                "input_word_count": parsed["body_word_count"],
            },
        }

        headline_text = parsed.get("headline_text") or ""
        body_text = parsed.get("body_text") or ""
        headline_words = int(parsed.get("headline_word_count") or 0)
        body_words = int(parsed.get("body_word_count") or 0)

        run_a = False
        run_b = False
        used_mode = parsed["used_mode"]

        if used_mode == "headline_only":
            run_a = headline_words > 0
        elif used_mode == "full_article":
            run_b = body_words >= BODY_MIN_WORDS_FOR_B
        elif used_mode == "headline_plus_article":
            run_a = headline_words > 0
            run_b = body_words >= BODY_MIN_WORDS_FOR_B
        else:
            has_headline = headline_words > 0
            has_body = body_words >= BODY_MIN_WORDS_FOR_B
            if has_headline and has_body:
                run_a = True
                run_b = True
            elif has_headline:
                run_a = True
            elif has_body:
                run_b = True

        if not run_a and not run_b:
            steps.append(
                {
                    "step": "Routing",
                    "score_impact": 0,
                    "details": (
                        "Insufficient parsed text to run Model A or B. "
                        f"Headline words: {headline_words}, Body words: {body_words}."
                    ),
                }
            )
            return {
                "final_score": total_score,
                "verdict": "UNCERTAIN",
                "risk_level": "Needs Review",
                "steps": steps,
                "article_class": "UNKNOWN",
                "uncertainty": self._build_uncertainty(
                    "INSUFFICIENT_TEXT",
                    "Not enough text was available for reliable model analysis.",
                ),
                "parse_metadata": {
                    "used_mode": used_mode,
                    "detected_shape": parsed["detected_shape"],
                    "headline_word_count": headline_words,
                    "body_word_count": body_words,
                    "headline_source": parsed.get("headline_source"),
                },
                "model_outputs": model_outputs,
                "conflict": {
                    "is_conflict": False,
                    "threshold": CONFLICT_CONFIDENCE_THRESHOLD,
                    "raw_score_before_override": total_score,
                },
                "lime_model": None,
                "lime_input_text": None,
            }

        headline_label = None
        headline_conf = None
        headline_class = "UNKNOWN"
        hl_score = 0

        if run_a:
            headline_label, headline_conf = self.model_headline.predict(headline_text)
            headline_class = self._label_to_class(headline_label)
            if headline_class == "FAKE" and headline_conf > 0.60:
                hl_score = 2
            elif headline_class == "REAL" and headline_conf > 0.60:
                hl_score = -2

            total_score += hl_score
            model_outputs["model_a"] = {
                "ran": True,
                "label": headline_label,
                "confidence": headline_conf,
                "score_impact": hl_score,
                "input_word_count": headline_words,
            }
            steps.append(
                {
                    "step": "Headline Check",
                    "score_impact": hl_score,
                    "details": f"Label: {headline_label}, Conf: {headline_conf:.2f}",
                    "sentence_preview": headline_text[:140],
                }
            )
        else:
            steps.append(
                {
                    "step": "Headline Check",
                    "score_impact": 0,
                    "details": "Skipped: no usable headline candidate.",
                }
            )

        body_label = None
        body_conf = None
        body_class = "UNKNOWN"
        art_score = 0

        if run_b:
            body_label, body_conf = self.model_article.predict(body_text)
            body_class = self._label_to_class(body_label)
            if body_class == "FAKE" and body_conf > 0.85:
                art_score = 1
            elif body_class == "REAL" and body_conf > 0.97:
                art_score = -1

            if run_a:
                if hl_score > 0 and art_score < 0:
                    art_score = 0
                elif hl_score < 0 and art_score > 0:
                    art_score = 0

            total_score += art_score
            model_outputs["model_b"] = {
                "ran": True,
                "label": body_label,
                "confidence": body_conf,
                "score_impact": art_score,
                "input_word_count": body_words,
            }
            steps.append(
                {
                    "step": "Article Check",
                    "score_impact": art_score,
                    "details": f"Label: {body_label}, Conf: {body_conf:.2f}",
                    "input_preview": body_text[:180],
                }
            )
        else:
            steps.append(
                {
                    "step": "Article Check",
                    "score_impact": 0,
                    "details": (
                        f"Skipped: body text below minimum length ({BODY_MIN_WORDS_FOR_B} words required)."
                    ),
                }
            )

        if total_score >= 2:
            verdict = "SUSPICIOUS"
            risk_level = "High Risk"
        elif total_score <= -2:
            verdict = "LIKELY REAL"
            risk_level = "Low Risk"
        else:
            verdict = "UNCERTAIN"
            risk_level = "Needs Review"

        uncertainty = self._build_uncertainty(None, None)
        conflict = {
            "is_conflict": False,
            "threshold": CONFLICT_CONFIDENCE_THRESHOLD,
            "raw_score_before_override": total_score,
        }

        if (
            run_a
            and run_b
            and headline_class in {"FAKE", "REAL"}
            and body_class in {"FAKE", "REAL"}
            and headline_class != body_class
            and headline_conf is not None
            and body_conf is not None
            and headline_conf >= CONFLICT_CONFIDENCE_THRESHOLD
            and body_conf >= CONFLICT_CONFIDENCE_THRESHOLD
        ):
            conflict["is_conflict"] = True
            verdict = "UNCERTAIN"
            risk_level = "Needs Review"
            uncertainty = self._build_uncertainty(
                "CONFLICT",
                "Model A and Model B strongly disagree on this content.",
            )
        else:
            primary_conf = body_conf if run_b else headline_conf
            if primary_conf is not None and primary_conf < LOW_CONFIDENCE_THRESHOLD:
                verdict = "UNCERTAIN"
                risk_level = "Needs Review"
                uncertainty = self._build_uncertainty(
                    "LOW_CONFIDENCE",
                    "The primary model confidence is below the reliability threshold.",
                )
            elif verdict == "UNCERTAIN":
                uncertainty = self._build_uncertainty(
                    "LOW_CONFIDENCE",
                    "Signals were mixed and require manual review.",
                )

        article_class = body_class if run_b else headline_class

        lime_model = None
        lime_input_text = None
        if run_b and body_text:
            lime_model = "B"
            lime_input_text = body_text
        elif run_a and headline_text:
            lime_model = "A"
            lime_input_text = headline_text

        return {
            "final_score": total_score,
            "verdict": verdict,
            "risk_level": risk_level,
            "steps": steps,
            "article_class": article_class,
            "uncertainty": uncertainty,
            "parse_metadata": {
                "used_mode": used_mode,
                "detected_shape": parsed["detected_shape"],
                "headline_word_count": headline_words,
                "body_word_count": body_words,
                "headline_source": parsed.get("headline_source"),
            },
            "model_outputs": model_outputs,
            "conflict": conflict,
            "lime_model": lime_model,
            "lime_input_text": lime_input_text,
        }


original_loader = None


def get_hybrid_model():
    global original_loader
    if original_loader is None:
        original_loader = HybridModelLoader()
    return original_loader
