import pytest
from apps.strategies.patterns import detect_shooting_star, detect_pin_bar_hammer
from apps.strategies.engine import StrategyEngine

def test_shooting_star_detection():
    # Long upper wick, small real body near low
    candle = {
        'open': 2820.0,
        'high': 2865.0,  # 45 pt upper shadow
        'low': 2818.0,   # 2 pt lower shadow
        'close': 2824.0  # 4 pt body
    }
    is_ss, conf = detect_shooting_star(candle)
    assert is_ss is True
    assert conf > 50.0


def test_pin_bar_detection():
    # Long lower wick, small real body near high
    candle = {
        'open': 2850.0,
        'high': 2853.0,  # 3 pt upper shadow
        'low': 2810.0,   # 40 pt lower shadow
        'close': 2848.0  # 2 pt body
    }
    is_pb, conf = detect_pin_bar_hammer(candle)
    assert is_pb is True
    assert conf > 50.0


def test_strategy_engine_signals():
    candles = [
        {'time': 1700000000 + i * 900, 'open': 2800 + i, 'high': 2810 + i, 'low': 2795 + i, 'close': 2805 + i, 'volume': 50000}
        for i in range(50)
    ]
    # Inject a shooting star at the latest closed candle
    candles[-1] = {
        'time': 1700000000 + 49 * 900,
        'open': 2850.0,
        'high': 2895.0,
        'low': 2849.0,
        'close': 2852.0,
        'volume': 85000
    }

    engine = StrategyEngine(min_rr=1.5, use_ema_filter=False)
    signals = engine.evaluate('RELIANCE', '15m', candles)

    assert len(signals) > 0
    assert any(s['action'] in ('BUY', 'SELL', 'WAIT') for s in signals)
    for sig in signals:
        assert 'entryPrice' in sig
        assert 'stopLoss' in sig
        assert 'target1' in sig
        assert 'rationale' in sig
        assert len(sig['rationale']) > 0
