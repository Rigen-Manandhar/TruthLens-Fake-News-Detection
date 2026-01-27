from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

from lime.lime_text import LimeTextExplainer
from app.model_loader import get_hybrid_model, HybridModelLoader

app = FastAPI(title="TruthLens Hybrid Backend", version="2.0")

# Adjust to your Next.js dev URL
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model: HybridModelLoader | None = None
explainer: LimeTextExplainer | None = None

class PredictRequest(BaseModel):
    text: str
    url: str | None = None

class StepDetail(BaseModel):
    step: str
    score_impact: int
    details: str
    # These fields are optional depending on the step
    sentence_preview: str | None = None
    input_preview: str | None = None
    metadata: dict | None = None

class PredictResponse(BaseModel):
    final_score: int
    verdict: str
    risk_level: str
    steps: list[StepDetail]
    explanation: list[tuple[str, float]] | None = None
    explanation_html: str | None = None

@app.on_event("startup")
def startup():
    global model, explainer
    model = get_hybrid_model()
    explainer = LimeTextExplainer(class_names=["Real", "Fake"])

@app.get("/")
def root():
    return {"message": "TruthLens Hybrid System is running"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    if model is None or explainer is None:
        raise HTTPException(status_code=500, detail="Model not loaded")

    text = (req.text or "").strip()
    if len(text) < 10:
        raise HTTPException(status_code=400, detail="Text too short")

    # Run the hybrid analysis
    try:
        # 1. Get Hybrid Steps Report
        report_dict = model.analyze(text, req.url)
        
        # 2. Run LIME Explanation (on the Article Model)
        # We access the internal article model: model.model_article
        explanation_list = []
        explanation_html = None
        
        try:
            exp = explainer.explain_instance(
                text, 
                model.model_article.predict_proba, 
                num_features=20, 
                num_samples=100
            )
            explanation_list = exp.as_list()
            explanation_html = exp.as_html()
        except Exception as e:
            print(f"LIME Error: {e}")
        
        # Merge results
        return PredictResponse(
            final_score=report_dict["final_score"],
            verdict=report_dict["verdict"],
            risk_level=report_dict["risk_level"],
            steps=report_dict["steps"],
            explanation=explanation_list,
            explanation_html=explanation_html
        )
    except Exception as e:
        print(f"Error during analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))
