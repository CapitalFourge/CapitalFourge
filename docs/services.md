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
