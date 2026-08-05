# Capital Fourge - Architecture & Troubleshooting Guide

## Project Overview

**Stack:**
- **Backend**: Spring Boot 3.2.2 (Java 17) - Portfolio Manager service
- **Frontend**: Next.js 14 (React 18) with Apollo Client
- **Database**: PostgreSQL (Supabase)
- **Cache**: Redis (Upstash)
- **GraphQL**: Spring Boot GraphQL (single dependency for dashboard)
- **Auth**: JWT (jjwt 0.12.3)
- **Deploy**: Render free tier (512MB RAM limit)

**Key Constraint**: Total memory must stay < 512MB on Render free tier.

---

## Architecture Decisions (What We Kept vs Removed)

### ✅ KEPT (Required for Dashboard)
- `spring-boot-starter-graphql` - GraphQL endpoint for dashboard queries/mutations
- `spring-boot-starter-web` - REST APIs for auth, health
- `spring-boot-starter-data-jpa` - PostgreSQL via Hibernate
- `spring-boot-starter-security` - JWT authentication
- `spring-boot-starter-actuator` - Health checks
- `spring-boot-starter-data-redis` - Redis caching (Lettuce pool)
- `jjwt-api`, `jjwt-impl`, `jjwt-jackson` - JWT tokens
- `postgresql` driver

### ❌ REMOVED (Saved ~120MB)
- `spring-boot-starter-webflux` - Reactive stack not needed
- `spring-boot-starter-grpc` - gRPC removed, use REST to data-collector
- `spring-boot-starter-websocket` - WebSocket not used
- `springdoc-openapi-starter-webmvc-ui` - OpenAPI/Swagger UI
- `caffeine` - Caching library (used Redis instead)
- `technical-analysis` - Not used in core
- `asset-search` - Not used

---

## Memory Optimization (Critical for Render 512MB)

### JVM Settings (Dockerfile)
```dockerfile
ENV JAVA_OPTS="-Xms48m -Xmx128m -XX:MaxMetaspaceSize=150m -XX:CompressedClassSpaceSize=20m -XX:+UseZGC -Dserver.address=0.0.0.0 -Dspring.datasource.hikari.maximum-pool-size=4 -Dspring.redis.lettuce.pool.max-active=4"
```

### Pool Sizes (application.yml)
```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 4      # Was 10
      minimum-idle: 1           # Was 2
  redis:
    lettuce:
      pool:
        max-active: 4           # Was 8
        max-idle: 4             # Was 8
```

### Actuator Health Indicators
```yaml
management:
  health:
    caches:
      enabled: false    # Disable to save memory
    db:
      enabled: true     # Keep for readiness
```

**Target**: Heap 128MB + Metaspace 150MB + Off-heap < 512MB total

---

## Critical Fixes & Root Causes

### 1. Render OOM (Exit Code 137)
**Cause**: Metaspace + Heap > 512MB
**Fix**: Reduced Metaspace from 180MB → 150MB, Heap 128MB, pools to 4 connections

### 2. Login Error: "Cannot invoke Long.longValue() because current is null"
**Cause**: Legacy users in DB had `version=NULL` - Hibernate optimistic locking fails
**Fix**: 
- `UserEntity.java`: Added `@PostLoad` to initialize version=0L
- `PortfolioManagerApplication.java`: CommandLineRunner runs `UPDATE users SET version=0 WHERE version IS NULL` at startup
- `UserPersistenceAdapter.saveAndFlush()`: Safety check before save

### 3. GraphQL Schema Mismatches (Frontend Validation Errors)
**Root Cause**: Frontend queries fields that didn't exist in schema

| Frontend Page | Missing Fields | Fix |
|--------------|----------------|-----|
| `/portfolio/:id` | `portfolio(id: ID!)` query, `isPublic`, `shareSlug`, `transactions` | Added query + Portfolio type fields |
| `/explorer` | `assetsByCategory`, `searchSymbols`, `Asset` type | Added queries + Asset type |
| `/transactions` | `Transaction.balanceTransaction` | Added field + resolver |
| `/settings` | `User.email`, `User.language`, `myFeedbacks` query, `Feedback` type | Added fields + query + type |

### 4. GitHub Actions E2E Test Failures
**Issues Fixed**:
- `checkDashboardValues()`: Changed from fragile `text=/\\$[0-9,.]+/` regex to stable `.metric-tile` selector
- `login()`: Wait for register API response + 1s DB commit delay + verify logout button
- `createPortfolio()`: Detect error toasts (sonner) and throw with actual error message
- Timeouts: 30s → 10s for faster CI feedback

### 5. JWT User ID Resolution
**Cause**: `JwtAuthenticationFilter` puts **userId (UUID)** as principal, but code treated it as **email**
**Fix**: `PortfolioGraphQLController.getUserIdFromAuth()` now reads UUID directly from principal

---

## GraphQL Schema (Complete)

