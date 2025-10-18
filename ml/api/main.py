"""
FastAPI-приложение для онлайн-инференса КТГ.
"""

from fastapi import FastAPI
import os
from inference.core import CTGInference
from inference.postprocess import AlarmConfig, AlarmState
from api.schemas import WindowRequest, PredictionResponse

app = FastAPI(title="ML service")

model = CTGInference(os.path.join("inference", "models", "model_v1.cbm"))

cfg = AlarmConfig(
    on_thr=0.80,      # включаем тревогу
    off_thr=0.60,     # выключаем тревогу
    on_minutes=10.0,  # риск ≥ 10 мин подряд
    off_minutes=5.0,  # безопасно ≥ 5 мин подряд
    on_ratio=0.80,
    off_ratio=1.00
)
alarm = AlarmState(cfg, stride_s=1)

@app.post("/predict", response_model=PredictionResponse)
def predict(req: WindowRequest):
    result = model.predict_from_json(req.model_dump(), horizon_min=req.H)
    proba = float(result["proba"])
    alert = alarm.update(proba)
    features = result.get("features", {})

    return PredictionResponse(
        proba=proba,
        label=int(result["label"]),
        alert=alert,
        features=features
    )

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "ml"}