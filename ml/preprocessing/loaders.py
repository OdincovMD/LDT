"""
Модуль загрузки и предобработки данных из JSON-окон.

Используется в онлайн-инференсе: получает пакет длительностью ~5 минут,
подготавливает его и возвращает DataFrame для подачи в модель.
"""

import numpy as np
import pandas as pd
from scipy.signal import medfilt
from config import P


def load_window_from_json(payload: dict) -> pd.DataFrame:
    """
    Преобразует JSON-пакет с окном сигналов в DataFrame и выполняет предобработку.
    
    Формат входного JSON:
    {
        "window": {
            "t":   [0, 1, 2, ..., 300],
            "bpm": [142, 143, 141, ...],
            "uc":  [10, 12, 15, ...]
        }
    }

    Args:
        payload (dict): JSON-пакет окна.

    Returns:
        pd.DataFrame: таблица с колонками:
            - "t": время (секунды),
            - "bpm": частота сердечных сокращений плода,
            - "uc": сокращения матки.
    """
    window = payload["window"]
    df = pd.DataFrame({
        "t":   window["t"],
        "bpm": window["bpm"],
        "uc":  window["uc"]
    })

    # удаление аномалий bpm
    bpm = df["bpm"].to_numpy(dtype=float)
    bpm[(bpm < 50) | (bpm > 210)] = np.nan
    bpm = pd.Series(bpm).interpolate(limit=8).bfill().ffill().values

    # сглаживание
    bpm = medfilt(bpm, kernel_size=P.kernel_size)
    uc = medfilt(df["uc"].to_numpy(dtype=float), kernel_size=P.kernel_size)

    return pd.DataFrame({"t": df["t"].values, "bpm": bpm, "uc": uc})