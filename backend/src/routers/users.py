"""
Роуты FastAPI для работы с пользователями.
Содержит эндпоинт получения пользователя по ID.
"""

from fastapi import APIRouter, HTTPException
from src.schemas import UserRead
from src.queries.orm import SyncOrm

router = APIRouter()


@router.get("/{user_id}", response_model=UserRead)
def get_user(user_id: int):
    """
    Получение информации о пользователе по его ID.
    Если пользователь не найден — возвращает 404.
    """
    user = SyncOrm.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
