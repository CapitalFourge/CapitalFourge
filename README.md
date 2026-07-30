# Capital Fourge (formerly Capital-Fourge)

Algorithmic trading platform with AI-powered bots, portfolio management, and real-time market data.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│   Next.js 14    │────▶│  Spring Boot 3   │────▶│  PostgreSQL        │
│   Frontend      │     │  Portfolio Mgr   │     │  (Supabase)        │
│   Port 3000     │     │  Port 10000      │     │  Users/Portfolios  │
└─────────────────┘     └────────┬─────────┘     └─────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
            ┌───────────────┐         ┌───────────────┐
            │   Redis       │         │  MongoDB      │
            │   (Upstash)   │         │  (Market Data)│
            │   Caching     │         │  Price History│
            └───────────────┘         └───────────────┘
                    ▲
                    │
            ┌───────┴───────┐
            │ Data Collector│
            │  (FastAPI)    │
            │  Port 8000    │
            └───────────────┘
```

## Services

| Service | Technology | Port | Description |
|---------|------------|------|-------------|
| **Frontend** | Next.js 14 + Apollo Client | 3000 | Dashboard, portfolio management, bot controls |
| **Portfolio Manager** | Spring Boot 3 + GraphQL | 10000 | Core business logic, orders, portfolios |
| **Data Collector** | FastAPI + WebSocket | 8000 | Market data ingestion, price streaming |
| **PostgreSQL** | Supabase | 5432 | Users, portfolios, positions, auth |
| **MongoDB** | Atlas/Local | 27017 | Raw market data, price history |
| **Redis** | Upstash/Local | 6379 | Caching, rate limiting, pub/sub |

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Java 17+
- Node.js 18+
- Python 3.11+

### Local Development

```bash
# Clone and enter
git clone <repo-url>
cd CapitalFourge

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Start all services
docker compose up -d --build

# Verify
docker compose ps
```

### Service URLs (Local)

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Portfolio Manager GraphQL | http://localhost:10000/graphql |
| Data Collector REST | http://localhost:8000 |
| Swagger UI | http://localhost:10000/swagger-ui.html |
| Prometheus Metrics | http://localhost:10000/actuator/prometheus |
| Health Check | http://localhost:10000/actuator/health |

## API Documentation

### GraphQL API (Portfolio Manager)

**Endpoint**: `POST /graphql`

**Authentication**: JWT Bearer token
```bash
curl -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"query": "{ portfolios { id name performance } }"}' \
     http://localhost:10000/graphql
```

**Key Queries**:
```graphql
# Get all user portfolios with performance
query Portfolios {
  portfolios {
    id
    name
    description
    isPublic
    performance
    cumulativeDeposits
    cumulativeWithdrawals
    positions {
      symbol
      quantity
      currentPrice
      totalValue
      profitLoss
    }
    transactions(first: 20) {
      id
      type
      symbol
      quantity
      price
      totalAmount
      timestamp
    }
  }
}

# Public portfolio leaderboard
query PublicPortfolios {
  publicPortfolios {
    id
    name
    performance
    shareSlug
  }
}
```

**Key Mutations**:
```graphql
# Create portfolio
mutation CreatePortfolio($input: CreatePortfolioInput!) {
  createPortfolio(input: $input) {
    id
    name
  }
}

# Place market order
mutation PlaceOrder($input: PlaceOrderInput!) {
  placeOrder(input: $input) {
    id
    type
    symbol
    status
  }
}

# Create limit order
mutation CreateLimitOrder($input: CreateLimitOrderInput!) {
  createLimitOrder(input: $input) {
    id
    type
    symbol
    limitPrice
    status
  }
}
```

### REST API (Data Collector)

**Base URL**: `http://localhost:8000`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/prices/batch?symbols=AAPL,GOOGL` | GET | Batch price quotes |
| `/price/history/{symbol}?days=30` | GET | Historical prices |
| `/assets/categorized` | GET | Assets by category |
| `/assets/search?q=apple&limit=10` | GET | Symbol search |
| `/assets/symbols` | GET | All available symbols |

### WebSocket (Real-time Prices)

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/prices');
ws.onmessage = (event) => {
  const prices = JSON.parse(event.data);
  console.log('Real-time prices:', prices);
};
ws.send(JSON.stringify({ subscribe: ['AAPL', 'GOOGL', 'BTC-USD'] }));
```

## Monitoring & Observability

### Prometheus Metrics
```
http://localhost:10000/actuator/prometheus
```

**Key Metrics**:
| Metric | Type | Description |
|--------|------|-------------|
| `price.cache.size` | Gauge | Cached price entries |
| `price.cache.hit.rate` | Gauge | Cache hit ratio |
| `price.cache.hits` | Counter | Cache hits |
| `price.cache.misses` | Counter | Cache misses |
| `jvm.memory.used` | Gauge | JVM heap usage |
| `http.server.requests` | Timer | HTTP request latency |

### Health Endpoints
```
GET /actuator/health           # Overall health
GET /actuator/health/liveness  # Liveness probe
GET /actuator/health/readiness # Readiness probe
```

### Swagger UI
```
http://localhost:10000/swagger-ui.html
```

## Testing

### Unit Tests
```bash
# Backend
cd portfolio-manager
mvn test

