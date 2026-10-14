from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from apps.market.smartapi_client import AngelOneSmartApiClient
from .engine import BacktestEngine
from datetime import datetime, timedelta

smart_client = AngelOneSmartApiClient.get_instance()

@api_view(['POST'])
@permission_classes([AllowAny])
def run_backtest(request):
    """
    Run historical backtest for given configuration and persist results.
    """
    params = request.data
    symbol = params.get('symbol', 'RELIANCE')
    timeframe = params.get('timeframe', '15m')
    initial_capital = float(params.get('initialCapital', 500000))
    brokerage = float(params.get('brokeragePerOrder', 20))
    slippage = float(params.get('slippagePercent', 0.05))
    min_rr = float(params.get('minRiskReward', 1.5))
    use_ema = bool(params.get('requireEmaFilter', True))
    enable_ss = bool(params.get('enableShootingStar', True))
    enable_pb = bool(params.get('enablePinBar', True))

    candles = smart_client.fetch_historical_candles(
        exchange='NSE',
        symbol_token='2885',
        interval=timeframe,
        from_date=datetime.now() - timedelta(days=45),
        to_date=datetime.now()
    )

    engine = BacktestEngine(
        symbol=symbol,
        timeframe=timeframe,
        initial_capital=initial_capital,
        brokerage_per_order=brokerage,
        slippage_percent=slippage,
        min_risk_reward=min_rr,
        require_ema_filter=use_ema,
        enable_shooting_star=enable_ss,
        enable_pin_bar=enable_pb
    )

    result = engine.run(candles)
    return Response(result)
