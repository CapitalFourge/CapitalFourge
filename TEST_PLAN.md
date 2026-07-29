# Plan de Pruebas Comprehensivo - Capital Fourge

## 1. Resumen Ejecutivo

**Bug reportado**: Al ingresar al dashboard, muestra patrimonio en 0 y sin portafolios. Al navegar a `/portfolio` y volver, los datos aparecen correctamente.

**Causa raíz sospechada**: Problema de sincronización de caché Apollo Client / GraphQL - el query `me` en el dashboard no se refresca después de mutaciones o navegación.

---

## 2. Arquitectura del Sistema

```
┌─────────────────┐     GraphQL      ┌──────────────────┐
│   Next.js 16    │ ◄──────────────► │  Spring Boot     │
│   Frontend      │   (port 8080)    │  Portfolio Mgr   │
│   (port 3000)   │                  │  (port 8080)     │
└─────────────────┘                  └──────────────────┘
        │                                      │
        │ Apollo Client Cache                  │ PostgreSQL
        ▼                                      ▼
┌─────────────────┐                  ┌──────────────────┐
│  InMemoryCache  │                  │  JPA/Hibernate   │
└─────────────────┘                  └──────────────────┘
```

**Queries clave**:
- `me` → `User` con `cashBalance`, `lockedBalance`
- `portfolios` → `List<Portfolio>` con positions
- `assetMovers` → datos de mercado

---

## 3. Plan de Pruebas por Capas

### 3.1 Pruebas Unitarias - Backend (Java/Spring Boot)

| ID | Componente | Caso de Prueba | Prioridad |
|----|------------|----------------|-----------|
| BU-01 | `PortfolioService.createPortfolio()` | Crea portafolio con userId válido, verifica defaults | ALTA |
| BU-02 | `PortfolioService.getPortfoliosByUser()` | Retorna lista con prices refreshed y performance calculado | ALTA |
| BU-03 | `PortfolioService.getPortfolio()` | Refresca precios y actualiza performance en get individual | ALTA |
| BU-04 | `PortfolioService.addCash()` | Incrementa user.cashBalance Y portfolio.cumulativeDeposits | ALTA |
| BU-05 | `PortfolioService.withdrawCash()` | Decrementa user.cashBalance Y portfolio.cumulativeWithdrawals | ALTA |
| BU-06 | `PortfolioService.buyAsset()` | Descuenta user.cashBalance, crea position, actualiza deposits | ALTA |
| BU-07 | `PortfolioService.sellAsset()` | Acredita user.cashBalance, reduce position, actualiza withdrawals | ALTA |
| BU-08 | `PortfolioService.updatePerformance()` | Fórmula: ((currentVal + totalOut) - totalIn) / totalIn * 100 | ALTA |
| BU-09 | `PortfolioService.repairUserBalance()` | Recupera lockedBalance de órdenes huérfanas | MEDIA |
| BU-10 | `PortfolioGraphQLController.me()` | Llama repairUserBalance ANTES de retornar user | CRÍTICA |
| BU-11 | `PortfolioGraphQLController.portfolios()` | Retorna portfolios con prices refreshed | ALTA |
| BU-12 | `PortfolioPersistenceAdapter.toDomain()` | Mapea positions y transactions correctamente con EAGER fetch | ALTA |

### 3.2 Pruebas Unitarias - Frontend (React/Next.js)

| ID | Componente | Caso de Prueba | Prioridad |
|----|------------|----------------|-----------|
| FU-01 | `DashboardPage` - `useQuery(DASHBOARD_QUERY)` | PollInterval 60s funciona, cache no stale | CRÍTICA |
| FU-02 | `DashboardPage` - `totalBalance` calculation | Suma cashBalance + lockedBalance + investedTotal | CRÍTICA |
| FU-03 | `PortfoliosPage` - `useQuery(PORTFOLIOS_QUERY)` | FetchPolicy correcto, loading/error states | ALTA |
| FU-04 | `DashboardLayout` - `ME_QUERY` | fetchPolicy: "cache-and-network" para welcome | MEDIA |
| FU-05 | Apollo Client config | Auth link agrega Bearer token, URI correcto | ALTA |
| FU-06 | `CashActionDialog` - `deposit` mutation | Llama `addCash`, refetch queries relacionadas | ALTA |