# Frontend
cd frontend
pnpm vitest run
```

### Integration Tests (Testcontainers)
```bash
# Requires Docker
cd portfolio-manager
mvn test -Dtest=PortfolioIntegrationTest
```

### Test Coverage
| Layer | Framework | Tests |
|-------|-----------|-------|
| Unit | JUnit 5 + Mockito | 116 |
| GraphQL | @SpringGraphQLTest | 21 |
| Integration | Testcontainers (PG + Redis) | 2 |
| Frontend | Vitest + RTL + Apollo Testing | 21 |
| E2E | Playwright | 10 critical flows |

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | Yes | - | 256-bit secret for JWT signing |
| `JWT_ISSUER` | No | capital-fourge | Token issuer |
| `DB_HOST` | Yes | localhost | PostgreSQL host |
| `DB_PORT` | No | 5432 | PostgreSQL port |
| `DB_NAME` | Yes | finsight_db | Database name |
| `DB_USER` | Yes | user | Database user |
| `DB_PASSWORD` | Yes | password | Database password |
| `SPRING_REDIS_URL` | Yes | redis://localhost:6379 | Redis connection URL |
| `DATA_COLLECTOR_BASE_URL` | Yes | http://localhost:8000 | Data collector URL |
| `DATA_COLLECTOR_API_KEY` | Yes | internal-service-key | API key for data collector |
| `REPORT_GENERATOR_SCRIPT_PATH` | No | report-service/generator.py | Python script path |

### Application.yml Key Settings

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,caches,prometheus
  endpoint:
    health:
      show-details: always
    prometheus:
      enabled: true
  prometheus:
    metrics:
      export:
        enabled: true
```

## Deployment

### Docker Compose (Production-like)
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Render (Free Tier)
1. Create Web Service from `portfolio-manager/Dockerfile`
2. Set environment variables in Render dashboard
3. Use `PORT=10000` for Spring Boot

### Vercel (Frontend)
1. Import `frontend/` folder
2. Set `NEXT_PUBLIC_API_URL` to backend URL
3. Deploy

### Supabase (Database)
1. Run migrations in Supabase SQL Editor
2. Enable RLS policies for users/portfolios
3. Configure auth providers

## Project Structure

```
CapitalFourge/
├── frontend/                 # Next.js 14 App Router
│   ├── app/(dashboard)/      # Dashboard pages
│   ├── components/           # React components
│   ├── lib/apollo/           # Apollo Client setup
│   └── graphql/              # GraphQL queries/mutations
│
├── portfolio-manager/        # Spring Boot 3
│   ├── src/main/java/com/capitalfourge/portfoliomanager/
│   │   ├── application/      # Use cases, services, ports
│   │   ├── domain/           # Domain models
│   │   ├── infrastructure/   # Adapters (JPA, GraphQL, gRPC, REST)
│   │   └── config/           # Security, Redis, OpenAPI, Metrics
│   └── src/test/             # Unit + Integration tests
│
├── data-collector/           # FastAPI
│   ├── app/
│   │   ├── collectors/       # Price collectors (yfinance, etc.)
│   │   ├── routes/           # REST + WebSocket endpoints
│   │   └── services/         # Business logic
│   └── tests/
│
├── protos/                   # gRPC protobuf definitions
└── docker-compose.yml        # Local development stack
```

## Code Quality Standards

| Check | Tool | Configuration |
|-------|------|---------------|
| Java Format | Spotless | Google Java Format |
| Imports | Spotless | Organized, no wildcards |
| Lint | Spotless + Checkstyle | Enforced in CI |
| Tests | JUnit 5 + Mockito | 80%+ coverage target |
| Frontend | ESLint + Prettier | Next.js recommended |

## Security

- **Authentication**: JWT (RS256) with 24h access / 7d refresh tokens
- **Authorization**: Role-based (USER, ADMIN) + portfolio ownership
- **Passwords**: BCrypt (cost 12)
- **CORS**: Restricted to configured origins
- **Rate Limiting**: Redis-based (configurable)
- **Secrets**: Environment variables only, never in code

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Run tests: `mvn test && pnpm vitest run`
4. Commit: `git commit -m "feat: add amazing feature"`
5. Push: `git push origin feature/amazing-feature`
6. Open Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Appendix: Recent Improvements (Code Review Action Plan)

### P1 - Critical Fixes ✅
- [x] Pagination for all repositories (`Page<T>`, `Pageable`)
- [x] `@Transactional` on all write operations
- [x] N+1 query fixes with `@EntityGraph` / `JOIN FETCH`
- [x] BUY_LIMIT balance bug fix (cash not double-counted)
- [x] NPE guards in persistence adapters
- [x] Transaction type mapping fix
- [x] CORS hardening (explicit headers, no wildcards)
- [x] `JwtAuthenticationFilter` bean registration
- [x] Redis password parsing (handles `:` in password)
- [x] JWT secret validation (fail-fast < 256 bits)
- [x] JWT claims null checks

### P2 - Quality Improvements ✅
- [x] Exception logging with full stack traces
- [x] Safe URL construction (`UriComponentsBuilder`)
- [x] Response validation before casting
- [x] SLF4J logging (removed `System.err`)
- [x] `UserRepository` pagination
- [x] Portfolio eager loading
- [x] Python report generator thread-safety
- [x] HealthConfig: RestTemplate bean, null metrics, DB timeout

### P3 - Observability & Documentation ✅
- [x] OpenAPI/Swagger with JWT security scheme
- [x] Micrometer + Prometheus metrics
- [x] Testcontainers integration tests
- [x] Comprehensive README with API docs