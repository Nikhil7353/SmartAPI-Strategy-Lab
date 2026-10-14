import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  BookOpen,
  Send,
  AlertCircle,
  PlusCircle,
  Clock,
  Trash2,
} from 'lucide-react';
import {
  PaperAccount,
  PaperOrder,
  PaperPosition,
  TradeJournalEntry,
  Instrument,
  PaperOrderType,
  OrderSide,
} from '../../types';
import {
  fetchPaperAccount,
  fetchPaperPositions,
  fetchPaperOrders,
  fetchTradeJournal,
  placePaperOrder,
} from '../../api/client';

interface PaperTradingDashboardProps {
  activeInstrument: Instrument;
  currentLtp: number;
}

export const PaperTradingDashboard: React.FC<PaperTradingDashboardProps> = ({
  activeInstrument,
  currentLtp,
}) => {
  const [account, setAccount] = useState<PaperAccount | null>(null);
  const [positions, setPositions] = useState<PaperPosition[]>([]);
  const [orders, setOrders] = useState<PaperOrder[]>([]);
  const [journal, setJournal] = useState<TradeJournalEntry[]>([]);

  // Order Ticket Form
  const [side, setSide] = useState<OrderSide>('BUY');
  const [orderType, setOrderType] = useState<PaperOrderType>('MARKET');
  const [quantity, setQuantity] = useState<number>(activeInstrument.lotSize || 25);
  const [limitPrice, setLimitPrice] = useState<number>(currentLtp || 2850);
  const [stopLoss, setStopLoss] = useState<number>(
    side === 'BUY' ? +(currentLtp * 0.99).toFixed(1) : +(currentLtp * 1.01).toFixed(1)
  );
  const [target, setTarget] = useState<number>(
    side === 'BUY' ? +(currentLtp * 1.02).toFixed(1) : +(currentLtp * 0.98).toFixed(1)
  );
  const [activeTab, setActiveTab] = useState<'positions' | 'orders' | 'journal'>('positions');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (currentLtp > 0) {
      setLimitPrice(currentLtp);
      setStopLoss(side === 'BUY' ? +(currentLtp * 0.99).toFixed(1) : +(currentLtp * 1.01).toFixed(1));
      setTarget(side === 'BUY' ? +(currentLtp * 1.02).toFixed(1) : +(currentLtp * 0.98).toFixed(1));
    }
  }, [currentLtp, side]);

  const loadData = async () => {
    const [acc, pos, ord, jrn] = await Promise.all([
      fetchPaperAccount(),
      fetchPaperPositions(),
      fetchPaperOrders(),
      fetchTradeJournal(),
    ]);
    setAccount(acc);
    setPositions(pos);
    setOrders(ord);
    setJournal(jrn);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const execPrice = orderType === 'MARKET' ? currentLtp : limitPrice;

    const newOrder = await placePaperOrder({
      symbol: activeInstrument.symbol,
      token: activeInstrument.token,
      side,
      orderType,
      price: execPrice,
      quantity,
      stopLoss,
      target,
      remarks: 'Simulated Order Ticket Execution',
    });

    // Update positions
    const existingIndex = positions.findIndex((p) => p.symbol === activeInstrument.symbol);
    let updatedPositions = [...positions];

    if (existingIndex >= 0) {
      const existing = updatedPositions[existingIndex];
      if (existing.side === side) {
        // Add to existing position
        const totalQty = existing.quantity + quantity;
        const avg = (existing.averagePrice * existing.quantity + execPrice * quantity) / totalQty;
        updatedPositions[existingIndex] = {
          ...existing,
          quantity: totalQty,
          averagePrice: +avg.toFixed(2),
        };
      } else {
        // Reduce / close position
        const remainingQty = existing.quantity - quantity;
        if (remainingQty <= 0) {
          // Closed position -> write to journal
          const pnl =
            existing.side === 'BUY'
              ? (execPrice - existing.averagePrice) * existing.quantity
              : (existing.averagePrice - execPrice) * existing.quantity;

          const journalEntry: TradeJournalEntry = {
            id: `JRN-${Date.now().toString().slice(-4)}`,
            symbol: existing.symbol,
            side: existing.side,
            entryPrice: existing.averagePrice,
            exitPrice: execPrice,
            quantity: existing.quantity,
            pnl: +pnl.toFixed(2),
            strategyUsed: 'Manual Paper Square-Off',
            entryReason: 'Discretionary Paper Setup',
            exitReason: 'Order ticket exit / counter-order',
            executedAt: new Date().toLocaleTimeString(),
            durationMinutes: 42,
          };
          setJournal([journalEntry, ...journal]);
          updatedPositions.splice(existingIndex, 1);
        } else {
          updatedPositions[existingIndex] = {
            ...existing,
            quantity: remainingQty,
          };
        }
      }
    } else {
      // New position
      const pnl = 0;
      updatedPositions.push({
        id: `POS-${Date.now().toString().slice(-4)}`,
        symbol: activeInstrument.symbol,
        token: activeInstrument.token,
        side,
        quantity,
        averagePrice: execPrice,
        ltp: currentLtp,
        unrealizedPnl: pnl,
        pnlPercent: 0,
        stopLoss,
        target,
        entryTime: new Date().toLocaleTimeString(),
      });
    }

    setPositions(updatedPositions);
    setOrders([newOrder, ...orders]);
    localStorage.setItem('nik_paper_positions', JSON.stringify(updatedPositions));
  };

  const handleSquareOff = (posId: string) => {
    const pos = positions.find((p) => p.id === posId);
    if (!pos) return;

    const exitPrice = currentLtp > 0 ? currentLtp : pos.averagePrice * 1.01;
    const pnl =
      pos.side === 'BUY'
        ? (exitPrice - pos.averagePrice) * pos.quantity
        : (pos.averagePrice - exitPrice) * pos.quantity;

    const newJournal: TradeJournalEntry = {
      id: `JRN-${Date.now().toString().slice(-4)}`,
      symbol: pos.symbol,
      side: pos.side,
      entryPrice: pos.averagePrice,
      exitPrice,
      quantity: pos.quantity,
      pnl: +pnl.toFixed(2),
      strategyUsed: 'One-Click Square-Off',
      entryReason: 'Paper Execution',
      exitReason: 'Manual Square-Off',
      executedAt: new Date().toLocaleTimeString(),
      durationMinutes: 35,
    };

    const remaining = positions.filter((p) => p.id !== posId);
    setPositions(remaining);
    setJournal([newJournal, ...journal]);
    localStorage.setItem('nik_paper_positions', JSON.stringify(remaining));
  };

  return (
    <div className="space-y-6">
      {/* Header with Strict Sandbox Isolation Guardrail */}
      <div className="bg-white border border-border rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-primary">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">
                Paper Trading Portfolio & Order Simulator
              </h2>
              <p className="text-xs text-text-secondary">
                100% Isolated Virtual Execution Sandbox — Zero live broker order placement risk
              </p>
            </div>
          </div>

          {/* Strict Safety Badge */}
          <div className="flex items-center space-x-2">
            <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Simulated Orders Only</span>
            </span>
          </div>
        </div>

        {/* Paper Account Balances */}
        {account && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="bg-slate-50 p-3 rounded-lg border border-border">
              <span className="text-3xs uppercase text-text-secondary block font-bold font-sans">
                Virtual Capital
              </span>
              <span className="text-sm font-bold text-text-primary">
                ₹{account.virtualCapital.toLocaleString()}
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-border">
              <span className="text-3xs uppercase text-text-secondary block font-bold font-sans">
                Available Margin
              </span>
              <span className="text-sm font-bold text-primary">
                ₹{account.availableMargin.toLocaleString()}
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-border">
              <span className="text-3xs uppercase text-text-secondary block font-bold font-sans">
                Realized P&L
              </span>
              <span
                className={`text-sm font-bold ${
                  account.realizedPnl >= 0 ? 'text-bull' : 'text-bear'
                }`}
              >
                {account.realizedPnl >= 0 ? '+' : ''}₹{account.realizedPnl.toLocaleString()}
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-border">
              <span className="text-3xs uppercase text-text-secondary block font-bold font-sans">
                Active Positions
              </span>
              <span className="text-sm font-bold text-text-primary">{positions.length} Open</span>
            </div>
          </div>
        )}
      </div>

      {/* Grid: Order Ticket on Left, Positions & History on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Simulated Order Entry Ticket */}
        <div className="bg-white border border-border rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
              Paper Order Ticket
            </h3>
            <span className="text-2xs font-mono font-bold text-text-primary">
              {activeInstrument.symbol}
            </span>
          </div>

          <form onSubmit={handlePlaceOrder} className="space-y-4 text-xs">
            {/* Buy / Sell Toggle Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSide('BUY')}
                className={`py-2 rounded-lg font-bold text-xs transition ${
                  side === 'BUY'
                    ? 'bg-bull text-white shadow-xs'
                    : 'bg-slate-100 text-text-secondary hover:bg-slate-200'
                }`}
              >
                BUY / LONG
              </button>
              <button
                type="button"
                onClick={() => setSide('SELL')}
                className={`py-2 rounded-lg font-bold text-xs transition ${
                  side === 'SELL'
                    ? 'bg-bear text-white shadow-xs'
                    : 'bg-slate-100 text-text-secondary hover:bg-slate-200'
                }`}
              >
                SELL / SHORT
              </button>
            </div>

            {/* Order Type */}
            <div>
              <label className="block text-text-secondary font-medium mb-1">Order Type</label>
              <div className="grid grid-cols-3 gap-2">
                {(['MARKET', 'LIMIT', 'SL'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setOrderType(t)}
                    className={`py-1.5 rounded border text-2xs font-semibold ${
                      orderType === t
                        ? 'border-primary bg-blue-50 text-primary'
                        : 'border-border bg-slate-50 text-text-secondary'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <div className="flex justify-between text-text-secondary mb-1">
                <span>Quantity</span>
                <span className="text-3xs">Lot: {activeInstrument.lotSize}</span>
              </div>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-slate-50 border border-border rounded-lg font-mono text-text-primary"
              />
            </div>

            {/* Price (if limit) */}
            {orderType !== 'MARKET' && (
              <div>
                <label className="block text-text-secondary mb-1">Limit Price (₹)</label>
                <input
                  type="number"
                  step="0.05"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-border rounded-lg font-mono text-text-primary"
                />
              </div>
            )}

            {/* Stop Loss & Target Inputs */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-bear text-2xs font-medium mb-1">Stop Loss (₹)</label>
                <input
                  type="number"
                  step="0.1"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-border rounded-lg font-mono text-xs text-bear font-bold"
                />
              </div>
              <div>
                <label className="block text-bull text-2xs font-medium mb-1">Target (₹)</label>
                <input
                  type="number"
                  step="0.1"
                  value={target}
                  onChange={(e) => setTarget(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-border rounded-lg font-mono text-xs text-bull font-bold"
                />
              </div>
            </div>

            {/* Margin Requirement Estimate */}
            <div className="p-2.5 bg-slate-50 border border-border rounded-lg flex justify-between text-2xs font-mono">
              <span className="text-text-secondary">Req. Margin:</span>
              <span className="font-bold text-text-primary">
                ₹{((orderType === 'MARKET' ? currentLtp : limitPrice) * quantity * 0.2).toFixed(2)} (5x Intraday)
              </span>
            </div>

            {/* Place Order Button */}
            <button
              type="submit"
              className={`w-full py-2.5 rounded-lg text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-sm transition ${
                side === 'BUY' ? 'bg-bull hover:bg-bull-dark' : 'bg-bear hover:bg-bear-dark'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Simulate {side} Order</span>
            </button>
          </form>
        </div>

        {/* Right 2 Columns: Positions, Orders, and Journal Tabs */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tabs Bar */}
          <div className="flex items-center space-x-2 border-b border-border pb-2 text-xs">
            <button
              onClick={() => setActiveTab('positions')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeTab === 'positions'
                  ? 'bg-slate-900 text-white'
                  : 'text-text-secondary hover:bg-slate-100'
              }`}
            >
              Open Positions ({positions.length})
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeTab === 'orders'
                  ? 'bg-slate-900 text-white'
                  : 'text-text-secondary hover:bg-slate-100'
              }`}
            >
              Order Book ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab('journal')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeTab === 'journal'
                  ? 'bg-slate-900 text-white'
                  : 'text-text-secondary hover:bg-slate-100'
              }`}
            >
              Trade Journal ({journal.length})
            </button>
          </div>

          {/* Tab 1: Positions Table */}
          {activeTab === 'positions' && (
            <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
              {positions.length === 0 ? (
                <div className="p-8 text-center text-xs text-text-secondary">
                  No active open paper positions. Submit a simulated order above.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-text-secondary border-b border-border font-semibold text-2xs">
                      <tr>
                        <th className="py-2.5 px-4">Symbol</th>
                        <th className="py-2.5 px-4">Side</th>
                        <th className="py-2.5 px-4">Qty</th>
                        <th className="py-2.5 px-4">Avg Price</th>
                        <th className="py-2.5 px-4">LTP</th>
                        <th className="py-2.5 px-4">SL / Target</th>
                        <th className="py-2.5 px-4">P&L</th>
                        <th className="py-2.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-2xs">
                      {positions.map((pos) => {
                        const ltp = currentLtp && pos.symbol === activeInstrument.symbol ? currentLtp : pos.ltp;
                        const pnl =
                          pos.side === 'BUY'
                            ? (ltp - pos.averagePrice) * pos.quantity
                            : (pos.averagePrice - ltp) * pos.quantity;
                        const isWin = pnl >= 0;

                        return (
                          <tr key={pos.id} className="hover:bg-slate-50 transition">
                            <td className="py-2.5 px-4 font-bold text-text-primary">{pos.symbol}</td>
                            <td className="py-2.5 px-4">
                              <span
                                className={`px-2 py-0.5 rounded font-bold text-3xs ${
                                  pos.side === 'BUY'
                                    ? 'bg-emerald-50 text-bull border border-emerald-200'
                                    : 'bg-red-50 text-bear border border-red-200'
                                }`}
                              >
                                {pos.side}
                              </span>
                            </td>
                            <td className="py-2.5 px-4">{pos.quantity}</td>
                            <td className="py-2.5 px-4">₹{pos.averagePrice.toFixed(2)}</td>
                            <td className="py-2.5 px-4 font-bold">₹{ltp.toFixed(2)}</td>
                            <td className="py-2.5 px-4 text-3xs">
                              <span className="text-bear">SL: ₹{pos.stopLoss}</span>
                              <br />
                              <span className="text-bull">TP: ₹{pos.target}</span>
                            </td>
                            <td
                              className={`py-2.5 px-4 font-bold ${
                                isWin ? 'text-bull' : 'text-bear'
                              }`}
                            >
                              {isWin ? '+' : ''}₹{pnl.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              <button
                                onClick={() => handleSquareOff(pos.id)}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-text-primary rounded font-semibold text-3xs border border-border transition"
                              >
                                Square Off
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Orders Table */}
          {activeTab === 'orders' && (
            <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto max-h-80 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-text-secondary border-b border-border font-semibold text-2xs">
                    <tr>
                      <th className="py-2.5 px-4">Order ID</th>
                      <th className="py-2.5 px-4">Time</th>
                      <th className="py-2.5 px-4">Symbol</th>
                      <th className="py-2.5 px-4">Type</th>
                      <th className="py-2.5 px-4">Side</th>
                      <th className="py-2.5 px-4">Qty</th>
                      <th className="py-2.5 px-4">Price</th>
                      <th className="py-2.5 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-2xs">
                    {orders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-4 font-bold text-text-primary">{ord.id}</td>
                        <td className="py-2.5 px-4 text-text-secondary">{ord.placedAt}</td>
                        <td className="py-2.5 px-4 font-bold text-text-primary">{ord.symbol}</td>
                        <td className="py-2.5 px-4">{ord.orderType}</td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`px-1.5 py-0.5 rounded text-3xs font-bold ${
                              ord.side === 'BUY'
                                ? 'bg-emerald-50 text-bull'
                                : 'bg-red-50 text-bear'
                            }`}
                          >
                            {ord.side}
                          </span>
                        </td>
                        <td className="py-2.5 px-4">{ord.quantity}</td>
                        <td className="py-2.5 px-4">₹{ord.price.toFixed(2)}</td>
                        <td className="py-2.5 px-4">
                          <span className="px-2 py-0.5 rounded text-3xs font-semibold bg-emerald-100 text-emerald-800">
                            {ord.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 3: Trade Journal */}
          {activeTab === 'journal' && (
            <div className="bg-white border border-border rounded-xl shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center space-x-1.5">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <h4 className="font-bold text-xs uppercase tracking-wider text-text-primary">
                    Simulated Trade Journal with Contextual Rationales
                  </h4>
                </div>
              </div>

              <div className="space-y-3">
                {journal.map((jrn) => {
                  const isProfit = jrn.pnl >= 0;
                  return (
                    <div
                      key={jrn.id}
                      className="p-3.5 bg-slate-50 border border-border rounded-lg space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-text-primary">{jrn.symbol}</span>
                          <span
                            className={`text-3xs font-bold px-1.5 py-0.5 rounded ${
                              jrn.side === 'BUY'
                                ? 'bg-emerald-100 text-bull-dark'
                                : 'bg-red-100 text-bear-dark'
                            }`}
                          >
                            {jrn.side}
                          </span>
                          <span className="text-2xs text-text-secondary font-medium">
                            {jrn.strategyUsed}
                          </span>
                        </div>
                        <span
                          className={`font-mono font-bold ${
                            isProfit ? 'text-bull' : 'text-bear'
                          }`}
                        >
                          {isProfit ? '+' : ''}₹{jrn.pnl.toLocaleString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-2xs font-mono text-text-secondary">
                        <div>
                          Entry: <strong className="text-text-primary">₹{jrn.entryPrice}</strong>
                        </div>
                        <div>
                          Exit: <strong className="text-text-primary">₹{jrn.exitPrice}</strong>
                        </div>
                        <div>
                          Qty: <strong className="text-text-primary">{jrn.quantity}</strong>
                        </div>
                        <div>
                          Duration: <strong className="text-text-primary">{jrn.durationMinutes}m</strong>
                        </div>
                      </div>

                      <div className="text-2xs bg-white p-2 rounded border border-slate-200 text-text-secondary space-y-1">
                        <div>
                          <strong className="text-text-primary">Setup Reason:</strong> {jrn.entryReason}
                        </div>
                        <div>
                          <strong className="text-text-primary">Exit Trigger:</strong> {jrn.exitReason}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