### 3.3 Pruebas de Integración - GraphQL API

| ID | Endpoint | Caso de Prueba | Prioridad |
|----|----------|----------------|-----------|
| GI-01 | `query me` | Retorna user con cashBalance/lockedBalance no-null | CRÍTICA |
| GI-02 | `query portfolios` | Lista portfolios del user autenticado | CRÍTICA |
| GI-03 | `mutation createPortfolio` | Crea portfolio, retorna en query portfolios inmediato | CRÍTICA |
| GI-04 | `mutation addCash` | Incrementa cashBalance, portfolio.cumulativeDeposits | ALTA |
| GI-05 | `mutation buyAsset` | Descuenta cash, crea position, actualiza portfolio | ALTA |
| GI-06 | Cache invalidation | Después de mutation, queries subsiguientes ven datos nuevos | CRÍTICA |
| GI-07 | `repairUserBalance` | Ejecutado en `me`, recupera locked de órdenes huérfanas | ALTA |

### 3.4 Pruebas E2E - Flujo Crítico (Bug Reportado)

| ID | Flujo | Pasos | Resultado Esperado |
|----|-------|-------|-------------------|
| E2E-01 | **Bug: Dashboard muestra 0** | 1. Login → 2. Dashboard → 3. Verificar stats | Patrimonio ≠ 0, portfolios.length > 0 |
| E2E-02 | Navegación corrige bug | 1. Dashboard (0) → 2. /portfolio → 3. Dashboard | Segunda visita muestra datos correctos |
| E2E-03 | Crear portfolio + recarga | 1. Crear portfolio → 2. Add cash → 3. Dashboard | Patrimonio = cash + invested |
| E2E-04 | Buy/Sell actualiza dashboard | 1. Buy asset → 2. Dashboard → 3. Verificar investedTotal | investedTotal incluye nueva posición |
| E2E-05 | Poll interval refresca precios | 1. Esperar 60s → 2. Verificar assetMovers | Precios actualizados sin reload |

### 3.5 Pruebas de Performance y Carga

| ID | Métrica | Target | Herramienta |
|----|---------|--------|-------------|
| PERF-01 | `me` query latency | < 100ms p95 | k6 / JMeter |
| PERF-02 | `portfolios` query latency | < 200ms p95 | k6 / JMeter |
| PERF-03 | Mutation `addCash` latency | < 300ms p95 | k6 / JMeter |
| PERF-04 | Apollo cache hit rate | > 80% | Apollo DevTools |
| PERF-05 | Dashboard FCP (First Contentful Paint) | < 1.5s | Lighthouse |
| PERF-06 | Dashboard TTI (Time to Interactive) | < 3s | Lighthouse |

### 3.6 Pruebas de Seguridad

| ID | Caso | Prioridad |
|----|------|-----------|
| SEC-01 | JWT válido requerido para `me` / `portfolios` | CRÍTICA |
| SEC-02 | Usuario A no ve portfolios de Usuario B | CRÍTICA |
| SEC-03 | Admin requerido para `adminUsers`, `adminSetRole` | ALTA |
| SEC-04 | Rate limiting en login/register | MEDIA |
| SEC-05 | CORS configurado solo para frontend domain | ALTA |

---

## 4. Métricas de Calidad (KPIs)

### 4.1 Cobertura de Código
| Capa | Target | Actual |
|------|--------|--------|
| Backend (services) | ≥ 80% | TBD |
| Backend (controllers) | ≥ 70% | TBD |
| Frontend (components) | ≥ 60% | TBD |
| Frontend (hooks/utils) | ≥ 70% | TBD |

### 4.2 Métricas de Bugs
| Métrica | Target |
|---------|--------|
| Bugs críticos en producción | 0 |
| Bugs alta severidad por release | ≤ 2 |
| Tiempo medio detección (MTTD) | < 1 hora |
| Tiempo medio resolución (MTTR) | < 4 horas |

