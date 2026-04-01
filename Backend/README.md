# TruthLens Fake News Detection Backend

FastAPI backend for the fake news detection application.

## Setup

Create and use the backend virtual environment before starting the API.

```powershell
cd C:\FYP\TruthLens-Fake-News-Detection\Backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

## Run

Start the server with the virtualenv interpreter or after activating the virtualenv.

```powershell
cd C:\FYP\TruthLens-Fake-News-Detection\Backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

If you prefer activation first:

```powershell
cd C:\FYP\TruthLens-Fake-News-Detection\Backend
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload
```

## Verify

Run tests from the same virtualenv so all backend dependencies from `requirements.txt` are available:

```powershell
cd C:\FYP\TruthLens-Fake-News-Detection\Backend
.\.venv\Scripts\Activate.ps1
python -m pytest tests
```
