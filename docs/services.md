# Backend Services

## data-collector
- **Purpose**: Market data ingestion & processing.
- **Stack**: FastAPI, Polars (ETL), MongoDB (Analytical), Redis (Pub/Sub).
- **Communication**: gRPC Server, Redis Publisher.
- **API endpoints**: 
  - `/health`: Health check
  - `main.py`: Single entry point for FastAPI and gRPC.

## portfolio-manager
- **Purpose**: Core business logic and portfolio state.
- **Stack**: Spring Boot, JPA, PostgreSQL, Redis (Listener).
- **Communication**: gRPC Client, GraphQL Server, WebSocket Provider.
- **Responsibilities**:
  - Centralized Cash Management: User entity holds the primary `cashBalance`.
  - Portfolio State Management: Portfolios track deployed capital (positions) and ROI.
  - JWT Security & GraphQL Resolvers.
  - Redis Message Listening (Market Data).
  - Real-time Price Broadcasting.
  - **Admin Panel**: User management with role-based access control (ADMIN role required).

## GraphQL API Endpoints

### Queries
| Query | Description | Auth |
|-------|-------------|------|
| `me` | Current user profile | Required |
| `stockPrice(symbol)` | Get current stock price | None |
| `priceHistory(symbol, days)` | Historical price data | None |
| `portfolio(id)` | Portfolio details | Required |
| `portfolios` | User's portfolios | Required |
| `leaderboard` | Public portfolio leaderboard | None |
| `sharedPortfolio(slug)` | Shared portfolio by slug | None |
| `searchSymbols(query, limit)` | Search trading symbols | None |
| `assetsByCategory(category)` | Assets by category | None |
| `assetMovers(sort, limit)` | Top market movers | None |
| `technicalIndicators(symbol, days)` | Technical indicators | None |
| `asset(symbol)` | Asset details | None |
| `adminUsers` | All users (admin only) | ADMIN Required |

### Mutations
| Mutation | Description |
|----------|-------------|
| `login(email, password)` | Authentication |
| `register(email, password, username)` | Registration |
| `createPortfolio(name, description)` | Create portfolio |
| `buyAsset(portfolioId, symbol, quantity, price)` | Buy assets |
| `sellAsset(portfolioId, symbol, quantity, price)` | Sell assets |
| `deposit(amount)` | Add cash |
| `withdraw(amount)` | Remove cash |
| `adminSetRole(userId, role)` | Change user role (admin only) |
| `adminDeactivateUser(userId)` | Deactivate user (admin only) |
