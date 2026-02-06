# System Architecture

## Architecture Style
- Hexagonal Architecture
- Domain-driven boundaries
- Adapter-based infrastructure

## Services Overview
- **data-collector** (Python / FastAPI): High-speed data ingestion and market oracle.
- **portfolio-manager** (Java / Spring Boot): Orchestration, business logic, and security.
- **frontend** (Next.js / React): Real-time trading terminal.

## Communication
- **REST**: External exposure and frontend-to-backend communication.
- **gRPC**: Internal high-performance service-to-service communication (e.g., Price Oracle).

## Patterns
- **Ports & Adapters**: Decoupling domain from infrastructure.
- **Dependency Inversion**: High-level modules don't depend on low-level modules.
- **DTO boundaries**: Clear separation between API contracts and internal domain.
