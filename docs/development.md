# Development Guide

## Local Setup

Ensure you have Docker and pnpm installed.

```bash
# Clone the repository
git clone <repo-url>
cd finsight

# Start infrastructure (PostgreSQL, MongoDB, Redis)
docker compose up -d postgres mongodb redis
```

## Running Services Locally

### data-collector (Python)

```bash
cd data-collector
venv\Scripts\activate
pip install -r requirements.txt
python main.py
# (Starts both gRPC Server on 50051 and FastAPI on 8000)
```

### portfolio-manager (Java)

```bash
cd portfolio-manager
mvn spring-boot:run
```

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
