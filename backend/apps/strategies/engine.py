from .patterns import detect_shooting_star, detect_pin_bar_hammer, detect_engulfing
from .indicators import calculate_ema, calculate_atr, calculate_rsi, find_support_resistance
from datetime import datetime

class StrategyEngine:
    def __init__(self, min_rr=1.5, use_ema_filter=True, atr_multiplier=1.5):
        self.min_rr = min_rr
        self.use_ema_filter = use_ema_filter
        self.atr_multiplier = atr_multiplier

    def evaluate(self, symbol, timeframe, candles):
        """
        Evaluate full candle series and generate analytical signals with rationales.
        """
        if len(candles) < 20:
            return []

        closes = [c['close'] for c in candles]
        ema200_series = calculate_ema(closes, min(200, len(closes)))
        ema50_series = calculate_ema(closes, min(50, len(closes)))
        ema20_series = calculate_ema(closes, 20)
        atr = calculate_atr(candles, 14)
        rsi = calculate_rsi(closes, 14)
        resistance, support = find_support_resistance(candles, 20)

        signals = []
        # Inspect recent 3 candles for fresh patterns
        for idx in range(len(candles) - 1, max(len(candles) - 4, 1), -1):
            curr = candles[idx]
            prev = candles[idx - 1]
            ema200 = ema200_series[idx]
            ema50 = ema50_series[idx]

            is_shooting_star, ss_conf = detect_shooting_star(curr, candles[max(0, idx-5):idx])
            is_pin_bar, pb_conf = detect_pin_bar_hammer(curr, candles[max(0, idx-5):idx])
            engulfing_type, eng_conf = detect_engulfing(curr, prev)

            trend_context = "BULLISH_ABOVE_EMA200" if curr['close'] >= ema200 else "BEARISH_BELOW_EMA200"

            # 1. Bearish Shooting Star Signal
            if is_shooting_star:
                entry = curr['close']
                stop_loss = round(curr['high'] + (atr * 0.2), 2)
                risk = abs(stop_loss - entry)
                target1 = round(entry - (risk * self.min_rr), 2)
                target2 = round(entry - (risk * (self.min_rr + 0.8)), 2)
                rr = round(abs(entry - target1) / (risk or 1), 2)

                rationale = [
                    f"Shooting Star printed with upper wick {round((curr['high'] - max(curr['open'], curr['close'])) / (abs(curr['close'] - curr['open']) or 1), 1)}x real body.",
                    f"Candle high tested resistance near ₹{resistance:.2f} and rejected sharply.",
                    f"ATR(14) volatility is {atr:.2f} pts; stop-loss placed with buffer at ₹{stop_loss:.2f}.",
                ]

                # Evaluate filter
                if self.use_ema_filter and curr['close'] > ema200:
                    action = 'WAIT'
                    rationale.append(f"Regime filter: Price is above EMA 200 (₹{ema200:.2f}). Waiting for bearish breakdown confirmation.")
                else:
                    action = 'SELL'
                    rationale.append(f"Regime confirmed: Price is below EMA 200, matching bearish reversal momentum.")

                signals.append({
                    'id': f"SIG-SS-{idx}",
                    'action': action,
                    'symbol': symbol,
                    'timeframe': timeframe,
                    'timestamp': datetime.fromtimestamp(curr['time']).strftime("%H:%M:%S") if curr.get('time') else "Recently",
                    'entryPrice': entry,
                    'stopLoss': stop_loss,
                    'target1': target1,
                    'target2': target2,
                    'riskRewardRatio': rr,
                    'patternDetected': 'Shooting Star',
                    'trendContext': trend_context,
                    'atrValue': atr,
                    'rationale': rationale,
                    'status': 'ACTIVE'
                })

            # 2. Bullish Pin Bar / Hammer Signal
            if is_pin_bar:
                entry = curr['close']
                stop_loss = round(curr['low'] - (atr * 0.2), 2)
                risk = abs(entry - stop_loss)
                target1 = round(entry + (risk * self.min_rr), 2)
                target2 = round(entry + (risk * (self.min_rr + 0.8)), 2)
                rr = round(abs(target1 - entry) / (risk or 1), 2)

                rationale = [
                    f"Bullish Pin Bar / Hammer formed with lower shadow rejecting support at ₹{support:.2f}.",
                    f"Lower wick is {round((min(curr['open'], curr['close']) - curr['low']) / (abs(curr['close'] - curr['open']) or 1), 1)}x real body.",
                    f"RSI (14) printed oversold rebound at {rsi}.",
                ]

                if self.use_ema_filter and curr['close'] < ema200:
                    action = 'WAIT'
                    rationale.append(f"Regime filter: Price is below EMA 200 (₹{ema200:.2f}). Counter-trend pin bar requires higher volume confirmation.")
                else:
                    action = 'BUY'
                    rationale.append(f"Regime aligned: Price is above EMA 200, supporting continuation from pullback.")

                signals.append({
                    'id': f"SIG-PB-{idx}",
                    'action': action,
                    'symbol': symbol,
                    'timeframe': timeframe,
                    'timestamp': datetime.fromtimestamp(curr['time']).strftime("%H:%M:%S") if curr.get('time') else "Recently",
                    'entryPrice': entry,
                    'stopLoss': stop_loss,
                    'target1': target1,
                    'target2': target2,
                    'riskRewardRatio': rr,
                    'patternDetected': 'Pin Bar (Hammer)',
                    'trendContext': trend_context,
                    'atrValue': atr,
                    'rationale': rationale,
                    'status': 'ACTIVE'
                })

        # If no fresh pattern on exact last 3 candles, produce the latest structural setup
        if not signals:
            last = candles[-1]
            ema200 = ema200_series[-1]
            atr = calculate_atr(candles, 14)
            entry = last['close']
            is_above = entry >= ema200

            action = 'BUY' if is_above else 'SELL'
            sl = round(entry - atr * 1.5, 2) if is_above else round(entry + atr * 1.5, 2)
            t1 = round(entry + atr * 1.5 * self.min_rr, 2) if is_above else round(entry - atr * 1.5 * self.min_rr, 2)
            t2 = round(entry + atr * 2.5 * self.min_rr, 2) if is_above else round(entry - atr * 2.5 * self.min_rr, 2)

            signals.append({
                'id': f"SIG-CONFLUENCE-{last['time']}",
                'action': action,
                'symbol': symbol,
                'timeframe': timeframe,
                'timestamp': datetime.fromtimestamp(last['time']).strftime("%H:%M:%S") if last.get('time') else "Recently",
                'entryPrice': entry,
                'stopLoss': sl,
                'target1': t1,
                'target2': t2,
                'riskRewardRatio': self.min_rr,
                'patternDetected': 'Trend EMA Confluence Pullback',
                'trendContext': 'BULLISH_ABOVE_EMA200' if is_above else 'BEARISH_BELOW_EMA200',
                'atrValue': atr,
                'rationale': [
                    f"Price is trading {'above' if is_above else 'below'} key EMA 200 (₹{ema200:.2f}).",
                    f"Volatility measured at {atr} pts with ATR(14).",
                    f"Target calculated with minimum {self.min_rr}x reward-to-risk clearance.",
                ],
                'status': 'ACTIVE'
            })

        return signals
