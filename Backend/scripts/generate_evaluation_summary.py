from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MODEL_DIR = ROOT / "model"


def _load_training_info(model_name: str) -> dict:
    path = MODEL_DIR / model_name / "training_info.json"
    return json.loads(path.read_text(encoding="utf-8"))


def _percent(value: float | None) -> str:
    if value is None:
        return "n/a"
    return f"{value * 100:.2f}%"


def _model_row(label: str, info: dict) -> str:
    metrics = info.get("final_metrics", {})
    return (
        f"| {label} | {info.get('config', {}).get('base_model', 'unknown')} | "
        f"{info.get('valid_samples', 'n/a')} | "
        f"{_percent(metrics.get('eval_accuracy'))} | "
        f"{_percent(metrics.get('eval_macro_f1'))} | "
        f"{_percent(metrics.get('eval_fake_recall'))} | "
        f"{_percent(metrics.get('eval_real_recall'))} |"
    )


def build_summary() -> str:
    model_a = _load_training_info("model_a")
    model_b = _load_training_info("model_b")
    b_metrics = model_b.get("final_metrics", {})

    confusion = ""
    if all(key in b_metrics for key in ("eval_tp", "eval_fp", "eval_fn", "eval_tn")):
        confusion = (
            "\nModel B confusion matrix from saved validation metadata:\n\n"
            "| | Predicted fake | Predicted real |\n"
            "| --- | ---: | ---: |\n"
            f"| Actual fake | {b_metrics['eval_tp']} | {b_metrics['eval_fn']} |\n"
            f"| Actual real | {b_metrics['eval_fp']} | {b_metrics['eval_tn']} |\n"
        )

    return f"""# TruthLens Model Evaluation Summary

This summary is generated from the checked-in `training_info.json` metadata. It should be used for defense/report wording instead of the more promotional model README files.

| Model | Base | Validation samples | Accuracy | Macro F1 | Fake recall | Real recall |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
{_model_row("Model A headline/claim language signal", model_a)}
{_model_row("Model B article language signal", model_b)}
{confusion}
## Interpretation

- These metrics show validation performance on prepared datasets, not real-world truth verification.
- RoBERTa can learn language and dataset patterns, but it cannot prove whether a real-world event happened.
- Model B is tuned toward catching more fake examples, which can increase false positives against real articles.
- The product therefore treats model outputs as language signals and combines them with source credibility, extraction quality, evidence hints, conflict handling, and uncertainty.

## Defense wording

I do not claim RoBERTa can determine truth. It only detects language patterns learned from training data. The improved system treats RoBERTa as one weak-to-moderate signal and combines it with source credibility, extraction quality, evidence hints, and uncertainty handling. The project's main contribution is showing a safer hybrid workflow for misinformation review, including where automation fails.
"""


def main() -> None:
    print(build_summary())


if __name__ == "__main__":
    main()
