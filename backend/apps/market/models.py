from django.db import models

class Instrument(models.Model):
    EXCHANGE_CHOICES = [
        ('NSE', 'National Stock Exchange'),
        ('BSE', 'Bombay Stock Exchange'),
        ('NFO', 'NSE Futures & Options'),
        ('MCX', 'Multi Commodity Exchange'),
    ]
    
    TYPE_CHOICES = [
        ('EQ', 'Equity'),
        ('INDEX', 'Index'),
        ('FUT', 'Futures'),
        ('OPT', 'Options'),
    ]

    token = models.CharField(max_length=50, unique=True, db_index=True)
    symbol = models.CharField(max_length=50, db_index=True)
    name = models.CharField(max_length=150)
    exchange = models.CharField(max_length=10, choices=EXCHANGE_CHOICES, default='NSE')
    instrument_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='EQ')
    lot_size = models.IntegerField(default=1)
    tick_size = models.DecimalField(max_digits=10, decimal_places=4, default=0.05)
    expiry = models.DateField(null=True, blank=True)
    strike_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.symbol} ({self.exchange}:{self.token})"


class HistoricalCandle(models.Model):
    TIMEFRAME_CHOICES = [
        ('1m', '1 Minute'),
        ('5m', '5 Minutes'),
        ('15m', '15 Minutes'),
        ('1h', '1 Hour'),
        ('1d', '1 Day'),
    ]

    instrument = models.ForeignKey(Instrument, on_delete=models.CASCADE, related_name='candles')
    timeframe = models.CharField(max_length=10, choices=TIMEFRAME_CHOICES)
    timestamp = models.BigIntegerField(db_index=True)  # Unix timestamp in seconds
    open_price = models.DecimalField(max_digits=12, decimal_places=2)
    high_price = models.DecimalField(max_digits=12, decimal_places=2)
    low_price = models.DecimalField(max_digits=12, decimal_places=2)
    close_price = models.DecimalField(max_digits=12, decimal_places=2)
    volume = models.BigIntegerField(default=0)

    class Meta:
        indexes = [
            models.Index(fields=['instrument', 'timeframe', 'timestamp']),
        ]
        unique_together = ('instrument', 'timeframe', 'timestamp')

    def __str__(self):
        return f"{self.instrument.symbol} [{self.timeframe}] @ {self.timestamp}: C={self.close_price}"


class SmartApiSession(models.Model):
    client_code = models.CharField(max_length=50, unique=True)
    jwt_token = models.TextField(blank=True)
    refresh_token = models.TextField(blank=True)
    feed_token = models.TextField(blank=True)
    is_active = models.BooleanField(default=False)
    login_time = models.DateTimeField(auto_now=True)
    last_error = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"SmartAPI Session: {self.client_code} (Active: {self.is_active})"
