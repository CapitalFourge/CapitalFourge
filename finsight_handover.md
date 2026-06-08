# Project Handover: Capital Fourge (Where Financial Knowledge Takes Shape)

**Capital Fourge** es una plataforma de análisis de inversiones de nivel empresarial que combina **Java Spring Boot**, **Python (Polars/AI)**, y **React**.

## 🏗️ Architecture: Distributed Microservices
The project follows **Hexagonal/Clean Architecture** principles within each service.

### Microservices Breakdown:
1. **`data-collector` (Python 3.11+ / FastAPI)**
   - **Role**: High-performance data ingestion from financial APIs.
   - **Tech**: **Polars** (for data processing), **PyMongo**.
   - **DB**: **MongoDB** (Raw data storage).
2. **`ai-analyst` (Python 3.11+ / AI)**
   - **Role**: Sentiment analysis and investment recommendations.
   - **Tech**: OpenAI/HuggingFace integration.
3. **`portfolio-manager` (Java 17 / Spring Boot 3)**
   - **Role**: Core business logic, user portfolios, and transaction history.
   - **Tech**: Spring Data JPA, Hibernate, Spring Security.
   - **DB**: **PostgreSQL** (Relational storage).
4. **`api-gateway` (Java 17 / Spring Cloud Gateway)**
   - **Role**: Entry point/Proxy for all services.
   - **Tech**: Redis for Rate Limiting and Caching.
5. **`frontend-dashboard` (React + Vite + Tailwind CSS)**
   - **Role**: Modern UI with premium aesthetics.
   - **Tech**: Shadcn UI, Framer Motion, **React Three Fiber** (ThreeJS) for 3D visualizations.

---

## 🛠️ Global Technology Stack
- **Messaging**: REST (Internal via OpenFeign), gRPC (optional).
- **Cache**: **Redis** (Shared cache between services).
- **Containerization**: **Docker & Docker Compose** for local dev and deployment.
- **CI/CD**: GitHub Actions (Maven/Python/Docker workflows).

---

## 📍 Current Progress & Specs
We are currently in **Phase 1: Infrastructure Setup**. 

### Local Infrastructure Specs (`docker-compose.yml`):
- **Postgres**: User: `user`, Pwd: `password`, DB: `capital_fourge_db`, Port: `5432`.
- **MongoDB**: Port: `27017`.
- **Redis**: Port: `6379`.

### Design Guidelines:
- **SOLID**: Strict enforcement of SRP, OCP, and DIP.
- **User-Led**: USER writes the code; Agent provides architecture, dependencies, and guidance.
- **Visuals**: WOW effect required for the frontend.

---

## 📅 Roadmap for Next Session:
1. **Infrastructure**: Finalize and run `docker-compose.yml`.
2. **Data-Collector**: Set up the Python FastAPI project and connect to MongoDB.
3. **Domain Logic**: Start the `portfolio-manager` Spring Boot skeleton.
