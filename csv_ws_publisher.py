# csv_ws_publisher.py
"""
Читает CSV (колонки: t,bpm,uc) и шлёт в WebSocket РОВНО:
  {"t": <float>, "bpm": <float|null>, "uc": <float|null>}

Авторизация: opaque WS-токен ТОЛЬКО через query:
  ws://<host>/ws/case/<CASE_ID>?token=<OPAQUE>[&H=...&stride=...]

Пример:
  python csv_ws_publisher.py --file data.csv --url ws://localhost:90/ws/case/15 --token JZ770r5...

Параметры:
  --file     путь к CSV (t,bpm,uc)
  --url      базовый WS URL до /ws/case/<id> (без ?token)
  --token    opaque WS-токен (добавится как ?token=...)
  --hz       частота, Гц, если не используем колонку 't' (по умолчанию 1)
  --use-t    использовать реальные интервалы из колонки 't' (сек)
  --loop     повторять файл по кругу
"""

import asyncio
import csv
import json
import time
from argparse import ArgumentParser
from typing import Iterator, Dict, Any
import urllib.parse as up

import websockets


def append_query_param(url: str, key: str, value: str) -> str:
    """Аккуратно добавляет/заменяет query-параметр в URL."""
    parts = up.urlparse(url)
    q = dict(up.parse_qsl(parts.query, keep_blank_values=True))
    q[key] = value
    return up.urlunparse(parts._replace(query=up.urlencode(q)))


def build_url(url: str, token: str | None) -> str:
    """Добавляет ?token=... если указан token."""
    if token:
        return append_query_param(url, "token", token)
    return url


def load_rows(path: str) -> Iterator[Dict[str, Any]]:
    """Стримит строки CSV как dict(t, bpm, uc). Пустые значения -> None."""
    with open(path, "r", newline="") as f:
        r = csv.DictReader(f)
        required = {"t", "bpm", "uc"}
        if not required.issubset(r.fieldnames or []):
            raise ValueError(f"CSV должен содержать колонки: {sorted(required)}")
        for i, row in enumerate(r, 2):  # строка 1 — хедер
            try:
                t = float(row["t"])
                bpm = float(row["bpm"]) if row["bpm"] != "" else None
                uc = float(row["uc"]) if row["uc"] != "" else None
            except Exception as e:
                raise ValueError(f"Строка {i}: неверный формат CSV: {e}")
            yield {"t": t, "bpm": bpm, "uc": uc}


async def publish(file_path: str, url: str, token: str | None, hz: float, use_t: bool, loop: bool):
    ws_url = build_url(url, token)
    backoff = 1.0

    while True:
        try:
            async with websockets.connect(
                ws_url,
                ping_interval=30,
                ping_timeout=30,
                close_timeout=5,
                max_queue=None,
            ) as ws:
                print(f"[WS] connected: {ws_url}")

                try:
                    msg = await asyncio.wait_for(ws.recv(), timeout=0.2)
                    print(f"[WS] rx (hello): {msg}")
                except asyncio.TimeoutError:
                    pass
                except websockets.ConnectionClosed:
                    raise

                while True:
                    rows = list(load_rows(file_path))
                    if not rows:
                        print("[WS] CSV пустой, ничего отправлять")
                        break

                    for i, row in enumerate(rows):
                        if i > 0:
                            if use_t:
                                dt = max(0.0, rows[i]["t"] - rows[i - 1]["t"])
                                # защитимся от нулевых/отрицательных шагов
                                await asyncio.sleep(dt)
                            else:
                                await asyncio.sleep(1.0 / max(1e-6, hz))

                        payload = {"t": row["t"], "bpm": row["bpm"], "uc": row["uc"]}
                        await ws.send(json.dumps(payload, ensure_ascii=False))
                        print("[WS] tx:", payload)

                    if not loop:
                        try:
                            await ws.close(code=1000, reason="done")
                            await ws.wait_closed()
                        finally:
                            print("[WS] done")
                        return

                if not loop:
                    return

        except (OSError, websockets.ConnectionClosed, websockets.WebSocketException) as e:
            print(f"[WS] error: {e}")
            await asyncio.sleep(backoff)
            backoff = min(10.0, backoff * 1.5)


def parse_args():
    p = ArgumentParser()
    p.add_argument("--file", required=True, help="Путь к CSV (колонки: t,bpm,uc)")
    p.add_argument("--url", required=True, help="WS URL до /ws/case/<id> (без ?token)")
    p.add_argument("--token", default=None, help="Opaque WS-токен (добавится как ?token=...)")
    p.add_argument("--hz", type=float, default=1.0, help="Частота, Гц (если не используем колонку t)")
    p.add_argument("--use-t", action="store_true", help="Использовать интервалы из колонки t (сек)")
    p.add_argument("--loop", action="store_true", help="Повторять файл по кругу")
    return p.parse_args()


if __name__ == "__main__":
    args = parse_args()
    try:
        asyncio.run(publish(args.file, args.url, args.token, args.hz, args.use_t, args.loop))
    except KeyboardInterrupt:
        print("\nStopped")