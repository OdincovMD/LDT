"""
Роуты FastAPI для работы с предсказаниями ML-модели.
Реализованы операции:
- POST / — добавление результата предсказания в БД,
- GET /by-case/{case_id} — получение всех предсказаний для конкретного обследования (case).
"""

from fastapi import APIRouter, HTTPException
from typing import List
from backend.src.schemas import PredictionCreate, PredictionRead
from backend.src.queries.orm import SyncOrm

router = APIRouter()


@router.post("/", response_model=PredictionRead)
def insert_prediction(pred: PredictionCreate):
    """
    Сохраняет предсказание модели для указанного обследования.
    """
    try:
        return SyncOrm.insert_prediction(
            pred.case_id,
            pred.model_name,
            pred.probability,
            pred.label,
            pred.alert
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to insert prediction: {e}")


@router.get("/by-case/{case_id}", response_model=List[PredictionRead])
def list_predictions(case_id: int):
    """
    Возвращает все предсказания для указанного обследования.
    """
    try:
        return SyncOrm.get_predictions(case_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch predictions: {e}")
