"""
Дополнительные признаки КТГ.

Содержит функции для вычисления дополнительных характеристик сигнала ЧСС плода:
- робастная статистика (MAD, асимметрия, эксцесс)
- трендовые характеристики (наклон, детрендирование)
- вариабельность сердечного ритма (RMSSD, Poincaré plot)
- нелинейный анализ (энтропия, параметры Хорса)
- автокорреляционный анализ
"""

import pandas as pd
import numpy as np
import math
from scipy.stats import skew, kurtosis
from scipy.signal import correlate

def robust_stats(x) -> dict:
    """Вычисляет робастные статистические характеристики сигнала.
    
    Args:
        x: Входной сигнал ЧСС плода
        
    Returns:
        Словарь с характеристиками:
        - bpm_mad: медианное абсолютное отклонение (MAD)
        - bpm_skew: коэффициент асимметрии
        - bpm_kurt: коэффициент эксцесса
        - outlier_ratio: доля выбросов (>3 MAD)
    """
    x = np.asarray(x)
    med = np.nanmedian(x)
    mad = np.nanmedian(np.abs(x - med)) * 1.4826  # нормированный MAD
    skews = skew(x, nan_policy="omit")
    kurt = kurtosis(x, fisher=True, nan_policy="omit")
    # robust z
    rz = (x - med) / (mad + 1e-9)
    outlier_ratio = np.mean(np.abs(rz) > 3) if np.isfinite(rz).any() else np.nan
    return {
        "bpm_mad": float(mad),
        "bpm_skew": float(skews),
        "bpm_kurt": float(kurt),
        "outlier_ratio": float(outlier_ratio),
    }

def trend_features(x, p) -> dict:
    """Анализ трендовых характеристик сигнала.
    
    Args:
        x: Входной сигнал
        fs: Частота дискретизации (Гц)
        
    Returns:
        Словарь с трендовыми характеристиками:
        - trend_slope: наклон линейного тренда (уд/мин/сек)
        - trend_r2: коэффициент детерминации тренда
        - deriv_zero_cross_rate: частота смены направления производной
    """
    t = np.arange(len(x)) / p.fs
    xm = np.nanmean(x); xs = x - xm
    # линейная регрессия по формуле нормальных уравнений
    A = np.vstack([t, np.ones_like(t)]).T
    coef, _, _, _ = np.linalg.lstsq(A, x, rcond=None)
    slope = coef[0]
    # R^2
    yhat = A @ coef
    ss_res = np.nansum((x - yhat)**2)
    ss_tot = np.nansum((x - np.nanmean(x))**2) + 1e-12
    r2 = 1.0 - ss_res/ss_tot
    # частота смены направления (по производной)
    dx = np.diff(x)
    zcr = np.mean(dx[:-1] * dx[1:] < 0) if len(dx) > 2 else np.nan
    return {
        "trend_slope": float(slope),
        "trend_r2": float(r2),
        "deriv_zero_cross_rate": float(zcr),
    }

# HRV / нелинейка
def rmssd(x) -> float:
    """Root Mean Square of Successive Differences - мера кратковременной вариабельности.
    
    Args:
        x: Входной сигнал ЧСС
        
    Returns:
        RMSSD в единицах измерения сигнала
    """
    d = np.diff(x)
    return float(np.sqrt(np.nanmean(d*d)))

def poincare_sd1_sd2(x) -> tuple:
    """Параметры SD1 и SD2 из анализа Poincaré plot.
    
    Args:
        x: Входной сигнал ЧСС
        
    Returns:
        tuple: (SD1, SD2, SD1/SD2) - меры кратковременной и долговременной вариабельности
    """
    x1, x2 = x[:-1], x[1:]
    dif = x2 - x1
    sd1 = np.sqrt(np.nanvar(dif) / 2.0)
    sd2 = np.sqrt(2*np.nanvar(x) - (np.nanvar(dif)/2.0))
    return float(sd1), float(sd2), float(sd1/(sd2+1e-9))

