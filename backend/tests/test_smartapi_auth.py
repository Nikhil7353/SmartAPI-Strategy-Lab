import pytest
import pyotp
from apps.market.smartapi_client import AngelOneSmartApiClient

@pytest.mark.django_db
def test_totp_generation():
    # Standard base32 test key
    secret = pyotp.random_base32()
    client = AngelOneSmartApiClient()
    client.totp_secret = secret
    totp = client.generate_totp()

    assert totp is not None
    assert len(totp) == 6
    assert totp.isdigit()


def test_auth_status_simulation_mode():
    client = AngelOneSmartApiClient()
    status = client.get_auth_status()

    assert status['broker'] == 'Angel One SmartAPI'
    assert status['feedStatus'] in ('CONNECTED', 'SIMULATION')
    assert 'rateLimitRemaining' in status
