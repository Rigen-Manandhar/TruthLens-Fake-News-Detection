# TruthLens Fake News Detection

TruthLens is a Final Year Project focused on fake news detection. It combines:
- a Next.js web app,
- a FastAPI ML backend with two RoBERTa+LoRA classifiers,
- and a Chrome extension client.

The system analyzes user-provided text or article URLs and returns a structured verdict with risk level, model signals, and optional token-level explanation.

## Repository Structure

- `Frontend/`: Next.js 16 application with app routes, server helpers, auth, settings, admin tools, and API routes.
- `Backend/`: FastAPI inference service with separated schemas, explanation helpers, prediction service, and model-loading modules.
- `extension/`: Chrome extension popup client split into popup state, DOM, render, and API modules.

## How It Works

1. User submits text and/or URL from web app or extension.
2. Frontend route `POST /api/predict` proxies request to backend `POST /predict`.
3. Backend computes:
   - source credibility score (domain list),
   - headline-level model score (Model A),
   - article-level model score (Model B, when enough body text is available).
4. Backend returns verdict (`LIKELY REAL`, `SUSPICIOUS`, or `UNCERTAIN`) with metadata.
5. LIME explanation is generated when `explanation_mode=force`, or automatically for uncertain results.

## Tech Stack

- Frontend: Next.js 16, React 19, NextAuth, MongoDB.
- Backend: FastAPI, PyTorch, Transformers, PEFT, LIME.
- Models: LoRA adapters under `Backend/model/model_a` and `Backend/model/model_b`.

## Prerequisites

- Node.js 20+
- npm
- Python 3.10+
- MongoDB instance

## Local Setup

### 1. Backend

```bash
cd Backend
python -m venv .venv
# Windows PowerShell
.venv\Scripts\Activate.ps1
# macOS/Linux
# source .venv/bin/activate
pip install -r requirements.txt
```

Optional model path overrides:

```bash
cp .env.example .env
```

Run backend:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### 2. Frontend

```bash
cd Frontend
npm install
```

Create local env file:

```bash
cp .env.example .env.local
```

Run frontend:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Validation

### Frontend

```bash
cd Frontend
npm run lint
npm run build
```

### Backend

Run these from the backend virtualenv so `requirements.txt` packages such as `lime` are available:

```bash
cd Backend
python -m pytest tests
python -m uvicorn app.main:app --reload
```

### Extension

- Load the unpacked `extension/` folder in Chrome.
- Verify analyze flow, retry flow, and feedback submission after configuring the bearer token.

## Environment Variables

Use the committed templates:
- `Frontend/.env.example`
- `Backend/.env.example`

Important frontend vars:
- `MONGO_URL`: MongoDB connection string.
- `NEXTAUTH_SECRET`: NextAuth signing secret.
- `AUTH_SECRET`: App auth/export signing secret.
- `NEXTAUTH_URL`: Frontend base URL, e.g. `http://localhost:3000`.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: Optional Google login.
- `NEWS_API_KEY`: News feed API key.
- `MAINTENANCE_API_KEY`: Protects internal deletion endpoint.
- `BACKEND_URL`: Backend origin (default fallback `http://127.0.0.1:8000`).

Backend vars:
- `HEADLINE_MODEL_PATH`: Optional override for model A adapter directory.
- `ARTICLE_MODEL_PATH`: Optional override for model B adapter directory.

## API (Backend)

### `POST /predict`

Request:

```json
{
  "text": "article or headline text",
  "url": "https://example.com/news",
  "input_mode": "auto",
  "explanation_mode": "auto"
}
```

Accepted `input_mode` values:
- `auto`
- `headline_only`
- `full_article`
- `headline_plus_article`

Accepted `explanation_mode` values:
- `none`
- `auto`
- `force`

Response includes:
- `final_score`
- `verdict`
- `risk_level`
- `steps`
- `uncertainty`
- `parse_metadata`
- `model_outputs`
- `conflict`
- `fetch_metadata`
- optional `explanation` / `explanation_html`

### Health endpoints

- `GET /` returns service message.
- `GET /health` returns `{ "status": "ok" }`.

## Chrome Extension

Extension source is in `extension/`.

Quick load:
1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select the `extension` folder.

The popup defaults to calling `http://localhost:3000/api/predict` via the frontend layer.
Its runtime code is bootstrapped from `popup-main.js`, which composes the popup state, DOM, render, and API/storage modules.

## Security Notes

- Never commit real `.env` files or credentials.
- `AUTH_SECRET` or `NEXTAUTH_SECRET` must be set for secure export URL signing.
- Keep `MAINTENANCE_API_KEY` private; it protects account deletion processing route.
