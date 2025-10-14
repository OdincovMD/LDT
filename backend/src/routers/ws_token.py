"""
Роуты FastAPI для управления долгоживущими WS-токенами (пара user_id + case_id).
Создание (однократно с выдачей секрета), проверка наличия, отзыв.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from src.schemas import WSTokenCreateResp, WSTokenCreate, WSTokenExistsResp, WSTokenRevokeResp, WSTokenRevoke

from src.queries.sync_orm import SyncOrm

router = APIRouter()

@router.post("/create", response_model=WSTokenCreateResp)
def create_ws_token(payload: WSTokenCreate):
    """
    Создаёт долгоживущий токен для (user_id, case_id).
    Возвращает секрет только при первом создании. Повторно секрет не раскрывается.
    """
    try:
        plain = SyncOrm.create_ws_token(payload.user_id, payload.case_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail={
            "error": "WS_TOKEN_CREATE_FAILED",
            "message": "Не удалось создать WS-токен",
            "extra": str(e),
        })

    if plain is None:
        return WSTokenCreateResp(status="exists", token=None)
    return WSTokenCreateResp(status="created", token=plain)


@router.get("/exists", response_model=WSTokenExistsResp)
def ws_token_exists(
    user_id: int = Query(..., ge=1),
    case_id: int = Query(..., ge=1),
):
    """
    Проверка наличия неотозванного токена для (user_id, case_id).
    """
    try:
        ok = SyncOrm.ws_token_exists(user_id, case_id)
        return WSTokenExistsResp(exists=bool(ok))
    except Exception as e:
        raise HTTPException(status_code=400, detail={
            "error": "WS_TOKEN_EXISTS_FAILED",
            "message": "Не удалось проверить наличие токена",
            "extra": str(e),
        })


@router.post("/revoke", response_model=WSTokenRevokeResp)
def revoke_ws_token(payload: WSTokenRevoke):
    """
    Отзывает активный токен для (user_id, case_id), если он есть.
    """
    try:
        changed = SyncOrm.revoke_ws_token(payload.user_id, payload.case_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail={
            "error": "WS_TOKEN_REVOKE_FAILED",
            "message": "Не удалось отозвать токен",
            "extra": str(e),
        })

    return WSTokenRevokeResp(status="revoked" if changed else "not_found")