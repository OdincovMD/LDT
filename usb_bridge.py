#!/usr/bin/env python3
"""
USB → WebSocket bridge (кроссплатформенный, без тяжёлых зависимостей).
Зависимости: pyserial, websocket-client
  pip install --upgrade pyserial websocket-client

Поведение:
- мониторит директорию с drop-файлами (по умолчанию /opt/ctg-bridge/drop, задаётся --dir или CTG_BRIDGE_DIR);
- при появлении нового файла вида bridge-*.json читает конфиг и запускает форвардинг:
    Serial(port, baud) → построчно → WebSocket (text frames)
- пересылает строки "как есть" (CSV/NDJSON/любой текст);
- умеет автоопределять порт, если в JSON/CLI/env/port.txt он не задан;
- переживает обрывы USB/WS с экспоненциальным backoff;
- новый файл конфигурации ⇒ старая сессия мягко останавливается и поднимается новая.

Формат JSON:
{
  "mode": "ws",
  "ws_url": "ws://host/ws/case/17?token=...&H=5&stride=1",
  "user_id": 1,
  "case_id": 17,
  "token": "...",          # опционально; ws_url уже содержит token
  "H": 5,
  "stride": 1,
}

Выбор порта (приоритет): CLI --port → env CTG_BRIDGE_PORT → <drop>/port.txt → поле "port" в JSON → авто-поиск.
Если найдено несколько кандидатов, bridge предложит создать port.txt с именем нужного порта.
"""

import argparse
import json
import os
import signal
import sys
import threading
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

# --- зависимости ---
try:
    import serial  # pyserial
    from serial.tools import list_ports
except Exception:
    print("ОШИБКА: требуется pyserial. Установите: pip install pyserial", file=sys.stderr)
    sys.exit(1)

try:
    from websocket import create_connection, WebSocketConnectionClosedException  # websocket-client
except Exception:
    print("ОШИБКА: требуется websocket-client. Установите: pip install websocket-client", file=sys.stderr)
    sys.exit(1)


# --- модели ---
@dataclass
class BridgeConfig:
    ws_url: str
    port: Optional[str] = None
    baud: int = 115200
    mode: str = "ws"
    fmt: str = "auto"
    file_path: str = ""  # путь до json-файла (для чтения port.txt рядом)


class StopEvent:
    def __init__(self):
        self._e = threading.Event()

    def set(self):
        self._e.set()

    def is_set(self) -> bool:
        return self._e.is_set()

    def wait(self, t: float) -> bool:
        return self._e.wait(t)


# --- утилиты ---
def load_config(path: str) -> Optional[BridgeConfig]:
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        mode = str(data.get("mode") or "ws").lower()
        if mode != "ws":
            print(f"[bridge] пропуск {os.path.basename(path)}: режим={mode} не поддерживается (только 'ws')")
            return None

        ws_url = data.get("ws_url")
        if not ws_url:
            print(f"[bridge] отсутствует ws_url в {path}")  # критический параметр
            return None

        port = data.get("port")  # может быть None
        baud = int(data.get("baud") or 115200)
        fmt = str(data.get("format") or data.get("fmt") or "auto")

        return BridgeConfig(ws_url=ws_url, port=port, baud=baud, mode=mode, fmt=fmt, file_path=path)
    except Exception as e:
        print(f"[bridge] ошибка чтения конфигурации {path}: {e}", file=sys.stderr)
        return None


