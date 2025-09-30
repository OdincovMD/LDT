"""
Фоновый воркер для симуляции стриминга сигналов из CSV.
Формат CSV: t,bpm,uc.
"""

import os
import csv
import asyncio
from datetime import datetime, timezone, timedelta
from pathlib import Path

import httpx
from src.queries.async_orm import AsyncOrm

WINDOW_SECONDS = 300

async def call_ml(payload: dict) -> dict:
    async with httpx.AsyncClient(timeout=5.0) as client:
        resp = await client.post(os.getenv("ML_URL"), json=payload)
        resp.raise_for_status()
        return resp.json()

async def start_stream_worker(case_id: int, hz: float):
    """
    Читает CSV, на каждом тике берёт следующую строку (t,bpm,uc),
    timestamp = старт_времени + t секунд.
    По накоплении 300 с вызывает ML.
    """
    csv_path = os.getenv("CSV_PATH")
    path = Path(csv_path)

    with path.open("r", newline="") as f:
        sample = f.read(2048)
        f.seek(0)
        try:
            dialect = csv.Sniffer().sniff(sample, delimiters=",;\t ")
        except Exception:
            dialect = csv.excel
        reader = csv.DictReader(f, dialect=dialect)
        rows = [(float(r["t"]), float(r["bpm"]), float(r["uc"])) for r in reader]

    if not rows:
        raise ValueError("CSV пустой")

    period = 1.0 / hz
    start_wall_clock = datetime.now(timezone.utc)
    i = 0

    try:
        while True:
            t_sec, bpm, uc = rows[i]
            ts = start_wall_clock + timedelta(seconds=t_sec)

            await AsyncOrm.insert_signal(case_id, ts, bpm, uc)

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

            i += 1
            if i >= len(rows):
                i = 0

            await asyncio.sleep(period)

    except asyncio.CancelledError:
        raise
    except Exception as e:
        print(f"stream worker crashed case {case_id}: {e}")
        raise