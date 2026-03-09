# Development Guide

## Local Setup

1.  **Platform Check**: Ensure you have Docker and pnpm installed.

```bash
# Clone the repository
git clone <repo-url>
cd finsight

# Start infrastructure and all backend microservices
# (PostgreSQL, MongoDB, Redis, data-collector, portfolio-manager)
docker compose up -d --build
```

You do not need to manually install Java or Python dependencies to run the backend anymore, as they are fully containerized.

### frontend (Next.js)

```bash
cd frontend
pnpm install
pnpm dev
```

## Workflows

- **Branching**: Use descriptive branch names `feature/something` or `fix/error`.
- **Commits**: Use conventional commits (e.g., `feat: add grpc client`).
- **PRs**: Ensure all local tests pass before submitting.
