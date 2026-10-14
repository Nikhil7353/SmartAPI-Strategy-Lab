import React, { useState, useEffect } from 'react';
import {
  Brain,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Database,
  Sliders,
  Layers,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Percent,
  BarChart,
  HelpCircle,
  Activity,
  Award,
} from 'lucide-react';
import {
  TradeDecision,
  TrackedOutcome,
  DecisionState,
  Instrument,
  Timeframe,
} from '../../types';
import { fetchTradeDecision, fetchTrackedOutcomes } from '../../api/client';

interface TradeDecisionEngineStudioProps {
  activeInstrument: Instrument;
  timeframe: Timeframe;
  onSendToPaperTrading: (tradeLevels: NonNullable<TradeDecision['tradeLevels']>, symbol: string) => void;
}

export const TradeDecisionEngineStudio: React.FC<TradeDecisionEngineStudioProps> = ({
  activeInstrument,
  timeframe,
  onSendToPaperTrading,
}) => {
  const [decision, setDecision] = useState<TradeDecision | null>(null);
  const [outcomes, setOutcomes] = useState<TrackedOutcome[]>([]);
  const [outcomeSummary, setOutcomeSummary] = useState<{
    totalTracked: number;
    targetHitCount: number;
    stopLossCount: number;
    datasetEligibleCount: number;
  }>({ totalTracked: 0, targetHitCount: 0, stopLossCount: 0, datasetEligibleCount: 0 });

  // Configurable Parameters State
  const [minRiskReward, setMinRiskReward] = useState<number>(1.5);
  const [useEmaFilter, setUseEmaFilter] = useState<boolean>(true);
  const [mlThreshold, setMlThreshold] = useState<number>(0.52);
  const [isCalibrated, setIsCalibrated] = useState<boolean>(true);
  const [simulateStale, setSimulateStale] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'decision' | 'outcomes' | 'model_info'>('decision');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    loadDecision();
  }, [activeInstrument, timeframe, minRiskReward, useEmaFilter, mlThreshold, isCalibrated, simulateStale]);

  useEffect(() => {
    loadOutcomes();
  }, []);

  const loadDecision = async () => {
    setLoading(true);
    try {
      const data = await fetchTradeDecision(
        activeInstrument.symbol,
        timeframe,
        activeInstrument.token,
        minRiskReward,
        useEmaFilter,
        mlThreshold,
        isCalibrated,
        simulateStale
      );
      setDecision(data);
    } finally {
      setLoading(false);
    }
  };

  const loadOutcomes = async () => {
    const res = await fetchTrackedOutcomes();
    setOutcomes(res.outcomes);
    setOutcomeSummary(res.summary);
  };

  // State styling helper for strict light theme
  const getStateBadge = (state: DecisionState) => {
    switch (state) {
      case 'SETUP_QUALIFIED':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          dot: 'bg-emerald-600',
          label: 'SETUP QUALIFIED',
        };
      case 'WAIT':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-300',
          dot: 'bg-amber-500',
          label: 'WAIT (CONFIRMATION REQUIRED)',
        };
      case 'WATCHING':
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-300',
          dot: 'bg-blue-600',
          label: 'WATCHING (APPROACHING S/R)',
        };
      case 'SETUP_REJECTED':
        return {
          bg: 'bg-slate-100 text-slate-800 border-slate-300',
          dot: 'bg-slate-500',
          label: 'SETUP REJECTED (RISK LIMIT)',
        };
      case 'INVALIDATED':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-300',
          dot: 'bg-rose-600',
          label: 'INVALIDATED',
        };
      case 'DATA_UNAVAILABLE':
        return {
          bg: 'bg-purple-50 text-purple-800 border-purple-300',
          dot: 'bg-purple-600',
          label: 'DATA UNAVAILABLE / FEED STALE',
        };
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Top Main Banner with Decision Engine Status & Controls */}
      <div className="bg-white border border-border rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-primary shadow-xs">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-text-primary">
                  ML-Powered Trade Decision Engine
                </h2>
                <span className="text-3xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                  v2.1-OOS
                </span>
              </div>
              <p className="text-xs text-text-secondary">
                Combines rule-based price action, calibrated ML predictions, out-of-sample backtest evidence, and data quality checks
              </p>
            </div>
          </div>

          {/* Quick Simulation & Safety Overrides */}
          <div className="flex flex-wrap items-center gap-2 text-2xs">
            {/* Calibration Mode Toggle */}
            <button
              onClick={() => setIsCalibrated(!isCalibrated)}
              className={`px-3 py-1.5 rounded-lg border font-semibold transition ${
                isCalibrated
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}
            >
              {isCalibrated ? 'Calibrated Probability Mode' : 'Uncalibrated Model Score Mode'}
            </button>

            {/* Stale Feed Safety Tester */}
            <button
              onClick={() => setSimulateStale(!simulateStale)}
              className={`px-3 py-1.5 rounded-lg border font-semibold transition ${
                simulateStale
                  ? 'bg-rose-50 text-rose-800 border-rose-300'
                  : 'bg-slate-50 text-text-secondary border-border hover:bg-slate-100'
              }`}
            >
              {simulateStale ? 'Stale Feed Simulated (Active)' : 'Test Stale Feed Safety'}
            </button>
          </div>
        </div>

        {/* Current State Indicator Box */}
        {decision && (
          <div className="p-4 bg-slate-50 border border-border rounded-xl space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2.5">
                {(() => {
                  const badge = getStateBadge(decision.state);
                  return (
                    <span
                      className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-xs ${badge.bg}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                      <span>{badge.label}</span>
                    </span>
                  );
                })()}

                <span className="font-bold text-xs text-text-primary">
                  {decision.symbol} ({decision.timeframe})
                </span>

                {decision.pattern !== 'None' && (
                  <span className="text-2xs font-mono font-semibold px-2 py-0.5 rounded bg-white border border-border text-text-secondary">
                    Pattern: {decision.pattern}
                  </span>
                )}
              </div>

              <div className="text-3xs font-mono text-text-secondary flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Prediction Timestamp: {decision.timestamp} (Zero Look-Ahead)</span>
              </div>
            </div>

            <p className="text-xs text-text-primary leading-relaxed font-medium">
              {decision.stateExplanation}
            </p>
          </div>
        )}

        {/* Navigation Tabs for Decision Studio */}
        <div className="flex items-center space-x-2 border-t border-border pt-3 text-xs">
          <button
            onClick={() => setActiveTab('decision')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              activeTab === 'decision'
                ? 'bg-slate-900 text-white'
                : 'text-text-secondary hover:bg-slate-100'
            }`}
          >
            Decision Ledger & ML Evidence
          </button>
          <button
            onClick={() => setActiveTab('outcomes')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              activeTab === 'outcomes'
                ? 'bg-slate-900 text-white'
                : 'text-text-secondary hover:bg-slate-100'
            }`}
          >
            Outcome Tracker & Dataset Pipeline ({outcomes.length})
          </button>
          <button
            onClick={() => setActiveTab('model_info')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              activeTab === 'model_info'
                ? 'bg-slate-900 text-white'
                : 'text-text-secondary hover:bg-slate-100'
            }`}
          >
            Audited OOS Evidence & Calibration
          </button>
        </div>
      </div>

      {/* Tab 1: Decision Ledger, Rule-Based Evidence & Isolated ML Output */}
      {activeTab === 'decision' && decision && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Rule-Based Technical Evidence Checklist (6 cols) */}
          <div className="lg:col-span-6 bg-white border border-border rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                  Rule-Based Technical Analysis Ledger
                </h3>
              </div>
              <span className="text-3xs font-mono text-text-secondary">
                Deterministic Criteria
              </span>
            </div>

            <div className="space-y-3">
              {decision.evidenceChecklist.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 border border-border rounded-lg flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-text-primary">{item.name}</span>
                      <span className="text-3xs font-mono px-1.5 py-0.2 rounded bg-white border border-slate-200 text-slate-500">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-2xs text-text-secondary leading-normal">
                      {item.description}
                    </p>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-3xs font-bold shrink-0 ${
                      item.status === 'PASSED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.status === 'WARNING'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>

            {/* Parameters Adjuster */}
            <div className="pt-3 border-t border-border space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-text-secondary">Min Risk-to-Reward:</span>
                <span className="font-mono font-bold text-text-primary">{minRiskReward.toFixed(1)}:1</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="3.0"
                step="0.1"
                value={minRiskReward}
                onChange={(e) => setMinRiskReward(parseFloat(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />

              <div className="flex items-center justify-between pt-1">
                <span className="font-semibold text-text-secondary">Require EMA 200 Filter:</span>
                <input
                  type="checkbox"
                  checked={useEmaFilter}
                  onChange={(e) => setUseEmaFilter(e.target.checked)}
                  className="rounded text-primary accent-primary"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Isolated Machine Learning Output & Trade Structuring (6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            {/* Isolated ML Output Card */}
            <div className="bg-white border border-border rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center space-x-2">
                  <Brain className="w-4 h-4 text-purple-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                    Isolated Machine Learning Model Output
                  </h3>
                </div>
                <span className="text-3xs font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 font-semibold">
                  {decision.mlOutput.modelVersion}
                </span>
              </div>

              {/* Model Score / Probability Display */}
              <div className="p-4 bg-slate-50 border border-border rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-3xs font-bold uppercase tracking-wider text-text-secondary">
                    {decision.mlOutput.label}
                  </div>
                  {decision.mlOutput.isCalibrated && decision.mlOutput.probability ? (
                    <div className="flex items-baseline space-x-2 mt-1">
                      <span className="text-2xl font-bold font-mono text-text-primary">
                        {(decision.mlOutput.probability * 100).toFixed(1)}%
                      </span>
                      {decision.mlOutput.confidenceInterval && (
                        <span className="text-2xs font-mono text-text-secondary">
                          (90% CI: {(decision.mlOutput.confidenceInterval[0] * 100).toFixed(1)}% -{' '}
                          {(decision.mlOutput.confidenceInterval[1] * 100).toFixed(1)}%)
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-baseline space-x-2 mt-1">
                      <span className="text-2xl font-bold font-mono text-amber-600">
                        {decision.mlOutput.modelScore.toFixed(3)}
                      </span>
                      <span className="text-2xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                        UNVALIDATED - EXPLORATORY SCORE
                      </span>
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-3xs text-text-secondary block">Model Threshold</span>
                  <span className="text-xs font-mono font-bold text-text-primary">
                    {mlThreshold.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Local Feature Contributions (SHAP-style explainability) */}
              <div className="space-y-2">
                <div className="text-2xs font-bold uppercase text-text-secondary">
                  Local Feature Contribution Breakdown
                </div>
                <div className="space-y-1.5 font-mono text-2xs">
                  {decision.mlOutput.featureContributions.slice(0, 5).map((feat, i) => (
                    <div key={i} className="flex items-center justify-between bg-white p-2 rounded border border-slate-100">
                      <span className="text-text-primary font-sans text-xs">
                        {feat.feature.replace(/_/g, ' ')}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-text-secondary text-3xs">Val: {feat.value}</span>
                        <span
                          className={`font-bold px-1.5 py-0.2 rounded text-3xs ${
                            feat.impact === 'POSITIVE'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {feat.contribution >= 0 ? '+' : ''}
                          {feat.contribution}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Trade Structuring Card (When Qualified or Structured) */}
            {decision.tradeLevels && (
              <div className="bg-white border border-border rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                    Proposed Trade Execution &amp; Risk Sizing
                  </h3>
                  <span className="text-2xs font-bold text-primary font-mono">
                    R:R {decision.tradeLevels.riskRewardRatio}:1
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-2xs font-mono">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-border">
                    <span className="text-3xs text-text-secondary uppercase block font-sans">
                      Proposed Entry
                    </span>
                    <span className="font-bold text-text-primary">
                      ₹{decision.tradeLevels.entryPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-border">
                    <span className="text-3xs text-bear uppercase block font-sans">Stop Loss</span>
                    <span className="font-bold text-bear">
                      ₹{decision.tradeLevels.stopLoss.toFixed(2)}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-border">
                    <span className="text-3xs text-bull uppercase block font-sans">Target 1</span>
                    <span className="font-bold text-bull">
                      ₹{decision.tradeLevels.target1.toFixed(2)}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-border">
                    <span className="text-3xs text-bull uppercase block font-sans">Target 2</span>
                    <span className="font-bold text-bull">
                      ₹{decision.tradeLevels.target2.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Sizing & Capital Allocation */}
                <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg flex items-center justify-between text-2xs">
                  <div>
                    <span className="text-text-secondary block">
                      Max Risk: ₹{decision.tradeLevels.maxRiskAmount.toLocaleString()} (1.5% Capital)
                    </span>
                    <span className="font-bold text-text-primary">
                      Recommended Size: {decision.tradeLevels.recommendedQuantity} Units
                    </span>
                  </div>

                  <button
                    onClick={() =>
                      decision.tradeLevels &&
                      onSendToPaperTrading(decision.tradeLevels, decision.symbol)
                    }
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-xs transition"
                  >
                    <span>Test in Paper Sandbox</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Regulatory Disclaimer Notice */}
            <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg flex items-start space-x-2 text-2xs text-amber-900 leading-relaxed">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{decision.regulatoryNotice}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Outcome Tracker & Dataset Pipeline */}
      {activeTab === 'outcomes' && (
        <div className="bg-white border border-border rounded-xl shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-text-primary">
                Continuous Outcome Tracker &amp; Evaluation Pipeline
              </h3>
              <p className="text-2xs text-text-secondary">
                Every qualified setup is tracked on subsequent ticks to record MFE, MAE, and eventual outcome for automated dataset generation.
              </p>
            </div>

            <div className="flex items-center space-x-3 text-2xs font-mono">
              <span className="bg-slate-100 px-2 py-1 rounded">
                Tracked: <strong>{outcomeSummary.totalTracked}</strong>
              </span>
              <span className="bg-emerald-50 text-emerald-800 px-2 py-1 rounded border border-emerald-200">
                Target Hit: <strong>{outcomeSummary.targetHitCount}</strong>
              </span>
              <span className="bg-rose-50 text-rose-800 px-2 py-1 rounded border border-rose-200">
                SL Hit: <strong>{outcomeSummary.stopLossCount}</strong>
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-text-secondary border-b border-border font-semibold text-2xs">
                <tr>
                  <th className="py-2.5 px-4">Track ID</th>
                  <th className="py-2.5 px-4">Symbol</th>
                  <th className="py-2.5 px-4">Pattern</th>
                  <th className="py-2.5 px-4">Side</th>
                  <th className="py-2.5 px-4">Entry / SL / Target</th>
                  <th className="py-2.5 px-4">MFE / MAE</th>
                  <th className="py-2.5 px-4">ML Predicted</th>
                  <th className="py-2.5 px-4">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-2xs">
                {outcomes.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-4 font-bold text-text-primary">{item.id}</td>
                    <td className="py-2.5 px-4 font-bold">{item.symbol}</td>
                    <td className="py-2.5 px-4 font-sans text-text-secondary">{item.pattern}</td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`px-1.5 py-0.5 rounded font-bold text-3xs ${
                          item.setupBias === 'LONG'
                            ? 'bg-emerald-50 text-bull'
                            : 'bg-rose-50 text-bear'
                        }`}
                      >
                        {item.setupBias}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-3xs">
                      Entry: ₹{item.entryPrice} | SL: ₹{item.stopLoss} | TP: ₹{item.target1}
                    </td>
                    <td className="py-2.5 px-4 text-3xs">
                      <span className="text-bull">+{item.mfe} pts</span> /{' '}
                      <span className="text-bear">-{item.mae} pts</span>
                    </td>
                    <td className="py-2.5 px-4">{(item.mlPredictedProb * 100).toFixed(1)}%</td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-3xs font-bold ${
                          item.outcome === 'TARGET_HIT'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.outcome === 'STOP_LOSS_HIT'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.outcome}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Audited Out-of-Sample (OOS) Evidence & Calibration Information */}
      {activeTab === 'model_info' && decision && (
        <div className="bg-white border border-border rounded-xl shadow-sm p-5 space-y-5">
          <div className="border-b border-border pb-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-text-primary">
              Audited Out-of-Sample (OOS) Evidence &amp; Model Governance
            </h3>
            <p className="text-2xs text-text-secondary mt-0.5">
              Strict walk-forward validation without look-ahead bias or survivorship bias.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-3 bg-slate-50 border border-border rounded-lg">
              <span className="text-3xs text-text-secondary block uppercase font-sans">
                OOS Win Rate
              </span>
              <span className="text-lg font-bold text-bull">
                {decision.mlOutput.oosMetrics.oosWinRate}%
              </span>
            </div>
            <div className="p-3 bg-slate-50 border border-border rounded-lg">
              <span className="text-3xs text-text-secondary block uppercase font-sans">
                OOS Profit Factor
              </span>
              <span className="text-lg font-bold text-primary">
                {decision.mlOutput.oosMetrics.oosProfitFactor}
              </span>
            </div>
            <div className="p-3 bg-slate-50 border border-border rounded-lg">
              <span className="text-3xs text-text-secondary block uppercase font-sans">
                OOS Max Drawdown
              </span>
              <span className="text-lg font-bold text-bear">
                -{decision.mlOutput.oosMetrics.oosMaxDrawdown}%
              </span>
            </div>
            <div className="p-3 bg-slate-50 border border-border rounded-lg">
              <span className="text-3xs text-text-secondary block uppercase font-sans">
                Sample Size (N)
              </span>
              <span className="text-lg font-bold text-text-primary">
                N = {decision.mlOutput.oosMetrics.sampleSizeN}
              </span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-border rounded-xl space-y-2 text-xs">
            <div className="font-bold text-text-primary">Validation Protocol Disclosures:</div>
            <ul className="list-disc list-inside space-y-1 text-2xs text-text-secondary leading-relaxed">
              <li>
                <strong>Friction Deducted:</strong> {decision.mlOutput.oosMetrics.transactionCostsIncluded}
              </li>
              <li>
                <strong>Probability Calibration:</strong> {decision.mlOutput.oosMetrics.calibrationMethod}
              </li>
              <li>
                <strong>Brier Score:</strong> {decision.mlOutput.oosMetrics.brierScore} (Scores below 0.20 indicate reliable probabilistic calibration)
              </li>
              <li>
                <strong>Validation Window:</strong> {decision.mlOutput.oosMetrics.datasetPeriod}
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

