import React from 'react';
import {
  TrendingUp,
  Cpu,
  History,
  FileSpreadsheet,
  Settings,
  HelpCircle,
  BarChart2,
} from 'lucide-react';

export type ActiveTab = 'terminal' | 'strategy' | 'backtest' | 'paper' | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const navItems = [
    {
      id: 'terminal' as ActiveTab,
      label: 'Market Terminal',
      description: 'Quotes, Charts & Watchlists',
      icon: BarChart2,
      phase: 'Phase 1',
    },
    {
      id: 'strategy' as ActiveTab,
      label: 'Strategy Studio',
      description: 'Shooting Star, Pin Bar & Confluence',
      icon: Cpu,
      phase: 'Phase 2',
    },
    {
      id: 'backtest' as ActiveTab,
      label: 'Backtesting',
      description: 'Historical Replay & Analytics',
      icon: History,
      phase: 'Phase 3',
    },
    {
      id: 'paper' as ActiveTab,
      label: 'Paper Trading',
      description: 'Simulated Execution & Journal',
      icon: FileSpreadsheet,
      phase: 'Phase 4',
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-border flex flex-col justify-between shrink-0 select-none">
      <div className="p-4 space-y-6">
        <div>
          <span className="text-2xs font-bold text-text-secondary uppercase tracking-wider px-3">
            Core Modules
          </span>
          <nav className="mt-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition font-medium ${
                    isActive
                      ? 'bg-primary-light text-primary border border-blue-200'
                      : 'text-text-primary hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-text-secondary'}`} />
                    <div>
                      <div className="text-xs font-semibold leading-none">{item.label}</div>
                      <div className="text-2xs text-text-secondary mt-1">{item.description}</div>
                    </div>
                  </div>
                  <span
                    className={`text-3xs font-semibold px-1.5 py-0.5 rounded ${
                      isActive ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {item.phase}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Strategy Context Pill */}
        <div className="p-3 bg-slate-50 border border-border rounded-lg">
          <div className="flex items-center space-x-2 text-text-secondary text-xs font-semibold mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-bull" />
            <span>Active Strategy Profile</span>
          </div>
          <p className="text-xs font-bold text-text-primary">Shooting Star + Pin Bar Reversal</p>
          <div className="mt-2 flex items-center justify-between text-2xs text-text-secondary">
            <span>Trend Filter: EMA 200</span>
            <span className="text-bull font-semibold">Min R:R 1.5</span>
          </div>
        </div>
      </div>

      {/* Bottom Footer Info */}
      <div className="p-4 border-t border-border space-y-2">
        <button
          onClick={() => onTabChange('settings')}
          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
            activeTab === 'settings'
              ? 'bg-slate-100 text-text-primary font-bold'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-50'
          }`}
        >
          <Settings className="w-4 h-4 text-text-secondary" />
          <span>SmartAPI & System Config</span>
        </button>

        <div className="px-3 py-2 text-2xs text-text-secondary flex items-center justify-between">
          <span>Angel One SDK v1.4</span>
          <span className="font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
            Light Theme Active
          </span>
        </div>
      </div>
    </aside>
  );
};
