import React from 'react';
import { Quote } from '../../types';

interface MarketDepthMiniProps {
  quote?: Quote;
}

export const MarketDepthMini: React.FC<MarketDepthMiniProps> = ({ quote }) => {
  if (!quote) {
    return (
      <div className="bg-white border border-border rounded-xl p-4 shadow-sm text-center text-xs text-text-secondary">
        Select an instrument to view market depth
      </div>
    );
  }

  const depth = quote.depth || {
    buy: [
      { price: quote.ltp - 0.05, quantity: 450, orders: 4 },
      { price: quote.ltp - 0.1, quantity: 820, orders: 12 },
      { price: quote.ltp - 0.15, quantity: 1540, orders: 18 },
      { price: quote.ltp - 0.2, quantity: 2100, orders: 25 },
      { price: quote.ltp - 0.25, quantity: 3800, orders: 39 },
    ],
    sell: [
      { price: quote.ltp + 0.05, quantity: 510, orders: 6 },
      { price: quote.ltp + 0.1, quantity: 940, orders: 14 },
      { price: quote.ltp + 0.15, quantity: 1210, orders: 15 },
      { price: quote.ltp + 0.2, quantity: 1980, orders: 22 },
      { price: quote.ltp + 0.25, quantity: 2950, orders: 31 },
    ],
  };

  const totalBuyQty = depth.buy.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalSellQty = depth.sell.reduce((acc, curr) => acc + curr.quantity, 0);
  const buyRatio = (totalBuyQty / (totalBuyQty + totalSellQty || 1)) * 100;

  // Day range calculation
  const dayRange = quote.high - quote.low || 1;
  const currentPosPercent = Math.min(
    100,
    Math.max(0, ((quote.ltp - quote.low) / dayRange) * 100)
  );

  return (
    <div className="bg-white border border-border rounded-xl p-4 shadow-sm space-y-4 select-none">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <h3 className="font-bold text-xs uppercase tracking-wider text-text-primary">
          Market Depth & Stats
        </h3>
        <span className="text-3xs font-mono text-text-secondary">5-Level L2 Order Book</span>
      </div>

      {/* L2 Depth Table */}
      <div className="grid grid-cols-2 gap-3 text-2xs">
        {/* Bid Side */}
        <div>
          <div className="flex justify-between font-semibold text-text-secondary pb-1 border-b border-slate-100">
            <span>Orders</span>
            <span>Qty</span>
            <span className="text-bull">Bid</span>
          </div>
          <div className="space-y-1 mt-1 font-mono">
            {depth.buy.map((b, i) => (
              <div key={i} className="flex justify-between items-center py-0.5 relative">
                <div
                  className="absolute right-0 top-0 bottom-0 bg-emerald-50 rounded-sm -z-0"
                  style={{ width: `${(b.quantity / totalBuyQty) * 100}%` }}
                />
                <span className="relative z-10 text-text-secondary text-3xs">{b.orders}</span>
                <span className="relative z-10 text-text-primary">{b.quantity}</span>
                <span className="relative z-10 font-bold text-bull">{b.price.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-1 border-t border-slate-200 flex justify-between font-bold text-text-primary font-mono">
            <span>Total</span>
            <span className="text-bull">{totalBuyQty.toLocaleString()}</span>
          </div>
        </div>

        {/* Ask Side */}
        <div>
          <div className="flex justify-between font-semibold text-text-secondary pb-1 border-b border-slate-100">
            <span className="text-bear">Ask</span>
            <span>Qty</span>
            <span>Orders</span>
          </div>
          <div className="space-y-1 mt-1 font-mono">
            {depth.sell.map((s, i) => (
              <div key={i} className="flex justify-between items-center py-0.5 relative">
                <div
                  className="absolute left-0 top-0 bottom-0 bg-red-50 rounded-sm -z-0"
                  style={{ width: `${(s.quantity / totalSellQty) * 100}%` }}
                />
                <span className="relative z-10 font-bold text-bear">{s.price.toFixed(2)}</span>
                <span className="relative z-10 text-text-primary">{s.quantity}</span>
                <span className="relative z-10 text-text-secondary text-3xs">{s.orders}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-1 border-t border-slate-200 flex justify-between font-bold text-text-primary font-mono">
            <span className="text-bear">{totalSellQty.toLocaleString()}</span>
            <span>Total</span>
          </div>
        </div>
      </div>

      {/* Buy vs Sell Pressure Bar */}
      <div>
        <div className="flex justify-between text-3xs font-semibold text-text-secondary mb-1">
          <span className="text-bull">Buyers: {buyRatio.toFixed(1)}%</span>
          <span className="text-bear">Sellers: {(100 - buyRatio).toFixed(1)}%</span>
        </div>
        <div className="h-1.5 w-full bg-bear-light rounded-full overflow-hidden flex">
          <div className="h-full bg-bull" style={{ width: `${buyRatio}%` }} />
        </div>
      </div>

      {/* Daily Stats Grid */}
      <div className="pt-2 border-t border-border space-y-2">
        <div className="text-3xs font-bold uppercase tracking-wider text-text-secondary">
          Session Statistics
        </div>
        <div className="grid grid-cols-2 gap-2 text-2xs font-mono">
          <div className="bg-slate-50 p-2 rounded border border-border/60">
            <div className="text-text-secondary text-3xs">Open</div>
            <div className="font-bold text-text-primary">₹{quote.open.toFixed(2)}</div>
          </div>
          <div className="bg-slate-50 p-2 rounded border border-border/60">
            <div className="text-text-secondary text-3xs">Prev. Close</div>
            <div className="font-bold text-text-primary">₹{quote.close.toFixed(2)}</div>
          </div>
          <div className="bg-slate-50 p-2 rounded border border-border/60">
            <div className="text-text-secondary text-3xs">VWAP</div>
            <div className="font-bold text-primary">₹{quote.vwap.toFixed(2)}</div>
          </div>
          <div className="bg-slate-50 p-2 rounded border border-border/60">
            <div className="text-text-secondary text-3xs">Volume</div>
            <div className="font-bold text-text-primary">{quote.volume.toLocaleString()}</div>
          </div>
        </div>

        {/* Day Range Bar */}
        <div className="pt-1">
          <div className="flex justify-between text-3xs font-mono text-text-secondary mb-1">
            <span>Low: ₹{quote.low.toFixed(2)}</span>
            <span>High: ₹{quote.high.toFixed(2)}</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full relative overflow-hidden">
            <div
              className="absolute top-0 bottom-0 w-2.5 bg-primary rounded-full shadow-sm"
              style={{ left: `calc(${currentPosPercent}% - 5px)` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
