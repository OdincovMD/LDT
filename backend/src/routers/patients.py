"""
Роуты FastAPI для работы с пациентами.
Реализованы операции:
- POST / — создание нового пациента для указанного пользователя (owner_id),
- GET /by-user/{owner_id} — получение списка пациентов, прикреплённых к пользователю.
"""

from fastapi import APIRouter, HTTPException
from typing import List
from src.schemas import PatientCreate, PatientRead
from src.queries.sync_orm import SyncOrm

router = APIRouter()


@router.post("/", response_model=PatientRead)
def create_patient(patient: PatientCreate, owner_id: int):
    """
    Создание пациента, принадлежащего указанному пользователю.
    owner_id сейчас передаётся в query-параметрах.
    """
    try:
        return SyncOrm.create_patient(owner_id, patient.name, patient.birth_date)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create patient: {e}")


@router.get("/by-user/{owner_id}", response_model=List[PatientRead])
def list_patients(owner_id: int):
    """
    Получение списка пациентов, прикреплённых к пользователю.
    """
    try:
        return SyncOrm.get_patients_by_user(owner_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch patients: {e}")
