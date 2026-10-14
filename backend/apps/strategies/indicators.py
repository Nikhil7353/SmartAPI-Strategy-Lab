import numpy as np

def calculate_ema(closes, period):
    """Calculate Exponential Moving Average series."""
    if len(closes) < period:
        return [closes[-1]] * len(closes)
    
    k = 2 / (period + 1)
    ema = [closes[0]]
    for price in closes[1:]:
        ema.append(price * k + ema[-1] * (1 - k))
    return ema


def calculate_sma(closes, period):
    """Calculate Simple Moving Average series."""
    if len(closes) < period:
        return [closes[-1]] * len(closes)
    sma = []
    for i in range(len(closes)):
        if i < period:
            sma.append(sum(closes[:i+1]) / (i + 1))
        else:
            sma.append(sum(closes[i-period+1:i+1]) / period)
    return sma


def calculate_atr(candles, period=14):
    """Calculate Average True Range (ATR) value."""
    if len(candles) < 2:
        return 10.0

    trs = []
    for i in range(1, len(candles)):
        c_curr = candles[i]
        c_prev = candles[i - 1]
        h_l = c_curr['high'] - c_curr['low']
        h_cp = abs(c_curr['high'] - c_prev['close'])
        l_cp = abs(c_curr['low'] - c_prev['close'])
        tr = max(h_l, h_cp, l_cp)
        trs.append(tr)

    if len(trs) < period:
        return float(np.mean(trs)) if trs else 10.0

    # Exponential smoothed ATR
    atr = trs[0]
    for tr in trs[1:]:
        atr = (atr * (period - 1) + tr) / period
    return round(float(atr), 2)


def calculate_rsi(closes, period=14):
    """Calculate Relative Strength Index (RSI)."""
    if len(closes) <= period:
        return 50.0

    deltas = np.diff(closes)
    gains = np.where(deltas > 0, deltas, 0)
    losses = np.where(deltas < 0, -deltas, 0)

    avg_gain = np.mean(gains[:period])
    avg_loss = np.mean(losses[:period])

    for i in range(period, len(deltas)):
        avg_gain = (avg_gain * (period - 1) + gains[i]) / period
        avg_loss = (avg_loss * (period - 1) + losses[i]) / period

    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return round(float(100 - (100 / (1 + rs))), 2)


def find_support_resistance(candles, window=20):
    """Identify key swing highs (resistance) and swing lows (support)."""
    if len(candles) < window:
        highs = [c['high'] for c in candles]
        lows = [c['low'] for c in candles]
        return max(highs), min(lows)

    recent = candles[-window:]
    resistance = max([c['high'] for c in recent])
    support = min([c['low'] for c in recent])
    return resistance, support
