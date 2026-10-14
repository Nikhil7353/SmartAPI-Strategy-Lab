from django.db import models

class BacktestRecord(models.Model):
    symbol = models.CharField(max_length=50)
    timeframe = models.CharField(max_length=10)
    start_date = models.DateField()
    end_date = models.DateField()
    initial_capital = models.DecimalField(max_digits=14, decimal_places=2)
    ending_capital = models.DecimalField(max_digits=14, decimal_places=2)
    total_pnl = models.DecimalField(max_digits=14, decimal_places=2)
    total_trades = models.IntegerField(default=0)
    winning_trades = models.IntegerField(default=0)
    losing_trades = models.IntegerField(default=0)
    win_rate = models.DecimalField(max_digits=5, decimal_places=2)
    profit_factor = models.DecimalField(max_digits=6, decimal_places=2)
    max_drawdown = models.DecimalField(max_digits=14, decimal_places=2)
    max_drawdown_percent = models.DecimalField(max_digits=5, decimal_places=2)
    config_params = models.JSONField(default=dict)
    equity_curve = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Backtest {self.symbol} [{self.timeframe}]: PnL {self.total_pnl} ({self.win_rate}% Win)"


class BacktestTradeRecord(models.Model):
    backtest = models.ForeignKey(BacktestRecord, on_delete=models.CASCADE, related_name='trades')
    trade_id = models.CharField(max_length=50)
    direction = models.CharField(max_length=10)
    entry_time = models.CharField(max_length=50)
    entry_price = models.DecimalField(max_digits=12, decimal_places=2)
    exit_time = models.CharField(max_length=50)
    exit_price = models.DecimalField(max_digits=12, decimal_places=2)
    quantity = models.IntegerField()
    gross_pnl = models.DecimalField(max_digits=12, decimal_places=2)
    fees = models.DecimalField(max_digits=10, decimal_places=2)
    net_pnl = models.DecimalField(max_digits=12, decimal_places=2)
    exit_reason = models.CharField(max_length=50)

    def __str__(self):
        return f"{self.direction} on {self.entry_time}: {self.net_pnl}"
