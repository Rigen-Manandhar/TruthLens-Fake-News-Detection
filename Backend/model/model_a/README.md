---
base_model: roberta-base
library_name: peft
tags:
- base_model:adapter:roberta-base
- lora
- transformers
---

# Model A — Headline/Claim Fake News Classifier

## Overview

Model A is a **headline-level fake news classifier** built on **RoBERTa-base** with **LoRA** (Low-Rank Adaptation) fine-tuning. It classifies short text inputs (headlines, claims, titles) as either **REAL** or **FAKE** with high accuracy.

- **Architecture:** RoBERTa-base (125M params) + LoRA adapters (~0.6M trainable params)
- **Task:** Binary text classification (REAL vs FAKE)
- **Input:** Short text — headlines, claims, titles (max 128 tokens)
- **Output:** Probability scores for REAL and FAKE classes

---

## Performance

| Metric      | Score    |
|-------------|----------|
| **Accuracy**    | 93.55%   |
| **Precision**   | 93.64%   |
| **Recall**      | 93.33%   |
| **Macro F1**    | 93.46%   |
| **Eval Loss**   | 0.1223   |

### Batch Test Results (101 Headlines)

| Category | Correct | Total | Accuracy |
|----------|---------|-------|----------|
| Fake Headlines | 44 | 50 | 88% |
| Real Headlines | 51 | 51 | 100% |
| **Overall** | **95** | **101** | **94.1%** |

The model achieves **100% accuracy on real headlines** and **88% on fake headlines** including challenging "boring fake" styled headlines that mimic official-sounding news.

---

## Training Data

### Datasets Used

| Dataset | Samples | Type | Description |
|---------|---------|------|-------------|
| **LIAR** | 12,791 | Headlines/Claims | Political claims from PolitiFact with 6-class labels mapped to binary |
| **FakeNewsNet** | 23,779 | Headlines + Articles | PolitiFact and GossipCop news articles with real/fake labels |
| **ISOT** (Kaggle) | 44,902 | Headlines + Articles | Reuters real news + fabricated fake news articles |
| **Diverse** | ~35,000 | Headlines + Articles | Combined diverse news sources for broader coverage |
| **New Real Headlines** | ~600 | Headlines | Freshly scraped real headlines from BBC, CNN, Al Jazeera, Reuters |
| **Targeted Real Headlines** | ~600 | Headlines | Real headlines specifically matching boring-fake topics |
| **Synthetic Boring Fakes** | 3,000 | Headlines + Articles | Template-generated official-sounding fake articles |

**Total after deduplication and preprocessing: 81,887 samples** (65,509 train / 8,189 valid / 8,189 test)

### Why Multiple Datasets?

Each dataset contributes different characteristics:
- **LIAR:** Political claims with nuanced truthfulness (6 categories → binary)
- **FakeNewsNet:** Social media context and engagement-based fake news
- **ISOT:** Clean, large-scale news articles with clear real/fake separation
- **Diverse:** Broader topic coverage to prevent topic bias
- **Custom scraped headlines:** Recent, real-world news to ground the model in current events
- **Synthetic boring fakes:** Deliberately crafted official-sounding fake headlines to prevent the "dry tone = real" shortcut

---

## Anti-Shortcut Measures

A major focus of this model's training was preventing **dataset artifact shortcuts** — patterns where the model learns to exploit dataset-specific quirks rather than genuinely detecting fake news.

### 1. ISOT Reuters Fingerprint Cleaning
The ISOT dataset's real articles all originate from Reuters and contain telltale fingerprints:
- `(Reuters)` attribution tags
- `Reporting by ...` and `Editing by ...` bylines
- Reuters-specific dateline formats (`WASHINGTON (Reuters) –`)
- Thomson Reuters Trust Principles notices

All of these were **stripped** to prevent the model from learning "Reuters fingerprint → REAL" as a shortcut.

### 2. Entity Masking (15% probability)
During training, named entities (people, organizations, locations) are randomly replaced with `<MASK>` tokens. This forces the model to learn from **linguistic patterns and writing style** rather than memorizing that specific entities correlate with specific labels.

