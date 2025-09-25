"""
Схемы входа/выхода для FastAPI.

Pydantic для валидации данных.
"""

from pydantic import BaseModel
from typing import List, Optional


class Window(BaseModel):
    t: List[float]
    bpm: List[float]
    uc: List[float]


class WindowRequest(BaseModel):
    window: Window


class PredictionResponse(BaseModel):
    proba: float
    label: int
    alert: Optional[int] = None
