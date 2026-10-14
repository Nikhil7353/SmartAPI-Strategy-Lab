from django.db import models

class PaperAccount(models.Model):
    virtual_capital = models.DecimalField(max_digits=14, decimal_places=2, default=1000000.00)
    available_margin = models.DecimalField(max_digits=14, decimal_places=2, default=1000000.00)
    used_margin = models.DecimalField(max_digits=14, decimal_places=2, default=0.00)
    realized_pnl = models.DecimalField(max_digits=14, decimal_places=2, default=0.00)
    total_trades = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Paper Portfolio: ₹{self.virtual_capital} (Realized PnL: ₹{self.realized_pnl})"


class PaperOrder(models.Model):
    SIDE_CHOICES = [('BUY', 'Buy'), ('SELL', 'Sell')]
    TYPE_CHOICES = [('MARKET', 'Market'), ('LIMIT', 'Limit'), ('SL', 'Stop Loss')]
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('EXECUTED', 'Executed'),
        ('CANCELLED', 'Cancelled'),
        ('REJECTED', 'Rejected'),
    ]

    order_id = models.CharField(max_length=50, unique=True)
    symbol = models.CharField(max_length=50)
    token = models.CharField(max_length=50)
    side = models.CharField(max_length=10, choices=SIDE_CHOICES)
    order_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='MARKET')
    price = models.DecimalField(max_digits=12, decimal_places=2)
    quantity = models.IntegerField()
    filled_quantity = models.IntegerField(default=0)
    average_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='EXECUTED')
    stop_loss = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    target = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    remarks = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.status}] {self.side} {self.quantity} {self.symbol} @ {self.price}"


class PaperPosition(models.Model):
    symbol = models.CharField(max_length=50, unique=True)
    token = models.CharField(max_length=50)
    side = models.CharField(max_length=10, choices=[('BUY', 'Buy'), ('SELL', 'Sell')])
    quantity = models.IntegerField()
    average_price = models.DecimalField(max_digits=12, decimal_places=2)
    stop_loss = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    target = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.side} {self.quantity} {self.symbol} @ ₹{self.average_price}"


class PaperJournalEntry(models.Model):
    symbol = models.CharField(max_length=50)
    side = models.CharField(max_length=10)
    entry_price = models.DecimalField(max_digits=12, decimal_places=2)
    exit_price = models.DecimalField(max_digits=12, decimal_places=2)
    quantity = models.IntegerField()
    pnl = models.DecimalField(max_digits=12, decimal_places=2)
    strategy_used = models.CharField(max_length=100)
    entry_reason = models.TextField()
    exit_reason = models.TextField()
    duration_minutes = models.IntegerField(default=0)
    executed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Journal {self.symbol} ({self.side}): ₹{self.pnl}"
