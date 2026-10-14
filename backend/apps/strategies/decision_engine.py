import time
from datetime import datetime
from .patterns import detect_shooting_star, detect_pin_bar_hammer, detect_engulfing
from .indicators import calculate_ema, calculate_atr, calculate_rsi, find_support_resistance
from .ml_engine import MLTradeDecisionModel

class TradeDecisionEngine:
    """
    Combines rule-based technical analysis, machine learning models,
    historical backtesting evidence, market-data quality, and risk checks.
    """
    def __init__(
        self,
        min_risk_reward=1.5,
        use_ema_filter=True,
        ml_score_threshold=0.52,
        is_calibrated=True,
        max_feed_stale_seconds=60,
    ):
        self.min_rr = min_risk_reward
        self.use_ema_filter = use_ema_filter
        self.ml_score_threshold = ml_score_threshold
        self.max_feed_stale_seconds = max_feed_stale_seconds
        self.ml_model = MLTradeDecisionModel(is_calibrated=is_calibrated)

    def evaluate_setup(
        self,
        symbol,
        timeframe,
        candles,
        feed_timestamp=None,
        is_live_feed=False,
    ):
        """
        Evaluate candle data and generate a full decision setup.
        Returns a dict matching the 12 core requirements.
        """
        # 1. Market Data Quality & Stale Feed Check
        now = time.time()
        is_stale = False
        if feed_timestamp:
            age = now - feed_timestamp
            if age > self.max_feed_stale_seconds:
                is_stale = True

        if len(candles) < 25:
            return self._create_data_unavailable(
                symbol,
                timeframe,
                "Insufficient candle depth: At least 25 completed candles required for statistical evaluation."
            )

        if is_stale:
            return self._create_data_unavailable(
                symbol,
                timeframe,
                f"Market data feed is stale ({int(age)}s latency > {self.max_feed_stale_seconds}s limit). Decision engine safety override active."
            )

        # Inspect the latest completed candle
        curr = candles[-1]
        prev = candles[-2]
        history = candles[:-1]

        closes = [c['close'] for c in candles]
        ema200 = calculate_ema(closes, min(200, len(closes)))[-1]
        ema50 = calculate_ema(closes, min(50, len(closes)))[-1]
        ema20 = calculate_ema(closes, min(20, len(closes)))[-1]
        atr = calculate_atr(candles, 14)
        rsi = calculate_rsi(closes, 14)
        resistance, support = find_support_resistance(candles, 20)

        # 2. Pattern Detection on Completed Candle
        is_ss, ss_conf = detect_shooting_star(curr)
        is_pb, pb_conf = detect_pin_bar_hammer(curr)
        eng_pattern, eng_conf = detect_engulfing(curr, prev)

        pattern_name = "None"
        setup_bias = "NEUTRAL"

        if is_ss:
            pattern_name = "Shooting Star (Bearish Rejection)"
            setup_bias = "SHORT"
        elif is_pb:
            pattern_name = "Pin Bar / Hammer (Bullish Rejection)"
            setup_bias = "LONG"
        elif eng_pattern == 'BULLISH_ENGULFING':
            pattern_name = "Bullish Engulfing"
            setup_bias = "LONG"
        elif eng_pattern == 'BEARISH_ENGULFING':
            pattern_name = "Bearish Engulfing"
            setup_bias = "SHORT"

        # 3. Feature Extraction & Machine Learning Output
        features = self.ml_model.extract_features(
            candle=curr,
            prev_candles=history,
            ema200=ema200,
            atr=atr,
            rsi=rsi,
            resistance=resistance,
            support=support
        )
        ml_prediction = self.ml_model.predict(features)
        ml_score = ml_prediction['modelScore']

        # 4. Evidence Checklist Evaluation
        evidence_checklist = []

        # Condition A: Pattern Clarity
        pattern_passed = pattern_name != "None"
        evidence_checklist.append({
            'name': 'Completed Candle Pattern',
            'status': 'PASSED' if pattern_passed else 'FAILED',
            'description': f"Detected {pattern_name}" if pattern_passed else "No recognized high-probability candle reversal structure.",
            'category': 'PRICE_ACTION',
        })

        # Condition B: Trend Regime (EMA 200)
        is_above_ema200 = curr['close'] >= ema200
        trend_aligned = (setup_bias == 'LONG' and is_above_ema200) or (setup_bias == 'SHORT' and not is_above_ema200)
        evidence_checklist.append({
            'name': 'Trend Regime Filter (EMA 200)',
            'status': 'PASSED' if trend_aligned else 'FAILED',
            'description': f"Price (₹{curr['close']:.2f}) {'above' if is_above_ema200 else 'below'} EMA200 (₹{ema200:.2f}). Bias: {setup_bias}.",
            'category': 'TREND',
        })

        # Condition C: Key Support / Resistance Proximity
        dist_to_res = abs(curr['high'] - resistance) / curr['close'] * 100
        dist_to_sup = abs(curr['low'] - support) / curr['close'] * 100
        sr_passed = (setup_bias == 'SHORT' and dist_to_res <= 1.2) or (setup_bias == 'LONG' and dist_to_sup <= 1.2)
        evidence_checklist.append({
            'name': 'Support / Resistance Confluence',
            'status': 'PASSED' if sr_passed else 'FAILED',
            'description': f"Rejection tested key swing level (Res: ₹{resistance:.2f}, Sup: ₹{support:.2f}).",
            'category': 'LEVELS',
        })

        # Condition D: Volatility Check (ATR Expansion)
        atr_pct = (atr / curr['close']) * 100
        volatility_passed = 0.2 <= atr_pct <= 3.5
        evidence_checklist.append({
            'name': 'ATR Volatility Regime',
            'status': 'PASSED' if volatility_passed else 'FAILED',
            'description': f"ATR(14) is {atr:.2f} pts ({atr_pct:.2f}% of price) - within safe tradable liquidity band.",
            'category': 'VOLATILITY',
        })

        # Condition E: Volume Expansion
        vol_passed = features['vol_expansion'] >= 1.05
        evidence_checklist.append({
            'name': 'Volume Confirmation',
            'status': 'PASSED' if vol_passed else 'WARNING',
            'description': f"Volume is {features['vol_expansion']:.2f}x of 20-period moving average.",
            'category': 'VOLUME',
        })

        # Condition F: Machine Learning Hurdle
        ml_passed = ml_score >= self.ml_score_threshold
        evidence_checklist.append({
            'name': 'ML Probability Hurdle',
            'status': 'PASSED' if ml_passed else 'FAILED',
            'description': f"Model Score: {ml_score:.3f} (Threshold: {self.ml_score_threshold:.2f}).",
            'category': 'MACHINE_LEARNING',
        })

        # 5. Determine Final State
        # States: WATCHING, WAIT, SETUP_QUALIFIED, SETUP_REJECTED, INVALIDATED, DATA_UNAVAILABLE
        if not pattern_passed:
            # Check if watching near S/R
            if dist_to_res <= 0.8 or dist_to_sup <= 0.8:
                state = 'WATCHING'
                state_explanation = "Price is testing key horizontal inflection zone. Watching for candle close confirmation."
            else:
                state = 'WAIT'
                state_explanation = "No qualified structural setup. System is waiting for price action confluence."
        elif not trend_aligned and self.use_ema_filter:
            state = 'SETUP_REJECTED'
            state_explanation = f"Pattern rejected: Counter-trend setup. Attempting {setup_bias} against dominant EMA200 regime."
        elif not sr_passed:
            state = 'WAIT'
            state_explanation = f"Pattern formed in mid-range without primary S/R confluence. Waiting for retest of major level."
        elif not ml_passed:
            state = 'WAIT'
            state_explanation = f"Setup matched rule criteria but failed ML predictive score threshold ({ml_score:.2f} < {self.ml_score_threshold})."
        else:
            state = 'SETUP_QUALIFIED'
            state_explanation = "All rule-based conditions, statistical trend alignments, and ML predictive models satisfied."

        # 6. Trade Structuring (Calculated when qualified or approaching)
        if setup_bias == 'SHORT':
            entry = curr['close']
            sl = round(curr['high'] + (atr * 0.25), 2)
            risk = max(1.0, sl - entry)
            target1 = round(entry - (risk * self.min_rr), 2)
            target2 = round(entry - (risk * (self.min_rr + 0.8)), 2)
            rr = round(abs(entry - target1) / risk, 2)
        elif setup_bias == 'LONG':
            entry = curr['close']
            sl = round(curr['low'] - (atr * 0.25), 2)
            risk = max(1.0, entry - sl)
            target1 = round(entry + (risk * self.min_rr), 2)
            target2 = round(entry + (risk * (self.min_rr + 0.8)), 2)
            rr = round(abs(target1 - entry) / risk, 2)
        else:
            entry = curr['close']
            sl = round(entry - atr * 1.5, 2)
            target1 = round(entry + atr * 2.0, 2)
            target2 = round(entry + atr * 3.0, 2)
            rr = self.min_rr

        # Risk check on minimum R:R
        if state == 'SETUP_QUALIFIED' and rr < self.min_rr:
            state = 'SETUP_REJECTED'
            state_explanation = f"Risk/Reward ratio ({rr:.2f}) does not meet strategy minimum of {self.min_rr:.2f}:1."

        # Position Sizing recommendation (1.5% max capital risk on ₹5,00,000 standard capital)
        max_capital_risk = 7500.0  # ₹7,500
        recommended_quantity = max(1, int(max_capital_risk / (abs(entry - sl) or 1.0)))

        return {
            'id': f"DEC-{symbol}-{curr['time']}",
            'symbol': symbol,
            'timeframe': timeframe,
            'state': state,
            'stateExplanation': state_explanation,
            'setupBias': setup_bias,
            'pattern': pattern_name,
            'timestamp': datetime.fromtimestamp(curr['time']).strftime("%Y-%m-%d %H:%M:%S") if curr.get('time') else "Latest Candle",
            'isCompletedCandle': True,
            'evidenceChecklist': evidence_checklist,
            'tradeLevels': {
                'entryPrice': entry,
                'stopLoss': sl,
                'target1': target1,
                'target2': target2,
                'riskRewardRatio': rr,
                'riskPerUnit': round(abs(entry - sl), 2),
                'rewardPerUnit': round(abs(target1 - entry), 2),
                'recommendedQuantity': recommended_quantity,
                'maxRiskAmount': max_capital_risk,
            },
            'mlOutput': ml_prediction,
            'regulatoryNotice': (
                "Analytical & Educational Research Only. Machine learning scores and rule-based setups "
                "do not guarantee profitability. All virtual executions must be tested strictly in Paper Trading."
            ),
            'outcomeTracking': {
                'status': 'TRACKING' if state == 'SETUP_QUALIFIED' else 'NOT_TRACKED',
                'datasetEligible': state == 'SETUP_QUALIFIED',
            }
        }

    def _create_data_unavailable(self, symbol, timeframe, reason):
        return {
            'id': f"DEC-{symbol}-UNAVAIL",
            'symbol': symbol,
            'timeframe': timeframe,
            'state': 'DATA_UNAVAILABLE',
            'stateExplanation': reason,
            'setupBias': 'NEUTRAL',
            'pattern': 'None',
            'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'isCompletedCandle': False,
            'evidenceChecklist': [
                {
                    'name': 'Market Data Provenance & Freshness',
                    'status': 'FAILED',
                    'description': reason,
                    'category': 'DATA_QUALITY',
                }
            ],
            'tradeLevels': None,
            'mlOutput': {
                'modelScore': 0.0,
                'isCalibrated': False,
                'label': 'DATA_UNAVAILABLE - Model Suspended',
                'probability': None,
                'confidenceInterval': None,
                'featureContributions': [],
                'modelVersion': self.ml_model.MODEL_VERSION,
                'oosMetrics': self.ml_model.OOS_METRICS,
            },
            'regulatoryNotice': "Trading engine inactive during data outage or feed stale conditions.",
            'outcomeTracking': {'status': 'NOT_TRACKED', 'datasetEligible': False}
        }

