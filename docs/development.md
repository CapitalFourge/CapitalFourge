# Development Guide

## Local Setup

1.  **Platform Check**: Ensure you have Docker and pnpm installed.

```bash
# Clone the repository
git clone <repo-url>
cd capital-fourge

# Start infrastructure (PostgreSQL, Redis only - no MongoDB, no gRPC)
docker compose up -d postgres redis
```

You do not need to manually install Java or Python dependencies to run the backend anymore, as they are fully containerized.

### Backend (portfolio-manager)
```bash
cd portfolio-manager
mvn test          # Run tests with Testcontainers
mvn clean package -DskipTests  # Build JAR
docker build -t portfolio-manager -f Dockerfile .  # Build Docker image
```

### Frontend (Next.js)
```bash
cd frontend
pnpm install
pnpm dev          # Runs on http://localhost:3000
```

## Workflows

- **Branching**: Use descriptive branch names `feature/something` or `fix/error`.
- **Commits**: Use conventional commits (e.g., `feat: add graphql query`).
- **PRs**: Ensure all local tests pass before submitting.

## Critical: Test Before Push
```bash
# Backend
cd portfolio-manager && mvn test && docker build -t test -f Dockerfile .

# Frontend
cd frontend && pnpm build && pnpm test

# Check memory locally (simulate Render 512MB limit)
docker run --memory=512m --cpus=1 -p 10000:10000 portfolio-manager-test
```

## Common Pitfalls to Avoid
- ❌ Don't add heavy dependencies (WebFlux, gRPC, WebSocket, OpenAPI, Caffeine)
- ❌ Don't increase pool sizes beyond 4 (Hikari, Redis)
- ❌ Don't skip `mvn test` - catches GraphQL schema mismatches
- ❌ Don't push without local Docker build test
- ✅ Keep Metaspace ≤ 150MB, Heap ≤ 128MB
