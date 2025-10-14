from typing import Dict, Set
from fastapi import WebSocket
from asyncio import Lock

class WSManager:
    def __init__(self):
        self._rooms: Dict[int, Set[WebSocket]] = {}
        self._lock = Lock()
    # Добавляем соединение в комнату
    async def join(self, case_id: int, ws: WebSocket):
        async with self._lock:
            self._rooms.setdefault(case_id, set()).add(ws)
    # Удаляем и чистим пустые комнаты
    async def leave(self, case_id: int, ws: WebSocket):
        async with self._lock:
            if case_id in self._rooms:
                self._rooms[case_id].discard(ws)
                if not self._rooms[case_id]:
                    self._rooms.pop(case_id, None)

    async def broadcast(self, case_id: int, message: dict):
        # молча удаляем "мертвые" сокеты
        dead = []
        for ws in list(self._rooms.get(case_id, [])):
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            await self.leave(case_id, ws)

manager = WSManager()