"""
Роуты FastAPI для работы с обследованиями (Case).
Позволяют создавать обследование для пациента и получать список всех обследований пациента.
"""

from fastapi import APIRouter, HTTPException
from typing import List
from src.schemas import CaseCreate, CaseRead
from src.queries.sync_orm import SyncOrm

router = APIRouter()


@router.post("/", response_model=CaseRead)
def create_case(case: CaseCreate):
    """
    Создание нового обследования (Case) для пациента.
    """
    try:
        return SyncOrm.create_case(case.patient_id, case.description)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create case: {e}")


@router.get("/by-patient/{patient_id}", response_model=List[CaseRead])
def list_cases(patient_id: int):
    """
    Получение списка всех обследований для указанного пациента.
    """
    cases = SyncOrm.get_cases_by_patient(patient_id)
    if not cases:
        return []
    return cases
