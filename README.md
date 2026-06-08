# Capital Fourge - Where Financial Knowledge Takes Shape.

**Capital Fourge** es un ecosistema financiero de alto rendimiento diseñado para empoderar a las personas a aprender, practicar y dominar la inversión mediante educación y simulaciones realistas del mercado. Construido con **Hexagonal Architecture** y microservicios modernos.

## 🏗️ Architecture & Modules

The system is divided into specialized modules following clean architecture principles:

### 1. `frontend` (Next.js 14 / React 18)
- **Role**: Professional Trading Terminal.
- **Technologies**: Tailwind CSS, Shadcn UI, Recharts, Framer Motion, Three.js.
- **Design**: Monochrome premium aesthetic with Glassmorphism and 3D backgrounds.
- **Key Features**: 
    - **Terminal Central**: Real-time aggregation of Total Net Worth.
    - **Quick Trade**: Universal dialog for BUY/SELL execution across any strategy.
    - **Strategy Hub**: Workspace isolation for different investment theses.
    - **Cash Management**: Secure Fund Transfer system for liquid capital.
    - **Technical Indicators**: SMA, EMA, RSI, MACD, Bollinger Bands with user selection.
    - **Multi-timeframe Analysis**: View price history from 1 day to all available data.

### 2. `portfolio-manager` (Java/Spring Boot 3)
- **Role**: Core Business Logic & Persistence.
- **Technologies**: JPA/Hibernate, Redis (Real-time Analytics), PostgreSQL.
- **Hexagonal Layers**: Pure Domain rules, Application Ports/Services, and Infrastructure Adapters.
- **Functions**: ROI calculation, position management, and metric broadcast.

### 3. `data-collector` (Python/FastAPI)
- **Role**: High-speed Data Ingestion & Price Oracle.
- **Technologies**: Polars (ETL), PyMongo, `yfinance`.
- **Database**: MongoDB (Raw analytical data storage).
- **Oracle System**: Real-time market synchronization using Redis as a high-speed shared state.

## 📊 Real-time Intelligence (The Redis Edge)

We leverage Redis to power high-frequency features without stressing the relational database:
- **Global Asset Trends**: Sorted Set tracking most traded assets by volume globally via HyperLogLog-inspired logic.
- **Fair ROI Ranking**: Performance metrics normalized against cumulative deposits/withdrawals to ensure accurate leaderboard positions.

## 🛠️ Tech Stack & Infrastructure
- **Languages**: Java 21, Python 3.11, TypeScript.
- **Orchestration**: Docker Compose.
- **Persistence**: PostgreSQL 15, MongoDB 6.0, Redis 7.0.
- **UI/UX**: Custom Monochrome-glass theme.

## 🚀 Quick Start Guide

1.  **Environment**: Ensure `docker` and Node.js (`pnpm`) are installed.
2.  **Infrastructure & Backends**:
    Starts PostgreSQL, MongoDB, Redis, the Python Data Collector, and the Java Portfolio Manager simultaneously.
    ```bash
    docker compose up -d
    ```
3.  **Frontend (Development Terminal)**:
    ```bash
    cd frontend && pnpm install && pnpm dev
    ```

## ⚠️ Troubleshooting
### PostgreSQL Port Conflict
We use **port 5433** for the PostgreSQL container to avoid conflicts with local PostgreSQL installations on Windows (which typically use 5432).
- **App Connection**: `jdbc:postgresql://localhost:5433/capital_fourge_db`
- **Docker External Access**: `localhost:5433`

## 🔮 Recent Enhancements (Phase 6)
- [x] **Technical Indicators Interface**: Added UI for selecting and displaying SMA, EMA, RSI, MACD, and Bollinger Bands
- [x] **Multi-timeframe Analysis**: Added timeframe selector (1D, 1W, 1M, 3M, 6M, 1Y, YTD, ALL)
- [x] **Indicator Limitations**: Free tier limited to 3 indicators simultaneously (upgrade path for monetization)
- [x] **Enhanced Price Chart**: Interactive chart with multiple Y-axes for different indicator types
- [x] **Dynamic Symbol Search (branch `search-fixes`)**: `searchSymbols` now matches tier-1 categorized assets, then falls back to dynamic yfinance resolution with LATAM exchange suffixes (`.BOG`, `.CL`, `.MX`, `.SA`, `.AR`, `.PE`). This removes the hardcoded-only limitation for Colombian stocks (e.g. `CIB`, `ISA`, `ETB`, `BOGOTA`, `CELSIA`). Live-price paths in `data-collector` resolve through `resolve_yfinance_symbol()` before Redis caching.
- [x] **Price Oracle LATAM Mapping**: `PriceOracle.fetch_and_cache()` now resolves Colombian/LATAM aliases before fetching via yfinance, fixing the zero-price issue in historical and portfolio views.
- [x] **TradingView Chart Mapping**: TradingView chart component now maps Colombian tickers (BVC/Colombia) to the correct `BVC:*` exchange format, so chart data matches the resolved exchange symbol.
- [x] **Explorer Fallbacks**: `app/(dashboard)/explorer/[symbol]` now maps BVC/Colombia-related tickets before live fetch, preventing 404s when the raw input lacks an exchange suffix.
- [x] **Java Inference Update**: `AssetSearchService.inferCategory()` now covers the broadened Colombian ticker set, keeping category filters consistent across the search surface.

## 🔮 Future Roadmap (Phase 7+)
- [ ] **AI Quant Analyst**: Large Language Model integration for portfolio risk assessment.
- [ ] **API Gateway Integration**: Unified entry point with rate limiting and JWT security.
- [ ] **Real-time Price WebSockets**: Live asset price updates with interactive TradingView-style charts.
- [ ] **Automated Capital Fourge Portfolio**: Rule-based portfolio using technical indicators for buy/sell signals.
- [ ] **Portfolio Ranking System**: Public leaderboard showcasing top-performing strategies.

## Deployment Note
Last rebuilt and deployed from search-fixes branch on Thu Jun  4 11:31:37 UTC 2026

## Rebuild Note
Latest rebuild from search-fixes branch: Thu Jun  4 13:56:21 UTC 2026
