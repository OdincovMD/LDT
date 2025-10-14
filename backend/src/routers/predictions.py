"""
Роуты FastAPI для работы с предсказаниями ML-модели.
- POST / — добавление результата предсказания в БД,
- GET /by-case/{case_id} — получение всех предсказаний для конкретного обследования (case).
"""

from typing import List, Optional
from datetime import datetime, timezone

import anyio
from fastapi import APIRouter, HTTPException

from src.schemas import PredictionCreate, PredictionRead
from src.queries.sync_orm import SyncOrm

router = APIRouter()

def _serialize(pred) -> dict:
    return {
        "id": pred.id,
        "case_id": pred.case_id,
        "model_name": pred.model_name,
        "probability": float(pred.probability),
        "label": int(pred.label),
        "alert": bool(pred.alert),
        "created_at": pred.created_at,
        "features": {
            pf.key: (None if pf.value is None else float(pf.value))
            for pf in getattr(pred, "features", [])
        },
    }


@router.post("/", response_model=PredictionRead)
async def insert_prediction(pred: PredictionCreate):
    """
    Сохраняет предсказание модели для указанного обследования.
    """
    try:
        obj = await anyio.to_thread.run_sync(
            SyncOrm.insert_prediction,
            pred.case_id,
            pred.model_name,
            pred.probability,
            pred.label,
            pred.alert,
            pred.features or {},
        )
        return _serialize(obj)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "PREDICTION_INSERT_FAILURE",
                "message": "Не удалось сохранить предсказание",
                "extra": f"{e}",
            },
        )


@router.get("/by-case/{case_id}", response_model=List[PredictionRead])
async def list_predictions(case_id: int, limit: int = 300):
    try:
        objs = await anyio.to_thread.run_sync(SyncOrm.get_predictions, case_id, limit)
        return [_serialize(o) for o in objs]
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "PREDICTION_LIST_FAILURE",
                "message": "Не удалось получить предсказания",
                "extra": f"{e}",
            },
        )