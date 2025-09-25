"""
Модуль core для инференса КТГ.

Назначение:
- загрузка обученной CatBoost модели один раз при старте,
- преобразование входного JSON окна в DataFrame,
- вычисление признаков через CTGFeatureBuilder,
- получение вероятности и метки от модели.
"""

import pandas as pd
from catboost import CatBoostClassifier
from preprocessing.loaders import load_window_from_json
from features.builder import CTGFeatureBuilder
from config import P


class CTGInference:
    """
    Класс-обёртка для инференса модели КТГ.
    """

    def __init__(self, model_path: str):
        """
        Загружает CatBoost модель из файла и инициализирует экстрактор признаков.

        Args:
            model_path str: путь к файлу с моделью (.cbm).
        """

        self.model = CatBoostClassifier()
        self.model.load_model(model_path)

        self.builder = CTGFeatureBuilder(P)

    def predict_from_json(self, payload: dict, threshold: float = 0.7) -> dict:
        """
        Делает предсказание по одному JSON-окну.

        Args:
            payload (dict): словарь формата:
                {
                  "window": {
                    "t": [...],
                    "bpm": [...],
                    "uc": [...]
                  }
                }
            threshold (float): порог классификации (по вероятности).

        Returns:
            dict: результат инференса:
                {
                  "proba": float,   # вероятность гипоксии
                  "label": int,     # бинарная метка (0/1)
                  "features": dict  # словарь признаков
                }
        """
        # загрузка окна
        df = load_window_from_json(payload)

        # извлечение признаков
        feats = self.builder.extract_features(df)

        # инференс
        X = pd.DataFrame([feats])
        X["H"] = 5
        proba = float(self.model.predict_proba(X)[:, 1][0])
        label = int(proba > threshold)

        return {"proba": proba, "label": label, "features": feats}
