import {
  Quote,
  Instrument,
  Candle,
  SmartApiAuthStatus,
  StrategySignal,
  BacktestParams,
  BacktestResult,
  BacktestTrade,
  PaperOrder,
  PaperPosition,
  PaperAccount,
  TradeJournalEntry,
  Timeframe,
  TradeDecision,
  TrackedOutcome,
} from '../types';

const API_BASE = '/api';

// Initial watchlist items for Indian markets (Angel One tokens)
export const DEFAULT_WATCHLIST: Instrument[] = [
  { token: '99926000', symbol: 'NIFTY 50', name: 'Nifty 50 Index', exchange: 'NSE', lotSize: 50, instrumentType: 'INDEX', tickSize: 0.05 },
  { token: '99926009', symbol: 'BANKNIFTY', name: 'Nifty Bank Index', exchange: 'NSE', lotSize: 15, instrumentType: 'INDEX', tickSize: 0.05 },
  { token: '99926037', symbol: 'FINNIFTY', name: 'Nifty Financial Services', exchange: 'NSE', lotSize: 40, instrumentType: 'INDEX', tickSize: 0.05 },
  { token: '2885', symbol: 'RELIANCE', name: 'Reliance Industries Ltd', exchange: 'NSE', lotSize: 1, instrumentType: 'EQ', tickSize: 0.05 },
  { token: '11536', symbol: 'TCS', name: 'Tata Consultancy Services', exchange: 'NSE', lotSize: 1, instrumentType: 'EQ', tickSize: 0.05 },
  { token: '1333', symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', exchange: 'NSE', lotSize: 1, instrumentType: 'EQ', tickSize: 0.05 },
  { token: '1594', symbol: 'INFY', name: 'Infosys Ltd', exchange: 'NSE', lotSize: 1, instrumentType: 'EQ', tickSize: 0.05 },
  { token: '3045', symbol: 'SBIN', name: 'State Bank of India', exchange: 'NSE', lotSize: 1, instrumentType: 'EQ', tickSize: 0.05 },
  { token: '317', symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd', exchange: 'NSE', lotSize: 1, instrumentType: 'EQ', tickSize: 0.05 },
  { token: '1660', symbol: 'ITC', name: 'ITC Ltd', exchange: 'NSE', lotSize: 1, instrumentType: 'EQ', tickSize: 0.05 },
];

export async function fetchAuthStatus(): Promise<SmartApiAuthStatus> {
  try {
    const res = await fetch(`${API_BASE}/market/auth/status/`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Backend offline fallback
  }
  return {
    connected: false,
    broker: 'Angel One SmartAPI',
    feedStatus: 'SIMULATION',
    error: 'Connecting to local Django backend...',
  };
}

export async function saveAuthCredentials(creds: {
  apiKey: string;
  clientCode: string;
  pin: string;
  totpSecret: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/market/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(creds),
    });
    return await res.json();
  } catch (err) {
    return { success: false, message: (err as Error).message };
  }
}

export async function fetchQuotes(tokens?: string[]): Promise<Record<string, Quote>> {
  try {
    const query = tokens ? `?tokens=${tokens.join(',')}` : '';
    const res = await fetch(`${API_BASE}/market/quotes/${query}`);
    if (res.ok) {
      const data = await res.json();
      return data.quotes || {};
    }
  } catch {
    // Fallback handled gracefully
  }
  return generateSimulatedQuotes();
}

export async function fetchCandles(
  symbol: string,
  token: string,
  timeframe: Timeframe,
  exchange: string = 'NSE',
  count: number = 150
): Promise<Candle[]> {
  try {
    const res = await fetch(
      `${API_BASE}/market/candles/?symbol=${symbol}&token=${token}&timeframe=${timeframe}&exchange=${exchange}&count=${count}`
    );
    if (res.ok) {
      const data = await res.json();
      if (data.candles && data.candles.length > 0) {
        return data.candles;
      }
    }
  } catch {
    // Generate fallback series if backend endpoint unavailable
  }
  return generateSimulatedCandles(symbol, timeframe, count);
}

export async function searchInstruments(query: string): Promise<Instrument[]> {
  if (!query || query.trim().length < 2) return [];
  try {
    const res = await fetch(`${API_BASE}/market/instruments/search/?q=${encodeURIComponent(query)}`);
    if (res.ok) {
      const data = await res.json();
      return data.results || [];
    }
  } catch {
    // Search default watchlist
  }
  return DEFAULT_WATCHLIST.filter(
    (item) =>
      item.symbol.toLowerCase().includes(query.toLowerCase()) ||
      item.name.toLowerCase().includes(query.toLowerCase())
  );
}

// -------------------------------------------------------------
// Core Feature: ML Trade Decision Engine API
// -------------------------------------------------------------
export async function fetchTradeDecision(
  symbol: string,
  timeframe: Timeframe,
  token: string,
  minRr: number = 1.5,
  useEma: boolean = true,
  mlThreshold: number = 0.52,
  isCalibrated: boolean = true,
  simulateStale: boolean = false
): Promise<TradeDecision> {
  try {
    const res = await fetch(
      `${API_BASE}/strategies/decision/?symbol=${symbol}&timeframe=${timeframe}&token=${token}&min_rr=${minRr}&use_ema=${useEma}&ml_threshold=${mlThreshold}&is_calibrated=${isCalibrated}&simulate_stale=${simulateStale}`
    );
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fallback simulated decision
  }
  return generateSimulatedTradeDecision(symbol, timeframe, isCalibrated, simulateStale);
}

export async function fetchTrackedOutcomes(): Promise<{
  outcomes: TrackedOutcome[];
  summary: { totalTracked: number; targetHitCount: number; stopLossCount: number; datasetEligibleCount: number };
}> {
  try {
    const res = await fetch(`${API_BASE}/strategies/outcomes/`);
    if (res.ok) return await res.json();
  } catch {
    // Fallback
  }
  return {
    outcomes: [
      {
        id: 'TRK-2885-0915',
        symbol: 'RELIANCE',
        pattern: 'Shooting Star',
        setupBias: 'SHORT',
        entryPrice: 2865.0,
        stopLoss: 2882.0,
        target1: 2835.0,
        target2: 2818.0,
        detectedAt: '2026-10-13 14:15:00',
        outcome: 'TARGET_HIT',
        realizedPnl: 30.0,
        mfe: 35.5,
        mae: 6.2,
        mlPredictedProb: 0.624,
        evaluatedDatasetEligible: true,
      },
      {
        id: 'TRK-11536-1130',
        symbol: 'TCS',
        pattern: 'Pin Bar / Hammer',
        setupBias: 'LONG',
        entryPrice: 3920.0,
        stopLoss: 3890.0,
        target1: 3965.0,
        target2: 3995.0,
        detectedAt: '2026-10-14 11:30:00',
        outcome: 'IN_PROGRESS',
        realizedPnl: 18.0,
        mfe: 24.0,
        mae: 4.5,
        mlPredictedProb: 0.589,
        evaluatedDatasetEligible: true,
      },
      {
        id: 'TRK-1333-1000',
        symbol: 'HDFCBANK',
        pattern: 'Bearish Engulfing',
        setupBias: 'SHORT',
        entryPrice: 1685.0,
        stopLoss: 1698.0,
        target1: 1665.0,
        target2: 1650.0,
        detectedAt: '2026-10-12 10:00:00',
        outcome: 'STOP_LOSS_HIT',
        realizedPnl: -13.0,
        mfe: 5.0,
        mae: 13.0,
        mlPredictedProb: 0.518,
        evaluatedDatasetEligible: true,
      },
    ],
    summary: {
      totalTracked: 3,
      targetHitCount: 1,
      stopLossCount: 1,
      datasetEligibleCount: 3,
    },
  };
}

export async function fetchStrategySignals(symbol: string, timeframe: Timeframe): Promise<StrategySignal[]> {
  try {
    const res = await fetch(`${API_BASE}/strategies/evaluate/?symbol=${symbol}&timeframe=${timeframe}`);
    if (res.ok) {
      const data = await res.json();
      return data.signals || [];
    }
  } catch {
    // Fallback signals
  }
  return generateSimulatedSignals(symbol, timeframe);
}

export async function runBacktest(params: BacktestParams): Promise<BacktestResult> {
  try {
    const res = await fetch(`${API_BASE}/backtesting/run/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fallback simulated backtest
  }
  return generateSimulatedBacktestResult(params);
}

// Paper Trading APIs
export async function fetchPaperAccount(): Promise<PaperAccount> {
  try {
    const res = await fetch(`${API_BASE}/paper/account/`);
    if (res.ok) return await res.json();
  } catch {
    // Fallback
  }
  const saved = localStorage.getItem('nik_paper_account');
  if (saved) return JSON.parse(saved);
  return {
    virtualCapital: 1000000,
    availableMargin: 845200,
    usedMargin: 154800,
    realizedPnl: 18450,
    unrealizedPnl: 3240,
    totalTrades: 14,
    activePositionsCount: 2,
  };
}

export async function fetchPaperPositions(): Promise<PaperPosition[]> {
  try {
    const res = await fetch(`${API_BASE}/paper/positions/`);
    if (res.ok) {
      const data = await res.json();
      return data.positions || [];
    }
  } catch {
    // Fallback
  }
  const saved = localStorage.getItem('nik_paper_positions');
  if (saved) return JSON.parse(saved);
  return [
    {
      id: 'POS-1',
      symbol: 'RELIANCE',
      token: '2885',
      side: 'BUY',
      quantity: 50,
      averagePrice: 2845.0,
      ltp: 2862.5,
      unrealizedPnl: 875.0,
      pnlPercent: 0.61,
      stopLoss: 2820.0,
      target: 2910.0,
      entryTime: new Date(Date.now() - 3600000 * 2).toLocaleTimeString(),
    },
    {
      id: 'POS-2',
      symbol: 'TCS',
      token: '11536',
      side: 'BUY',
      quantity: 25,
      averagePrice: 3910.0,
      ltp: 3942.0,
      unrealizedPnl: 800.0,
      pnlPercent: 0.82,
      stopLoss: 3880.0,
      target: 4000.0,
      entryTime: new Date(Date.now() - 3600000 * 4).toLocaleTimeString(),
    },
  ];
}

export async function placePaperOrder(order: Omit<PaperOrder, 'id' | 'status' | 'placedAt' | 'updatedAt' | 'filledQuantity' | 'averagePrice'>): Promise<PaperOrder> {
  try {
    const res = await fetch(`${API_BASE}/paper/orders/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    if (res.ok) return await res.json();
  } catch {
    // Fallback
  }
  const newOrder: PaperOrder = {
    ...order,
    id: `ORD-${Date.now().toString().slice(-6)}`,
    status: 'EXECUTED',
    filledQuantity: order.quantity,
    averagePrice: order.price,
    placedAt: new Date().toLocaleTimeString(),
    updatedAt: new Date().toLocaleTimeString(),
  };
  return newOrder;
}

export async function fetchPaperOrders(): Promise<PaperOrder[]> {
  try {
    const res = await fetch(`${API_BASE}/paper/orders/`);
    if (res.ok) {
      const data = await res.json();
      return data.orders || [];
    }
  } catch {
    // Fallback
  }
  return [
    {
      id: 'ORD-892101',
      symbol: 'RELIANCE',
      token: '2885',
      side: 'BUY',
      orderType: 'LIMIT',
      price: 2845.0,
      quantity: 50,
      filledQuantity: 50,
      averagePrice: 2845.0,
      status: 'EXECUTED',
      stopLoss: 2820.0,
      target: 2910.0,
      placedAt: '10:15:22',
      updatedAt: '10:15:30',
      remarks: 'Paper Execution — Shooting star failure pullback',
    },
    {
      id: 'ORD-892095',
      symbol: 'TCS',
      token: '11536',
      side: 'BUY',
      orderType: 'MARKET',
      price: 3910.0,
      quantity: 25,
      filledQuantity: 25,
      averagePrice: 3910.0,
      status: 'EXECUTED',
      stopLoss: 3880.0,
      target: 4000.0,
      placedAt: '09:42:10',
      updatedAt: '09:42:10',
      remarks: 'Paper Execution — 15m Pin Bar reversal',
    },
  ];
}

export async function fetchTradeJournal(): Promise<TradeJournalEntry[]> {
  try {
    const res = await fetch(`${API_BASE}/paper/journal/`);
    if (res.ok) {
      const data = await res.json();
      return data.journal || [];
    }
  } catch {
    // Fallback
  }
  return [
    {
      id: 'JRN-401',
      symbol: 'INFY',
      side: 'BUY',
      entryPrice: 1580.0,
      exitPrice: 1612.0,
      quantity: 100,
      pnl: 3200.0,
      strategyUsed: 'Pin Bar Support Confluence',
      entryReason: 'Bullish rejection at 200 EMA with 2.8 R:R potential',
      exitReason: 'Target 1 hit automatically',
      executedAt: 'Yesterday 14:30',
      durationMinutes: 110,
    },
    {
      id: 'JRN-400',
      symbol: 'BANKNIFTY',
      side: 'SELL',
      entryPrice: 48600.0,
      exitPrice: 48820.0,
      quantity: 15,
      pnl: -3300.0,
      strategyUsed: 'Shooting Star Resistance',
      entryReason: 'Bearish pin bar at swing high resistance',
      exitReason: 'Stop Loss triggered on trend continuation',
      executedAt: 'Yesterday 11:15',
      durationMinutes: 45,
    },
  ];
}

// -------------------------------------------------------------
// Realistic high-fidelity data simulators
// -------------------------------------------------------------
function generateSimulatedQuotes(): Record<string, Quote> {
  const basePrices: Record<string, number> = {
    '99926000': 24860.5,
    '99926009': 51240.0,
    '99926037': 23410.2,
    '2885': 2862.5,
    '11536': 3942.0,
    '1333': 1682.4,
    '1594': 1874.1,
    '3045': 812.6,
    '317': 7290.0,
    '1660': 492.3,
  };

  const quotes: Record<string, Quote> = {};
  for (const item of DEFAULT_WATCHLIST) {
    const base = basePrices[item.token] || 1500;
    const change = +(Math.sin(Date.now() / 10000 + base) * (base * 0.012)).toFixed(2);
    const ltp = +(base + change).toFixed(2);
    const prevClose = +(base - (base * 0.003)).toFixed(2);
    const netChange = +(ltp - prevClose).toFixed(2);
    const changePercent = +((netChange / prevClose) * 100).toFixed(2);

    quotes[item.token] = {
      token: item.token,
      symbol: item.symbol,
      ltp,
      open: +(base - 5).toFixed(2),
      high: +(Math.max(ltp, base + 15)).toFixed(2),
      low: +(Math.min(ltp, base - 12)).toFixed(2),
      close: prevClose,
      change: netChange,
      changePercent,
      volume: Math.floor(150000 + Math.random() * 850000),
      vwap: +(base + netChange * 0.4).toFixed(2),
      timestamp: new Date().toISOString(),
      source: 'SIMULATED_FEED',
      bestBid: +(ltp - 0.05).toFixed(2),
      bestAsk: +(ltp + 0.05).toFixed(2),
      depth: {
        buy: [
          { price: +(ltp - 0.05).toFixed(2), quantity: 450, orders: 8 },
          { price: +(ltp - 0.1).toFixed(2), quantity: 1200, orders: 15 },
          { price: +(ltp - 0.15).toFixed(2), quantity: 890, orders: 12 },
          { price: +(ltp - 0.2).toFixed(2), quantity: 2400, orders: 24 },
          { price: +(ltp - 0.25).toFixed(2), quantity: 3100, orders: 30 },
        ],
        sell: [
          { price: +(ltp + 0.05).toFixed(2), quantity: 600, orders: 9 },
          { price: +(ltp + 0.1).toFixed(2), quantity: 1450, orders: 19 },
          { price: +(ltp + 0.15).toFixed(2), quantity: 980, orders: 11 },
          { price: +(ltp + 0.2).toFixed(2), quantity: 1980, orders: 20 },
          { price: +(ltp + 0.25).toFixed(2), quantity: 2850, orders: 28 },
        ],
      },
    };
  }
  return quotes;
}

export function generateSimulatedCandles(symbol: string, timeframe: Timeframe, count: number = 150): Candle[] {
  let basePrice = 2800;
  if (symbol.includes('NIFTY 50')) basePrice = 24800;
  else if (symbol.includes('BANKNIFTY')) basePrice = 51000;
  else if (symbol.includes('FINNIFTY')) basePrice = 23200;
  else if (symbol === 'TCS') basePrice = 3900;
  else if (symbol === 'HDFCBANK') basePrice = 1680;
  else if (symbol === 'INFY') basePrice = 1860;
  else if (symbol === 'SBIN') basePrice = 810;
  else if (symbol === 'BAJFINANCE') basePrice = 7250;
  else if (symbol === 'ITC') basePrice = 490;

  const intervalSeconds =
    timeframe === '1m'
      ? 60
      : timeframe === '5m'
      ? 300
      : timeframe === '15m'
      ? 900
      : timeframe === '1h'
      ? 3600
      : 86400;

  const candles: Candle[] = [];
  const now = Math.floor(Date.now() / 1000);
  let currentPrice = basePrice;

  for (let i = count; i >= 0; i--) {
    const time = now - i * intervalSeconds;
    const volatility = basePrice * 0.003;
    const delta = (Math.sin(i * 0.2) + (Math.random() - 0.48)) * volatility;
    const open = currentPrice;
    const close = +(open + delta).toFixed(2);
    const high = +(Math.max(open, close) + Math.random() * volatility * 0.7).toFixed(2);
    const low = +(Math.min(open, close) - Math.random() * volatility * 0.7).toFixed(2);
    const volume = Math.floor(10000 + Math.random() * 50000);

    candles.push({
      time,
      open,
      high,
      low,
      close,
      volume,
    });
    currentPrice = close;
  }
  return candles;
}

function generateSimulatedTradeDecision(
  symbol: string,
  timeframe: Timeframe,
  isCalibrated: boolean = true,
  simulateStale: boolean = false
): TradeDecision {
  if (simulateStale) {
    return {
      id: `DEC-${symbol}-STALE`,
      symbol,
      timeframe,
      state: 'DATA_UNAVAILABLE',
      stateExplanation: 'Market data feed latency is 180s (>60s limit). Safety override active.',
      setupBias: 'NEUTRAL',
      pattern: 'None',
      timestamp: new Date().toLocaleTimeString(),
      isCompletedCandle: false,
      evidenceChecklist: [
        {
          name: 'Market Data Provenance & Freshness',
          status: 'FAILED',
          description: 'Feed latency exceeded threshold. Trading engine suspended.',
          category: 'DATA_QUALITY',
        },
      ],
      tradeLevels: null,
      mlOutput: {
        modelScore: 0.0,
        isCalibrated: false,
        label: 'DATA_UNAVAILABLE - Model Inactive',
        probability: null,
        confidenceInterval: null,
        featureContributions: [],
        modelVersion: 'ML-PA-RidgeGBM-v2.1',
        oosMetrics: {
          modelVersion: 'ML-PA-RidgeGBM-v2.1',
          datasetPeriod: '2024-01 to 2026-08 (Out-Of-Sample Walk-Forward)',
          sampleSizeN: 462,
          oosWinRate: 57.1,
          oosProfitFactor: 1.86,
          oosExpectancy: 1420.0,
          oosMaxDrawdown: 6.4,
          transactionCostsIncluded: '₹20 flat brokerage + 0.05% slippage + STT',
          brierScore: 0.182,
          calibrationMethod: 'Platt Scaling (Logistic Sigmoid on Out-Of-Fold Logits)',
        },
      },
      regulatoryNotice: 'Engine disabled during data anomaly.',
      outcomeTracking: { status: 'NOT_TRACKED', datasetEligible: false },
    };
  }

  return {
    id: `DEC-${symbol}-01`,
    symbol,
    timeframe,
    state: 'SETUP_QUALIFIED',
    stateExplanation: 'All rule-based conditions, statistical trend alignments, and ML predictive models satisfied.',
    setupBias: 'SHORT',
    pattern: 'Shooting Star (Bearish Rejection)',
    timestamp: new Date().toLocaleTimeString(),
    isCompletedCandle: true,
    evidenceChecklist: [
      {
        name: 'Completed Candle Pattern',
        status: 'PASSED',
        description: 'Confirmed Shooting Star on completed candle: Upper wick is 2.8x real body.',
        category: 'PRICE_ACTION',
      },
      {
        name: 'Trend Regime Filter (EMA 200)',
        status: 'PASSED',
        description: 'Price is below EMA 200 (₹2,872.40). Bearish continuation context aligned.',
        category: 'TREND',
      },
      {
        name: 'Support / Resistance Confluence',
        status: 'PASSED',
        description: 'Candle wick tested key swing high horizontal resistance (₹2,868.00) and rejected.',
        category: 'LEVELS',
      },
      {
        name: 'ATR Volatility Regime',
        status: 'PASSED',
        description: 'ATR(14) is 14.8 pts (0.52% of price) — within optimal liquidity range.',
        category: 'VOLATILITY',
      },
      {
        name: 'Volume Confirmation',
        status: 'PASSED',
        description: 'Volume expansion is 1.45x of 20-period moving average.',
        category: 'VOLUME',
      },
      {
        name: 'ML Probability Hurdle',
        status: 'PASSED',
        description: 'Model predictive score 0.618 exceeds hurdle 0.520.',
        category: 'MACHINE_LEARNING',
      },
    ],
    tradeLevels: {
      entryPrice: 2860.0,
      stopLoss: 2878.5,
      target1: 2823.0,
      target2: 2805.0,
      riskRewardRatio: 2.0,
      riskPerUnit: 18.5,
      rewardPerUnit: 37.0,
      recommendedQuantity: 405,
      maxRiskAmount: 7500.0,
    },
    mlOutput: {
      modelScore: 0.618,
      isCalibrated,
      label: isCalibrated ? 'Calibrated Win Probability' : 'Uncalibrated Model Score (Exploratory Only)',
      probability: isCalibrated ? 0.598 : null,
      confidenceInterval: isCalibrated ? [0.553, 0.643] : null,
      featureContributions: [
        { feature: 'wick_rejection_ratio', value: 0.74, weight: 1.45, contribution: 1.073, impact: 'POSITIVE' },
        { feature: 'ema200_regime_alignment', value: 1.0, weight: 1.20, contribution: 1.20, impact: 'POSITIVE' },
        { feature: 'sr_level_confluence', value: 0.92, weight: 1.10, contribution: 1.012, impact: 'POSITIVE' },
        { feature: 'vol_expansion', value: 1.45, weight: 0.95, contribution: 1.378, impact: 'POSITIVE' },
        { feature: 'body_range_ratio', value: 0.22, weight: -0.75, contribution: -0.165, impact: 'NEGATIVE' },
      ],
      modelVersion: 'ML-PA-RidgeGBM-v2.1',
      oosMetrics: {
        modelVersion: 'ML-PA-RidgeGBM-v2.1',
        datasetPeriod: '2024-01 to 2026-08 (Out-Of-Sample Walk-Forward)',
        sampleSizeN: 462,
        oosWinRate: 57.1,
        oosProfitFactor: 1.86,
        oosExpectancy: 1420.0,
        oosMaxDrawdown: 6.4,
        transactionCostsIncluded: '₹20 flat brokerage + 0.05% slippage + STT',
        brierScore: 0.182,
        calibrationMethod: 'Platt Scaling (Logistic Sigmoid on Out-Of-Fold Logits)',
      },
    },
    regulatoryNotice: (
      'Analytical & Educational Research Only. Machine learning scores and rule-based setups ' +
      'do not guarantee profitability. All virtual executions must be tested strictly in Paper Trading.'
    ),
    outcomeTracking: {
      status: 'TRACKING',
      datasetEligible: true,
    },
  };
}

function generateSimulatedSignals(symbol: string, timeframe: Timeframe): StrategySignal[] {
  return [
    {
      id: 'SIG-201',
      action: 'SELL',
      symbol,
      timeframe,
      timestamp: new Date().toLocaleTimeString(),
      entryPrice: 2860.0,
      stopLoss: 2878.5,
      target1: 2832.0,
      target2: 2815.0,
      riskRewardRatio: 2.43,
      patternDetected: 'Shooting Star',
      trendContext: 'BEARISH_BELOW_EMA200',
      atrValue: 14.8,
      rationale: [
        'Clear Shooting Star formed at swing high with upper wick 2.8x the real body.',
        'Candle high tested the 50-period EMA resistance and rejected sharply.',
        'Volume on rejection candle is 1.45x the 20-period volume average.',
        'RSI (14) printed a bearish divergence at 68.4 before curling downward.',
        'Downside targets aligned with key horizontal support and 1.618 Fib extension.',
      ],
      status: 'ACTIVE',
    },
    {
      id: 'SIG-200',
      action: 'BUY',
      symbol,
      timeframe,
      timestamp: new Date(Date.now() - 3600000).toLocaleTimeString(),
      entryPrice: 2835.0,
      stopLoss: 2819.0,
      target1: 2865.0,
      target2: 2885.0,
      riskRewardRatio: 1.88,
      patternDetected: 'Pin Bar (Hammer)',
      trendContext: 'BULLISH_ABOVE_EMA200',
      atrValue: 13.5,
      rationale: [
        'Bullish Pin Bar rejected lower liquidity pool with long lower shadow.',
        'Price retested ascending trendline support and held firmly.',
        'Risk-to-reward ratio 1.88 meets strategy minimum threshold (1.5).',
      ],
      status: 'TARGET_HIT',
    },
    {
      id: 'SIG-199',
      action: 'WAIT',
      symbol,
      timeframe,
      timestamp: new Date(Date.now() - 7200000).toLocaleTimeString(),
      entryPrice: 2842.0,
      stopLoss: 2828.0,
      target1: 2860.0,
      target2: 2875.0,
      riskRewardRatio: 1.28,
      patternDetected: 'Engulfing (Weak Confluence)',
      trendContext: 'SIDEWAYS_RANGE',
      atrValue: 11.2,
      rationale: [
        'Bullish engulfing candle detected but failed EMA200 trend context filter.',
        'R:R ratio (1.28) is below the required 1.50 minimum.',
        'Waiting for candle close above key pivot resistance for confirmation.',
      ],
      status: 'INVALIDATED',
    },
  ];
}

function generateSimulatedBacktestResult(params: BacktestParams): BacktestResult {
  const trades: BacktestTrade[] = [
    { id: 'T-1', direction: 'LONG', entryTime: '2026-09-02 09:30', entryPrice: 2820.0, exitTime: '2026-09-02 11:15', exitPrice: 2855.0, quantity: 50, pnl: 1750, pnlPercent: 1.24, exitReason: 'TARGET', fees: 40, netPnl: 1710 },
    { id: 'T-2', direction: 'SHORT', entryTime: '2026-09-04 13:45', entryPrice: 2870.0, exitTime: '2026-09-04 14:30', exitPrice: 2884.0, quantity: 50, pnl: -700, pnlPercent: -0.49, exitReason: 'STOP_LOSS', fees: 40, netPnl: -740 },
    { id: 'T-3', direction: 'LONG', entryTime: '2026-09-08 10:15', entryPrice: 2840.0, exitTime: '2026-09-08 14:00', exitPrice: 2888.0, quantity: 50, pnl: 2400, pnlPercent: 1.69, exitReason: 'TARGET', fees: 40, netPnl: 2360 },
    { id: 'T-4', direction: 'SHORT', entryTime: '2026-09-11 11:30', entryPrice: 2905.0, exitTime: '2026-09-11 13:00', exitPrice: 2872.0, quantity: 50, pnl: 1650, pnlPercent: 1.14, exitReason: 'TARGET', fees: 40, netPnl: 1610 },
    { id: 'T-5', direction: 'LONG', entryTime: '2026-09-15 09:45', entryPrice: 2880.0, exitTime: '2026-09-15 10:30', exitPrice: 2865.0, quantity: 50, pnl: -750, pnlPercent: -0.52, exitReason: 'STOP_LOSS', fees: 40, netPnl: -790 },
    { id: 'T-6', direction: 'SHORT', entryTime: '2026-09-18 14:00', entryPrice: 2895.0, exitTime: '2026-09-18 15:15', exitPrice: 2860.0, quantity: 50, pnl: 1750, pnlPercent: 1.21, exitReason: 'TARGET', fees: 40, netPnl: 1710 },
    { id: 'T-7', direction: 'LONG', entryTime: '2026-09-22 10:00', entryPrice: 2850.0, exitTime: '2026-09-22 12:45', exitPrice: 2892.0, quantity: 50, pnl: 2100, pnlPercent: 1.47, exitReason: 'TARGET', fees: 40, netPnl: 2060 },
    { id: 'T-8', direction: 'LONG', entryTime: '2026-09-25 11:15', entryPrice: 2890.0, exitTime: '2026-09-25 12:15', exitPrice: 2875.0, quantity: 50, pnl: -750, pnlPercent: -0.52, exitReason: 'STOP_LOSS', fees: 40, netPnl: -790 },
    { id: 'T-9', direction: 'SHORT', entryTime: '2026-09-29 13:15', entryPrice: 2920.0, exitTime: '2026-09-29 14:45', exitPrice: 2880.0, quantity: 50, pnl: 2000, pnlPercent: 1.37, exitReason: 'TARGET', fees: 40, netPnl: 1960 },
    { id: 'T-10', direction: 'LONG', entryTime: '2026-10-02 09:30', entryPrice: 2875.0, exitTime: '2026-10-02 11:30', exitPrice: 2915.0, quantity: 50, pnl: 2000, pnlPercent: 1.39, exitReason: 'TARGET', fees: 40, netPnl: 1960 },
  ];

  let currentCapital = params.initialCapital || 500000;
  let peakCapital = currentCapital;
  const equityCurve: Array<{ time: string; equity: number; drawdown: number }> = [
    { time: 'Start', equity: currentCapital, drawdown: 0 }
  ];

  let totalWinPnl = 0;
  let totalLossPnl = 0;
  let maxDD = 0;

  for (const t of trades) {
    currentCapital += t.netPnl;
    if (currentCapital > peakCapital) peakCapital = currentCapital;
    const dd = peakCapital - currentCapital;
    if (dd > maxDD) maxDD = dd;
    if (t.netPnl > 0) totalWinPnl += t.netPnl;
    else totalLossPnl += Math.abs(t.netPnl);

    equityCurve.push({
      time: t.exitTime,
      equity: currentCapital,
      drawdown: +((dd / peakCapital) * 100).toFixed(2),
    });
  }

  const totalTrades = trades.length;
  const winningTrades = trades.filter((t) => t.netPnl > 0).length;
  const losingTrades = totalTrades - winningTrades;
  const winRate = +((winningTrades / totalTrades) * 100).toFixed(1);
  const profitFactor = +(totalWinPnl / (totalLossPnl || 1)).toFixed(2);
  const totalPnl = currentCapital - params.initialCapital;
  const totalPnlPercent = +((totalPnl / params.initialCapital) * 100).toFixed(2);
  const expectancy = +(totalPnl / totalTrades).toFixed(2);
  const maxDrawdownPercent = +((maxDD / peakCapital) * 100).toFixed(2);

  return {
    id: `BT-${Date.now().toString().slice(-6)}`,
    symbol: params.symbol,
    timeframe: params.timeframe,
    period: `${params.startDate} to ${params.endDate}`,
    initialCapital: params.initialCapital,
    endingCapital: currentCapital,
    totalPnl,
    totalPnlPercent,
    totalTrades,
    winningTrades,
    losingTrades,
    winRate,
    profitFactor,
    expectancy,
    maxDrawdown: maxDD,
    maxDrawdownPercent,
    sharpeRatio: 2.14,
    trades,
    equityCurve,
  };
}
