def detect_shooting_star(candle, prev_candles=None):
    """
    Detects Shooting Star candlestick pattern:
    - Upper shadow at least 2x the real body (or >= 50% of total candle range)
    - Small lower shadow (<= 20% of total candle range)
    - Body is positioned in the lower half of the total candle range
    """
    o, h, l, c = candle['open'], candle['high'], candle['low'], candle['close']
    body = abs(c - o)
    total_range = h - l

    if total_range == 0:
        return False, 0.0

    upper_wick = h - max(o, c)
    lower_wick = min(o, c) - l

    # Shooting Star conditions:
    # 1. Upper wick >= 1.8x body OR upper wick >= 50% of total range
    # 2. Lower wick is small (<= 20% of total range or <= 0.6x body)
    is_upper_rejection = upper_wick >= (1.8 * body) or upper_wick >= (0.5 * total_range)
    is_lower_wick_small = lower_wick <= (0.20 * total_range) or lower_wick <= (0.6 * body)
    is_body_lower = max(o, c) <= (l + total_range * 0.55)

    if is_upper_rejection and is_lower_wick_small and is_body_lower:
        confidence = min(95.0, round((upper_wick / (total_range or 1)) * 100.0, 1))
        return True, confidence

    return False, 0.0


def detect_pin_bar_hammer(candle, prev_candles=None):
    """
    Detects Bullish Pin Bar / Hammer candlestick pattern:
    - Lower shadow at least 2x the real body (or >= 50% of total candle range)
    - Small upper shadow (<= 20% of total candle range)
    - Body is positioned in the upper half of the total candle range
    """
    o, h, l, c = candle['open'], candle['high'], candle['low'], candle['close']
    body = abs(c - o)
    total_range = h - l

    if total_range == 0:
        return False, 0.0

    upper_wick = h - max(o, c)
    lower_wick = min(o, c) - l

    # Hammer / Pin bar conditions:
    # 1. Lower wick >= 1.8x body OR lower wick >= 50% of total range
    # 2. Upper wick is small (<= 20% of total range or <= 0.6x body)
    is_lower_rejection = lower_wick >= (1.8 * body) or lower_wick >= (0.5 * total_range)
    is_upper_wick_small = upper_wick <= (0.20 * total_range) or upper_wick <= (0.6 * body)
    is_body_upper = min(o, c) >= (l + total_range * 0.45)

    if is_lower_rejection and is_upper_wick_small and is_body_upper:
        confidence = min(95.0, round((lower_wick / (total_range or 1)) * 100.0, 1))
        return True, confidence

    return False, 0.0


def detect_engulfing(curr_candle, prev_candle):
    """
    Detects Bullish or Bearish Engulfing pattern against the preceding candle.
    """
    if not prev_candle or not curr_candle:
        return None, 0.0

    curr_o, curr_c = curr_candle['open'], curr_candle['close']
    prev_o, prev_c = prev_candle['open'], prev_candle['close']

    curr_bullish = curr_c > curr_o
    prev_bearish = prev_c < prev_o

    curr_bearish = curr_c < curr_o
    prev_bullish = prev_c > prev_o

    # Bullish engulfing
    if prev_bearish and curr_bullish:
        if curr_o <= prev_c and curr_c >= prev_o:
            return 'BULLISH_ENGULFING', 85.0

    # Bearish engulfing
    if prev_bullish and curr_bearish:
        if curr_o >= prev_c and curr_c <= prev_o:
            return 'BEARISH_ENGULFING', 85.0

    return None, 0.0
