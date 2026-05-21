from __future__ import annotations

import math
from collections import defaultdict
from pathlib import Path
from typing import Any

import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
    roc_curve,
)


def sigmoid_np(values: np.ndarray | list[float]) -> np.ndarray:
    array = np.asarray(values, dtype=np.float32)
    return 1.0 / (1.0 + np.exp(-array))


def safe_roc_auc(y_true: list[int] | np.ndarray, y_prob: list[float] | np.ndarray) -> float | None:
    labels = np.asarray(y_true)
    if len(np.unique(labels)) < 2:
        return None
    return float(roc_auc_score(labels, y_prob))


def binary_metrics_from_probs(
    y_true: list[int] | np.ndarray,
    y_prob: list[float] | np.ndarray,
    threshold: float = 0.5,
) -> dict[str, Any]:
    labels = np.asarray(y_true).astype(int)
    probabilities = np.asarray(y_prob, dtype=np.float32)
    predictions = (probabilities >= threshold).astype(int)
    auc = safe_roc_auc(labels, probabilities)

    return {
        "accuracy": float(accuracy_score(labels, predictions)) if len(labels) else None,
        "precision": float(precision_score(labels, predictions, zero_division=0)) if len(labels) else None,
        "recall": float(recall_score(labels, predictions, zero_division=0)) if len(labels) else None,
        "f1": float(f1_score(labels, predictions, zero_division=0)) if len(labels) else None,
        "roc_auc": auc,
        "threshold": float(threshold),
        "num_samples": int(len(labels)),
        "num_positive": int(labels.sum()) if len(labels) else 0,
        "num_negative": int(len(labels) - labels.sum()) if len(labels) else 0,
    }


def find_best_threshold(
    y_true: list[int] | np.ndarray,
    y_prob: list[float] | np.ndarray,
    metric: str = "f1",
) -> float:
    labels = np.asarray(y_true).astype(int)
    probabilities = np.asarray(y_prob, dtype=np.float32)
    if len(labels) == 0 or len(np.unique(labels)) < 2:
        return 0.5

    metric_fn = {
        "f1": lambda yt, yp: f1_score(yt, yp, zero_division=0),
        "accuracy": accuracy_score,
        "precision": lambda yt, yp: precision_score(yt, yp, zero_division=0),
        "recall": lambda yt, yp: recall_score(yt, yp, zero_division=0),
    }.get(metric, lambda yt, yp: f1_score(yt, yp, zero_division=0))

    best_threshold = 0.5
    best_value = -1.0
    for threshold in np.linspace(0.1, 0.9, 81):
        predictions = (probabilities >= threshold).astype(int)
        score = metric_fn(labels, predictions)
        if score > best_value:
            best_value = score
            best_threshold = float(threshold)
    return best_threshold


def aggregate_video_records(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for record in records:
        grouped[record["video_key"]].append(record)

    aggregated: list[dict[str, Any]] = []
    for video_key, items in grouped.items():
        mean_logit = float(np.mean([item["logit"] for item in items]))
        aggregated.append(
            {
                "video_key": video_key,
                "label": int(items[0]["label"]),
                "method": items[0]["method"],
                "compression": items[0]["compression"],
                "num_frames": len(items),
                "logit": mean_logit,
                "prob": float(sigmoid_np([mean_logit])[0]),
            }
        )
    return aggregated


def compute_slice_metrics(
    rows: list[dict[str, Any]],
    group_field: str,
    threshold: float,
) -> dict[str, dict[str, Any]]:
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        grouped[str(row.get(group_field, "unknown"))].append(row)

    output: dict[str, dict[str, Any]] = {}
    for group_name, group_rows in grouped.items():
        labels = [int(row["label"]) for row in group_rows]
        probs = [float(row["prob"]) for row in group_rows]
        output[group_name] = binary_metrics_from_probs(labels, probs, threshold)
    return output


def save_confusion_matrix(
    y_true: list[int] | np.ndarray,
    y_prob: list[float] | np.ndarray,
    threshold: float,
    path: str | Path,
    title: str,
) -> None:
    labels = np.asarray(y_true).astype(int)
    probabilities = np.asarray(y_prob, dtype=np.float32)
    predictions = (probabilities >= threshold).astype(int)
    matrix = confusion_matrix(labels, predictions, labels=[0, 1])

    plt.figure(figsize=(5, 4))
    sns.heatmap(
        matrix,
        annot=True,
        fmt="d",
        cmap="Blues",
        xticklabels=["Real", "Fake"],
        yticklabels=["Real", "Fake"],
    )
    plt.xlabel("Predicted")
    plt.ylabel("Actual")
    plt.title(title)
    plt.tight_layout()
    plt.savefig(path)
    plt.close()


def save_roc_curve(
    y_true: list[int] | np.ndarray,
    y_prob: list[float] | np.ndarray,
    path: str | Path,
    title: str,
) -> None:
    labels = np.asarray(y_true).astype(int)
    probabilities = np.asarray(y_prob, dtype=np.float32)
    if len(np.unique(labels)) < 2:
        return

    fpr, tpr, _ = roc_curve(labels, probabilities)
    auc = roc_auc_score(labels, probabilities)

    plt.figure(figsize=(5, 4))
    plt.plot(fpr, tpr, label=f"ROC-AUC = {auc:.4f}")
    plt.plot([0, 1], [0, 1], linestyle="--", color="gray")
    plt.xlabel("False Positive Rate")
    plt.ylabel("True Positive Rate")
    plt.title(title)
    plt.legend(loc="lower right")
    plt.tight_layout()
    plt.savefig(path)
    plt.close()


def sanitize_for_json(payload: Any) -> Any:
    if isinstance(payload, dict):
        return {key: sanitize_for_json(value) for key, value in payload.items()}
    if isinstance(payload, list):
        return [sanitize_for_json(item) for item in payload]
    if isinstance(payload, tuple):
        return [sanitize_for_json(item) for item in payload]
    if isinstance(payload, np.generic):
        return payload.item()
    if isinstance(payload, float) and (math.isnan(payload) or math.isinf(payload)):
        return None
    return payload
