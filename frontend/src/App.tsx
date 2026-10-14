import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, ActiveTab } from './components/layout/Sidebar';
import { WatchlistPanel } from './components/terminal/WatchlistPanel';
import { TradingViewChart } from './components/terminal/TradingViewChart';
import { MarketDepthMini } from './components/terminal/MarketDepthMini';
import { TimeframeBar } from './components/terminal/TimeframeBar';
import { StrategyStudio } from './components/strategy/StrategyStudio';
import { BacktestStudio } from './components/backtesting/BacktestStudio';
import { PaperTradingDashboard } from './components/papertrading/PaperTradingDashboard';
import { SmartApiSettingsModal } from './components/settings/SmartApiSettingsModal';

import {
  Instrument,
  Quote,
  Candle,
  SmartApiAuthStatus,
  Timeframe,
  StrategySignal,
} from './types';
import {
  DEFAULT_WATCHLIST,
  fetchAuthStatus,
  fetchQuotes,
  fetchCandles,
  fetchStrategySignals,
  searchInstruments,
} from './api/client';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('terminal');
  const [instruments, setInstruments] = useState<Instrument[]>(DEFAULT_WATCHLIST);
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument>(DEFAULT_WATCHLIST[0]);
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [candles, setCandles] = useState<Candle[]>([]);
  const [timeframe, setTimeframe] = useState<Timeframe>('15m');
  const [authStatus, setAuthStatus] = useState<SmartApiAuthStatus>({
    connected: false,
    broker: 'Angel One SmartAPI',
    feedStatus: 'SIMULATION',
  });
  const [signals, setSignals] = useState<StrategySignal[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Indicators toggle state
  const [showEma20, setShowEma20] = useState(true);
  const [showEma50, setShowEma50] = useState(true);
  const [showEma200, setShowEma200] = useState(true);
  const [showVolume, setShowVolume] = useState(true);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Update quotes and candles when instrument or timeframe changes
  useEffect(() => {
    loadCandlesForSelected();
    loadSignals();
  }, [selectedInstrument, timeframe]);

  // Periodic polling for quotes
  useEffect(() => {
    const timer = setInterval(async () => {
      const q = await fetchQuotes();
      setQuotes(q);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const loadInitialData = async () => {
    setIsRefreshing(true);
    try {
      const [status, initialQuotes] = await Promise.all([
        fetchAuthStatus(),
        fetchQuotes(),
      ]);
      setAuthStatus(status);
      setQuotes(initialQuotes);
      await loadCandlesForSelected();
      await loadSignals();
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadCandlesForSelected = async () => {
    const c = await fetchCandles(
      selectedInstrument.symbol,
      selectedInstrument.token,
      timeframe,
      selectedInstrument.exchange
    );
    setCandles(c);
  };

  const loadSignals = async () => {
    const s = await fetchStrategySignals(selectedInstrument.symbol, timeframe);
    setSignals(s);
  };

  const handleSearch = async (query: string) => {
    if (!query) {
      setInstruments(DEFAULT_WATCHLIST);
      return;
    }
    const results = await searchInstruments(query);
    if (results.length > 0) {
      setInstruments(results);
    }
  };

  const currentQuote = quotes[selectedInstrument.token];
  const activeLtp = currentQuote ? currentQuote.ltp : 0;

  return (
    <div className="flex flex-col min-h-screen bg-background text-text-primary">
      {/* Strict Light Theme Header */}
      <Navbar
        authStatus={authStatus}
        activeQuote={currentQuote}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onRefreshFeed={loadInitialData}
        isRefreshing={isRefreshing}
      />

      {/* Main Body Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            if (tab === 'settings') {
              setIsSettingsOpen(true);
            } else {
              setActiveTab(tab);
            }
          }}
        />

        {/* Content Area */}
        <main className="flex-1 p-5 overflow-y-auto space-y-4">
          {activeTab === 'terminal' && (
            <div className="flex flex-col gap-4 h-full">
              {/* Timeframe & Overlay Controls */}
              <TimeframeBar
                activeTimeframe={timeframe}
                onSelectTimeframe={setTimeframe}
                showEma20={showEma20}
                setShowEma20={setShowEma20}
                showEma50={showEma50}
                setShowEma50={setShowEma50}
                showEma200={showEma200}
                setShowEma200={setShowEma200}
                showVolume={showVolume}
                setShowVolume={setShowVolume}
              />

              {/* Terminal Workspace: Watchlist, Chart, Depth */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 flex-1 min-h-[580px]">
                {/* Watchlist Column */}
                <div className="xl:col-span-3 h-full min-h-[380px]">
                  <WatchlistPanel
                    instruments={instruments}
                    quotes={quotes}
                    selectedToken={selectedInstrument.token}
                    onSelectInstrument={setSelectedInstrument}
                    onSearch={handleSearch}
                  />
                </div>

                {/* Main Interactive Lightweight Chart */}
                <div className="xl:col-span-6 h-full min-h-[460px]">
                  <TradingViewChart
                    candles={candles}
                    symbol={selectedInstrument.symbol}
                    timeframe={timeframe}
                    showEma20={showEma20}
                    showEma50={showEma50}
                    showEma200={showEma200}
                    showVolume={showVolume}
                  />
                </div>

                {/* Market Depth Column */}
                <div className="xl:col-span-3 h-full min-h-[380px]">
                  <MarketDepthMini quote={currentQuote} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'strategy' && (
            <StrategyStudio
              symbol={selectedInstrument.symbol}
              timeframe={timeframe}
              signals={signals}
              onExecutePaperOrder={(sig) => {
                setActiveTab('paper');
              }}
            />
          )}

          {activeTab === 'backtest' && (
            <BacktestStudio currentSymbol={selectedInstrument.symbol} />
          )}

          {activeTab === 'paper' && (
            <PaperTradingDashboard
              activeInstrument={selectedInstrument}
              currentLtp={activeLtp}
            />
          )}
        </main>
      </div>

      {/* Angel One SmartAPI Modal */}
      <SmartApiSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        authStatus={authStatus}
        onCredentialsUpdated={loadInitialData}
      />
    </div>
  );
};

export default App;
