"""
Схемы входа/выхода для FastAPI.

Pydantic для валидации данных.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict


class Window(BaseModel):
    t: List[float]
    bpm: List[float]
    uc: List[float]


class WindowRequest(BaseModel):
    window: Window
    H: float = Field(5, ge=1, le=15, description="Горизонт прогноза в минутах")


class PredictionResponse(BaseModel):
    proba: float
    label: int
    alert: Optional[int] = None
    features: Optional[Dict[str, Optional[float]]] = None
