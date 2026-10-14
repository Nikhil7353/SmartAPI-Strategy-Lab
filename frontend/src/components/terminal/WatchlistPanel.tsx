import React, { useState } from 'react';
import { Search, TrendingUp, TrendingDown, Star, Plus } from 'lucide-react';
import { Instrument, Quote } from '../../types';

interface WatchlistPanelProps {
  instruments: Instrument[];
  quotes: Record<string, Quote>;
  selectedToken: string;
  onSelectInstrument: (instrument: Instrument) => void;
  onSearch: (q: string) => void;
}

export const WatchlistPanel: React.FC<WatchlistPanelProps> = ({
  instruments,
  quotes,
  selectedToken,
  onSelectInstrument,
  onSearch,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'INDEX' | 'EQ'>('ALL');

  const filtered = instruments.filter((inst) => {
    const matchesSearch =
      inst.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (filterType === 'INDEX') return inst.instrumentType === 'INDEX';
    if (filterType === 'EQ') return inst.instrumentType === 'EQ';
    return true;
  });

  return (
    <div className="w-80 bg-white border border-border rounded-xl shadow-sm flex flex-col h-full overflow-hidden select-none">
      {/* Header & Search */}
      <div className="p-3 border-b border-border bg-white space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
            <h2 className="font-bold text-xs uppercase tracking-wider text-text-primary">
              Watchlist
            </h2>
          </div>
          <span className="text-2xs font-mono font-medium text-text-secondary bg-slate-100 px-2 py-0.5 rounded-full">
            {filtered.length} Symbols
          </span>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-text-secondary" />
          <input
            type="text"
            placeholder="Search symbol, token or index..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              onSearch(e.target.value);
            }}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1 text-2xs">
          {(['ALL', 'INDEX', 'EQ'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                filterType === type
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-100 text-text-secondary hover:bg-slate-200'
              }`}
            >
              {type === 'ALL' ? 'All' : type === 'INDEX' ? 'Indices' : 'Equities'}
            </button>
          ))}
        </div>
      </div>

      {/* Symbol List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-xs text-text-secondary">
            No instruments match "{searchTerm}"
          </div>
        ) : (
          filtered.map((inst) => {
            const quote = quotes[inst.token];
            const isSelected = selectedToken === inst.token;
            const isPositive = quote ? quote.change >= 0 : true;

            return (
              <div
                key={inst.token}
                onClick={() => onSelectInstrument(inst)}
                className={`p-3 flex items-center justify-between cursor-pointer transition ${
                  isSelected
                    ? 'bg-blue-50/70 border-l-4 border-primary'
                    : 'hover:bg-slate-50 border-l-4 border-transparent'
                }`}
              >
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-xs text-text-primary">{inst.symbol}</span>
                    <span className="text-3xs px-1.5 py-0.2 rounded font-semibold bg-slate-100 text-slate-500">
                      {inst.exchange}
                    </span>
                  </div>
                  <div className="text-2xs text-text-secondary truncate max-w-[130px]">
                    {inst.name}
                  </div>
                </div>

                <div className="text-right">
                  {quote ? (
                    <>
                      <div className="font-mono font-bold text-xs text-text-primary">
                        ₹{quote.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <div
                        className={`text-2xs font-mono font-semibold flex items-center justify-end space-x-0.5 ${
                          isPositive ? 'text-bull' : 'text-bear'
                        }`}
                      >
                        {isPositive ? (
                          <TrendingUp className="w-3 h-3 stroke-[2.5]" />
                        ) : (
                          <TrendingDown className="w-3 h-3 stroke-[2.5]" />
                        )}
                        <span>
                          {isPositive ? '+' : ''}
                          {quote.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    </>
                  ) : (
                    <span className="text-2xs text-text-secondary">--</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Token Add Footer */}
      <div className="p-2 border-t border-border bg-slate-50 text-center">
        <span className="text-3xs text-text-secondary">
          Angel One SmartAPI contract master synced
        </span>
      </div>
    </div>
  );
};
