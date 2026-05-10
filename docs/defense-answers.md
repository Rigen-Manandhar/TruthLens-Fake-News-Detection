# Defense Answers

## What is TruthLens now?

TruthLens is a hybrid misinformation risk assessment system. It does not claim to prove whether news is true or false. It combines source credibility, article extraction quality, RoBERTa language signals, claim hints, optional trusted-source coverage, and uncertainty handling to support human review.

## Why is RoBERTa not enough?

RoBERTa is a text classifier, so it learns language patterns from training data. It cannot verify whether an event happened, whether a quote is real, or whether a number is accurate. That is why I use it only as one signal instead of the final truth source.

## What changed after pre-defense feedback?

The project was reframed from fake-news detection to misinformation risk assessment. I kept the trained models, but reduced their authority. I added source provenance, claim hints, evidence-summary output, clearer uncertainty handling, and UI wording that says lower risk or higher risk instead of pretending the system proves real or fake.

## How does the hybrid prediction work?

The system first checks whether a URL looks like an article page. If possible, it extracts article text. Then it checks the source domain, runs the headline and article language models where appropriate, extracts claim hints, optionally checks trusted-source coverage, and combines the signals into a risk label. If signals are weak or conflicting, it returns Needs Review.

## What is the scoring layer?

The scoring layer combines source evidence, headline model evidence, and article model evidence. The important formula is:

```text
weighted_score = source_evidence + headline_weight * model_a_evidence + article_weight * model_b_evidence
```

The score is then converted into a risk label. Conflict and low-confidence rules can override the score to avoid overclaiming.

## What is your main contribution?

The contribution is not proving that RoBERTa can detect fake news. The contribution is showing a safer design for misinformation review: a system that combines multiple signals, exposes uncertainty, and clearly explains where automation is limited.

## What are the limitations?

The source database is a small local seed list. The evidence check is lightweight and depends on NewsAPI when configured. RoBERTa can still be wrong because it detects language patterns, not truth. The system is useful for triage and review, not final fact-checking.

## Why is this still a strong final year project?

It is stronger because it addresses the real weakness of fake-news detection directly. Instead of making an unrealistic claim, the project demonstrates the limitation, redesigns the system around that limitation, and builds a working hybrid platform with backend inference, source checks, evidence hints, web UI, extension support, tests, and documentation.
