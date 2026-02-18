# Finsight – Project Overview (Agent Guide)

*Last Updated: 2025-02-06*

---

## Purpose of This Document

This document provides a **high-level overview** of the Finsight platform and acts as a **navigation guide** for developers, AI agents, and maintainers.

It explains:
- What the project is
- How it is structured
- Where to find detailed information for each part

For implementation details, refer to the linked documents below.

---

## Project Summary

**Finsight** is a modular trading and portfolio management platform composed of multiple services:

- A **data ingestion & analytics service**
- A **core portfolio & business logic service**
- A **modern trading terminal frontend**

The system is designed with:
- Hexagonal architecture
- Clear domain boundaries
- Scalability and automation in mind

---

## High-Level Architecture

At a high level, the system consists of:

- **data-collector** (Python / FastAPI)  
  Responsible for market data ingestion, processing, and pricing.

- **portfolio-manager** (Java / Spring Boot)  
  Core business logic: users, portfolios, transactions, metrics, and auth.

- **frontend** (Next.js / React)  
  Trading terminal UI used by end users.

- **Shared infrastructure**  
  PostgreSQL, MongoDB, Redis, Docker, gRPC.

📌 **Detailed architecture**: see [`architecture.md`](architecture.md)

---

## Documentation Map

Use this section as a guide to find the right file quickly:

### System & Architecture
- **Overall architecture & patterns** → [`architecture.md`](architecture.md)
- **Inter-service communication (REST / gRPC)** → [`architecture.md`](architecture.md)

### Backend Services
- **data-collector details** → [`services.md`](services.md)
- **portfolio-manager details** → [`services.md`](services.md)

### Frontend
- **UI structure, routes & components** → [`frontend.md`](frontend.md)

### Databases & Storage
- **PostgreSQL, MongoDB, Redis** → [`databases.md`](databases.md)

### Development
- **Local setup & workflows** → [`development.md`](development.md)

### Security
- **Auth, JWT, risks & best practices** → [`security.md`](security.md)

### Testing
- **Current test coverage & strategy** → [`testing.md`](testing.md)

### Deployment & CI/CD
- **Docker, CI/CD, future deployment plans** → [`deployment.md`](deployment.md)

---

## Design Principles

The entire project follows these principles:

- **Hexagonal Architecture**
- **SOLID principles**
- **Clear separation of concerns**
- **Infrastructure as replaceable adapters**
- **Automation-friendly design**

📌 **Technical breakdown**: see [`architecture.md`](architecture.md)

---

## Current Status (High-Level)

### Implemented
- Core domain models (User, Role, Portfolio)
- REST & FastAPI (Inbound data)
- JWT authentication (Spring Security)
- gRPC communication (Internal Price Data)
- GraphQL API (Frontend-to-Backend Orchestration) 🚀
- Real-time WebSockets (Live market prices) 🛰️
- Docker Compose infrastructure
- Premium Next.js Trading Terminal

### Pending / Improvements
- Comprehensive test coverage
- CI/CD hardening
- Security scanning
- Production-ready Docker images
- Observability & monitoring

📌 **Details**:
- Testing → [`testing.md`](testing.md)
- Deployment → [`deployment.md`](deployment.md)
- Security → [`security.md`](security.md)

---

## How to Use This Repository

1. Start with **this file (`agent.md`)**
2. Jump to the relevant `.md` depending on your task
3. Check existing code before making changes
4. Follow architecture and domain boundaries
5. Add tests for new functionality

---

## Audience

This documentation is intended for:
- Backend & frontend developers
- DevOps engineers
- AI coding agents
- Technical reviewers
- Future maintainers

---

## Final Note

This project is **designed to scale**, both technically and organizationally.  
Consistency, clarity, and automation are key goals.

If something is unclear, improve the documentation before changing the code.
