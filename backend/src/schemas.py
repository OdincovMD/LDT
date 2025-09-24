"""
Pydantic-схемы для валидации входных данных и формирования ответов API.
Разделены на блоки: пользователи, пациенты, обследования (cases), сырые сигналы (stream),
предсказания моделей. Используются как для запросов (Create), так и для ответов (Read).
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, ConfigDict


class ORMModel(BaseModel):
    """
    Базовая схема для чтения ORM-моделей.
    Добавляет поддержку from_attributes=True.
    """
    model_config = ConfigDict(from_attributes=True)


# =========================
#          AUTH / USER
# =========================
class UserBase(BaseModel):
    """Общие поля пользователя: email и ФИО."""
    email: EmailStr
    full_name: Optional[str] = None


class UserCreate(UserBase):
    """Валидация при регистрации нового пользователя."""
    password: str = Field(min_length=8)


class UserRead(ORMModel, UserBase):
    """Схема ответа при получении пользователя."""
    id: int
    created_at: datetime


class LoginRequest(BaseModel):
    """Запрос авторизации по email и паролю."""
    email: EmailStr
    password: str


class Token(BaseModel):
    """JWT-токен, возвращаемый при авторизации."""
    access_token: str
    token_type: str = "bearer"


# =========================
#         PATIENT
# =========================
class PatientBase(BaseModel):
    """Общие поля пациента."""
    full_name: str
    birth_date: Optional[datetime] = None


class PatientCreate(PatientBase):
    """Запрос на создание пациента."""
    pass


class PatientRead(ORMModel, PatientBase):
    """Ответ с данными пациента."""
    id: int
    owner_id: int
    created_at: datetime


# =========================
#           CASE
# =========================
class CaseBase(BaseModel):
    """Базовые поля обследования (case)."""
    description: Optional[str] = None


class CaseCreate(CaseBase):
    """Запрос на создание обследования."""
    patient_id: int


class CaseRead(ORMModel, CaseBase):
    """Ответ с данными обследования."""
    id: int
    patient_id: int
    created_at: datetime


# =========================
#        RAW STREAM
# =========================
class RawSignalCreate(BaseModel):
    """
    Одна секунда данных от датчика по двум каналам.
    timestamp — время прихода/измерения (из датчика),
    bpm — частота сердечных сокращений,
    uc  — активность матки.
    """
    case_id: int
    timestamp: datetime
    bpm: float
    uc: float


class RawSignalRead(ORMModel):
    """Ответ с сохранёнными сигналами (bpm + uc)."""
    id: int
    case_id: int
    timestamp: datetime
    bpm: float
    uc: float


# =========================
#       ML PREDICTION
# =========================
class PredictionBase(BaseModel):
    """Общие поля предсказания ML-модели."""
    model_name: str
    probability: float = Field(ge=0.0, le=1.0)
    label: int
    alert: bool


class PredictionCreate(PredictionBase):
    """Запрос на сохранение результата предсказания."""
    case_id: int


class PredictionRead(ORMModel, PredictionBase):
    """Ответ с сохранённым предсказанием."""
    id: int
    case_id: int
    created_at: datetime
