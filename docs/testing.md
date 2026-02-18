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
- Test gRPC communication and batch price fetching.
- Test GraphQL resolvers and security filters.
- Verify WebSocket STOMP connectivity and message broadcasting.
- Test repository persistence with Testcontainers.

### E2E Testing
- Focus on critical flows: Registration -> Portfolio Creation -> Trade execution.
- Tool: Playwright.
### CI/CD Pipeline
- Fully automated via GitHub Actions.
- Parallel jobs for all microservices.
- See [CI/CD Documentation](ci-cd.md) for details.