### 3. Artifact Token Dropout (20% probability)
A dataset classifier identifies tokens that are highly predictive of which *dataset* a sample comes from (rather than its label). These artifact tokens are randomly dropped during training to prevent cross-dataset shortcut learning.

### 4. Leakage Detection
The preprocessing pipeline scans for and removes samples containing leakage patterns:
- Fact-checking terminology ("fact check", "debunked", "hoax")
- Source attribution that reveals the label ("politifact", "snopes")
- Self-referential label language ("this claim is false/true")

---

## Model Architecture

### Base Model: RoBERTa-base
- 12 transformer layers, 768 hidden dimensions, 12 attention heads
- Pre-trained on 160GB of text data
- 125 million parameters (frozen during fine-tuning)

### LoRA Adapter Configuration
| Parameter | Value |
|-----------|-------|
| LoRA rank (r) | 16 |
| LoRA alpha (α) | 32 |
| LoRA dropout | 0.05 |
| Target modules | query, value |
| Modules to save | classifier, score |
| Trainable parameters | ~600K (0.48% of total) |

The `modules_to_save: ["classifier", "score"]` ensures the classification head is fully trained and saved alongside the LoRA adapters, not randomly initialized at inference.

### Training Hyperparameters

| Parameter | Value |
|-----------|-------|
| Max sequence length | 128 tokens |
| Batch size | 16 |
| Gradient accumulation | 2 (effective batch: 32) |
| Learning rate | 2e-4 |
| Epochs | 5 |
| Warmup ratio | 0.06 |
| Weight decay | 0.01 |
| Precision | FP16 mixed |
| Early stopping | Patience 2 (macro F1) |
| Optimizer | AdamW |
| Seed | 42 |

---

## Preprocessing Pipeline

All input data goes through a multi-stage preprocessing pipeline before training:

1. **Text Cleaning** — Unicode normalization, HTML removal, whitespace normalization, URL/email/mention replacement
2. **Leakage Detection** — Scans for fact-checking terminology that would leak labels
3. **Exact Deduplication** — Content hash-based removal of identical samples
4. **Near Deduplication** — MinHash-based detection of near-duplicate content (Jaccard threshold 0.90)
5. **Artifact Detection** — Trains a dataset classifier to identify tokens that distinguish datasets (rather than labels)
6. **Stratified Splitting** — 80/10/10 train/valid/test split, stratified by label

---

## Usage

```python
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from peft import PeftModel, PeftConfig
import torch

# Load model
model_path = "pipeline_v2/artifacts/models/model_a"
config = PeftConfig.from_pretrained(model_path)
tokenizer = AutoTokenizer.from_pretrained(model_path)
base_model = AutoModelForSequenceClassification.from_pretrained(
    config.base_model_name_or_path, num_labels=2
)
model = PeftModel.from_pretrained(base_model, model_path)
model.eval()

# Predict
headline = "Scientists Confirm Cats Can Speak English, Refuse Out of Spite"
inputs = tokenizer(headline, return_tensors="pt", truncation=True, max_length=128)
with torch.no_grad():
    outputs = model(**inputs)
    probs = torch.nn.functional.softmax(outputs.logits, dim=-1)

prediction = "FAKE" if probs[0][1] > 0.5 else "REAL"
confidence = max(probs[0][0].item(), probs[0][1].item())
print(f"{prediction} ({confidence:.1%})")
# Output: FAKE (99.9%)
```

---

## Limitations

- Optimized for **English** text only
- Designed for **headlines/claims** (short text); for full articles, use Model B
- May struggle with extremely plausible boring-fake headlines in the 50-75% confidence range
- Trained primarily on US/UK news; performance may vary on non-Western news sources

---

## Framework Versions

- Python: 3.10+
- Transformers: 4.x
- PEFT: 0.18.0
- PyTorch: 2.x
- CUDA: 12.x (GPU training)
### Framework versions

- PEFT 0.18.0