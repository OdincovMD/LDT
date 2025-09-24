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
)
from sqlalchemy.orm import relationship
from backend.src.database import BaseModel


class User(BaseModel):
    """
    Пользователь системы (например, врач).
    Хранит email, хэш пароля и ФИО.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
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
    full_name = Column(String, nullable=False)
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
    """
    Результат работы ML-модели для конкретного окна сигнала.
    """
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String, nullable=False)
    probability = Column(Float, nullable=False)  # вероятность (0..1)
    label = Column(Integer, nullable=False)      # метка (например, 0/1)
    alert = Column(Integer, nullable=False, default=0)  # тревога (0/1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # внешний ключ: к какому обследованию относится предсказание
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    case = relationship("Case", back_populates="predictions")
