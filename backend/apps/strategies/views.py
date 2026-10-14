from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from apps.market.smartapi_client import AngelOneSmartApiClient
from .engine import StrategyEngine
from datetime import datetime, timedelta

smart_client = AngelOneSmartApiClient.get_instance()

@api_view(['GET'])
@permission_classes([AllowAny])
def evaluate_strategy(request):
    """
    Evaluate technical patterns and trend context for an instrument and timeframe.
    """
    symbol = request.query_params.get('symbol', 'RELIANCE')
    timeframe = request.query_params.get('timeframe', '15m')
    token = request.query_params.get('token', '2885')

    # Config parameters from query or defaults
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