### 4.3 Métricas de Performance
| Métrica | Target | Alerta |
|---------|--------|--------|
| API p95 latency | < 200ms | > 500ms |
| Error rate | < 0.1% | > 1% |
| Apollo cache hit rate | > 80% | < 60% |
| Bundle size (gzipped) | < 200KB | > 300KB |

### 4.4 Métricas de UX
| Métrica | Target |
|---------|--------|
| Dashboard load time (cached) | < 500ms |
| Dashboard load time (cold) | < 2s |
| Navigation transitions | < 200ms |
| Zero hydration errors | 0 |

---

## 5. Estrategia de Ejecución

### Fase 1: Reproducción y Diagnóstico (Día 1)
- [ ] Reproducir bug E2E-01 en entorno local
- [ ] Analizar Apollo DevTools: cache hits/misses, query timing
- [ ] Verificar Network tab: requests `me` y `portfolios` timing
- [ ] Revisar logs backend: `repairUserBalance` execution

### Fase 2: Pruebas Unitarias Críticas (Día 1-2)
- [ ] BU-10: `me()` llama `repairUserBalance` antes de retornar
- [ ] BU-02/03: `getPortfoliosByUser` refresca prices
- [ ] FU-01: `DASHBOARD_QUERY` pollInterval y cache policy
- [ ] GI-06: Cache invalidation después de mutations

### Fase 3: Fix y Validación (Día 2-3)
- [ ] Implementar fix (probable: `fetchPolicy: "cache-and-network"` en DASHBOARD_QUERY)
- [ ] Ejecutar suite completa unitarias
- [ ] Validar E2E-01 a E2E-05

### Fase 4: Regression y Performance (Día 3-4)
- [ ] Ejecutar suite completa
- [ ] Load testing con k6
- [ ] Lighthouse CI en PR pipeline

---

## 6. Herramientas y Configuración

### Backend
```xml
<!-- pom.xml dependencies para testing -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-junit-jupiter</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>junit-jupiter</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>postgresql</artifactId>
    <scope>test</scope>
</dependency>
```

### Frontend
```json
// package.json additions
{
  "devDependencies": {
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.4.0",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "@apollo/client/testing": "^3.12.0",
    "msw": "^2.3.0"
  },
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

### E2E
```json
// playwright.config.ts
{
  "projects": [{ "name": "chromium", "use": { "browserName": "chromium" } }],
  "webServer": { "command": "npm run dev", "port": 3000 }
}
```

---

## 7. Checklist de Validación Pre-Release

### Funcionalidad Core
- [ ] Login/Register funciona
- [ ] Dashboard muestra patrimonio correcto en primera carga
- [ ] Portfolio CRUD completo
- [ ] Buy/Sell/Deposit/Withdraw actualizan balances
- [ ] Leaderboard público funciona
- [ ] Admin panel accesible solo a admins

### Calidad
- [ ] 0 errores TypeScript
- [ ] 0 warnings ESLint
- [ ] Cobertura backend ≥ 70%
- [ ] Cobertura frontend ≥ 50%
- [ ] 0 hydration errors Next.js
- [ ] Lighthouse Performance ≥ 90

### Observabilidad
- [ ] Logs estructurados (JSON) en backend
- [ ] Métricas Prometheus expuestas (`/actuator/prometheus`)
- [ ] Health checks (`/actuator/health`)
- [ ] Error tracking (Sentry o similar)

---

## 8. Próximos Pasos Inmediatos

1. **Ejecutar reproducción del bug** - Confirmar E2E-01
2. **Analizar Apollo Cache** - Verificar `cache.policies` para `User` y `Portfolio`
3. **Revisar `fetchPolicy`** en `DASHBOARD_QUERY` vs `PORTFOLIOS_QUERY`
4. **Verificar `repairUserBalance`** execution en `me()` query

---

## 9. Métricas de Éxito Post-Fix

| Métrica | Antes | Target Post-Fix |
|---------|-------|-----------------|
| Dashboard muestra 0 en primera carga | Sí (Bug) | No |
| Navegación requerida para ver datos | Sí | No |
| Apollo cache miss rate (dashboard) | Alto | < 20% |
| User complaints (data inconsistency) | Reportado | 0 |

---

*Documento vivo - actualizar conforme se ejecutan pruebas y se descubren hallazgos.*