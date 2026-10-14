import React from 'react';
import { Timeframe } from '../../types';
import { SlidersHorizontal, BarChart2 } from 'lucide-react';

interface TimeframeBarProps {
  activeTimeframe: Timeframe;
  onSelectTimeframe: (tf: Timeframe) => void;
  showEma20: boolean;
  setShowEma20: (v: boolean) => void;
  showEma50: boolean;
  setShowEma50: (v: boolean) => void;
  showEma200: boolean;
  setShowEma200: (v: boolean) => void;
  showVolume: boolean;
  setShowVolume: (v: boolean) => void;
}

export const TimeframeBar: React.FC<TimeframeBarProps> = ({
  activeTimeframe,
  onSelectTimeframe,
  showEma20,
  setShowEma20,
  showEma50,
  setShowEma50,
  showEma200,
  setShowEma200,
  showVolume,
  setShowVolume,
}) => {
  const timeframes: { id: Timeframe; label: string }[] = [
    { id: '1m', label: '1m' },
    { id: '5m', label: '5m' },
    { id: '15m', label: '15m' },
    { id: '1h', label: '1h' },
    { id: '1d', label: '1D' },
  ];

  return (
    <div className="bg-white border border-border rounded-xl p-2.5 shadow-sm flex flex-wrap items-center justify-between gap-3 select-none">
      {/* Timeframes */}
      <div className="flex items-center space-x-1">
        <span className="text-3xs font-bold uppercase text-text-secondary mr-1">Timeframe</span>
        {timeframes.map((tf) => (
          <button
            key={tf.id}
            onClick={() => onSelectTimeframe(tf.id)}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
              activeTimeframe === tf.id
                ? 'bg-primary text-white shadow-xs'
                : 'bg-slate-100 text-text-secondary hover:bg-slate-200 hover:text-text-primary'
            }`}
          >
            {tf.label}
          </button>
        ))}
      </div>

      {/* Overlays & Indicators Toggles */}
      <div className="flex items-center space-x-2 text-2xs">
        <div className="flex items-center space-x-1 text-text-secondary mr-1">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="font-semibold">Indicators:</span>
        </div>

        <button
          onClick={() => setShowEma20(!showEma20)}
          className={`px-2 py-0.5 rounded border transition font-medium ${
            showEma20
              ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold'
              : 'bg-slate-50 border-border text-text-secondary opacity-60'
          }`}
        >
          EMA 20
        </button>

        <button
          onClick={() => setShowEma50(!showEma50)}
          className={`px-2 py-0.5 rounded border transition font-medium ${
            showEma50
              ? 'bg-amber-50 border-amber-300 text-amber-700 font-bold'
              : 'bg-slate-50 border-border text-text-secondary opacity-60'
          }`}
        >
          EMA 50
        </button>

        <button
          onClick={() => setShowEma200(!showEma200)}
          className={`px-2 py-0.5 rounded border transition font-medium ${
            showEma200
              ? 'bg-purple-50 border-purple-300 text-purple-700 font-bold'
              : 'bg-slate-50 border-border text-text-secondary opacity-60'
          }`}
        >
          EMA 200
        </button>

        <button
          onClick={() => setShowVolume(!showVolume)}
          className={`px-2 py-0.5 rounded border transition font-medium ${
            showVolume
              ? 'bg-slate-100 border-slate-300 text-text-primary font-bold'
              : 'bg-slate-50 border-border text-text-secondary opacity-60'
          }`}
        >
          Volume
        </button>
      </div>
    </div>
  );
};