def permutation_entropy(x, m=3, tau=1) -> float:
    """Энтропия перестановок - мера сложности временного ряда.
    
    Args:
        x: Входной сигнал
        m: Размерность паттерна (рекомендуется 3-7)
        tau: Задержка дискретизации
        
    Returns:
        Нормализованная энтропия перестановок [0, 1]
    """
    x = np.asarray(x)
    n = len(x) - (m-1)*tau
    if n <= 0:
        return np.nan
    patterns = {}
    for i in range(n):
        pat = tuple(np.argsort(x[i:i+m*tau:tau]))
        patterns[pat] = patterns.get(pat, 0) + 1
    p = np.array(list(patterns.values()), dtype=float)
    p /= p.sum()
    H = -np.sum(p*np.log2(p))
    Hmax = np.log2(math.factorial(m))
    return float(H / (Hmax + 1e-12))

def hjorth_params(x, p) -> tuple:
    """Параметры Хорса - активность, мобильность, сложность.
    
    Args:
        x: Входной сигнал
        
    Returns:
        tuple: (activity, mobility, complexity) - параметры Хорса
    """
    x = np.asarray(x)
    dx = np.diff(x, prepend=x[0]) * p.fs
    ddx = np.diff(dx, prepend=dx[0]) * p.fs
    var_x = np.nanvar(x); var_dx = np.nanvar(dx); var_ddx = np.nanvar(ddx)
    activity = var_x
    mobility = np.sqrt(var_dx/(var_x+1e-12))
    complexity = np.sqrt(var_ddx/(var_dx+1e-12)) / (mobility + 1e-12)
    return float(activity), float(mobility), float(complexity)

# Автокорреляция
def autocorr_features(x, p, max_lag_s=120) -> tuple:
    """Анализ автокорреляционной функции сигнала ЧСС.
    
    Args:
        x: Входной сигнал
        fs: Частота дискретизации (Гц)
        max_lag_s: Максимальный лаг для анализа (секунды)
        
    Returns:
        tuple: (ac_peak_lag, ac_decay) - лаг первого пика и время спада до 1/e
    """
    x = np.asarray(x) - np.nanmean(x)
    x = np.nan_to_num(x)
    n = len(x)
    max_lag = int(max_lag_s*p.fs)
    ac = correlate(x, x, mode="full")[n-1:n+max_lag]
    ac /= ac[0] + 1e-12
    # первый локальный пик после нулевого лага
    # найдём максимум на интервале [1..]
    if len(ac) > 2:
        # грубо: лаг, где ac максимален после нуля
        lag_idx = 1 + np.argmax(ac[1:])
        ac_peak_lag = lag_idx / p.fs
    else:
        ac_peak_lag = np.nan
    # время спада до уровня 1/e
    below = np.where(ac <= (1/np.e))[0]
    ac_decay = (below[0]/p.fs) if len(below) > 0 else np.nan
    return float(ac_peak_lag), float(ac_decay)


def compute_window_extra_features(seg: pd.DataFrame, p) -> dict:
    bpm = seg.bpm.values
    feats = {}
    feats.update(robust_stats(bpm))
    feats.update(trend_features(bpm, p))
    sd1, sd2, ratio = poincare_sd1_sd2(bpm)
    feats.update({
        "rmssd": rmssd(bpm),
        "poincare_sd1": sd1,
        "poincare_sd2": sd2,
        "sd1_sd2_ratio": ratio,
        "perm_entropy": permutation_entropy(bpm, m=3, tau=max(1, int(0.5*p.fs))),  # ~0.5с лаг
    })
    act, mob, comp = hjorth_params(bpm, p)
    feats.update({
        "hjorth_activity": act,
        "hjorth_mobility": mob,
        "hjorth_complexity": comp,
    })
    ac_lag, ac_decay = autocorr_features(bpm, p)
    feats.update({
        "ac_peak_lag": ac_lag,
        "ac_decay_time": ac_decay,
    })
    return feats