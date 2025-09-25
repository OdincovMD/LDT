"""
Модуль конфигурации проекта.

Задачи:
- Один раз загрузить параметры из configs/default.yaml.
- Превратить их в dataclass для удобного обращения по атрибутам.
- Предоставить глобальный экземпляр P, используемый по всему проекту.
"""

from dataclasses import dataclass
import os
import yaml

@dataclass
class Params:
    # Общие
    seed: int

    # Предобработка сигналов
    kernel_size: int
    alpha: float
    fs: float
    baseline_minutes: float

    # UC detection
    uc_min_distance_s: float
    uc_min_width_s: float
    uc_rel_start: float
    uc_prominence_min: float
    uc_prominence_k_mad: float
    uc_height_k_mad: float
    uc_local_base_window_s: float

    # Decelerations
    decel_min_drop_bpm: float
    decel_min_duration_s: float
    prolonged_decel_min_s: float
    abrupt_onset_s: float

    # Accelerations
    accel_min_rise_bpm: float
    accel_min_duration_s: float
    accel_total_threshold: float

    # Variability
    low_var_bpm: float
    low_var_min_s: float

    # Tachycardia / Bradycardia
    tachy_bpm: float
    brady_bpm: float


def load_params(path: str) -> Params:
    """
    Загружает YAML-конфиг и возвращает dataclass Params.
    """
    with open(path, "r") as f:
        cfg = yaml.safe_load(f)
    return Params(**cfg)


P = load_params(os.path.join("ml", "configs", "default.yaml"))