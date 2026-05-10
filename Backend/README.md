# TruthLens Backend

FastAPI backend for the TruthLens misinformation risk assessment workflow.

This service does not treat RoBERTa as a truth source. It combines:

- URL eligibility and article extraction,
- source credibility checks,
- Model A headline/claim language signal,
- Model B article language signal,
- confidence-weighted scoring,
- conflict and uncertainty handling,
- claim-hint extraction,
- and optional trusted-source coverage checks.

## Run Locally

```powershell
cd C:\FYP\TruthLens-Fake-News-Detection\Backend
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## Test

```powershell
cd C:\FYP\TruthLens-Fake-News-Detection\Backend
.\.venv\Scripts\python.exe -m pytest tests
```

## Main Files

- `app/main.py`: FastAPI entrypoint.
- `app/services/predict_service.py`: request flow, extraction, model call, response assembly.
- `app/hybrid_model.py`: Model A/Model B loading and analysis.
- `app/scoring.py`: confidence-weighted scoring and uncertainty rules.
- `app/evidence.py`: claim hints, source signal, optional coverage signal.
- `app/data/source_credibility.json`: transparent local seed source database.

## API

`POST /predict`

Request:

```json
{
  "text": "article text or headline",
  "url": "https://example.com/news/story",
  "input_mode": "auto",
  "explanation_mode": "auto"
}
```

Response includes the existing compatibility fields plus:

```json
{
  "evidence_summary": {
    "claim_hints": [],
    "source_signal": {},
    "coverage_signal": {},
    "evidence_status": "NOT_CHECKED",
    "limitations": "TruthLens supports review..."
  }
}
```

## Optional Coverage Check

Set `NEWS_API_KEY` in the backend environment to enable a lightweight trusted-source coverage check. If the key is missing, the backend returns `NOT_CHECKED` and continues normally.

Coverage support is not proof of truth. It only tells the user whether similar claim hints appear in trusted-source coverage.

## Evaluation Summary

Generate a defense/report-ready summary from checked-in model metadata:

```powershell
.\.venv\Scripts\python.exe scripts\generate_evaluation_summary.py
```

Use this summary and the `training_info.json` files for claims about model performance.
