"""
Фоновый воркер для симуляции стриминга сигналов.
Генерирует bpm/uc, пишет их в БД, вызывает ML и сохраняет предсказания.
"""
import os
import asyncio
from datetime import datetime, timezone
import httpx
from src.queries.async_orm import AsyncOrm

WINDOW_SECONDS = 300


async def call_ml(payload: dict) -> dict:
    async with httpx.AsyncClient(timeout=5.0) as client:
        resp = await client.post(os.getenv("ML_URL"), json=payload)
        resp.raise_for_status()
        return resp.json()


def _next_value(prev: float, base: float, jitter: float, lo: float, hi: float) -> float:
    val = prev + (base - prev) * 0.05 + (jitter * (2 * asyncio.get_running_loop().time() % 1 - 0.5))
    return max(lo, min(hi, val))


async def start_stream_worker(case_id: int, hz: float):
    period = 1.0 / hz
    bpm, uc = 140.0, 10.0

    try:
        while True:
            now = datetime.now(timezone.utc)
            bpm = _next_value(bpm, 140.0, jitter=2.0, lo=90.0, hi=200.0)
            uc = _next_value(uc, 12.0, jitter=1.0, lo=0.0, hi=100.0)

            await AsyncOrm.insert_signal(case_id, now, bpm, uc)

            window = await AsyncOrm.get_window(case_id, limit=WINDOW_SECONDS)
            if len(window) >= WINDOW_SECONDS:
                t0 = window[0].timestamp
                payload = {
                    "window": {
                        "t": [(s.timestamp - t0).total_seconds() for s in window],
                        "bpm": [float(s.bpm) for s in window],
                        "uc": [float(s.uc) for s in window],
                    }
                }
                try:
                    ml_res = await call_ml(payload)
                    await AsyncOrm.insert_prediction(
                        case_id,
                        ml_res.get("model_name", "model_v1"),
                        float(ml_res.get("proba", 0.0)),
                        int(ml_res.get("label", 0)),
                        bool(ml_res.get("alert", False)),
                    )
                except Exception as e:
                    print(f"ML call failed for case {case_id}: {e}")

            await asyncio.sleep(period)

    except asyncio.CancelledError:
        raise
    except Exception as e:
        print(f"stream worker crashed case {case_id}: {e}")
        raise
