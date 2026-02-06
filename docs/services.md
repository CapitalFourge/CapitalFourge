# Backend Services

## data-collector
- **Purpose**: Market data ingestion & processing.
- **Stack**: FastAPI, Polars (ETL), MongoDB (Analytical data), Redis (Cache).
- **Communication**: gRPC Server.
- **API endpoints**: 
  - `/health`: Health check
  - `/collect`: Trigger data collection
  - `/price`: Fetch live price

## portfolio-manager
- **Purpose**: Core business logic and portfolio state.
- **Stack**: Spring Boot, JPA, PostgreSQL (Transactional data), Redis (Session/Metrics).
- **Communication**: gRPC Client, REST API.
- **Responsibilities**:
  - Users & Authentication (JWT)
  - Portfolios & Positions management
  - Transactions history
  - Performance Metrics calculation
