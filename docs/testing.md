# Testing Strategy

## Current State
- **data-collector**: Basic health check and collection tests.
- **portfolio-manager**: Infrastructure is set up, but detailed logic tests are pending.
- **frontend**: UI component unit tests missing.

## Strategy

### Unit Testing
- **Backend**: JUnit 5 + Mockito for Java; Pytest for Python.
- **Frontend**: Vitest + React Testing Library.

### Integration Testing
- Test gRPC communication between `portfolio-manager` and `data-collector`.
- Test repository persistence with Testcontainers (PostgreSQL).

### E2E Testing
- Focus on critical flows: Registration -> Portfolio Creation -> Trade execution.
- Tool: Playwright.
