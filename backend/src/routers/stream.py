"""
Роуты FastAPI для работы с потоковыми данными (RawSignal).
Реализованы операции:
- POST /data — приём одного сигнала от датчика (bpm + uc) и сохранение в БД,
- GET /data/{case_id} — получение последних N сигналов для конкретного обследования (case).
"""

from fastapi import APIRouter, HTTPException
from typing import List
from src.schemas import RawSignalCreate, RawSignalRead
from src.queries.orm import SyncOrm

router = APIRouter()


@router.post("/data", response_model=RawSignalRead)
def insert_signal(signal: RawSignalCreate):
    """
    Добавляет новую запись сигналов (bpm + uc) для указанного обследования.
    """
    try:
        return SyncOrm.insert_raw_signal(signal.case_id, signal.timestamp, signal.bpm, signal.uc)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to insert raw signal: {e}")


@router.get("/data/{case_id}", response_model=List[RawSignalRead])
def get_signals(case_id: int, limit: int = 300):
    """
    Возвращает последние N сигналов для данного обследования (case).
    По умолчанию — 300 точек (5 минут при частоте 1 Гц).
    """
    try:
        return SyncOrm.get_raw_signals(case_id, limit)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch signals: {e}")
