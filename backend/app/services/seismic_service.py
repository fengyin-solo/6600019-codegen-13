"""Seismic waveform processing service."""
import numpy as np
from typing import List, Dict, Any


def generate_mock_waveform(duration: int = 60, sr: int = 100) -> Dict[str, Any]:
    """Generate synthetic seismic waveform with P and S arrivals."""
    n = sr * duration
    t = np.linspace(0, duration, n)

    # Background noise
    bhz = np.random.normal(0, 0.01, n)
    bhn = np.random.normal(0, 0.01, n)
    bhe = np.random.normal(0, 0.01, n)

    # P-wave (t=10s, 8Hz)
    p_mask = (t > 10) & (t < 18)
    p_amp = 0.8 * np.exp(-((t[p_mask] - 12) ** 2) / 8)
    bhz[p_mask] += p_amp * np.sin(2 * np.pi * 8 * t[p_mask])

    # S-wave (t=22s, 4Hz)
    s_mask = (t > 22) & (t < 40)
    s_amp = 1.5 * np.exp(-((t[s_mask] - 28) ** 2) / 30)
    bhe[s_mask] += s_amp * np.sin(2 * np.pi * 4 * t[s_mask])

    return {
        "time": t.tolist(),
        "bhz": bhz.tolist(),
        "bhn": bhn.tolist(),
        "bhe": bhe.tolist(),
        "samplingRate": sr,
    }


def sta_lta_pick(data: List[float], sr: int,
                 sta_sec: float = 1.0, lta_sec: float = 10.0,
                 threshold: float = 3.5) -> List[Dict[str, Any]]:
    """STA/LTA automatic phase picker."""
    arr = np.array(data)
    sta_len = int(sta_sec * sr)
    lta_len = int(lta_sec * sr)

    # Compute STA/LTA ratio
    sq = arr ** 2
    sta = np.convolve(sq, np.ones(sta_len) / sta_len, mode='valid')
    lta = np.convolve(sq, np.ones(lta_len) / lta_len, mode='valid')

    # Align lengths
    min_len = min(len(sta), len(lta))
    sta = sta[:min_len]
    lta = lta[:min_len]

    ratio = np.where(lta > 0, sta / lta, 0)
    picks = []
    last_pick = -999

    for i in range(len(ratio)):
        if ratio[i] > threshold and (i / sr - last_pick) > 2:
            t = (i + lta_len) / sr
            picks.append({
                "id": f"pick_{i}",
                "type": "P" if not picks else "S",
                "time": round(t, 2),
                "confidence": round(min(1.0, ratio[i] / 10), 2),
                "method": "STA/LTA",
            })
            last_pick = t

    return picks


def process_waveform(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """
    Process uploaded waveform file.
    In production, use ObsPy to read SAC/miniSEED:
        from obspy import read
        st = read(BytesIO(file_bytes))
    """
    waveform = generate_mock_waveform()
    picks = sta_lta_pick(waveform["bhz"], waveform["samplingRate"])
    return {"waveform": waveform, "picks": picks}
