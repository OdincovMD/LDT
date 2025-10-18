"""
Маршрут подготовки drop-файла для USB/WS-моста.
POST /provision/ws: берёт WS-токен из БД, собирает ws://…/ws/case/{case_id}?token=…&H&stride,
создаёт JSON в /bridge_drop (имя с таймстампом) и возвращает filename, путь и ws_url.
"""
import os
import json
from datetime import datetime, timezone
from src.schemas import ProvisionWsIn, ProvisionWsOut

from fastapi import APIRouter, HTTPException, Request

from src.queries.sync_orm import SyncOrm

router = APIRouter()

BRIDGE_DROP_DIR = "/bridge_drop"

def _build_ws_url(req: Request, case_id: int, token: str, H: int, stride: int) -> str:
    """
    Собирает URL формата:
    ws://<host>/ws/case/<case_id>?token=<TOKEN>&H=<H>&stride=<stride>
    (или wss:// если бекенд за HTTPS)
    """
    base = str(req.base_url).rstrip("/")  # http(s)://host:port
    scheme = "wss" if base.startswith("https") else "ws"
    host = base.split("://", 1)[1]
    return f"{scheme}://{host}/ws/case/{case_id}?token={token}&H={H}&stride={stride}"


@router.post("/provision/ws", response_model=ProvisionWsOut, summary="Создать drop-файл для моста (токен берём из БД)")
async def provision_ws(req: Request, body: ProvisionWsIn):

    rec = SyncOrm.get_ws_token_record(body.user_id, body.case_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Активный WS-токен для (user_id, case_id) не найден")

    token_for_ws = getattr(rec, "token_hash", None)
    if not token_for_ws:
        raise HTTPException(status_code=500, detail="В записи токена отсутствует поле token_hash")

    ws_url = _build_ws_url(req, body.case_id, token_for_ws, body.H, body.stride)

    #подготовим папку и сформируем JSON для моста
    os.makedirs(BRIDGE_DROP_DIR, exist_ok=True)
    payload = {
        "created_at": datetime.now(timezone.utc).isoformat(),
        "mode": "ws",
        "ws_url": ws_url,
        "user_id": body.user_id,
        "case_id": body.case_id,
        "token": token_for_ws,
        "H": body.H,
        "stride": body.stride,
    }

    hint = f"-{body.name_hint}" if body.name_hint else ""
    filename = f"bridge-{body.case_id}{hint}-{int(datetime.now().timestamp())}.json"
    path = os.path.join(BRIDGE_DROP_DIR, filename)

    try:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
        os.chmod(path, 0o600)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка записи файла: {e}")

    return ProvisionWsOut(filename=filename, path_in_container=path, ws_url=ws_url)