import React from 'react';
import { Activity, ShieldCheck, AlertCircle, RefreshCw, KeyRound, Wifi, Database } from 'lucide-react';
import { SmartApiAuthStatus, Quote } from '../../types';

interface NavbarProps {
  authStatus: SmartApiAuthStatus;
  activeQuote?: Quote;
  onOpenSettings: () => void;
  onRefreshFeed: () => void;
  isRefreshing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  authStatus,
  activeQuote,
  onOpenSettings,
  onRefreshFeed,
  isRefreshing,
}) => {
  const [istTime, setIstTime] = React.useState('');

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setIstTime(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' IST'
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const isLive = authStatus.feedStatus === 'CONNECTED' && authStatus.connected;

  return (
    <header className="h-16 bg-white border-b border-border px-6 flex items-center justify-between sticky top-0 z-30 select-none shadow-sm">
      {/* Brand & Market Status */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-sm font-bold text-sm tracking-tight">
            NiK
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base tracking-tight text-text-primary">NiK Trade Desk</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                Research & Paper
              </span>
            </div>
            <p className="text-xs text-text-secondary leading-none">Angel One SmartAPI Engine</p>
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="h-6 w-px bg-border hidden md:block" />

        {/* Active Instrument Mini-Banner */}
        {activeQuote && (
          <div className="hidden lg:flex items-center space-x-3 text-xs bg-slate-50 border border-border px-3 py-1.5 rounded-lg">
            <span className="font-bold text-text-primary">{activeQuote.symbol}</span>
            <span className="font-mono font-semibold text-text-primary">
              ₹{activeQuote.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span
              className={`font-mono font-medium px-1.5 py-0.5 rounded text-2xs ${
                activeQuote.change >= 0
                  ? 'bg-bull-light text-bull-dark'
                  : 'bg-bear-light text-bear-dark'
              }`}
            >
              {activeQuote.change >= 0 ? '+' : ''}
              {activeQuote.change.toFixed(2)} ({activeQuote.changePercent.toFixed(2)}%)
            </span>
          </div>
        )}
      </div>

      {/* Right Controls & Telemetry */}
      <div className="flex items-center space-x-3 text-xs">
        {/* Data Provenance Badge */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md border font-medium bg-slate-50 border-border text-text-secondary">
          {isLive ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-bull animate-pulse" />
              <span className="text-text-primary font-semibold">SmartAPI Live</span>
            </>
          ) : (
            <>
              <Database className="w-3.5 h-3.5 text-warn" />
              <span className="text-warn-dark font-semibold">Dev Simulation</span>
              <span className="text-2xs bg-amber-100 text-amber-800 px-1 rounded">Labeled</span>
            </>
          )}
        </div>

        {/* IST Clock */}
        <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-border font-mono text-text-secondary">
          <Activity className="w-3.5 h-3.5 text-primary" />
          <span>{istTime}</span>
        </div>

        {/* Refresh Feed Button */}
        <button
          onClick={onRefreshFeed}
          title="Refresh market quotes"
          className="p-1.5 rounded-md hover:bg-slate-100 text-text-secondary hover:text-text-primary border border-transparent hover:border-border transition"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
        </button>

        {/* SmartAPI Auth Button / Status Pill */}
        <button
          onClick={onOpenSettings}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border font-medium transition shadow-sm ${
            isLive
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              : 'bg-white text-text-primary border-border hover:bg-slate-50'
          }`}
        >
          {isLive ? (
            <>
              <ShieldCheck className="w-4 h-4 text-bull" />
              <span>Connected: {authStatus.clientCode || 'SmartAPI'}</span>
            </>
          ) : (
            <>
              <KeyRound className="w-4 h-4 text-primary" />
              <span>Connect SmartAPI</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
