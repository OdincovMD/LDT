"""
SQLAlchemy ORM-модели для работы с основной БД.
Содержит описание всех сущностей: User, Patient, Case, RawSignal, Prediction
и связи между ними (1→N, N→1). Наследуются от BaseModel из database.py.
"""

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    Text,
    Float,
    func,
    UniqueConstraint,
    Index
)
from sqlalchemy.orm import relationship
from src.database import BaseModel


class User(BaseModel):
    """
    Пользователь системы (например, врач).
    Хранит email, хэш пароля и ФИО.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    name = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # связи: один пользователь → много пациентов
    patients = relationship(
        "Patient",
        back_populates="owner",
        cascade="all, delete-orphan",
    )


class Patient(BaseModel):
    """
    Пациент, прикреплённый к пользователю (врачу).
    """
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    birth_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # внешний ключ: кто владелец пациента
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    owner = relationship("User", back_populates="patients")

    # один пациент → несколько обследований (cases)
    cases = relationship(
        "Case",
        back_populates="patient",
        cascade="all, delete-orphan",
    )


class Case(BaseModel):
    """
    Обследование пациента (например, запись КТГ или снимок кожи).
    """
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # внешний ключ: к какому пациенту относится обследование
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    patient = relationship("Patient", back_populates="cases")

    # одно обследование → поток сигналов и предсказания
    raw_signals = relationship(
        "RawSignal",
        back_populates="case",
        cascade="all, delete-orphan",
    )
    predictions = relationship(
        "Prediction",
        back_populates="case",
        cascade="all, delete-orphan",
    )


class RawSignal(BaseModel):
    """
    Сырые данные от датчика (1 Гц).
    Содержат bpm и uc в каждый момент времени.
    """
    __tablename__ = "raw_signals"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    bpm = Column(Float, nullable=False)
    uc = Column(Float, nullable=False)

    # внешний ключ: к какому обследованию относится сигнал
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    case = relationship("Case", back_populates="raw_signals")


class Prediction(BaseModel):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String, nullable=False)
    probability = Column(Float, nullable=False)  # вероятность (0..1)
    label = Column(Integer, nullable=False)      # метка (например, 0/1)
    alert = Column(Integer, nullable=False, default=0)  # тревога (0/1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    case = relationship("Case", back_populates="predictions")

    features = relationship(
        "PredictionFeature",
        back_populates="prediction",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class PredictionFeature(BaseModel):
    """
    Одна строка = один признак конкретного предсказания.
    """
    __tablename__ = "prediction_features"

    id = Column(Integer, primary_key=True)
    prediction_id = Column(
        Integer,
        ForeignKey("predictions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    key = Column(String, nullable=False)     # имя признака
    value = Column(Float, nullable=True)     # значение признака (None, если NaN/inf)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    prediction = relationship("Prediction", back_populates="features")

    __table_args__ = (
        UniqueConstraint("prediction_id", "key", name="uq_predfeature_pred_key"),
        Index("ix_predfeature_key", "key"),
    )

class WSToken(BaseModel):
    __tablename__ = "ws_static_tokens"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    case_id = Column(Integer, ForeignKey("cases.id"), index=True, nullable=False)
    token_hash = Column(String(128), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    last_seen_at = Column(DateTime(timezone=True))
    revoked_at = Column(DateTime(timezone=True))

    __table_args__ = (
        UniqueConstraint("user_id", "case_id", name="uq_ws_static_token_user_case"),
        Index("ix_ws_static_token_hash", "token_hash"),
    )