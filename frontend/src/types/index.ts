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

// Phase 2 Strategy Types
export type PatternType = 'SHOOTING_STAR' | 'PIN_BAR_HAMMER' | 'BULLISH_ENGULFING' | 'BEARISH_ENGULFING' | 'DOJI' | 'BREAKOUT';
export type SignalAction = 'BUY' | 'SELL' | 'WAIT';

export interface StrategyPatternMatch {
  pattern: PatternType;
  name: string;
  timestamp: number;
  candleIndex: number;
  confidence: number; // 0 to 100
  isBullish: boolean;
  price: number;
}

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
  brokeragePerOrder: number; // Flat e.g. 20 INR
  slippagePercent: number; // e.g. 0.05%
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
  winRate: number; // percentage e.g. 58.2
  profitFactor: number;
  expectancy: number; // average PnL per trade
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
