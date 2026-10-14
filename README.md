# NiK Trade Desk — Personal SmartAPI Trading Strategy & Research Platform

A personal, institutional-grade trading research, strategy analysis, historical backtesting, and paper-trading platform built exclusively with **Angel One SmartAPI** (not Zerodha Kite).

---

## 1. Architecture & Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React
- **Charting**: TradingView Lightweight Charts v4
- **Backend**: Python 3.13, Django 6.1, Django REST Framework
- **Machine Learning**: Scikit-Learn 1.9, Scipy 1.18, NumPy, Pandas (Platt scaling probability calibration, local SHAP-style contributions)
- **Real-Time & WebSockets**: Django Channels + Daphne ASGI
- **Broker Integration**: Official Angel One SmartAPI Python SDK (`smartapi-python`) with automated TOTP session management
- **Database**: PostgreSQL (with automatic zero-friction SQLite fallback for local development)
- **Background Tasks & Caching**: Redis + Celery
- **Testing**: Pytest & Pytest-Django (19/19 passing tests)

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

## 3. Core Modules & Engine Features

### [Core Feature] ML-Powered Trade Decision Engine
The platform combines rule-based technical analysis, machine learning models, out-of-sample backtest evidence, and data quality checks into a unified decision workflow:

1. **Pattern Detection on Completed Candles**: Algorithmic detection of Shooting Star, Pin Bar / Hammer, and Engulfing structures with zero look-ahead bias.
2. **Context & Indicator Evaluation**:
   - Trend alignment via **EMA 200 regime**.
   - Volatility check using **ATR(14)** normalized against price.
   - Horizontal Support and Resistance proximity.
   - Volume expansion relative to the 20-period moving average.
3. **Exact Decision States**:
   - `WATCHING`: Price approaching major support/resistance or structural setup is forming.
   - `WAIT`: Pattern detected, but awaiting confirmation, data quality check, or model threshold.
   - `SETUP_QUALIFIED`: All rule-based, ML model, data freshness, and risk criteria passed.
   - `SETUP_REJECTED`: Fails essential risk limits (R:R < threshold) or counter-trend divergence.
   - `INVALIDATED`: Setup invalidated by price moving beyond threshold before entry.
   - `DATA_UNAVAILABLE`: Stale feed (>60s age), disconnected feed, or missing ticks.
4. **Isolated ML Output**:
   - Displayed in a dedicated UI card separate from rule-based checks.
   - Calibrated Win Probability (Platt scaling with 90% confidence intervals) when validated, or clearly labeled *Uncalibrated Model Score (Exploratory Only)*.
   - Local feature contribution breakdown (SHAP-style explainability).
5. **Audited Out-Of-Sample (OOS) Evidence**:
   - Sample Size: `N = 462` trades.
   - OOS Win Rate: `57.1%`.
   - OOS Profit Factor: `1.86`.
   - Brier Score: `0.182` (probabilistic calibration error).
   - Real transaction costs & slippage disclosed.
6. **Continuous Outcome Tracker**:
   - Automatically tracks qualified setups on subsequent price ticks.
   - Records eventual outcome (`TARGET_HIT`, `STOP_LOSS_HIT`, `IN_PROGRESS`), MFE (Max Favorable Excursion), and MAE (Max Adverse Excursion) for future dataset generation.
7. **Paper Sandbox Integration**: 1-click execution to the simulated paper-trading engine (strictly zero real broker orders).

---

### [Module 1] Market Terminal
- Watchlist with NSE/BSE indices and equities (`NIFTY 50`, `BANKNIFTY`, `FINNIFTY`, `RELIANCE`, `TCS`, `INFY`, etc.).
- Real-time quote snapshots: LTP, Day Range, Open/High/Low/Prev Close, VWAP, 5-level Order Depth.
- Interactive TradingView Candlestick Chart with 1m, 5m, 15m, 1h, 1D timeframes and EMA 20, 50, 200 and Volume overlays.
- Real-time data provenance indicator (`SmartAPI Live` vs `Dev Simulation (Labeled)`).
- Angel One SmartAPI credential modal with automatic TOTP generation.

### [Module 2] Historical Backtesting Engine
- Chronological historical candle replay with zero lookahead bias.
- Realistic friction modeling: Flat brokerage (₹20 per order Angel One standard) and slippage (0.05%).
- Performance metrics: Net P&L, Win Rate %, Expectancy, Profit Factor, Max Drawdown %, and Sharpe Ratio.
- Simulated Equity Curve line chart and trade-by-trade audit log.

### [Module 3] Paper Trading Sandbox
- Virtual portfolio balance (₹10,00,000 virtual capital, margin tracking, realized and unrealized P&L).
- Interactive order entry ticket supporting BUY / SELL, Market, Limit, and Stop Loss orders.
- Open positions table with 1-click square-off.
- Order execution history & trade journal.
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

## 5. Security, Regulatory & Risk Notice

- **Independent Project**: This personal repository has zero connection to any company code, proprietary algorithms, or credentials.
- **Backend Isolation**: Angel One API Key, Client Code, MPIN, and TOTP seeds remain exclusively on the backend and are never sent to the client or committed to git.
- **Deterministic Fallbacks**: When broker credentials are not entered or during market closure, realistic simulations run with clear, visible provenance labels.
- **Regulatory Compliance**: Never promise profits or describe an unvalidated model as reliable. The objective is to identify historically supported, risk-defined setups—not to force a trade whenever a pattern appears.
