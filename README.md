# NiK Trade Desk — Personal SmartAPI Trading Strategy & Research Platform

A personal, institutional-grade trading research, strategy analysis, historical backtesting, and paper-trading platform built exclusively with **Angel One SmartAPI** (not Zerodha Kite).

---

## 1. Architecture & Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React
- **Charting**: TradingView Lightweight Charts v4
- **Backend**: Python 3.13, Django 6.1, Django REST Framework
- **Real-Time & WebSockets**: Django Channels + Daphne ASGI
- **Broker Integration**: Official Angel One SmartAPI Python SDK (`smartapi-python`) with automated TOTP session management
- **Database**: PostgreSQL (with automatic zero-friction SQLite fallback for local development)
- **Background Tasks & Caching**: Redis + Celery
- **Testing**: Pytest & Pytest-Django (13/13 passing tests)

---

## 2. Strict Light Theme Design Specification

The entire platform follows a strict, professional financial analytics **Light Theme**:

- **Main background**: `#F8FAFC`
- **Cards and panels**: `#FFFFFF`
- **Primary text**: `#0F172A`
- **Secondary text**: `#64748B`
- **Borders**: `#E2E8F0`
- **Primary accent**: `#2563EB`
- **Positive / Bull**: `#16A34A`
- **Negative / Bear**: `#DC2626`
- **Warnings**: `#D97706`
- **Candlestick Charts**: Pure white background, subtle `#F1F5F9` gridlines, `#16A34A` bullish candles, `#DC2626` bearish candles.

---

## 3. Product Phases & Features

### Phase 1 — Market Terminal
- Watchlist with NSE/BSE indices and equities (`NIFTY 50`, `BANKNIFTY`, `FINNIFTY`, `RELIANCE`, `TCS`, `INFY`, etc.).
- Real-time quote snapshots: LTP, Day Range, Open/High/Low/Prev Close, VWAP, 5-level Order Depth.
- Interactive TradingView Candlestick Chart with 1m, 5m, 15m, 1h, 1D timeframes and EMA 20, 50, 200 and Volume overlays.
- Real-time data provenance indicator (`SmartAPI Live` vs `Dev Simulation (Labeled)`).
- Angel One SmartAPI credential modal with automatic TOTP generation.

### Phase 2 — Strategy Studio
- Automated detection of high-probability price action patterns: **Shooting Star**, **Pin Bar (Hammer)**, and **Engulfing**.
- Dynamic trend context filter utilizing **EMA 200 regime** (bullish above, bearish below).
- Generates **BUY**, **SELL**, or **WAIT** signals with complete, verifiable analytical rationales.
- Real-time risk management calculations: Entry, Stop-Loss (with ATR buffer), Target 1, Target 2, and Risk-to-Reward ratio.
- Regulatory disclaimer: Analytical signals only, no claim of profitability without out-of-sample testing.

### Phase 3 — Historical Backtesting Engine
- Chronological historical candle replay with zero lookahead bias.
- Realistic friction modeling: Flat brokerage (₹20 per order Angel One standard) and slippage (0.05%).
- Performance metrics: Net P&L, Win Rate %, Expectancy, Profit Factor, Max Drawdown %, and Sharpe Ratio.
- Simulated Equity Curve line chart.
- Trade-by-trade audit log with entry/exit timestamps, fees, and exit triggers.

### Phase 4 — Paper Trading Sandbox
- Virtual portfolio balance (₹10,00,000 virtual capital, margin tracking, realized and unrealized P&L).
- Interactive order entry ticket supporting BUY / SELL, Market, Limit, and Stop Loss orders.
- Open positions table with 1-click square-off.
- Order execution history.
- Trade journal recording entry reasons, exit triggers, and setup duration.
- **Safety Guarantee**: 100% isolated virtual execution engine — never places real orders with the broker.

---

## 4. Setup & Installation

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)

### Backend Setup
1. Open terminal in `backend/`:
   ```bash
   cd backend
   python -m venv venv
   .\venv\Scripts\activate
   pip install -r requirements.txt
   ```
2. Configure environment variables in `.env` (copied from `.env.example`):
   ```ini
   DJANGO_SECRET_KEY=your_secret_key
   USE_SQLITE=True
   ANGEL_API_KEY=your_api_key
   ANGEL_CLIENT_CODE=your_client_code
   ANGEL_PIN=your_pin
   ANGEL_TOTP_SECRET=your_totp_secret
   ```
3. Run migrations:
   ```bash
   python manage.py migrate
   ```
4. Run tests:
   ```bash
   pytest
   ```
5. Start development server:
   ```bash
   python manage.py runserver 8000
   # Or with ASGI / Daphne:
   daphne -p 8000 nik_tradedesk.asgi:application
   ```

### Frontend Setup
1. Open terminal in `frontend/`:
   ```bash
   cd frontend
   npm install
   ```
2. Start Vite development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser.

---

## 5. Security & Isolation

- **Independent Project**: This personal repository has zero connection to any company code, proprietary algorithms, or credentials.
- **Backend Isolation**: Angel One API Key, Client Code, MPIN, and TOTP seeds remain exclusively on the backend and are never sent to the client or committed to git.
- **Deterministic Fallbacks**: When broker credentials are not entered or during market closure, realistic simulations run with clear, visible provenance labels.
