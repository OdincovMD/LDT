"""
Признаки сокращений матки (UC).

Содержит функции для:
- детекции схваток по UC-сигналу,
- подсчёта числа и длительности схваток,
"""

import numpy as np
from scipy.signal import find_peaks

def detect_contractions(df, p) -> list:
    """
    Детектор схваток (UC):
      - ищем пики по prominence и высоте,
      - для каждого пика определяем start/end как точки пересечения с уровнем base+rel*h.
    """
    uc = df.uc.values
    t  = df.t.values

    # робастная статистика
    med = float(np.median(uc))
    mad = float(np.median(np.abs(uc - med)) + 1e-6)

    # пороги
    prom_abs = max(p.uc_prominence_min, p.uc_prominence_k_mad * mad)
    height_min = med + p.uc_height_k_mad * mad
    distance = int(p.uc_min_distance_s * p.fs)

    peaks, props = find_peaks(
        uc,
        prominence=prom_abs,
        height=height_min,
        distance=distance,
    )

    contractions = []
    # окно для поиска вокруг пика
    win = int(p.uc_local_base_window_s * p.fs)

    for pk, prom in zip(peaks, props["prominences"]):
        left = max(0, pk - win)
        right = min(len(uc), pk + win)
        local = np.r_[uc[left:pk-2], uc[pk+2:right]] if pk+2 < right and pk-2 > left else uc[left:right]
        # база
        base = float(np.median(local)) if len(local) > 0 else med

        peak_val = float(uc[pk])
        h = peak_val - base
        if h <= 0:
            continue

        level = base + p.uc_rel_start * h

        # влево
        i = pk
        while i > 0 and uc[i] > level:
            i -= 1
        start_idx = i

        # вправо
        j = pk
        while j < len(uc) - 1 and uc[j] > level:
            j += 1
        end_idx = j

        # если это были кратковременные схватки, тогда не учитывем
        duration = float(t[end_idx] - t[start_idx])
        if duration < p.uc_min_width_s:
            continue

        contractions.append(dict(
            start=float(t[start_idx]),
            peak=float(t[pk]),
            end=float(t[end_idx]),
            duration=float(t[end_idx] - t[start_idx]),
            height=float(h),
            base=base,
            prominence=float(prom),
        ))
    return contractions
