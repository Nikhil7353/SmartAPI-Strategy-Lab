import React, { useState } from 'react';
import {
  History,
  Play,
  RotateCcw,
  CheckCircle,
  TrendingUp,
  Percent,
  DollarSign,
  AlertOctagon,
  Award,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { BacktestParams, BacktestResult, Timeframe } from '../../types';
import { runBacktest } from '../../api/client';

interface BacktestStudioProps {
  currentSymbol: string;
}

export const BacktestStudio: React.FC<BacktestStudioProps> = ({ currentSymbol }) => {
  const [params, setParams] = useState<BacktestParams>({
    symbol: currentSymbol || 'RELIANCE',
    timeframe: '15m',
    startDate: '2026-09-01',
    endDate: '2026-10-14',
    initialCapital: 500000,
    riskPercentage: 1.5,
    brokeragePerOrder: 20, // Standard Angel One flat brokerage
    slippagePercent: 0.05,
    enableShootingStar: true,
    enablePinBar: true,
    enableEngulfing: true,
    requireEmaFilter: true,
    minRiskReward: 1.5,
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);

  const handleRun = async () => {
    setLoading(true);
    try {
      const data = await runBacktest(params);
      setResult(data);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    // Initial run on mount
    handleRun();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-border rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-primary">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-text-primary">
              Historical Backtesting Engine
            </h2>
            <p className="text-xs text-text-secondary">
              Zero look-ahead bias candle simulation with slippage, STT, and Angel One brokerage modeling
            </p>
          </div>
        </div>
        <button
          onClick={handleRun}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50"
        >
          {loading ? (
            <RotateCcw className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4 fill-white" />
          )}
          <span>{loading ? 'Replaying Candles...' : 'Execute Backtest'}</span>
        </button>
      </div>

      {/* Grid: Parameters on Left, Results on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Config Panel */}
        <div className="bg-white border border-border rounded-xl p-5 shadow-sm space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h3 className="font-bold uppercase tracking-wider text-text-primary">
              Simulation Parameters
            </h3>
            <span className="text-3xs text-text-secondary">Reproducible</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-text-secondary block font-medium mb-1">Target Instrument</label>
              <input
                type="text"
                value={params.symbol}
                onChange={(e) => setParams({ ...params, symbol: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-50 border border-border rounded-lg font-mono text-xs text-text-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-text-secondary block font-medium mb-1">Timeframe</label>
                <select
                  value={params.timeframe}
                  onChange={(e) => setParams({ ...params, timeframe: e.target.value as Timeframe })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-border rounded-lg text-xs text-text-primary"
                >
                  <option value="5m">5m</option>
                  <option value="15m">15m</option>
                  <option value="1h">1h</option>
                  <option value="1d">1D</option>
                </select>
              </div>

              <div>
                <label className="text-text-secondary block font-medium mb-1">Initial Capital (₹)</label>
                <input
                  type="number"
                  value={params.initialCapital}
                  onChange={(e) => setParams({ ...params, initialCapital: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-border rounded-lg font-mono text-xs text-text-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-text-secondary block font-medium mb-1">Start Date</label>
                <input
                  type="date"
                  value={params.startDate}
                  onChange={(e) => setParams({ ...params, startDate: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-border rounded-lg text-xs text-text-primary"
                />
              </div>

              <div>
                <label className="text-text-secondary block font-medium mb-1">End Date</label>
                <input
                  type="date"
                  value={params.endDate}
                  onChange={(e) => setParams({ ...params, endDate: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-border rounded-lg text-xs text-text-primary"
                />
              </div>
            </div>

            {/* Friction & Costs Modeling */}
            <div className="pt-2 border-t border-border space-y-2">
              <span className="text-3xs font-bold uppercase tracking-wider text-text-secondary">
                Friction & Realistic Costs
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-text-secondary block text-3xs mb-0.5">
                    Brokerage / Order
                  </label>
                  <input
                    type="number"
                    value={params.brokeragePerOrder}
                    onChange={(e) =>
                      setParams({ ...params, brokeragePerOrder: Number(e.target.value) })
                    }
                    className="w-full px-2 py-1 bg-slate-50 border border-border rounded text-xs font-mono"
                  />
                  <span className="text-3xs text-text-secondary">₹20 flat standard</span>
                </div>
                <div>
                  <label className="text-text-secondary block text-3xs mb-0.5">Slippage (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={params.slippagePercent}
                    onChange={(e) =>
                      setParams({ ...params, slippagePercent: Number(e.target.value) })
                    }
                    className="w-full px-2 py-1 bg-slate-50 border border-border rounded text-xs font-mono"
                  />
                  <span className="text-3xs text-text-secondary">0.05% fill variance</span>
                </div>
              </div>
            </div>

            {/* Rule Filters */}
            <div className="pt-2 border-t border-border space-y-2">
              <span className="text-3xs font-bold uppercase tracking-wider text-text-secondary">
                Active Replay Rules
              </span>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={params.enableShootingStar}
                  onChange={(e) => setParams({ ...params, enableShootingStar: e.target.checked })}
                  className="rounded text-primary accent-primary"
                />
                <span className="text-text-primary">Shooting Star Signals</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={params.enablePinBar}
                  onChange={(e) => setParams({ ...params, enablePinBar: e.target.checked })}
                  className="rounded text-primary accent-primary"
                />
                <span className="text-text-primary">Pin Bar / Hammer Signals</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={params.requireEmaFilter}
                  onChange={(e) => setParams({ ...params, requireEmaFilter: e.target.checked })}
                  className="rounded text-primary accent-primary"
                />
                <span className="text-text-primary">Enforce EMA 200 Trend Alignment</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Results Dashboard */}
        <div className="lg:col-span-2 space-y-6">
          {result && (
            <>
              {/* Metric Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white border border-border rounded-xl p-4 shadow-sm">
                  <div className="text-3xs uppercase font-bold text-text-secondary mb-1">
                    Net Profit / Loss
                  </div>
                  <div
                    className={`text-lg font-bold font-mono ${
                      result.totalPnl >= 0 ? 'text-bull' : 'text-bear'
                    }`}
                  >
                    {result.totalPnl >= 0 ? '+' : ''}₹{result.totalPnl.toLocaleString()}
                  </div>
                  <div className="text-2xs font-semibold text-text-secondary mt-0.5">
                    {result.totalPnlPercent >= 0 ? '+' : ''}
                    {result.totalPnlPercent}% Return
                  </div>
                </div>

                <div className="bg-white border border-border rounded-xl p-4 shadow-sm">
                  <div className="text-3xs uppercase font-bold text-text-secondary mb-1">
                    Win Rate
                  </div>
                  <div className="text-lg font-bold font-mono text-text-primary">
                    {result.winRate}%
                  </div>
                  <div className="text-2xs text-text-secondary mt-0.5">
                    {result.winningTrades}W / {result.losingTrades}L of {result.totalTrades}
                  </div>
                </div>

                <div className="bg-white border border-border rounded-xl p-4 shadow-sm">
                  <div className="text-3xs uppercase font-bold text-text-secondary mb-1">
                    Profit Factor
                  </div>
                  <div className="text-lg font-bold font-mono text-primary">
                    {result.profitFactor}
                  </div>
                  <div className="text-2xs text-text-secondary mt-0.5">
                    Expectancy: ₹{result.expectancy}/trade
                  </div>
                </div>

                <div className="bg-white border border-border rounded-xl p-4 shadow-sm">
                  <div className="text-3xs uppercase font-bold text-text-secondary mb-1">
                    Max Drawdown
                  </div>
                  <div className="text-lg font-bold font-mono text-bear">
                    -{result.maxDrawdownPercent}%
                  </div>
                  <div className="text-2xs text-text-secondary mt-0.5">
                    -₹{result.maxDrawdown.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Equity Curve Visualization */}
              <div className="bg-white border border-border rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                    Simulated Portfolio Equity Curve
                  </h3>
                  <span className="text-2xs text-text-secondary font-mono">
                    Initial: ₹{result.initialCapital.toLocaleString()} &rarr; Final: ₹
                    {result.endingCapital.toLocaleString()}
                  </span>
                </div>

                {/* SVG Line Chart for Equity Curve */}
                <div className="h-44 w-full relative pt-2">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 500 120" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563EB" stopOpacity="0.18" />
                        <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {/* Render curve */}
                    {(() => {
                      const minEq = Math.min(...result.equityCurve.map((e) => e.equity)) * 0.99;
                      const maxEq = Math.max(...result.equityCurve.map((e) => e.equity)) * 1.01;
                      const range = maxEq - minEq || 1;
                      const pts = result.equityCurve.map((pt, i) => {
                        const x = (i / (result.equityCurve.length - 1 || 1)) * 500;
                        const y = 110 - ((pt.equity - minEq) / range) * 100;
                        return `${x},${y}`;
                      });
                      const polyPts = `0,110 ${pts.join(' ')} 500,110`;
                      return (
                        <>
                          <polygon points={polyPts} fill="url(#equityGrad)" />
                          <polyline
                            points={pts.join(' ')}
                            fill="none"
                            stroke="#2563EB"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </>
                      );
                    })()}
                  </svg>
                </div>
              </div>

              {/* Trade Log Table */}
              <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-slate-50 flex items-center justify-between">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-text-primary">
                    Simulated Replay Trades Log ({result.trades.length} Executions)
                  </h3>
                  <span className="text-3xs text-text-secondary">With slippage & fees deducted</span>
                </div>

                <div className="overflow-x-auto max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white text-text-secondary border-b border-border font-semibold text-2xs sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-4">Trade ID</th>
                        <th className="py-2.5 px-4">Direction</th>
                        <th className="py-2.5 px-4">Entry</th>
                        <th className="py-2.5 px-4">Exit</th>
                        <th className="py-2.5 px-4">Qty</th>
                        <th className="py-2.5 px-4">Fees</th>
                        <th className="py-2.5 px-4">Exit Reason</th>
                        <th className="py-2.5 px-4 text-right">Net P&L</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-2xs">
                      {result.trades.map((t) => {
                        const isWin = t.netPnl > 0;
                        return (
                          <tr key={t.id} className="hover:bg-slate-50 transition">
                            <td className="py-2.5 px-4 font-bold text-text-primary">{t.id}</td>
                            <td className="py-2.5 px-4">
                              <span
                                className={`px-2 py-0.5 rounded font-bold ${
                                  t.direction === 'LONG'
                                    ? 'bg-emerald-50 text-bull border border-emerald-200'
                                    : 'bg-red-50 text-bear border border-red-200'
                                }`}
                              >
                                {t.direction}
                              </span>
                            </td>
                            <td className="py-2.5 px-4">
                              ₹{t.entryPrice.toFixed(1)}
                              <span className="block text-3xs text-text-secondary">{t.entryTime}</span>
                            </td>
                            <td className="py-2.5 px-4">
                              ₹{t.exitPrice.toFixed(1)}
                              <span className="block text-3xs text-text-secondary">{t.exitTime}</span>
                            </td>
                            <td className="py-2.5 px-4">{t.quantity}</td>
                            <td className="py-2.5 px-4 text-text-secondary">₹{t.fees}</td>
                            <td className="py-2.5 px-4">
                              <span
                                className={`px-1.5 py-0.5 rounded text-3xs font-semibold ${
                                  t.exitReason === 'TARGET'
                                    ? 'bg-bull-light text-bull-dark'
                                    : 'bg-bear-light text-bear-dark'
                                }`}
                              >
                                {t.exitReason}
                              </span>
                            </td>
                            <td
                              className={`py-2.5 px-4 text-right font-bold ${
                                isWin ? 'text-bull' : 'text-bear'
                              }`}
                            >
                              {isWin ? '+' : ''}₹{t.netPnl.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
