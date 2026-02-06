# Databases

## PostgreSQL
- **Role**: Source of truth for relational data.
- **Entities**: Users, Roles, Portfolios, Transactions, Positions.
- **Connection**: Managed via Spring Data JPA in `portfolio-manager`.

## MongoDB
- **Role**: Storage for raw market data and analytical results.
- **Usage**: Large-scale time-series or unstructured data.
- **Connection**: Used by `data-collector`.

## Redis
- **Role**: High-speed cache and real-time state.
- **Usage**: 
  - Pricing cache
  - JWT blacklist (future)
  - Shared performance metrics
