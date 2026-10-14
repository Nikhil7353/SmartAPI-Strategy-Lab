from django.db import models

class StrategyDefinition(models.Model):
    name = models.CharField(max_length=100, default="Price Action Confluence")
    version = models.CharField(max_length=20, default="1.2.0")
    description = models.TextField(blank=True)
    min_risk_reward = models.DecimalField(max_digits=4, decimal_places=2, default=1.50)
    use_ema_filter = models.BooleanField(default=True)
    atr_multiplier = models.DecimalField(max_digits=4, decimal_places=2, default=1.50)
    enable_shooting_star = models.BooleanField(default=True)
    enable_pin_bar = models.BooleanField(default=True)
    enable_engulfing = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} v{self.version}"


class SignalLog(models.Model):
    ACTION_CHOICES = [
        ('BUY', 'Buy Signal'),
        ('SELL', 'Sell Signal'),
        ('WAIT', 'Wait / Invalidation'),
    ]

    strategy = models.ForeignKey(StrategyDefinition, on_delete=models.SET_NULL, null=True, blank=True)
    symbol = models.CharField(max_length=50, db_index=True)
    timeframe = models.CharField(max_length=10)
    timestamp = models.DateTimeField(auto_now_add=True)
    action = models.CharField(max_length=10, choices=ACTION_CHOICES)
    entry_price = models.DecimalField(max_digits=12, decimal_places=2)
    stop_loss = models.DecimalField(max_digits=12, decimal_places=2)
    target_1 = models.DecimalField(max_digits=12, decimal_places=2)
    target_2 = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    risk_reward_ratio = models.DecimalField(max_digits=6, decimal_places=2)
    pattern_detected = models.CharField(max_length=100)
    trend_context = models.CharField(max_length=100)
    atr_value = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    rationale = models.JSONField(default=list)

    def __str__(self):
        return f"[{self.action}] {self.symbol} ({self.pattern_detected}) @ {self.entry_price}"
