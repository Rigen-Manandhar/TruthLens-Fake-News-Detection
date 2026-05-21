from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_cors_origins
from app.deepfake_detection.schemas import DeepfakePredictResponse
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
    global model, explainer, deepfake_model, face_detector
    model = get_hybrid_model()
    explainer = create_text_explainer()
    try:
        from app.deepfake_detection.loader import DeepfakeModelLoader

        deepfake_model = DeepfakeModelLoader()
        try:
            from app.deepfake_detection.face_detector import FaceDetector

            face_detector = FaceDetector(device=str(deepfake_model.device))
            print("Face detector initialized successfully.")
        except Exception as exc:
            print(f"Warning: Face detection unavailable: {exc}")
            face_detector = None
    except (FileNotFoundError, ModuleNotFoundError) as exc:
        print(f"Warning: Deepfake detection unavailable: {exc}")
        deepfake_model = None
        face_detector = None
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
deepfake_model = None
face_detector = None


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


@app.post("/deepfake/predict", response_model=DeepfakePredictResponse)
async def deepfake_predict(file: UploadFile = File(...)):
    if deepfake_model is None:
        raise HTTPException(status_code=503, detail="Deepfake detection is unavailable.")

    from app.deepfake_detection.service import build_deepfake_response

    contents = await file.read()
    filename = file.filename or "unknown"
    return build_deepfake_response(contents, filename, deepfake_model, face_detector=face_detector)