def resolve_port(drop_dir: str, cli_port: Optional[str], json_port: Optional[str]) -> Optional[str]:
    """
    Приоритет источников:
      1) CLI --port
      2) ENV CTG_BRIDGE_PORT
      3) <drop_dir>/port.txt (одна строка)
      4) поле 'port' из JSON
      5) авто-поиск среди доступных портов (pyserial.tools.list_ports)
         - если ровно один — берём его;
         - если несколько — печатаем список и ждём port.txt.
    """
    # 1) CLI
    if cli_port:
        return cli_port

    # 2) ENV
    env_port = os.environ.get("CTG_BRIDGE_PORT")
    if env_port:
        return env_port

    # 3) port.txt
    pt = Path(drop_dir) / "port.txt"
    if pt.exists():
        try:
            val = pt.read_text(encoding="utf-8").strip()
            if val:
                return val
        except Exception:
            pass

    # 4) JSON
    if json_port:
        return json_port

    # 5) Автопоиск
    candidates = []
    try:
        for p in list_ports.comports():
            candidates.append(p.device)
    except Exception:
        candidates = []

    # упорядочим: by-id (Linux) приоритетнее
    def score(dev: str) -> int:
        # меньше — выше приоритет
        if dev.startswith("/dev/serial/by-id/"):
            return 0
        if dev.startswith("/dev/ttyACM") or dev.startswith("/dev/ttyUSB"):
            return 1
        if dev.startswith("/dev/cu.usb") or dev.startswith("/dev/tty.usb"):
            return 1
        if dev.upper().startswith("COM"):
            return 2
        return 3

    candidates = sorted(set(candidates), key=score)

    if len(candidates) == 1:
        print(f"[port] auto-selected: {candidates[0]}")
        return candidates[0]

    if len(candidates) > 1:
        print("[port] обнаружено несколько последовательных портов, выберите один созданием файла:")
        print(f"       {pt}  (укажите одну строку с именем порта, например /dev/ttyACM0 или COM4)")
        for i, c in enumerate(candidates, 1):
            print(f"       {i}. {c}")
        # ждём port.txt
        for _ in range(1_000_000):
            time.sleep(1.0)
            if pt.exists():
                try:
                    val = pt.read_text(encoding="utf-8").strip()
                    if val:
                        print(f"[port] выбран через port.txt: {val}")
                        return val
                except Exception:
                    pass
        return None

    print("[port] последовательные порты не найдены. Подключите устройство или укажите --port / CTG_BRIDGE_PORT / port.txt")
    return None


def run_bridge(cfg: BridgeConfig, cli_port: Optional[str], stop: StopEvent):
    """
    Основной цикл:
      1) открыть Serial
      2) открыть WS
      3) читать строку из Serial → отправлять в WS (text frame)
    Ошибки → реконнект с backoff.
    """
    print(f"[bridge] starting with config: file={os.path.basename(cfg.file_path)} ws={cfg.ws_url}")
    ser = None
    ws = None

    ser_backoff = 1.0
    ws_backoff = 1.0

    def open_serial():
        nonlocal ser, ser_backoff
        drop_dir = str(Path(cfg.file_path).parent)
        while not stop.is_set():
            try:
                port = resolve_port(drop_dir, cli_port, cfg.port)
                if not port:
                    raise RuntimeError("последовательный порт не указан")
                ser = serial.Serial(port, cfg.baud, timeout=1)
                ser.reset_input_buffer()
                print(f"[serial] подключен: {ser.port} @ {cfg.baud}")
                ser_backoff = 1.0
                return
            except Exception as e:
                print(f"[serial] ошибка подключения: {e} (повтор через {ser_backoff:.1f}с)")
                stop.wait(ser_backoff)
                ser_backoff = min(30.0, ser_backoff * 1.8)
        raise RuntimeError("остановка до подключения к последовательному порту")

    def open_ws():
        nonlocal ws, ws_backoff
        while not stop.is_set():
            try:
                ws = create_connection(cfg.ws_url, timeout=5)
                print(f"[ws] connected")
                ws_backoff = 1.0
                return
            except Exception as e:
                print(f"[ws] ошибка подключения: {e} (повтор через {ws_backoff:.1f}с)")
                stop.wait(ws_backoff)
                ws_backoff = min(30.0, ws_backoff * 1.8)
        raise RuntimeError("остановка до подключения к WebSocket")

    try:
        open_serial()
        open_ws()

        # основной форвард
        while not stop.is_set():
            try:
                line = ser.readline()  # bytes до \n или timeout
                if not line:
                    continue
                # нормализуем к LF
                try:
                    text = line.decode("utf-8", errors="ignore")
                except Exception:
                    text = str(line, "utf-8", errors="ignore")
                text = text.rstrip("\r\n")
                if not text:
                    continue

                ws.send(text)
            except WebSocketConnectionClosedException:
                print("[ws] соединение закрыто сервером, переподключение…")
                try:
                    ws.close()
                except Exception:
                    pass
                open_ws()
            except Exception as e:
                print(f"[bridge] ошибка ввода-вывода: {e}")
                # закрыть каналы и пересоздать
                try:
                    if ws:
                        ws.close()
                except Exception:
                    pass
                try:
                    if ser and ser.is_open:
                        ser.close()
                except Exception:
                    pass
                open_serial()
                open_ws()

    finally:
        try:
            if ws:
                ws.close()
        except Exception:
            pass
        try:
            if ser and ser.is_open:
                ser.close()
        except Exception:
            pass
        print("[bridge] остановлен")


