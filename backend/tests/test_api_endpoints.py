import pytest
from rest_framework.test import APIClient

@pytest.fixture
def api_client():
    return APIClient()

@pytest.mark.django_db
def test_market_auth_status_endpoint(api_client):
    response = api_client.get('/api/market/auth/status/')
    assert response.status_code == 200
    data = response.json()
    assert 'broker' in data
    assert data['broker'] == 'Angel One SmartAPI'
    assert 'feedStatus' in data

@pytest.mark.django_db
def test_market_quotes_endpoint(api_client):
    response = api_client.get('/api/market/quotes/')
    assert response.status_code == 200
    data = response.json()
    assert 'quotes' in data
    assert '2885' in data['quotes']  # Reliance
    assert '99926000' in data['quotes']  # Nifty 50

@pytest.mark.django_db
def test_market_candles_endpoint(api_client):
    response = api_client.get('/api/market/candles/?token=2885&timeframe=15m')
    assert response.status_code == 200
    data = response.json()
    assert 'candles' in data
    assert len(data['candles']) > 0

@pytest.mark.django_db
def test_strategy_evaluation_endpoint(api_client):
    response = api_client.get('/api/strategies/evaluate/?symbol=RELIANCE&timeframe=15m')
    assert response.status_code == 200
    data = response.json()
    assert 'signals' in data
    assert len(data['signals']) > 0

@pytest.mark.django_db
def test_backtesting_run_endpoint(api_client):
    payload = {
        'symbol': 'RELIANCE',
        'timeframe': '15m',
        'initialCapital': 500000,
        'brokeragePerOrder': 20,
        'slippagePercent': 0.05,
        'minRiskReward': 1.5,
        'requireEmaFilter': False,
        'enableShootingStar': True,
        'enablePinBar': True
    }
    response = api_client.post('/api/backtesting/run/', payload, format='json')
    assert response.status_code == 200
    data = response.json()
    assert 'initialCapital' in data
    assert 'equityCurve' in data
    assert 'trades' in data

@pytest.mark.django_db
def test_paper_trading_endpoints(api_client):
    # Account
    res_acc = api_client.get('/api/paper/account/')
    assert res_acc.status_code == 200
    assert 'virtualCapital' in res_acc.json()

    # Positions
    res_pos = api_client.get('/api/paper/positions/')
    assert res_pos.status_code == 200
    assert 'positions' in res_pos.json()

    # Place order
    order_payload = {
        'symbol': 'RELIANCE',
        'token': '2885',
        'side': 'BUY',
        'orderType': 'MARKET',
        'price': 2860.0,
        'quantity': 50,
        'stopLoss': 2835.0,
        'target': 2910.0
    }
    res_ord = api_client.post('/api/paper/orders/', order_payload, format='json')
    assert res_ord.status_code == 200
    assert res_ord.json()['status'] == 'EXECUTED'

@pytest.mark.django_db
def test_strategy_decision_engine_endpoint(api_client):
    response = api_client.get('/api/strategies/decision/?symbol=RELIANCE&timeframe=15m&token=2885')
    assert response.status_code == 200
    data = response.json()
    assert 'state' in data
    assert data['state'] in ('WATCHING', 'WAIT', 'SETUP_QUALIFIED', 'SETUP_REJECTED', 'INVALIDATED', 'DATA_UNAVAILABLE')
    assert 'evidenceChecklist' in data
    assert 'mlOutput' in data
    assert 'regulatoryNotice' in data

@pytest.mark.django_db
def test_strategy_outcomes_endpoint(api_client):
    response = api_client.get('/api/strategies/outcomes/')
    assert response.status_code == 200
    data = response.json()
    assert 'outcomes' in data
    assert 'summary' in data
    assert len(data['outcomes']) > 0
