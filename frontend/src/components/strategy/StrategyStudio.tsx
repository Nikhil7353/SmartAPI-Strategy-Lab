import React, { useState } from 'react';
import {
  Cpu,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  Shield,
  Target,
  ArrowRight,
} from 'lucide-react';
import { StrategySignal, Instrument, Timeframe } from '../../types';

interface StrategyStudioProps {
  symbol: string;
  timeframe: Timeframe;
  signals: StrategySignal[];
  onExecutePaperOrder?: (signal: StrategySignal) => void;
}

export const StrategyStudio: React.FC<StrategyStudioProps> = ({
  symbol,
  timeframe,
  signals,
  onExecutePaperOrder,
}) => {
  // Configurable Parameters State
  const [minRiskReward, setMinRiskReward] = useState<number>(1.5);
  const [useEmaFilter, setUseEmaFilter] = useState<boolean>(true);
  const [atrMultiplier, setAtrMultiplier] = useState<number>(1.5);
  const [selectedSignal, setSelectedSignal] = useState<StrategySignal | null>(
    signals[0] || null
  );

  return (
    <div className="space-y-6">
      {/* Strategy Studio Header & Disclaimer Banner */}
      <div className="bg-white border border-border rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-primary">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">
                Strategy Studio — Price Action & Pattern Confluence
              </h2>
              <p className="text-xs text-text-secondary">
                Rule-based pattern scanner: Shooting Star & Pin Bar Reversals with multi-factor trend context
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-2xs font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-semibold border border-slate-200">
              Strategy v1.2.0
            </span>
            <span className="text-2xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md border border-emerald-200">
              Active Scanner
            </span>
          </div>
        </div>

        {/* Regulatory & Risk Notice (Strictly required) */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3 flex items-start space-x-2.5 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-2xs leading-relaxed">
            <strong>Analytical Signals Only:</strong> Signals presented are purely algorithmic calculations based on historical price action, ATR volatility, and trend confluence. No claim is made that this strategy is profitable without rigorous out-of-sample backtesting. Always exercise disciplined risk management.
          </p>
        </div>
      </div>

      {/* Main Grid: Parameters on Left, Signals on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Configurable Strategy Rules */}
        <div className="bg-white border border-border rounded-xl p-5 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
              Pattern & Context Rules
            </h3>
            <span className="text-3xs text-text-secondary">Configurable</span>
          </div>

          {/* Shooting Star Toggle */}
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-border rounded-lg">
              <div>
                <div className="font-semibold text-text-primary">Shooting Star Scanner</div>
                <div className="text-2xs text-text-secondary">
                  Upper shadow ≥ 2x real body, small lower wick
                </div>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded text-primary focus:ring-primary accent-primary" />
            </div>

            {/* Pin Bar / Hammer Toggle */}
            <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-border rounded-lg">
              <div>
                <div className="font-semibold text-text-primary">Pin Bar (Hammer) Scanner</div>
                <div className="text-2xs text-text-secondary">
                  Lower shadow ≥ 2x real body at support level
                </div>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded text-primary focus:ring-primary accent-primary" />
            </div>

            {/* EMA 200 Trend Filter */}
            <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-border rounded-lg">
              <div>
                <div className="font-semibold text-text-primary">EMA 200 Regime Filter</div>
                <div className="text-2xs text-text-secondary">
                  Require price &gt; EMA200 for BUY, &lt; EMA200 for SELL
                </div>
              </div>
              <input
                type="checkbox"
                checked={useEmaFilter}
                onChange={(e) => setUseEmaFilter(e.target.checked)}
                className="h-4 w-4 rounded text-primary focus:ring-primary accent-primary"
              />
            </div>

            {/* Min Risk to Reward Slider */}
            <div className="space-y-1.5 pt-2 border-t border-border">
              <div className="flex justify-between font-semibold">
                <span className="text-text-primary">Minimum Risk-to-Reward (R:R)</span>
                <span className="font-mono text-primary font-bold">{minRiskReward.toFixed(1)} : 1</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="3.5"
                step="0.1"
                value={minRiskReward}
                onChange={(e) => setMinRiskReward(parseFloat(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
              <div className="flex justify-between text-3xs text-text-secondary">
                <span>1.0x (Loose)</span>
                <span>2.0x (Standard)</span>
                <span>3.5x (Strict)</span>
              </div>
            </div>

            {/* ATR Multiplier for Stop Loss */}
            <div className="space-y-1.5 pt-2 border-t border-border">
              <div className="flex justify-between font-semibold">
                <span className="text-text-primary">ATR Stop Loss Buffer</span>
                <span className="font-mono text-text-primary font-bold">{atrMultiplier.toFixed(1)}x ATR</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="3.0"
                step="0.2"
                value={atrMultiplier}
                onChange={(e) => setAtrMultiplier(parseFloat(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Signals & Rationale Breakdown */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                Generated Analytical Signals ({symbol} - {timeframe})
              </h3>
            </div>
            <span className="text-2xs text-text-secondary">
              Updated on every closed candle
            </span>
          </div>

          {/* Signals Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {signals.map((sig) => {
              const isBuy = sig.action === 'BUY';
              const isSell = sig.action === 'SELL';
              const isWait = sig.action === 'WAIT';
              const isSelected = selectedSignal?.id === sig.id;

              return (
                <div
                  key={sig.id}
                  onClick={() => setSelectedSignal(sig)}
                  className={`bg-white border rounded-xl p-4 shadow-sm cursor-pointer transition space-y-3 ${
                    isSelected
                      ? 'border-primary ring-1 ring-primary'
                      : 'border-border hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          isBuy
                            ? 'bg-bull-light text-bull-dark border border-emerald-200'
                            : isSell
                            ? 'bg-bear-light text-bear-dark border border-red-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {sig.action}
                      </span>
                      <span className="font-bold text-xs text-text-primary">
                        {sig.patternDetected}
                      </span>
                    </div>
                    <span className="text-3xs font-mono text-text-secondary flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{sig.timestamp}</span>
                    </span>
                  </div>

                  {/* Pricing Matrix */}
                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-2xs font-mono">
                    <div>
                      <span className="text-text-secondary block text-3xs">Entry</span>
                      <span className="font-bold text-text-primary">₹{sig.entryPrice.toFixed(1)}</span>
                    </div>
                    <div>
                      <span className="text-bear block text-3xs">Stop Loss</span>
                      <span className="font-bold text-bear">₹{sig.stopLoss.toFixed(1)}</span>
                    </div>
                    <div>
                      <span className="text-bull block text-3xs">Target 1 (R:R)</span>
                      <span className="font-bold text-bull">
                        ₹{sig.target1.toFixed(1)} ({sig.riskRewardRatio.toFixed(1)}x)
                      </span>
                    </div>
                  </div>

                  {/* Status & Details */}
                  <div className="flex items-center justify-between text-2xs">
                    <span className="text-text-secondary">
                      Regime:{' '}
                      <strong className="text-text-primary font-semibold">
                        {sig.trendContext.replace(/_/g, ' ')}
                      </strong>
                    </span>
                    <span className="text-primary font-semibold hover:underline">
                      View Rationale &rarr;
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Signal Detailed Rationale Breakdown */}
          {selectedSignal && (
            <div className="bg-white border border-border rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center space-x-2">
                  <Info className="w-4 h-4 text-primary" />
                  <h4 className="font-bold text-xs uppercase tracking-wider text-text-primary">
                    Signal Verification & Execution Rationale ({selectedSignal.id})
                  </h4>
                </div>
                {onExecutePaperOrder && selectedSignal.action !== 'WAIT' && (
                  <button
                    onClick={() => onExecutePaperOrder(selectedSignal)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition shadow-sm"
                  >
                    <span>Send to Paper Trading</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Rationale Checklist */}
              <div className="space-y-2">
                {selectedSignal.rationale.map((point, idx) => (
                  <div key={idx} className="flex items-start space-x-2 text-xs">
                    {selectedSignal.action === 'WAIT' ? (
                      <XCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-bull shrink-0 mt-0.5" />
                    )}
                    <span className="text-text-primary leading-relaxed">{point}</span>
                  </div>
                ))}
              </div>

              {/* Mathematical Risk Breakdown */}
              <div className="p-3 bg-slate-50 border border-border rounded-lg grid grid-cols-2 sm:grid-cols-4 gap-3 text-2xs font-mono">
                <div>
                  <span className="text-text-secondary block text-3xs uppercase">Risk Per Share</span>
                  <span className="font-bold text-bear">
                    ₹{Math.abs(selectedSignal.entryPrice - selectedSignal.stopLoss).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-text-secondary block text-3xs uppercase">Reward Per Share</span>
                  <span className="font-bold text-bull">
                    ₹{Math.abs(selectedSignal.target1 - selectedSignal.entryPrice).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-text-secondary block text-3xs uppercase">ATR (14)</span>
                  <span className="font-bold text-text-primary">{selectedSignal.atrValue} pts</span>
                </div>
                <div>
                  <span className="text-text-secondary block text-3xs uppercase">R:R Ratio</span>
                  <span className="font-bold text-primary">{selectedSignal.riskRewardRatio} : 1</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
