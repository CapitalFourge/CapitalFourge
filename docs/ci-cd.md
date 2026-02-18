# CI/CD & Pipeline Workflow

This document explains the CI/CD architecture for FinSight.

## Pipeline Overview

The project uses **GitHub Actions** to automate quality control. The pipeline is triggered on every `push` or `pull_request` to the `main` or `master` branches.

### Jobs and Stages

The pipeline consists of three parallel jobs to ensure fast feedback:

1.  **Python: Data Collector**
    - Environment: Python 3.11
    - Tools: `pip`, `pytest`, `flake8`
    - Actions: Installs dependencies and runs unit tests for the data ingestion logic.

2.  **Java: Portfolio Manager**
    - Environment: JDK 17 (Temurin)
    - Tools: `Maven`
    - Actions: Compiles the code and runs JUnit 5 tests. It uses the `test` profile to avoid external infrastructure dependencies where possible.

3.  **React: Frontend**
    - Environment: Node.js 20
    - Tools: `npm` / `pnpm`, `eslint`
    - Actions: Verifies code quality through static analysis (linting).

## Local Execution

To run the same checks locally:

### Backend (Java)
```bash
cd portfolio-manager
./mvnw test
```

### Data Collector (Python)
```bash
cd data-collector
python -m pytest
```

### Frontend (React)
```bash
cd frontend
npm run lint
```

## Future Enhancements
- **Docker Build**: Automated building of Docker images on successful tests.
- **E2E Testing**: Integration of Playwright for browser-level testing in the CI environment.
- **Deployment**: Automatic deployment to staging environments.
