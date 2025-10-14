"""
Модуль безопасности (security.py)
Только WebSocket-аутентификация по opaque-токену:
ws://.../ws/case/{case_id}?token=<OPAQUE>[&H=...&stride=...]
"""
from typing import Optional
from fastapi import HTTPException, WebSocket, status
from src.queries.sync_orm import SyncOrm
from src.schemas import CurrentUser

# ====================================
#        WS-АУТЕНТИФИКАЦИЯ
# ====================================
 
async def get_current_user_ws(websocket: WebSocket) -> CurrentUser:
    """
    Аутентификация для WS-хэндшейка:
    - token берём из query (?token=...), либо как fallback — из Authorization: Bearer ...
    - case_id берём из path_params (/ws/case/{case_id}) или из query (?case_id=...|case=...).
    - Валидация токена поручается SyncOrm:
        * при наличии SyncOrm.find_user_by_ws_token(case_id, token) — используем его;
        * иначе ожидаем user_id в query (?user_id=...) или заголовке X-User-Id и вызываем
            SyncOrm.validate_ws_token(user_id, case_id, token)   SyncOrm.get_user(user_id).
    """
    # 1) Токен: из query (браузерный стандарт) или из Authorization (нестандартный клиент)
    token = websocket.query_params.get("token")

    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        raise HTTPException(status_code=401, detail="missing_token")

    # 2) case_id: из path или query
    try:
        case_id = websocket.path_params.get("case_id")
    except Exception:
        case_id = None
    if case_id is None:
        case_id = websocket.query_params.get("case_id") or websocket.query_params.get("case")
    try:
        case_id = int(case_id) if case_id is not None else None
    except Exception:
        case_id = None
    if case_id is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        raise HTTPException(status_code=401, detail="missing_case_id")

    # 3) Валидация токена без прямого доступа к БД (без SQLAlchemy)
    db_user = None
    try:
        db_user = SyncOrm.find_user_by_ws_token(case_id, token)  # type: ignore[attr-defined]
    except Exception:
        db_user = None

    if not db_user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        raise HTTPException(status_code=401, detail="invalid_ws_token")

    return CurrentUser(
        id=db_user.id,
        email=db_user.email
    )