import pytest
from apps.backtesting.engine import BacktestEngine

def test_backtest_execution():
    candles = []
    base = 2800.0
    for i in range(100):
        # Create predictable price swings
        o = base + (i % 10) * 3
        c = o + 2.0
        h = max(o, c) + 8.0
        l = min(o, c) - 8.0
        candles.append({
            'time': 1700000000 + i * 900,
            'open': o,
            'high': h,
            'low': l,
            'close': c,
            'volume': 40000
        })

    engine = BacktestEngine(
        symbol="RELIANCE",
        timeframe="15m",
        initial_capital=500000.0,
        brokerage_per_order=20.0,
        slippage_percent=0.05,
        min_risk_reward=1.5,
        require_ema_filter=False,
    )

    result = engine.run(candles)
    assert result is not None
    assert 'initialCapital' in result
    assert result['initialCapital'] == 500000.0
    assert 'winRate' in result
    assert 'profitFactor' in result
    assert 'maxDrawdownPercent' in result
    assert 'equityCurve' in result
    assert len(result['equityCurve']) > 0
