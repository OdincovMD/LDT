"""
AsyncOrm — минимальная асинхронная обёртка над SyncOrm.
Нужна для вызова тяжёлых синхронных операций (insert_signal, get_window, insert_prediction)
из асинхронных контекстов FastAPI без блокировки event loop.

Реализовано через asyncio.to_thread: каждая операция выполняется
в пуле потоков, что предотвращает "фриз" основного цикла.
"""

import asyncio
from datetime import datetime
from typing import List, Optional, Dict
from src.queries.sync_orm import SyncOrm
from src import models


class AsyncOrm:
    # =============================
    #        RAW SIGNALS
    # =============================
    @staticmethod
    async def insert_signal(case_id: int, timestamp: datetime, bpm: float, uc: float) -> models.RawSignal:
        """
        Асинхронная вставка одной секунды данных от датчика.
        """
        return await asyncio.to_thread(SyncOrm.insert_raw_signal, case_id, timestamp, bpm, uc)

    @staticmethod
    async def get_window(case_id: int, limit: int = 300) -> List[models.RawSignal]:
        """
        Получить последние N сигналов (по умолчанию окно в 5 минут при fs=1 Гц).
        """
        return await asyncio.to_thread(SyncOrm.get_raw_signals, case_id, limit)

    # =============================
    #        PREDICTIONS
    # =============================
    @staticmethod
    async def insert_prediction(case_id: int, model_name: str, probability: float, label: int, alert: bool, features: Optional[Dict[str, Optional[float]]] = None, ) -> models.Prediction:
        return await asyncio.to_thread(SyncOrm.insert_prediction, case_id, model_name, probability, label, int(alert), features or {})