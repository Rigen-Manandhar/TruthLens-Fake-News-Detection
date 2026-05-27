# TruthLens Architecture Map

TruthLens is a hybrid misinformation risk assessment system. It is split into a web app, a backend inference API, and a Chrome extension client. The system should be explained as a review-support workflow, not as an automated truth detector.

## Runtime Flow

1. A user submits text or a URL from the Next.js web app or the Chrome extension.
2. The frontend `POST /api/predict` route forwards the payload to the FastAPI backend.
3. The backend checks whether the URL looks like an article page and safely extracts article text when possible.
4. The backend checks the source domain against the local source credibility database.
5. Model A analyzes headline-style text and Model B analyzes article-body text when enough text is available.
6. The scoring layer combines source evidence, model confidence, model disagreement, and uncertainty rules.
7. The frontend or extension renders the returned risk label, supporting signals, uncertainty, and optional language-signal explanation.

## Frontend Responsibilities

- Pages under `Frontend/app/` provide the user interface.
- API routes under `Frontend/app/api/` handle server-side proxying, authentication, feedback, user settings, password reset, contact email, and admin data.
- Server helpers under `Frontend/lib/server/` keep database, auth, email, rate-limit, session, privacy, and audit logic out of UI components.
- Shared contract files under `Frontend/lib/shared/` define frontend-side types for settings, admin data, news analysis, and detection feedback.

## Backend Responsibilities

- `Backend/app/main.py` exposes FastAPI routes and loads long-lived services on startup.
- `Backend/app/services/predict_service.py` coordinates prediction requests.
- `Backend/app/hybrid_model.py` loads the language models, parses input, runs Model A and Model B, and assembles model signals.
- `Backend/app/scoring.py` contains the scoring thresholds, model weights, conflict handling, and verdict resolution.
- `Backend/app/article_extractor.py` safely fetches article text from supported public URLs.
- `Backend/app/evidence.py` returns transparent source and evidence limitations.

## Extension Responsibilities

- The extension popup captures the active tab URL, validates whether it looks article-like, and sends the same prediction payload as the web app.
- It calls the frontend API base, which defaults to `http://localhost:3000`.
- Feedback from the extension uses a bearer token generated from the settings page.

## Data Flow

- MongoDB stores users, sessions, password reset tokens, audit events, privacy/export jobs, prediction feedback, and news prediction cache records.
- The backend source credibility data is local JSON in `Backend/app/data/source_credibility.json`.
- Model assets stay under `Backend/model/model_a/` and `Backend/model/model_b/` unless explicitly configured by environment variables.

## Defense Framing

TruthLens combines weak-to-moderate signals instead of relying on a single classifier. RoBERTa outputs are language-pattern signals only. The final verdict is a risk assessment with uncertainty handling, not proof that a news item is true or false.
