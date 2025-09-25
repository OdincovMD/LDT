"""
Роуты FastAPI для аутентификации пользователей.
Реализованы эндпоинты:
- POST /register — регистрация нового пользователя,
- POST /login — вход по email и паролю (возвращает заглушку токена).
"""

from fastapi import APIRouter, HTTPException
from src.schemas import UserCreate, UserRead, LoginRequest, Token
from src.queries.orm import SyncOrm

router = APIRouter()

@router.post("/register", response_model=UserRead)
def register(user: UserCreate):
    """
    Регистрация нового пользователя.
    При дублировании email возвращает 400.
    """
    try:
        return SyncOrm.create_user(user.email, user.password, user.full_name)
    except ValueError:
        raise HTTPException(status_code=400, detail="Email already registered")


@router.post("/login", response_model=Token)
def login(req: LoginRequest):
    """
    Авторизация по email и паролю.
    При успехе возвращает "FAKE_TOKEN_{user_id}".
    При неверных данных — 401 Unauthorized.
    """
    db_user = SyncOrm.get_user_by_email(req.email)
    if not db_user or not SyncOrm.verify_password(req.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"access_token": f"FAKE_TOKEN_{db_user.id}", "token_type": "bearer"}
