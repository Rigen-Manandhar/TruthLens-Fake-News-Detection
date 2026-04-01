from __future__ import annotations

import json
import os
from pathlib import Path

import torch
from dotenv import load_dotenv

from app.inference_model import InferenceModel
from app.parsing import BODY_MIN_WORDS_FOR_B, parse_input
from app.scoring import (
    CONFLICT_CONFIDENCE_THRESHOLD,
    build_uncertainty,
    check_source,
    determine_model_runs,
    label_to_class,
    resolve_verdict,
)


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
        if not self.source_cred_path.exists():
            print(f"Warning: Source DB not found at {self.source_cred_path}")
            return []

        try:
            with open(self.source_cred_path, "r", encoding="utf-8") as file:
                return json.load(file)
        except Exception as exc:
            print(f"Error loading source DB: {exc}")
            return []

    def check_source(self, url: str | None) -> dict:
        return check_source(url, self.source_db)

    def analyze(
        self,
        text: str,
        url: str | None = None,
        input_mode: str = "auto",
        title_candidates: list[str] | None = None,
    ) -> dict:
        total_score = 0
        steps: list[dict] = []

        source_res = check_source(url, self.source_db)
        total_score += int(source_res.get("score", 0))
        steps.append(
            {
                "step": "Source Check",
                "score_impact": int(source_res.get("score", 0)),
                "details": str(source_res.get("reason", "")),
            }
        )

        parsed = parse_input(text, input_mode=input_mode, title_candidates=title_candidates)
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

        run_a, run_b = determine_model_runs(
            parsed["used_mode"], headline_words, body_words, BODY_MIN_WORDS_FOR_B
        )

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
                "uncertainty": build_uncertainty(
                    "INSUFFICIENT_TEXT",
                    "Not enough text was available for reliable model analysis.",
                ),
                "parse_metadata": {
                    "used_mode": parsed["used_mode"],
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
        headline_score = 0

        if run_a:
            headline_label, headline_conf = self.model_headline.predict(headline_text)
            headline_class = label_to_class(headline_label)
            if headline_class == "FAKE" and headline_conf > 0.60:
                headline_score = 2
            elif headline_class == "REAL" and headline_conf > 0.60:
                headline_score = -2

            total_score += headline_score
            model_outputs["model_a"] = {
                "ran": True,
                "label": headline_label,
                "confidence": headline_conf,
                "score_impact": headline_score,
                "input_word_count": headline_words,
            }
            steps.append(
                {
                    "step": "Headline Check",
                    "score_impact": headline_score,
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
        article_score = 0

        if run_b:
            body_label, body_conf = self.model_article.predict(body_text)
            body_class = label_to_class(body_label)
            if body_class == "FAKE" and body_conf > 0.85:
                article_score = 1
            elif body_class == "REAL" and body_conf > 0.97:
                article_score = -1

            if run_a:
                if headline_score > 0 and article_score < 0:
                    article_score = 0
                elif headline_score < 0 and article_score > 0:
                    article_score = 0

            total_score += article_score
            model_outputs["model_b"] = {
                "ran": True,
                "label": body_label,
                "confidence": body_conf,
                "score_impact": article_score,
                "input_word_count": body_words,
            }
            steps.append(
                {
                    "step": "Article Check",
                    "score_impact": article_score,
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

        verdict, risk_level, uncertainty, conflict = resolve_verdict(
            total_score,
            run_a,
            run_b,
            headline_class,
            body_class,
            headline_conf,
            body_conf,
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
                "used_mode": parsed["used_mode"],
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
