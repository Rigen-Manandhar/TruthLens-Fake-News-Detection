from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_cors_origins
from app.explanations import create_text_explainer
from app.loader import get_hybrid_model
from app.model_loader import HybridModelLoader
from app.schemas import (
    ConflictInfo,
    FetchMetadata,
    ModelOutputs,
    ParseMetadata,
    PredictRequest,
    PredictResponse,
    SingleModelOutput,
    StepDetail,
    UncertaintyInfo,
)
from app.services.predict_service import build_predict_response


@asynccontextmanager
async def lifespan(_: FastAPI):
    global model, explainer
    model = get_hybrid_model()
    explainer = create_text_explainer()
    yield


app = FastAPI(title="TruthLens Hybrid Backend", version="2.1", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model: HybridModelLoader | None = None
explainer = None


@app.get("/")
def root():
    return {"message": "TruthLens Hybrid System is running"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    try:
        return build_predict_response(req, model, explainer)
    except HTTPException:
        raise
