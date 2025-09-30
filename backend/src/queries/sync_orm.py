"""
Cинхронный слой работы с БД.
Содержит класс SyncOrm с CRUD-методами для пользователей, пациентов,
обследований (cases), сырых сигналов и предсказаний.
Использует session_factory для управления сессиями и SQLAlchemy ORM.
"""

from typing import Optional, List
from datetime import datetime

from sqlalchemy import select, inspect
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from passlib.context import CryptContext

from src.database import Base, sync_engine, session_factory
from src import models


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class SyncOrm:
    # =============================
    #   СЛУЖЕБНЫЕ ОПЕРАЦИИ
    # =============================
    @staticmethod
    def create_tables():
        """
        Создание таблиц, если их ещё нет.
        Если таблицы существуют — ничего не делает.
        """
        table_names = inspect(sync_engine).get_table_names()
        if not table_names:
            Base.metadata.create_all(sync_engine)

    # =============================
    #          USER
    # =============================
    @staticmethod
    def hash_password(password: str) -> str:
        """Хэширует пароль через bcrypt."""
        return pwd_context.hash(password)

    @staticmethod
    def verify_password(password: str, hashed: str) -> bool:
        """Проверяет пароль против хэша."""
        return pwd_context.verify(password, hashed)

    @staticmethod
    def create_user(email: str, password: str, name: Optional[str] = None) -> models.User:
        """
        Создаёт пользователя с уникальным email.
        Возвращает объект User или поднимает ValueError при дубликате.
        """
        with session_factory() as session:
            hashed = SyncOrm.hash_password(password)
            user = models.User(email=email, hashed_password=hashed, name=name)
            session.add(user)
            try:
                session.commit()
            except IntegrityError:
                session.rollback()
                raise ValueError("User with this email already exists")
            session.refresh(user)
            return user

    @staticmethod
    def get_user_by_email(email: str) -> Optional[models.User]:
        """Возвращает пользователя по email или None, если не найден."""
        with session_factory() as session:
            stmt = select(models.User).where(models.User.email == email)
            return session.scalars(stmt).first()

    @staticmethod
    def get_user(user_id: int) -> Optional[models.User]:
        """Возвращает пользователя по ID или None."""
        with session_factory() as session:
            stmt = select(models.User).where(models.User.id == user_id)
            return session.scalars(stmt).first()

    # =============================
    #         PATIENT
    # =============================
    @staticmethod
    def create_patient(owner_id: int, name: str, birth_date: Optional[datetime] = None) -> models.Patient:
        """
        Создаёт пациента для указанного пользователя.
        """
        with session_factory() as session:
            patient = models.Patient(owner_id=owner_id, name=name, birth_date=birth_date)
            session.add(patient)
            try:
                session.commit()
            except SQLAlchemyError:
                session.rollback()
                raise
            session.refresh(patient)
            return patient

    @staticmethod
    def get_patients_by_user(owner_id: int) -> List[models.Patient]:
        """Возвращает список пациентов, прикреплённых к пользователю."""
        with session_factory() as session:
            stmt = select(models.Patient).where(models.Patient.owner_id == owner_id)
            return list(session.scalars(stmt).all())

    # =============================
    #           CASE
    # =============================
    @staticmethod
    def create_case(patient_id: int, description: Optional[str] = None) -> models.Case:
        """
        Создаёт новое обследование (Case) для пациента.
        """
        with session_factory() as session:
            case = models.Case(patient_id=patient_id, description=description)
            session.add(case)
            try:
                session.commit()
            except SQLAlchemyError:
                session.rollback()
                raise
            session.refresh(case)
            return case

    @staticmethod
    def get_cases_by_patient(patient_id: int) -> List[models.Case]:
        """Возвращает все обследования пациента."""
        with session_factory() as session:
            stmt = select(models.Case).where(models.Case.patient_id == patient_id)
            return list(session.scalars(stmt).all())

    # =============================
    #        RAW SIGNALS
    # =============================
    @staticmethod
    def insert_raw_signal(case_id: int, timestamp: datetime, bpm: float, uc: float) -> models.RawSignal:
        """
        Вставляет запись сырых данных (bpm + uc) в таблицу raw_signals.
        """
        with session_factory() as session:
            record = models.RawSignal(case_id=case_id, timestamp=timestamp, bpm=bpm, uc=uc)
            session.add(record)
            try:
                session.commit()
            except SQLAlchemyError:
                session.rollback()
                raise
            session.refresh(record)
            return record

    @staticmethod
    def get_raw_signals(case_id: int, limit: int = 300) -> List[models.RawSignal]:
        """
        Получает последние N сигналов для окна (по умолчанию 5 минут при fs=1 Гц).
        Результат возвращается в хронологическом порядке.
        """
        with session_factory() as session:
            stmt = (
                select(models.RawSignal)
                .where(models.RawSignal.case_id == case_id)
                .order_by(models.RawSignal.timestamp.desc())
                .limit(limit)
            )
            return list(reversed(session.scalars(stmt).all()))

    # =============================
    #        PREDICTIONS
    # =============================
    @staticmethod
    def insert_prediction(case_id: int, model_name: str, probability: float, label: int, alert: bool) -> models.Prediction:
        """
        Вставляет предсказание модели в таблицу predictions.
        """
        with session_factory() as session:
            pred = models.Prediction(
                case_id=case_id,
                model_name=model_name,
                probability=probability,
                label=label,
                alert=int(alert),
            )
            session.add(pred)
            try:
                session.commit()
            except SQLAlchemyError:
                session.rollback()
                raise
            session.refresh(pred)
            return pred

    @staticmethod
    def get_predictions(case_id: int, limit: int = 1) -> List[models.Prediction]:
        """Возвращает предсказания для указанного обследования."""
        with session_factory() as session:
            stmt = (
                select(models.Prediction)
                .where(models.Prediction.case_id == case_id)
                .order_by(models.Prediction.created_at.desc())
                .limit(limit)
            ) 
            return list(reversed(session.scalars(stmt).all()))
