# Deployment & CI/CD

## CI/CD Pipeline
- **Platform**: GitHub Actions (planned).
- **Stages**:
  1. Build & Lint.
  2. Test execution.
  3. Docker image build.
  4. Push to Registry (GHCR/DockerHub).

## Infrastructure as Code
- **Docker Compose**: Used for local development and staging environments.
- **Kubernetes**: Future target for production scaling.

## Environment Management
- `.env.example`: Template for all required environment variables.

## Port Reference 📡
| Service | Port | Protocol |
|---------|------|----------|
| portfolio-manager | 8080 | HTTP/GraphQL/WS |
| data-collector (API) | 8000 | HTTP |
| data-collector (gRPC) | 50051 | gRPC |
| frontend | 3000 | HTTP (Next.js) |
| PostgreSQL | 5433 | DB |
| Redis | 6379 | NoSQL/PubSub |
| MongoDB | 27017 | NoSQL |