```graphql
schema {
  query: Query
  mutation: Mutation
}

type Query {
  me: User
  portfolio(id: ID!): Portfolio
  portfolios(sort: String, limit: Int): [Portfolio!]!
  assetMovers(sort: String, limit: Int): [AssetMover!]!
  assetsByCategory(category: String): [Asset!]!
  searchSymbols(query: String!, limit: Int!): [Asset!]!
  myFeedbacks: [Feedback!]!
}

type Mutation {
  login(email: String!, password: String!): AuthResult
  createPortfolio(name: String!, description: String): Portfolio
  buyAsset(portfolioId: ID!, symbol: String!, quantity: Float!, price: Float!): Portfolio
  sellAsset(portfolioId: ID!, symbol: String!, quantity: Float!, price: Float!): Portfolio
  buyAssetByUSD(portfolioId: ID!, symbol: String!, usdAmount: Float!, price: Float!): Portfolio
  sellAssetByUSD(portfolioId: ID!, symbol: String!, usdAmount: Float!, price: Float!): Portfolio
  addCash(portfolioId: ID!, amount: Float!): Portfolio
  withdrawCash(portfolioId: ID!, amount: Float!): Portfolio
  deposit(amount: Float!): User
  withdraw(amount: Float!): User
  deletePortfolio(id: ID!): Boolean
  toggleVisibility(portfolioId: ID!, isPublic: Boolean!): Portfolio
  repairBalance: Boolean
  adminSetRole(userId: ID!, role: String!): User
  adminDeactivateUser(userId: ID!): Boolean
}

type AuthResult {
  token: String!
  refreshToken: String!
  user: User!
}

type User {
  id: ID!
  username: String!
  email: String!
  cashBalance: Float!
  lockedBalance: Float!
  language: String!
}

type Portfolio {
  id: ID!
  name: String!
  description: String
  performance: Float!
  isPublic: Boolean!
  shareSlug: String
  positions: [Position!]!
  transactions: [Transaction!]!
}

type Transaction {
  id: ID!
  symbol: String!
  type: String!
  quantity: Float!
  price: Float!
  totalAmount: Float!
  timestamp: String!
  balanceTransaction: Float!
}

type Position {
  id: ID!
  symbol: String!
  quantity: Float!
  averagePurchasePrice: Float!
  currentPrice: Float
}

type Asset {
  symbol: String!
  name: String
  category: String!
}

type AssetMover {
  symbol: String!
  name: String
  price: Float!
  changePercent: Float!
  changeValue: Float!
  volume: Float!
}

type Feedback {
  id: ID!
  userId: ID!
  username: String!
  category: FeedbackCategory!
  message: String!
  createdAt: String!
  read: Boolean!
}

enum FeedbackCategory {
  QUEJA
  RECLAMO
  SUGERENCIA
  OTRO
}
```

---

## Common Pitfalls & How to Avoid

### ❌ DON'T: Add Heavy Dependencies
- No WebFlux, gRPC, WebSocket, OpenAPI, Caffeine
- Each adds 15-30MB → pushes over 512MB limit

### ❌ DON'T: Use Mock Data in Production Resolvers
- `assetsByCategory`, `searchSymbols`, `myFeedbacks` return empty lists
- **TODO**: Connect to data-collector service for real data

### ❌ DON'T: Change GraphQL Schema Without Updating Frontend
- Frontend validates queries at build time
- Missing field = 503 Service Unavailable on page load

### ❌ DON'T: Skip Database Migrations for Version Field
- Always ensure `@Version` fields have default 0L
- Use CommandLineRunner for one-time fixes

### ✅ DO: Test Locally with Docker Before Push
```bash
cd portfolio-manager && mvn test && docker build -t test -f Dockerfile .
```

### ✅ DO: Check Memory with `docker stats`
```bash
docker run -d --name test test && docker stats test --no-stream
```

### ✅ DO: Keep Pool Sizes Small
- Hikari: max 4, min 1
- Redis Lettuce: max-active 4
- Each connection ~2-5MB overhead

---

## Deployment Checklist

Before pushing to main:
- [ ] `mvn test` passes in portfolio-manager
- [ ] `docker build` succeeds
- [ ] Frontend builds: `cd frontend && pnpm build`
- [ ] No new heavy dependencies added
- [ ] GraphQL schema matches frontend queries
- [ ] Memory settings in Dockerfile unchanged

---

## Key Files to Review

| File | Purpose |
|------|---------|
| `portfolio-manager/Dockerfile` | JVM memory settings |
| `portfolio-manager/src/main/resources/application.yml` | Pool sizes, health config |
| `portfolio-manager/src/main/resources/graphql/schema.graphqls` | GraphQL schema |
| `portfolio-manager/src/main/java/.../PortfolioGraphQLController.java` | All resolvers |
| `portfolio-manager/src/main/java/.../UserEntity.java` | @Version + @PostLoad |
| `portfolio-manager/src/main/java/.../PortfolioManagerApplication.java` | Startup DB fix |
| `frontend/e2e/critical-flows.spec.ts` | E2E tests with proper waits |

---

## Debugging Commands

```bash
# Check Render logs for OOM
# Look for: "OutOfMemoryError: Metaspace" or exit code 137

# Local memory test
docker run --memory=512m --cpus=1 -p 10000:10000 portfolio-manager-test

# Check GraphQL schema
curl -X POST http://localhost:10000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __schema { types { name fields { name } } } }"}'

# Test login
curl -X POST http://localhost:10000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password"}'
```

---

## Future Improvements (Not Blocking)

1. **Real data for Explorer**: Connect `assetsByCategory`/`searchSymbols` to data-collector service
2. **Feedback persistence**: Implement FeedbackRepository for real `myFeedbacks`
3. **AssetMovers**: Implement real market data for dashboard
4. **WebSocket**: Consider for real-time portfolio updates (memory permitting)
5. **Metrics**: Add Prometheus/Grafana for memory monitoring

---

*Last updated: August 2025 - All critical issues resolved, deploy stable on Render free tier*