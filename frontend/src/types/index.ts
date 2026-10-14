export type Timeframe = '1m' | '5m' | '15m' | '1h' | '1d';

export type Exchange = 'NSE' | 'BSE' | 'NFO' | 'MCX';

export interface Instrument {
  token: string;
  symbol: string;
  name: string;
  exchange: Exchange;
  expiry?: string;
  strike?: number;
  lotSize: number;
  instrumentType: 'EQ' | 'FUT' | 'OPT' | 'INDEX';
  tickSize: number;
}

export interface Quote {
  token: string;
  symbol: string;
  ltp: number;
  open: number;
  high: number;
  low: number;
  close: number; // Previous close
  change: number;
  changePercent: number;
  volume: number;
  vwap: number;
  timestamp: string;
  source: 'SMARTAPI_LIVE' | 'SIMULATED_FEED' | 'STALE_CACHE';
  bestBid?: number;
  bestAsk?: number;
  depth?: {
    buy: Array<{ price: number; quantity: number; orders: number }>;
    sell: Array<{ price: number; quantity: number; orders: number }>;
  };
}

export interface Candle {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SmartApiAuthStatus {
  connected: boolean;
  clientCode?: string;
  userName?: string;
  broker: 'Angel One SmartAPI';
  feedStatus: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'SIMULATION';
  lastPing?: string;
  jwtTokenValidUntil?: string;
  rateLimitRemaining?: number;
  error?: string;
}

// -------------------------------------------------------------
// Core Feature: ML-Powered Trade Decision Engine Types
// -------------------------------------------------------------
export type DecisionState =
  | 'WATCHING'
  | 'WAIT'
  | 'SETUP_QUALIFIED'
  | 'SETUP_REJECTED'
  | 'INVALIDATED'
  | 'DATA_UNAVAILABLE';

export interface EvidenceItem {
  name: string;
  status: 'PASSED' | 'FAILED' | 'WARNING';
  description: string;
  category: 'PRICE_ACTION' | 'TREND' | 'LEVELS' | 'VOLATILITY' | 'VOLUME' | 'MACHINE_LEARNING' | 'DATA_QUALITY';
}

export interface MLFeatureContribution {
  feature: string;
  value: number;
  weight: number;
  contribution: number;
  impact: 'POSITIVE' | 'NEGATIVE';
}

export interface OOSMetrics {
  modelVersion: string;
  datasetPeriod: string;
  sampleSizeN: number;
  oosWinRate: number; // %
  oosProfitFactor: number;
  oosExpectancy: number; // INR
  oosMaxDrawdown: number; // %
  transactionCostsIncluded: string;
  brierScore: number;
  calibrationMethod: string;
}

export interface MLOutput {
  modelScore: number;
  isCalibrated: boolean;
  label: string;
  probability?: number | null;
  confidenceInterval?: [number, number] | null;
  featureContributions: MLFeatureContribution[];
  modelVersion: string;
  oosMetrics: OOSMetrics;
}

export interface TradeLevels {
  entryPrice: number;
  stopLoss: number;
  target1: number;
  target2: number;
  riskRewardRatio: number;
  riskPerUnit: number;
  rewardPerUnit: number;
  recommendedQuantity: number;
  maxRiskAmount: number;
}

export interface TradeDecision {
  id: string;
  symbol: string;
  timeframe: Timeframe;
  state: DecisionState;
  stateExplanation: string;
  setupBias: 'LONG' | 'SHORT' | 'NEUTRAL';
  pattern: string;
  timestamp: string;
  isCompletedCandle: boolean;
  evidenceChecklist: EvidenceItem[];
  tradeLevels?: TradeLevels | null;
  mlOutput: MLOutput;
  regulatoryNotice: string;
  outcomeTracking: {
    status: string;
    datasetEligible: boolean;
  };
}

export interface TrackedOutcome {
  id: string;
  symbol: string;
  pattern: string;
  setupBias: string;
  entryPrice: number;
  stopLoss: number;
  target1: number;
  target2: number;
  detectedAt: string;
  outcome: 'TARGET_HIT' | 'STOP_LOSS_HIT' | 'IN_PROGRESS' | 'EXPIRED';
  realizedPnl: number;
  mfe: number; // Max Favorable Excursion (points)
  mae: number; // Max Adverse Excursion (points)
  mlPredictedProb: number;
  evaluatedDatasetEligible: boolean;
}

// Phase 2 Strategy Types (Legacy)
export type PatternType = 'SHOOTING_STAR' | 'PIN_BAR_HAMMER' | 'BULLISH_ENGULFING' | 'BEARISH_ENGULFING' | 'DOJI' | 'BREAKOUT';
export type SignalAction = 'BUY' | 'SELL' | 'WAIT';

export interface StrategySignal {
  id: string;
  action: SignalAction;
  symbol: string;
  timeframe: Timeframe;
  timestamp: string;
  entryPrice: number;
  stopLoss: number;
  target1: number;
  target2: number;
  riskRewardRatio: number;
  patternDetected: string;
  trendContext: 'BULLISH_ABOVE_EMA200' | 'BEARISH_BELOW_EMA200' | 'SIDEWAYS_RANGE';
  atrValue: number;
  rationale: string[];
  status: 'ACTIVE' | 'TARGET_HIT' | 'SL_HIT' | 'INVALIDATED';
}

// Phase 3 Backtest Types
export interface BacktestParams {
  symbol: string;
  timeframe: Timeframe;
  startDate: string;
  endDate: string;
  initialCapital: number;
  riskPercentage: number;
  brokeragePerOrder: number;
  slippagePercent: number;
  enableShootingStar: boolean;
  enablePinBar: boolean;
  enableEngulfing: boolean;
  requireEmaFilter: boolean;
  minRiskReward: number;
}

export interface BacktestTrade {
  id: string;
  direction: 'LONG' | 'SHORT';
  entryTime: string;
  entryPrice: number;
  exitTime: string;
  exitPrice: number;
  quantity: number;
  pnl: number;
  pnlPercent: number;
  exitReason: 'TARGET' | 'STOP_LOSS' | 'TIME_EXIT';
  fees: number;
  netPnl: number;
}

export interface BacktestResult {
  id: string;
  symbol: string;
  timeframe: string;
  period: string;
  initialCapital: number;
  endingCapital: number;
  totalPnl: number;
  totalPnlPercent: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  profitFactor: number;
  expectancy: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  sharpeRatio: number;
  trades: BacktestTrade[];
  equityCurve: Array<{ time: string; equity: number; drawdown: number }>;
}

// Phase 4 Paper Trading Types
export type PaperOrderType = 'MARKET' | 'LIMIT' | 'SL' | 'SL-M';
export type PaperOrderStatus = 'PENDING' | 'EXECUTED' | 'CANCELLED' | 'REJECTED';
export type OrderSide = 'BUY' | 'SELL';

export interface PaperOrder {
  id: string;
  symbol: string;
  token: string;
  side: OrderSide;
  orderType: PaperOrderType;
  price: number;
  triggerPrice?: number;
  quantity: number;
  filledQuantity: number;
  averagePrice: number;
  status: PaperOrderStatus;
  stopLoss?: number;
  target?: number;
  placedAt: string;
  updatedAt: string;
  remarks: string;
}

export interface PaperPosition {
  id: string;
  symbol: string;
  token: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  averagePrice: number;
  ltp: number;
  unrealizedPnl: number;
  pnlPercent: number;
  stopLoss?: number;
  target?: number;
  entryTime: string;
}

export interface PaperAccount {
  virtualCapital: number;
  availableMargin: number;
  usedMargin: number;
  realizedPnl: number;
  unrealizedPnl: number;
  totalTrades: number;
  activePositionsCount: number;
}

export interface TradeJournalEntry {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  strategyUsed: string;
  entryReason: string;
  exitReason: string;
  executedAt: string;
  durationMinutes: number;
}
