# TruthLens: Hybrid Misinformation Risk Assessment

TruthLens is a Final Year Project that evaluates misinformation risk using multiple imperfect signals. It does not claim that RoBERTa, or any text classifier, can prove whether news is true or false.

The system combines:

- a Next.js web app,
- a FastAPI backend with two RoBERTa+LoRA language-signal models,
- source credibility and article extraction checks,
- lightweight claim-hint and evidence-support signals,
- uncertainty and conflict handling,
- and a Chrome extension client.

## What the System Does

TruthLens helps users review news content by showing:

- source credibility context,
- whether article text was extracted or pasted manually,
- headline and article language-model signals,
- model confidence and disagreement,
- claim hints that should be manually checked,
- optional trusted-source coverage checks when `NEWS_API_KEY` is configured,
- and a final risk label.

Backend enum values remain compatible with the original API:

- `LIKELY REAL` means lower observed risk, not confirmed truth.
- `SUSPICIOUS` means higher observed risk, not proven falsehood.
- `UNCERTAIN` means the system does not have enough reliable evidence for a strong judgment.

## What the System Does Not Claim

TruthLens does not replace human fact-checking. RoBERTa cannot verify real-world events, source intent, hidden context, or whether numbers and quotes are accurate. The model outputs are language-pattern signals learned from training data.

The project is therefore framed as a fact-checking support and misinformation risk assessment workflow, not a final truth detector.

## Why Text-Only Classifiers Are Limited

Text classifiers can learn dataset shortcuts, writing style, topic bias, and training-set artifacts. They can be useful for risk screening, but they cannot independently prove factual truth.

This is why TruthLens combines:

- knowledge/source signals,
- article extraction quality,
- language-pattern models,
- claim hints,
- coverage support,
- and uncertainty handling.

## Hybrid Architecture

1. User submits text and/or URL from the web app or extension.
2. `Frontend/app/api/predict/route.ts` proxies to backend `POST /predict`.
3. The backend checks URL eligibility and safely extracts article text when possible.
4. The backend checks source credibility from `Backend/app/data/source_credibility.json`.
5. Model A analyzes headline/claim language.
6. Model B analyzes longer article language.
7. The evidence layer extracts check-worthy claim hints and optionally searches trusted-source coverage.
8. The scoring layer returns a risk label with uncertainty, conflict, and evidence metadata.

Core backend files:

- `Backend/app/main.py`
- `Backend/app/services/predict_service.py`
- `Backend/app/hybrid_model.py`
- `Backend/app/scoring.py`
- `Backend/app/evidence.py`

## Evidence and Source Credibility Layer

The source database is a small transparent seed list, not a live authority. Each entry includes domain, source type, credibility, category, rationale, review date, reference URL, and notes.

The evidence layer returns:

- `claim_hints`
- `source_signal`
- `coverage_signal`
- `evidence_status`
- `limitations`

Coverage checks are optional. If `NEWS_API_KEY` is missing, the system reports that evidence coverage was not checked instead of pretending evidence exists.

## Model Limitations and Evaluation

Use `training_info.json` and generated evaluation summaries for report claims. Do not rely on promotional wording inside model README files.

Generate an honest model summary:

```powershell
cd Backend
.\.venv\Scripts\python.exe scripts\generate_evaluation_summary.py
```

The correct defense position is:

> I do not claim RoBERTa can determine truth. It only detects language patterns learned from training data. The improved system treats RoBERTa as one weak-to-moderate signal and combines it with source credibility, extraction quality, evidence hints, and uncertainty handling.

## Local Setup

### Backend

```powershell
cd Backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Optional backend env vars:

- `HEADLINE_MODEL_PATH`
- `ARTICLE_MODEL_PATH`
- `BACKEND_CORS_ORIGINS`
- `NEWS_API_KEY`

### Frontend

```powershell
cd Frontend
npm install
copy .env.example .env
npm run dev
```

Open `http://localhost:3000`.

### Extension

Load the unpacked `extension/` folder in Chrome. The popup defaults to calling `http://localhost:3000/api/predict`.

## Validation

Backend:

```powershell
cd Backend
.\.venv\Scripts\python.exe -m pytest tests
```

Frontend:

```powershell
cd Frontend
npm run lint
npm run build
```

## Research Framing

The project aligns with automated fact-checking research because it separates claim review, evidence support, source context, and classifier limitations. It is intentionally not framed as a solved binary fake-news detector.