def find_latest_bridge_file(directory: str) -> Optional[str]:
    try:
        entries = [p for p in Path(directory).glob("bridge-*.json")]
        if not entries:
            return None
        entries.sort(key=lambda p: p.stat().st_mtime, reverse=True)
        return str(entries[0])
    except FileNotFoundError:
        return None
    except Exception as e:
        print(f"[watch] list error: {e}", file=sys.stderr)
        return None


def main():
    parser = argparse.ArgumentParser(description="USB→WS Bridge (simple, cross-platform)")
    parser.add_argument("--dir", default=os.environ.get("CTG_BRIDGE_DIR", "/opt/ctg-bridge/drop"),
                        help="Директория drop-файлов (default: /opt/ctg-bridge/drop или $CTG_BRIDGE_DIR)")
    parser.add_argument("--poll", type=float, default=2.0, help="Интервал опроса директории, сек (default 2.0)")
    parser.add_argument("--once", action="store_true", help="Запуск по первому найденному файлу; завершить при остановке")
    parser.add_argument("--port", help="Явно указать serial-порт (перекрывает все источники)")
    args = parser.parse_args()

    watch_dir = args.dir
    poll = max(0.5, float(args.poll))
    if args.port:
        # прокинем в env, чтобы при смене файла конфигурации сохранялся выбор порта
        os.environ["CTG_BRIDGE_PORT"] = args.port

    print(f"[watch] dir={watch_dir}, poll={poll}s, once={args.once}")

    stop_all = StopEvent()
    current_thread: Optional[threading.Thread] = None
    current_stop: Optional[StopEvent] = None
    current_cfg_path: Optional[str] = None
    current_cfg_mtime: Optional[float] = None

    def shutdown(sig=None, frame=None):
        print("[main] запрошено завершение работы")
        stop_all.set()
        if current_stop:
            current_stop.set()

    # корректное завершение
    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    # основной цикл наблюдения
    while not stop_all.is_set():
        cfg_path = find_latest_bridge_file(watch_dir)
        if cfg_path:
            try:
                mtime = os.path.getmtime(cfg_path)
            except Exception:
                mtime = None

            # новый или изменённый файл — перезапуск
            if (cfg_path != current_cfg_path) or (mtime and mtime != current_cfg_mtime):
                cfg = load_config(cfg_path)
                if cfg:
                    # стоп старого
                    if current_stop:
                        print("[main] stopping previous bridge…")
                        current_stop.set()
                        if current_thread:
                            current_thread.join(timeout=5)
                    current_stop = StopEvent()
                    current_thread = threading.Thread(
                        target=run_bridge,
                        args=(cfg, os.environ.get("CTG_BRIDGE_PORT"), current_stop),
                        daemon=True
                    )
                    current_thread.start()
                    current_cfg_path = cfg_path
                    current_cfg_mtime = mtime
                    print(f"[main] started bridge from {os.path.basename(cfg_path)}")

                    if args.once:
                        # дождаться завершения и выйти
                        while not stop_all.is_set() and current_thread.is_alive():
                            time.sleep(0.2)
                        break

        # ждём следующее сканирование
        if stop_all.wait(poll):
            break

    # финальная остановка
    if current_stop:
        current_stop.set()
        if current_thread:
            current_thread.join(timeout=5)
    print("[main] завершение работы")


if __name__ == "__main__":
    main()