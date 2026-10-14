from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from apps.market.smartapi_client import AngelOneSmartApiClient
from .engine import StrategyEngine
from .decision_engine import TradeDecisionEngine
from datetime import datetime, timedelta
import time

smart_client = AngelOneSmartApiClient.get_instance()

# Mock in-memory outcome store for tracking eventual outcomes
_tracked_outcomes = [
    {
        'id': 'TRK-2885-0915',
        'symbol': 'RELIANCE',
        'pattern': 'Shooting Star',
        'setupBias': 'SHORT',
        'entryPrice': 2865.0,
        'stopLoss': 2882.0,
        'target1': 2835.0,
        'target2': 2818.0,
        'detectedAt': '2026-10-13 14:15:00',
        'outcome': 'TARGET_HIT',
        'realizedPnl': 30.0,
        'mfe': 35.5,  # Max Favorable Excursion in points
        'mae': 6.2,   # Max Adverse Excursion in points
        'mlPredictedProb': 0.624,
        'evaluatedDatasetEligible': True,
    },
    {
        'id': 'TRK-11536-1130',
        'symbol': 'TCS',
        'pattern': 'Pin Bar / Hammer',
        'setupBias': 'LONG',
        'entryPrice': 3920.0,
        'stopLoss': 3890.0,
        'target1': 3965.0,
        'target2': 3995.0,
        'detectedAt': '2026-10-14 11:30:00',
        'outcome': 'IN_PROGRESS',
        'realizedPnl': 18.0,
        'mfe': 24.0,
        'mae': 4.5,
        'mlPredictedProb': 0.589,
        'evaluatedDatasetEligible': True,
    },
    {
        'id': 'TRK-1333-1000',
        'symbol': 'HDFCBANK',
        'pattern': 'Bearish Engulfing',
        'setupBias': 'SHORT',
        'entryPrice': 1685.0,
        'stopLoss': 1698.0,
        'target1': 1665.0,
        'target2': 1650.0,
        'detectedAt': '2026-10-12 10:00:00',
        'outcome': 'STOP_LOSS_HIT',
        'realizedPnl': -13.0,
        'mfe': 5.0,
        'mae': 13.0,
        'mlPredictedProb': 0.518,
        'evaluatedDatasetEligible': True,
    }
]

@api_view(['GET'])
@permission_classes([AllowAny])
def evaluate_strategy(request):
    """Legacy signal evaluation endpoint."""
    symbol = request.query_params.get('symbol', 'RELIANCE')
    timeframe = request.query_params.get('timeframe', '15m')
    token = request.query_params.get('token', '2885')
    min_rr = float(request.query_params.get('min_rr', 1.5))
    use_ema = request.query_params.get('use_ema', 'true').lower() in ('true', '1')

    candles = smart_client.fetch_historical_candles(
        exchange='NSE',
        symbol_token=token,
        interval=timeframe,
        from_date=datetime.now() - timedelta(days=30),
        to_date=datetime.now()
    )

    engine = StrategyEngine(min_rr=min_rr, use_ema_filter=use_ema)
    signals = engine.evaluate(symbol, timeframe, candles)

    return Response({
        'symbol': symbol,
        'timeframe': timeframe,
        'signals': signals
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def evaluate_decision(request):
    """
    Core ML-Powered Trade Decision Engine endpoint.
    Combines rule-based technical checks, ML probability, OOS evidence,
    and returns exact decision states:
    WATCHING, WAIT, SETUP_QUALIFIED, SETUP_REJECTED, INVALIDATED, DATA_UNAVAILABLE.
    """
    symbol = request.query_params.get('symbol', 'RELIANCE')
    timeframe = request.query_params.get('timeframe', '15m')
    token = request.query_params.get('token', '2885')
    min_rr = float(request.query_params.get('min_rr', 1.5))
    use_ema = request.query_params.get('use_ema', 'true').lower() in ('true', '1')
    ml_threshold = float(request.query_params.get('ml_threshold', 0.52))
    is_calibrated = request.query_params.get('is_calibrated', 'true').lower() in ('true', '1')
    simulate_stale = request.query_params.get('simulate_stale', 'false').lower() in ('true', '1')

    candles = smart_client.fetch_historical_candles(
        exchange='NSE',
        symbol_token=token,
        interval=timeframe,
        from_date=datetime.now() - timedelta(days=30),
        to_date=datetime.now()
    )

    # Set feed timestamp: if simulate_stale is requested, simulate feed 180s in past
    feed_timestamp = (time.time() - 180) if simulate_stale else time.time()

    decision_engine = TradeDecisionEngine(
        min_risk_reward=min_rr,
        use_ema_filter=use_ema,
        ml_score_threshold=ml_threshold,
        is_calibrated=is_calibrated,
    )

    decision = decision_engine.evaluate_setup(
        symbol=symbol,
        timeframe=timeframe,
        candles=candles,
        feed_timestamp=feed_timestamp,
        is_live_feed=smart_client.get_auth_status()['connected']
    )

    return Response(decision)


@api_view(['GET'])
@permission_classes([AllowAny])
def setup_outcomes(request):
    """
    Returns history of tracked setups and eventual outcomes
    for continuous model evaluation and future dataset generation.
    """
    return Response({
        'outcomes': _tracked_outcomes,
        'summary': {
            'totalTracked': len(_tracked_outcomes),
            'targetHitCount': len([o for o in _tracked_outcomes if o['outcome'] == 'TARGET_HIT']),
            'stopLossCount': len([o for o in _tracked_outcomes if o['outcome'] == 'STOP_LOSS_HIT']),
            'datasetEligibleCount': len([o for o in _tracked_outcomes if o['evaluatedDatasetEligible']]),
        }
    })
