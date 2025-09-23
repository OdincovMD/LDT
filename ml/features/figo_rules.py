"""
Признаки по правилам FIGO/NICHD.

Содержит функции:
- detect_decelerations: поиск деселераций и классификация их типов,
- detect_accelerations: поиск акцелераций,
- summarize_events_on_window: сводка по окну (схватки, деселерации, акцелерации,
  вариабельность, тахикардия/брадикардия).
"""

import pandas as pd
import numpy as np
from scipy.ndimage import label
from ml.features.uc_features import detect_contractions

def rolling_sd(x: np.ndarray, win_s: int, p) -> np.ndarray:
    """
    Скользящее стандартное отклонение (вариабельность FHR).
    win_s: длина окна в секундах
    fs: частота дискретизации (по умолчанию 1 Гц)
    """
    win = int(win_s * p.fs)
    return pd.Series(x).rolling(win, min_periods=win).std().values

def estimate_baseline_exp(bpm: np.ndarray, p) -> np.ndarray:
    """
    Экспоненциально сглаженный baseline FHR.
    Этот метод присваивает больший вес более последним наблюдениям,
    эффективно фильтруя кратковременные вариации (акселерации, децелерации) и выделяя долгосрочный тренд (базовый уровень).
    """
    alpha = p.alpha
    base = np.zeros_like(bpm, dtype=float)
    base[0] = bpm[0]
    for i in range(1, len(bpm)):
        base[i] = alpha * bpm[i] + (1 - alpha) * base[i-1]
    return base


def detect_decelerations(df: pd.DataFrame, contractions, p) -> list:
    """
    Возвращает список деселераций с типом FIGO.
    """
    t = df.t.values
    fhr = df.bpm.values
    # базовый уровень
    base = estimate_baseline_exp(fhr, p)

    # всё что ниже базового уровня - порог
    below = (fhr <= (base - p.decel_min_drop_bpm)).astype(int)
    labels, n = label(below)
    decels = []

    for k in range(1, n+1):
        idx = np.where(labels == k)[0]
        seg_t = t[idx]
        seg_f = fhr[idx]
        dur_s = seg_t[-1] - seg_t[0]

        # кратковременные выбросы не учитывем
        if dur_s < p.decel_min_duration_s:
            continue

        # надир и падание
        nadir_i = idx[np.argmin(seg_f)]
        drop = float(base[nadir_i] - fhr[nadir_i])
    
        if drop < p.decel_min_drop_bpm:
            continue

        # по умолчанию (нестрашно)
        dec_type, uc_idx, lag_to_uc_peak = "variable", None, None

        if dur_s >= p.prolonged_decel_min_s:
            dec_type = "prolonged"
        else:
            # ищем пересечение со схватками
            uc_idx, max_overlap = None, 0.0
            for idx_uc, uc in enumerate(contractions):
                ovl = max(0.0, min(seg_t[-1], uc["end"]) - max(seg_t[0], uc["start"]))
                if ovl > max_overlap:
                    max_overlap, uc_idx = ovl, idx_uc

            if uc_idx is not None and max_overlap > 0:
                uc = contractions[uc_idx]
                lag_to_uc_peak = float(t[nadir_i] - uc["peak"])

                near_peak = abs(lag_to_uc_peak) <= 10.0
                ends_after_uc = t[idx[-1]] > uc["end"]
                starts_with_uc = t[idx[0]] >= uc["start"] - 5.0

                if near_peak and starts_with_uc and not ends_after_uc:
                    dec_type = "early"
                elif lag_to_uc_peak > 0 and ends_after_uc:
                    dec_type = "late"

        decels.append(dict(
            start=float(seg_t[0]),
            nadir=float(t[nadir_i]),
            end=float(seg_t[-1]),
            drop_bpm=drop,
            duration_s=dur_s,
            type=dec_type,
            uc_idx=uc_idx,
            lag_to_uc_peak_s=lag_to_uc_peak
        ))
    return decels


def detect_accelerations(df: pd.DataFrame, p) -> list:
    """
    Поиск акцелераций:
    - ≥ accel_min_rise_bpm над baseline
    - длительность ≥ accel_min_duration_s
    """
    t = df.t.values
    fhr = df.bpm.values
    # база
    base = estimate_baseline_exp(fhr, p)

    # маска выше baseline
    above = (fhr >= (base + p.accel_min_rise_bpm)).astype(int)
    labels, n = label(above)

    accels = []
    for k in range(1, n+1):
        idx = np.where(labels == k)[0]
        seg_t = t[idx]
        seg_f = fhr[idx]
        duration_s = seg_t[-1] - seg_t[0]

        # короткие не учитываем
        if duration_s < p.accel_min_duration_s:
            continue

        peak_i_rel = int(np.argmax(seg_f))
        peak_i = idx[peak_i_rel]

        accels.append(dict(
            start=float(seg_t[0]),
            peak=float(t[peak_i]),
            end=float(seg_t[-1]),
            rise_bpm=float(fhr[peak_i] - base[peak_i]),
            duration_s=duration_s
        ))

    return accels


def summarize_events_on_window(seg: pd.DataFrame, p) -> dict:
    """
    Сводка событий за окно.

    Args:
        seg (pd.DataFrame): окно с сигналами (t, bpm, uc).
        p (Params): параметры проекта.

    Returns:
        tuple:
            counts (dict): агрегированные показатели (кол-во событий, вариабельность, тахи/бради).
            cons (list): найденные схватки.
            decels (list): деселерации.
            accels (list): акцелерации.
    """
    fs = p.fs

    # UC и схватки
    cons = detect_contractions(seg, p)

    # Деселерации и акцелерации
    decels = detect_decelerations(seg, cons, p)
    accels = detect_accelerations(seg, p)

    # Вариабельность
    fhr = seg.bpm.values
    var_sd = float(np.nanstd(fhr))

    # низкая вариабельность: доля времени, где SD < порога (по окну 60с)
    sd_series = rolling_sd(fhr, win_s=60, p=p)
    if np.isfinite(sd_series).sum() > 0:
        low_var_ratio = float(np.mean(sd_series < p.low_var_bpm))
        low_var_mean  = float(np.nanmean(sd_series))
    else:
        low_var_ratio, low_var_mean = np.nan, np.nan

    # тахикардия / брадикардия
    tachy_ratio = float(np.mean(fhr > p.tachy_bpm))
    brady_ratio = float(np.mean(fhr < p.brady_bpm))

    counts = dict(
        cons_total      = len(cons),
        decel_total     = len(decels),
        decel_early     = sum(1 for d in decels if d["type"] == "early"),
        decel_late      = sum(1 for d in decels if d["type"] == "late"),
        decel_variable  = sum(1 for d in decels if d["type"] == "variable"),
        decel_prolonged = sum(1 for d in decels if d["type"] == "prolonged"),
        accel_total     = len(accels),
        contractions    = len(cons),
        low_var_ratio   = low_var_ratio,
        low_var_mean    = low_var_mean,
        sd_overall      = var_sd,
        tachy_ratio     = tachy_ratio,
        brady_ratio     = brady_ratio,
    )
    return counts, cons, decels, accels