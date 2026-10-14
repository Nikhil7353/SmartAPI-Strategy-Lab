import pytest
from apps.paper_trading.views import _virtual_account, _virtual_positions, _virtual_orders

def test_paper_trading_isolation():
    # Verify sandbox capital and initial virtual state
    assert _virtual_account['virtualCapital'] == 1000000.0
    assert len(_virtual_positions) >= 1
    assert len(_virtual_orders) >= 1

    # Verify orders are tagged as simulated paper executions
    for order in _virtual_orders:
        assert 'Paper' in order['remarks'] or 'Simulated' in order['remarks']
