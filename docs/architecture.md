# System Architecture

## Architecture Style
- Hexagonal Architecture
- Domain-driven boundaries
- Adapter-based infrastructure
- **Centralized Balance**: Investable funds managed at User level, while Portfolios track position-based performance.

## Services Overview
- **data-collector** (Python / FastAPI): High-speed data ingestion and market oracle.
- **portfolio-manager** (Java / Spring Boot): Orchestration, business logic, and security.
- **frontend** (Next.js / React): Real-time trading terminal.

## Communication
- **GraphQL**: Primary frontend-to-backend API for flexible data fetching.
- **gRPC**: Internal high-performance service-to-service communication.
- **WebSockets (STOMP)**: Real-time price streaming to the frontend.
- **REST**: Authentication and legacy endpoint exposure.

## Patterns
- **Ports & Adapters**: Decoupling domain from infrastructure.
- **Dependency Inversion**: High-level modules don't depend on low-level modules.
- **DTO boundaries**: Clear separation between API contracts and internal domain.
