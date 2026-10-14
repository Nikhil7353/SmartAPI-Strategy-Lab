import pytest
import time
from apps.strategies.decision_engine import TradeDecisionEngine
from apps.strategies.ml_engine import MLTradeDecisionModel

def test_ml_model_feature_extraction_and_prediction():
    candle = {
        'open': 2820.0,
        'high': 2865.0,
        'low': 2818.0,
        'close': 2824.0,
        'volume': 65000,
    }
    history = [
        {'volume': 50000} for _ in range(20)
    ]
    model = MLTradeDecisionModel(is_calibrated=True)
    features = model.extract_features(
        candle=candle,
        prev_candles=history,
        ema200=2850.0,
        atr=14.5,
        rsi=68.0,
        resistance=2866.0,
        support=2800.0
    )

    assert 'wick_rejection_ratio' in features
    assert 'vol_expansion' in features
    assert 'ema200_regime_alignment' in features

    pred = model.predict(features)
    assert 'modelScore' in pred
    assert 'isCalibrated' in pred
    assert pred['isCalibrated'] is True
    assert pred['label'] == 'Calibrated Win Probability'
    assert pred['probability'] is not None
    assert 'confidenceInterval' in pred
    assert 'featureContributions' in pred
    assert len(pred['featureContributions']) > 0
    assert 'oosMetrics' in pred
    assert pred['oosMetrics']['sampleSizeN'] == 462


def test_ml_model_uncalibrated_label():
    model = MLTradeDecisionModel(is_calibrated=False)
    features = {'wick_rejection_ratio': 0.75, 'vol_expansion': 1.4}
    pred = model.predict(features)

    assert pred['isCalibrated'] is False
    assert 'Uncalibrated' in pred['label']
    assert pred['probability'] is None


def test_decision_engine_stale_feed_safety_override():
    engine = TradeDecisionEngine(max_feed_stale_seconds=60)
    stale_timestamp = time.time() - 150  # 150 seconds ago

    candles = [
        {'time': 1700000000 + i * 900, 'open': 2800, 'high': 2810, 'low': 2795, 'close': 2805, 'volume': 50000}
        for i in range(30)
    ]

    result = engine.evaluate_setup(
        symbol='RELIANCE',
        timeframe='15m',
        candles=candles,
        feed_timestamp=stale_timestamp
    )

    assert result['state'] == 'DATA_UNAVAILABLE'
    assert 'stale' in result['stateExplanation'].lower()


def test_decision_engine_setup_states():
    engine = TradeDecisionEngine(min_risk_reward=1.5, use_ema_filter=True, ml_score_threshold=0.50)
    now = time.time()

    candles = [
        {'time': int(now - (50 - i) * 900), 'open': 2800 + i, 'high': 2810 + i, 'low': 2795 + i, 'close': 2805 + i, 'volume': 50000}
        for i in range(50)
    ]

    # Inject a clear Shooting Star rejection at resistance
    candles[-1] = {
        'time': int(now - 900),
        'open': 2848.0,
        'high': 2895.0,  # 47 pt upper wick
        'low': 2846.0,   # 2 pt lower wick
        'close': 2850.0,
        'volume': 85000
    }

    result = engine.evaluate_setup(
        symbol='RELIANCE',
        timeframe='15m',
        candles=candles,
        feed_timestamp=now
    )

    valid_states = ['WATCHING', 'WAIT', 'SETUP_QUALIFIED', 'SETUP_REJECTED', 'INVALIDATED', 'DATA_UNAVAILABLE']
    assert result['state'] in valid_states
    assert 'evidenceChecklist' in result
    assert len(result['evidenceChecklist']) >= 5
    assert 'mlOutput' in result
    assert 'tradeLevels' in result
    assert 'regulatoryNotice' in result

