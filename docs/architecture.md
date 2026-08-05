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
- **gRPC**: ~~Internal high-performance service-to-service communication.~~ **REMOVED** - uses REST to data-collector now
- **WebSockets (STOMP)**: ~~Real-time price streaming to the frontend.~~ **REMOVED** - not in current stack
- **REST**: Authentication and legacy endpoint exposure.

## Patterns
- **Ports & Adapters**: Decoupling domain from infrastructure.
- **Dependency Inversion**: High-level modules don't depend on low-level modules.
- **DTO boundaries**: Clear separation between API contracts and internal domain.

## Role-Based Access Control
The system implements role-based access control with the following roles:

- **USER**: Default role for registered users. Can manage portfolios, execute trades, and view personal data.
- **ADMIN**: Elevated privileges for system administration. Can:
  - View all registered users via `adminUsers` query
  - Change user roles via `adminSetRole` mutation
  - Deactivate user accounts via `adminDeactivateUser` mutation

The `User` domain entity contains an `isAdmin()` helper method that checks if `role == Role.ADMIN`. All admin mutations verify the requesting user has admin privileges before execution.

## Memory Constraints (Render Free Tier)
**Critical**: Total memory must stay ≤ 512MB

### Removed Dependencies (Saved ~120MB)
- `spring-boot-starter-webflux` - Reactive stack not needed
- `spring-boot-starter-grpc` - gRPC removed, use REST to data-collector
- `spring-boot-starter-websocket` - WebSocket not used
- `springdoc-openapi-starter-webmvc-ui` - OpenAPI/Swagger UI
- `caffeine` - Caching library (used Redis instead)

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
