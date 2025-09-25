"""
Базовые признаки КТГ-сигнала.

Содержит функции для вычисления:
- baseline ЧСС (сглаживание),
- общей вариабельности (SDNN, IQR, STV),
- спектральных характеристик (низкие/высокие частоты).
- кросс-коррелиция.
"""

import numpy as np
import pandas as pd
from scipy.signal import welch

def compute_baseline(x: np.ndarray) -> float:
    """Глобальный baseline (медиана)"""
    return float(np.nanmedian(x))


def compute_variability(bpm: np.ndarray, p) -> dict:
    """Статистические признаки вариабельности"""
    f = {}
    f["bpm_sd"]  = float(np.nanstd(bpm))
    f["bpm_iqr"] = float(np.nanpercentile(bpm, 75) - np.nanpercentile(bpm, 25))
    sec = bpm[::int(p.fs)] if p.fs >= 1 else bpm
    if len(sec) > 1 and np.isfinite(sec).sum() > 1:
        f["stv"] = float(np.nanmean(np.abs(np.diff(sec))))
    else:
        f["stv"] = np.nan
    return f


def compute_psd(bpm: np.ndarray, p) -> dict:
    """Спектральные признаки HRV (low/high frequency)"""
    f = {}
    detr = bpm - np.nanmedian(bpm)
    if len(detr) >= p.fs*60:
        freqs, Pxx = welch(detr, fs=p.fs, nperseg=int(p.fs*60))
        lf_mask = (freqs >= 0.04) & (freqs < 0.15)
        hf_mask = (freqs >= 0.15) & (freqs < 0.4)
        f["psd_low"]  = float(Pxx[lf_mask].sum())
        f["psd_high"] = float(Pxx[hf_mask].sum())
        f["psd_lf_hf"] = float(f["psd_low"] / f["psd_high"]) if f["psd_high"] > 0 else np.nan
    else:
        f["psd_low"] = f["psd_high"] = f["psd_lf_hf"] = np.nan
    return f


def compute_coupling(bpm: np.ndarray, uc: np.ndarray) -> dict:
    """Кросс-коррелиция: анализ взаимосвязи между двумя сигналами (FHR и UC)"""
    b0 = (bpm - np.nanmean(bpm)) / (np.nanstd(bpm) + 1e-6)
    u0 = (uc - np.nanmean(uc)) / (np.nanstd(uc) + 1e-6)
    xcorr = np.correlate(b0, u0, mode="full") / len(b0)
    return {"xcorr_absmax": float(np.nanmax(np.abs(xcorr))) if len(xcorr) else np.nan}


def compute_window_basic_features(seg: pd.DataFrame, p) -> dict:
    bpm = seg.bpm.values
    uc  = seg.uc.values
    feats = {}
    feats["baseline"] = compute_baseline(bpm)
    feats.update(compute_variability(bpm, p))
    feats.update(compute_psd(bpm, p))
    feats.update(compute_coupling(bpm, uc))
    return feats