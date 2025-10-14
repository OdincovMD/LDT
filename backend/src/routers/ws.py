# src/routers/ws.py
# -*- coding: utf-8 -*-
"""
WS-инжест: принимает точки t,bpm,uc. Шаги:
1) insert raw -> 2) окно 300s -> 3) ML POST -> 4) insert prediction
5) broadcast prediction/alert -> 6) broadcast raw.
"""
import os
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, Optional

import httpx
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends

from src.security import get_current_user_ws
from src.services.ws_manager import manager
from src.queries.async_orm import AsyncOrm

WINDOW_SECONDS = 300
router = APIRouter()

def _sanitize_h(h) -> float:
    try:
        return min(60.0, max(1.0, float(h)))
    except Exception:
        return 5.0

def _now_utc() -> datetime:
    return datetime.now(timezone.utc)

def _unwrap(msg: Dict[str, Any]) -> Dict[str, Any]:
    """Единый плоский формат из разных входов."""
    if isinstance(msg, dict) and msg.get("type") in {"raw", "prediction"} and isinstance(msg.get("payload"), dict):
        msg = msg["payload"]
    return {
        "t": msg.get("t") or msg.get("time") or msg.get("t_center"),
        "bpm": msg.get("bpm") or msg.get("hr") or msg.get("heart_rate"),
        "uc": msg.get("uc") or msg.get("toco") or msg.get("uterine"),
    }

async def _call_ml(window_payload: dict) -> dict:
    ml_url = os.getenv("ML_URL")
    if not ml_url:
        raise RuntimeError("ML_URL is not set")
    async with httpx.AsyncClient(timeout=5.0) as client:
        r = await client.post(ml_url, json=window_payload)
        r.raise_for_status()
        return r.json()

@router.websocket("/case/{case_id}")
async def ws_case(websocket: WebSocket, case_id: int, user=Depends(get_current_user_ws)):
    await websocket.accept()
    await manager.join(case_id, websocket)
    H_min = _sanitize_h(websocket.query_params.get("H", 5.0))
    try:
        stride_s = max(1.0, float(websocket.query_params.get("stride", 1.0)))
    except Exception:
        stride_s = 1.0

    # hello
    await websocket.send_json({
        "type": "hello",
        "payload": {"case_id": case_id, "user_id": getattr(user, "id", None), "H": H_min}
    })

    base_t0: Optional[datetime] = None  # для преобразования относительного t в абсолютный timestamp
    last_ml_ts: Optional[datetime] = None

    try:
        while True:
            data = await websocket.receive_json()
            if isinstance(data, dict) and data.get("type") == "pong":
                continue

            row = _unwrap(data)

            # инициализация нуля времени по первой точке
            if base_t0 is None:
                first_t = float(row["t"]) if row.get("t") is not None else 0.0
                base_t0 = _now_utc() - timedelta(seconds=first_t)

            # 1) RAW -> БД
            t_val = row.get("t")
            ts = base_t0 + timedelta(seconds=float(t_val)) if t_val is not None else _now_utc()
            bpm = None if row.get("bpm") in (None, "") else float(row["bpm"])
            uc  = None if row.get("uc")  in (None, "") else float(row["uc"])
            await AsyncOrm.insert_signal(case_id, ts, bpm, uc)

            # 2) окно и 3) ML
            window = await AsyncOrm.get_window(case_id, limit=WINDOW_SECONDS)
            if len(window) >= WINDOW_SECONDS:
                t0_abs = window[0].timestamp
                now_ts = window[-1].timestamp
                if last_ml_ts and (now_ts - last_ml_ts).total_seconds() < stride_s:
                    # пропускаем вызов ML до следующего шага
                    await manager.broadcast(case_id, {"type":"raw","payload":{"t": float(t_val) if t_val is not None else None, "bpm": bpm, "uc": uc}})
                    continue
                payload = {
                    "window": {
                        "t": [(s.timestamp - t0_abs).total_seconds() for s in window],
                        "bpm": [float(s.bpm) for s in window],
                        "uc": [float(s.uc) for s in window],
                    },
                    "H": H_min
                }
                try:
                    ml_res = await _call_ml(payload)
                    # 4) prediction -> БД
                    obj = await AsyncOrm.insert_prediction(
                        case_id=case_id,
                        model_name=str(ml_res.get("model_name", "model_v1")),
                        probability=float(ml_res.get("proba", 0.0)),
                        label=int(ml_res.get("label", 0)),
                        alert=bool(ml_res.get("alert", False)),
                        features=ml_res.get("features") or {},
                    )
                    last_ml_ts = now_ts
                    # 5) broadcast prediction/alert
                    t_center = (getattr(obj, "created_at", ts)).timestamp()
                    await manager.broadcast(
                        case_id,
                        {"type": "prediction", "payload": {"t_center": t_center, "proba": float(obj.probability)}}
                    )
                    await manager.broadcast(
                        case_id,
                        {"type": "alert", "payload": {"t": t_center, "state": ("on" if bool(obj.alert) else "off"), "reason": None}}
                    )
                    last_ml_ts = now_ts
                except Exception as e:
                    # не рвём поток
                    try:
                        await websocket.send_json({"type": "ml_error", "payload": {"detail": str(e)}})
                    except Exception:
                        pass

            # 6) broadcast raw``
            await manager.broadcast(
                case_id,
                {"type": "raw", "payload": {"t": float(t_val) if t_val is not None else None, "bpm": bpm, "uc": uc}}
            )
         

    except WebSocketDisconnect:
        await manager.leave(case_id, websocket)
    except Exception:
        try:
            await websocket.send_json({"type": "error", "payload": {"detail": "server_error"}})
        finally:
            await manager.leave(case_id, websocket)
