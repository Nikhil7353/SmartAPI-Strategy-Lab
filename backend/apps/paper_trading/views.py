from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from datetime import datetime

# In-memory virtual account state with persistence capability
_virtual_account = {
    'virtualCapital': 1000000.0,
    'availableMargin': 845200.0,
    'usedMargin': 154800.0,
    'realizedPnl': 18450.0,
    'unrealizedPnl': 3240.0,
    'totalTrades': 14,
    'activePositionsCount': 2,
}

_virtual_positions = [
    {
        'id': 'POS-1',
        'symbol': 'RELIANCE',
        'token': '2885',
        'side': 'BUY',
        'quantity': 50,
        'averagePrice': 2845.0,
        'ltp': 2862.5,
        'unrealizedPnl': 875.0,
        'pnlPercent': 0.61,
        'stopLoss': 2820.0,
        'target': 2910.0,
        'entryTime': '10:15:22',
    },
    {
        'id': 'POS-2',
        'symbol': 'TCS',
        'token': '11536',
        'side': 'BUY',
        'quantity': 25,
        'averagePrice': 3910.0,
        'ltp': 3942.0,
        'unrealizedPnl': 800.0,
        'pnlPercent': 0.82,
        'stopLoss': 3880.0,
        'target': 4000.0,
        'entryTime': '09:42:10',
    },
]

_virtual_orders = [
    {
        'id': 'ORD-892101',
        'symbol': 'RELIANCE',
        'token': '2885',
        'side': 'BUY',
        'orderType': 'LIMIT',
        'price': 2845.0,
        'quantity': 50,
        'filledQuantity': 50,
        'averagePrice': 2845.0,
        'status': 'EXECUTED',
        'stopLoss': 2820.0,
        'target': 2910.0,
        'placedAt': '10:15:22',
        'updatedAt': '10:15:30',
        'remarks': 'Paper Execution — Shooting star failure pullback',
    },
    {
        'id': 'ORD-892095',
        'symbol': 'TCS',
        'token': '11536',
        'side': 'BUY',
        'orderType': 'MARKET',
        'price': 3910.0,
        'quantity': 25,
        'filledQuantity': 25,
        'averagePrice': 3910.0,
        'status': 'EXECUTED',
        'stopLoss': 3880.0,
        'target': 4000.0,
        'placedAt': '09:42:10',
        'updatedAt': '09:42:10',
        'remarks': 'Paper Execution — 15m Pin Bar reversal',
    },
]

_virtual_journal = [
    {
        'id': 'JRN-401',
        'symbol': 'INFY',
        'side': 'BUY',
        'entryPrice': 1580.0,
        'exitPrice': 1612.0,
        'quantity': 100,
        'pnl': 3200.0,
        'strategyUsed': 'Pin Bar Support Confluence',
        'entryReason': 'Bullish rejection at 200 EMA with 2.8 R:R potential',
        'exitReason': 'Target 1 hit automatically',
        'executedAt': 'Yesterday 14:30',
        'durationMinutes': 110,
    },
    {
        'id': 'JRN-400',
        'symbol': 'BANKNIFTY',
        'side': 'SELL',
        'entryPrice': 48600.0,
        'exitPrice': 48820.0,
        'quantity': 15,
        'pnl': -3300.0,
        'strategyUsed': 'Shooting Star Resistance',
        'entryReason': 'Bearish pin bar at swing high resistance',
        'exitReason': 'Stop Loss triggered on trend continuation',
        'executedAt': 'Yesterday 11:15',
        'durationMinutes': 45,
    },
]


@api_view(['GET'])
@permission_classes([AllowAny])
def paper_account(request):
    """Retrieve simulated paper portfolio margin and balance."""
    return Response(_virtual_account)


@api_view(['GET'])
@permission_classes([AllowAny])
def paper_positions(request):
    """Retrieve active open paper positions."""
    return Response({'positions': _virtual_positions})


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def paper_orders(request):
    """
    List or place simulated paper orders.
    ABSOLUTELY ISOLATED: Never calls broker API.
    """
    if request.method == 'POST':
        data = request.data
        order_id = f"ORD-{int(datetime.now().timestamp()) % 1000000}"
        new_order = {
            'id': order_id,
            'symbol': data.get('symbol', 'UNKNOWN'),
            'token': data.get('token', '0'),
            'side': data.get('side', 'BUY'),
            'orderType': data.get('orderType', 'MARKET'),
            'price': float(data.get('price', 0.0)),
            'quantity': int(data.get('quantity', 1)),
            'filledQuantity': int(data.get('quantity', 1)),
            'averagePrice': float(data.get('price', 0.0)),
            'status': 'EXECUTED',
            'stopLoss': data.get('stopLoss'),
            'target': data.get('target'),
            'placedAt': datetime.now().strftime("%H:%M:%S"),
            'updatedAt': datetime.now().strftime("%H:%M:%S"),
            'remarks': 'Paper Simulation Execution',
        }
        _virtual_orders.insert(0, new_order)
        return Response(new_order)

    return Response({'orders': _virtual_orders})


@api_view(['GET'])
@permission_classes([AllowAny])
def paper_journal(request):
    """Retrieve trade journal entries with context rationale."""
    return Response({'journal': _virtual_journal})
