"""
Объединение всех признаков в единый словарь.

Импортирует функции из common, uc_features, figo_rules, extra
и вызывает их в едином пайплайне.
"""

import pandas as pd
import numpy as np
from ml.config import Params
from ml.features.extra import compute_window_extra_features
from ml.features.common import compute_window_basic_features
from ml.features.figo_rules import summarize_events_on_window


class CTGFeatureBuilder:
    """
    Класс-обёртка для извлечения признаков из окна КТГ.
    """

    def __init__(self, params: Params):
        self.params = params

    

    def extract_features(self, df: pd.DataFrame) -> dict:
        """
        Вычисляет признаки по одному окну сигнала.

        Args:
            df (pd.DataFrame): окно с сигналами (t, bpm, uc).

        Returns:
            dict: словарь признаков.
        """
        # базовые агрегаты
        feats = compute_window_basic_features(df, self.params)

        # события по FIGO
        counts, cons, decels, accels = summarize_events_on_window(df, self.params)
        feats.update({f"evt_{k}": v for k, v in counts.items()})

        # дополнительные динамические и спектральные признаки
        extra_feats = compute_window_extra_features(df, self.params)
        feats.update({f"extra_{k}": v for k, v in extra_feats.items()})

        # # лаги поздних деселераций
        # lags = [d["lag_to_uc_peak_s"] for d in decels if d["type"] == "late" and d["lag_to_uc_peak_s"] is not None]
        # base_feats["evt_late_mean_lag_s"] = float(np.mean(lags)) if lags else 0.0
        # base_feats["evt_late_max_lag_s"]  = float(np.max(lags)) if lags else 0.0

        # глубина деселераций и высота акцелераций
        drops = [d["drop_bpm"] for d in decels]
        rises = [a["rise_bpm"] for a in accels]
        feats["evt_decel_mean_drop"] = float(np.mean(drops)) if drops else 0.0
        feats["evt_accel_mean_rise"] = float(np.mean(rises)) if rises else 0.0

        return feats