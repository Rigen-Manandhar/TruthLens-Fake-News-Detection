from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

from lime.lime_text import LimeTextExplainer
from app.model_loader import load_inference_model, InferenceModel

app = FastAPI(title="TruthLens Backend", version="1.0")

# Adjust to your Next.js dev URL (add more later if needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model: InferenceModel | None = None
explainer: LimeTextExplainer | None = None


class PredictRequest(BaseModel):
    text: str


class PredictResponse(BaseModel):
    label: str
    confidence: float
    explanation: list[tuple[str, float]] | None = None
    explanation_html: str | None = None


@app.on_event("startup")
def startup():
    global model, explainer
    model = load_inference_model()
    explainer = LimeTextExplainer(class_names=["Fake", "Real"])


@app.get("/")
def root():
    return {"message": "TruthLens backend is running"}


@app.get("/health")
def health():
    return {"status": "ok"}


# JSON endpoint (kept for frontend use)
@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    if model is None or explainer is None:
        raise HTTPException(status_code=500, detail="Model not loaded")

    text = (req.text or "").strip()
    if len(text) < 10:
        raise HTTPException(status_code=400, detail="Text too short")

    # 1. Standard Prediction
    label, conf = model.predict(text)

    # 2. LIME Explanation
    try:
        exp = explainer.explain_instance(
            text, 
            model.predict_proba, 
            num_features=20, 
            num_samples=100
        )
        explanation_list = exp.as_list()
        explanation_html = exp.as_html()
    except Exception as e:
        print(f"LIME Error: {e}")
        explanation_list = []
        explanation_html = None

    return PredictResponse(
        label=label, 
        confidence=conf, 
        explanation=explanation_list,
        explanation_html=explanation_html
    )


# Plain-text endpoint (paste anything here, no JSON escaping needed)
@app.post("/predict-text", response_model=PredictResponse)
def predict_text(text: str = Body(..., media_type="text/plain")):
    if model is None or explainer is None:
        raise HTTPException(status_code=500, detail="Model not loaded")

    text = (text or "").strip()
    if len(text) < 10:
        raise HTTPException(status_code=400, detail="Text too short")

    # 1. Standard Prediction
    label, conf = model.predict(text)

    # 2. LIME Explanation
    try:
        exp = explainer.explain_instance(
            text, 
            model.predict_proba, 
            num_features=20, 
            num_samples=100
        )
        explanation_list = exp.as_list()
        explanation_html = exp.as_html()
    except Exception as e:
        print(f"LIME Error: {e}")
        explanation_list = []
        explanation_html = None

    return PredictResponse(
        label=label, 
        confidence=conf, 
        explanation=explanation_list,
        explanation_html=explanation_html
    )
