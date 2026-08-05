# Deployment & CI/CD

## CI/CD Pipeline
- **Platform**: GitHub Actions
- **Stages**:
  1. Build & Lint (Maven + pnpm)
  2. Test execution (JUnit5 + Testcontainers + Playwright E2E)
  3. Docker image build (multi-stage)
  4. Deploy to Render (auto-deploy on push to main)

## Production (Render)
- **Backend**: `https://api.capitalfourge.com` (port 10000)
- **Frontend**: `https://www.capitalfourge.com` (Next.js on Vercel/Netlify)
- **Database**: Supabase PostgreSQL
- **Cache**: Upstash Redis

## Infrastructure
- **Docker Compose**: Local development only
- **Render**: Free tier (512MB RAM limit) - auto-deploys from GitHub main branch

## Environment Variables (Render)
```
DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
SPRING_REDIS_URL
JWT_SECRET, JWT_ISSUER, JWT_ACCESS_EXPIRATION_MS, JWT_REFRESH_EXPIRATION_MS
DATA_COLLECTOR_BASE_URL, DATA_COLLECTOR_API_KEY
PORT=10000
```

## Port Reference
| Service | Local Port | Prod Port | Protocol |
|---------|------------|-----------|----------|
| portfolio-manager | 10000 | 10000 | HTTP/GraphQL |
| data-collector (API) | 8000 | 8000 | HTTP (REST) |
| data-collector (gRPC) | N/A | N/A | **REMOVED** |
| frontend | 3000 | 443 | HTTPS (Next.js) |
| PostgreSQL | 5433 | N/A | DB (Supabase) |
| Redis | 6379 | N/A | Cache (Upstash) |
| MongoDB | 27017 | N/A | **NOT USED** |

## Critical Memory Limit (Render Free Tier)
**Total memory must stay ≤ 512MB**

JVM settings in Dockerfile:
```dockerfile
ENV JAVA_OPTS="-Xms48m -Xmx128m -XX:MaxMetaspaceSize=150m -XX:CompressedClassSpaceSize=20m -XX:+UseZGC -Dserver.address=0.0.0.0 -Dspring.datasource.hikari.maximum-pool-size=4 -Dspring.redis.lettuce.pool.max-active=4"
```

Pool sizes in application.yml:
```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 4
      minimum-idle: 1
  redis:
    lettuce:
      pool:
        max-active: 4
        max-idle: 4
```

Actuator health:
```yaml
management:
  health:
    caches:
      enabled: false
    db:
      enabled: true
```

**Target**: Heap 128MB + Metaspace 150MB + Off-heap < 512MB total
