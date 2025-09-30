"""
Модуль постобработки предсказаний модели.
"""

from collections import deque
from dataclasses import dataclass
import numpy as np

STRIDE_S = 1  # шаг поступления окон, сек

def minutes_to_frames(minutes: float, stride_s: int = STRIDE_S) -> int:
    return int(np.ceil(minutes * 60.0 / stride_s))

@dataclass
class AlarmConfig:
    on_thr: float = 0.80          # порог включения
    off_thr: float = 0.65         # порог выключения (гистерезис)
    on_minutes: float = 2.0      # сколько минут подряд «высоко» для включения
    off_minutes: float = 1.0      # сколько минут подряд «низко» для выключения
    on_ratio: float = 0.80        # доля окон выше порога в интервале включения
    off_ratio: float = 1.00       # доля окон ниже порога в интервале выключения

class AlarmState:
    def __init__(self, cfg: AlarmConfig, stride_s: int = STRIDE_S):
        self.cfg = cfg
        self.on_n  = minutes_to_frames(cfg.on_minutes,  stride_s)
        self.off_n = minutes_to_frames(cfg.off_minutes, stride_s)
        self.on_k  = int(np.ceil(self.on_n  * cfg.on_ratio))
        self.off_k = int(np.ceil(self.off_n * cfg.off_ratio))
        # Буферы последних окон под каждое правило
        self.buf_on  = deque(maxlen=self.on_n)
        self.buf_off = deque(maxlen=self.off_n)
        self.is_on = False  # текущее состояние тревоги

    def update(self, proba: float) -> int:
        # Обновляем буферы индикаторами
        self.buf_on.append(  1 if proba > self.cfg.on_thr  else 0 )
        self.buf_off.append( 1 if proba < self.cfg.off_thr else 0 )

        if not self.is_on:
            # Условие включения: достаточно истории + k из n выше on_thr
            if len(self.buf_on) == self.buf_on.maxlen and sum(self.buf_on) >= self.on_k:
                self.is_on = True
        else:
            # Условие выключения: достаточно истории + k из n ниже off_thr
            if len(self.buf_off) == self.buf_off.maxlen and sum(self.buf_off) >= self.off_k:
                self.is_on = False

        return int(self.is_on)
