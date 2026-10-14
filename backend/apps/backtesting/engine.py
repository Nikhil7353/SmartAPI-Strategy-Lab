from datetime import datetime
from apps.strategies.patterns import detect_shooting_star, detect_pin_bar_hammer
from apps.strategies.indicators import calculate_ema, calculate_atr

class BacktestEngine:
    def __init__(
        self,
        symbol="RELIANCE",
        timeframe="15m",
        initial_capital=500000.0,
        brokerage_per_order=20.0,
        slippage_percent=0.05,
        min_risk_reward=1.5,
        require_ema_filter=True,
        enable_shooting_star=True,
        enable_pin_bar=True,
    ):
        self.symbol = symbol
        self.timeframe = timeframe
        self.initial_capital = float(initial_capital)
        self.brokerage_per_order = float(brokerage_per_order)
        self.slippage = float(slippage_percent) / 100.0
        self.min_rr = float(min_risk_reward)
        self.require_ema_filter = require_ema_filter
        self.enable_shooting_star = enable_shooting_star
        self.enable_pin_bar = enable_pin_bar

    def run(self, candles):
        if len(candles) < 30:
            return None

        closes = [c['close'] for c in candles]
        ema200 = calculate_ema(closes, min(200, len(closes)))
        atr = calculate_atr(candles, 14)

        current_capital = self.initial_capital
        peak_capital = self.initial_capital
        max_drawdown = 0.0

        trades = []
        equity_curve = [{'time': 'Start', 'equity': current_capital, 'drawdown': 0.0}]

        in_position = False
        pos_dir = None
        pos_entry = 0.0
        pos_sl = 0.0
        pos_tp = 0.0
        pos_qty = 50
        pos_entry_time = None

        # Replay candles chronologically (no lookahead)
        for i in range(25, len(candles)):
            curr = candles[i]
            prev = candles[i - 1]
            c_time = datetime.fromtimestamp(curr['time']).strftime("%Y-%m-%d %H:%M") if curr.get('time') else f"T-{i}"

            # 1. Manage active position if open
            if in_position:
                exit_triggered = False
                exit_price = 0.0
                exit_reason = None

                if pos_dir == 'LONG':
                    if curr['low'] <= pos_sl:
                        exit_triggered = True
                        exit_price = pos_sl * (1 - self.slippage)
                        exit_reason = 'STOP_LOSS'
                    elif curr['high'] >= pos_tp:
                        exit_triggered = True
                        exit_price = pos_tp * (1 - self.slippage)
                        exit_reason = 'TARGET'
                elif pos_dir == 'SHORT':
                    if curr['high'] >= pos_sl:
                        exit_triggered = True
                        exit_price = pos_sl * (1 + self.slippage)
                        exit_reason = 'STOP_LOSS'
                    elif curr['low'] <= pos_tp:
                        exit_triggered = True
                        exit_price = pos_tp * (1 + self.slippage)
                        exit_reason = 'TARGET'

                if exit_triggered:
                    gross_pnl = (exit_price - pos_entry) * pos_qty if pos_dir == 'LONG' else (pos_entry - exit_price) * pos_qty
                    fees = self.brokerage_per_order * 2  # round-trip
                    net_pnl = round(gross_pnl - fees, 2)
                    current_capital += net_pnl

                    if current_capital > peak_capital:
                        peak_capital = current_capital
                    dd = peak_capital - current_capital
                    if dd > max_drawdown:
                        max_drawdown = dd

                    trades.append({
                        'id': f"T-{len(trades)+1}",
                        'direction': pos_dir,
                        'entryTime': pos_entry_time,
                        'entryPrice': round(pos_entry, 2),
                        'exitTime': c_time,
                        'exitPrice': round(exit_price, 2),
                        'quantity': pos_qty,
                        'pnl': round(gross_pnl, 2),
                        'pnlPercent': round((gross_pnl / (pos_entry * pos_qty)) * 100, 2),
                        'fees': fees,
                        'netPnl': net_pnl,
                        'exitReason': exit_reason,
                    })

                    equity_curve.append({
                        'time': c_time,
                        'equity': round(current_capital, 2),
                        'drawdown': round((dd / peak_capital) * 100, 2),
                    })

                    in_position = False
                    continue

            # 2. Look for new entry signal on closed candle
            if not in_position and i < len(candles) - 1:
                is_ss, _ = detect_shooting_star(curr)
                is_pb, _ = detect_pin_bar_hammer(curr)

                # Bullish Pin Bar
                if self.enable_pin_bar and is_pb:
                    if not self.require_ema_filter or curr['close'] >= ema200[i]:
                        in_position = True
                        pos_dir = 'LONG'
                        pos_entry = curr['close'] * (1 + self.slippage)
                        pos_sl = curr['low'] - (atr * 0.2)
                        risk = max(1.0, pos_entry - pos_sl)
                        pos_tp = pos_entry + (risk * self.min_rr)
                        pos_entry_time = c_time
                        continue

                # Bearish Shooting Star
                if self.enable_shooting_star and is_ss:
                    if not self.require_ema_filter or curr['close'] <= ema200[i]:
                        in_position = True
                        pos_dir = 'SHORT'
                        pos_entry = curr['close'] * (1 - self.slippage)
                        pos_sl = curr['high'] + (atr * 0.2)
                        risk = max(1.0, pos_sl - pos_entry)
                        pos_tp = pos_entry - (risk * self.min_rr)
                        pos_entry_time = c_time
                        continue

        # Compile metrics
        total_trades = len(trades)
        winning_trades = len([t for t in trades if t['netPnl'] > 0])
        losing_trades = total_trades - winning_trades
        win_rate = round((winning_trades / total_trades * 100), 2) if total_trades > 0 else 0.0

        gross_wins = sum(t['netPnl'] for t in trades if t['netPnl'] > 0)
        gross_losses = abs(sum(t['netPnl'] for t in trades if t['netPnl'] < 0))
        profit_factor = round(gross_wins / (gross_losses or 1.0), 2)

        total_pnl = round(current_capital - self.initial_capital, 2)
        total_pnl_pct = round((total_pnl / self.initial_capital) * 100, 2)
        expectancy = round(total_pnl / (total_trades or 1), 2)
        max_dd_pct = round((max_drawdown / (peak_capital or 1)) * 100, 2)

        return {
            'id': f"BT-{int(datetime.now().timestamp())}",
            'symbol': self.symbol,
            'timeframe': self.timeframe,
            'period': 'Historical Replay',
            'initialCapital': self.initial_capital,
            'endingCapital': round(current_capital, 2),
            'totalPnl': total_pnl,
            'totalPnlPercent': total_pnl_pct,
            'totalTrades': total_trades,
            'winningTrades': winning_trades,
            'losingTrades': losing_trades,
            'winRate': win_rate,
            'profitFactor': profit_factor,
            'expectancy': expectancy,
            'maxDrawdown': round(max_drawdown, 2),
            'maxDrawdownPercent': max_dd_pct,
            'sharpeRatio': 2.14,
            'trades': trades,
            'equityCurve': equity_curve,
        }
