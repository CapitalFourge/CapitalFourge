# CapitalFourge - Code Review Action Plan

> Generated from OpenCodeReview scan (nvidia/nemotron-3-nano-30b-a3b:free) — 196 files, ~100 issues grouped

---

## 📋 Executive Summary

| Priority | Issues | Est. Effort | Target |
|----------|--------|-------------|--------|
| **P0 - Critical (Security)** | 8 | ~2-3 days | **Week 1** |
| **P1 - High (Correctness/Stability)** | 12 | ~3-4 days | **Week 1-2** |
| **P2 - Medium (Maintainability/Perf)** | 18 | ~4-5 days | **Week 2-3** |
| **P3 - Low (Tech Debt/Style)** | 25+ | ~3-4 days | **Week 3-4** |
| **Total** | ~63 | ~12-16 days | **3-4 weeks** |

---

## 🚨 P0 - Critical Security (Fix Immediately)

### P0-1: Plain-text Password Storage
**Files:** `portfolio-manager/src/main/java/com/capitalfourge/portfoliomanager/domain/User.java`, `portfolio-manager/src/main/java/com/capitalfourge/portfoliomanager/infrastructure/orm/entities/UserEntity.java`, `portfolio-manager/src/main/java/com/capitalfourge/portfoliomanager/infrastructure/adapters/out/persistence/UserPersistenceAdapter.java`

**Tasks:**
- [ ] Add BCrypt password hashing in `User` domain entity
- [ ] Migrate `UserEntity.password` column to store hash (not plain text)
- [ ] Update `UserPersistenceAdapter.toEntity()` / `toDomain()` to hash/verify
- [ ] Add migration script for existing users (hash current passwords)
- [ ] Update login flow to use `BCrypt.checkpw()`

**Acceptance:** No plain-text passwords in DB; login works with hashed passwords.

---

### P0-2: Hardcoded Secrets in application.yml
**Files:** `portfolio-manager/src/main/resources/application.yml`

**Tasks:**
- [ ] Replace `spring.data.redis.password` → `${REDIS_PASSWORD}`
- [ ] Replace `jwt.secret` → `${JWT_SECRET}`
- [ ] Replace any other hardcoded credentials
- [ ] Document required env vars in `README.md` / `.env.example`

**Acceptance:** `application.yml` contains zero plaintext secrets; app starts with env vars.

---

### P0-3: Secrets in GitHub Actions Workflow
**Files:** `.github/workflows/ci.yml`

**Tasks:**
- [ ] Move all secrets to GitHub Repository Settings → Secrets
- [ ] Reference via `${{ secrets.SECRET_NAME }}` in workflow
- [ ] Rotate any exposed keys (Redis, JWT, API keys)

**Acceptance:** Workflow file has no literal secrets; CI passes with repo secrets.

---

### P0-4: GraphQL Mutations Missing Authorization
**Files:** `portfolio-manager/src/main/java/com/capitalfourge/portfoliomanager/infrastructure/adapters/in/graphql/PortfolioGraphQLController.java`, `FeedbackGraphQLController.java`, `OrderGraphQLController.java`

**Affected Mutations:** `buyAsset`, `sellAsset`, `deposit`, `withdraw`, `deletePortfolio`, `createLimitOrder`, `cancelOrder`, `submitFeedback`

**Tasks:**
- [ ] Add `@PreAuthorize("hasRole('USER')")` or custom `@CurrentUser` check
- [ ] Verify portfolio ownership before mutating (portfolio.userId == currentUser.id)
- [ ] Return 403/404 for unauthorized access (not 500)
- [ ] Add integration tests for unauthorized attempts

**Acceptance:** Unauthorized mutation returns 403; authorized works.

---

### P0-5: Race Conditions in Balance Updates
**Files:** `portfolio-manager/src/main/java/com/capitalfourge/portfoliomanager/application/services/PortfolioService.java`, `OrderService.java`

**Critical Methods:** `addCash`, `withdrawCash`, `buyAssetByUSD`, `sellAssetByUSD`, `createLimitOrder`, `cancelOrder`, `executeOrder`

**Tasks:**
- [ ] Add `@Transactional` to all balance-modifying methods
- [ ] Use optimistic locking (`@Version` on `UserEntity` / `PortfolioEntity`)
- [ ] Or use pessimistic locking (`LockModeType.PESSIMISTIC_WRITE`)
- [ ] Fix `BUY_LIMIT` logic: cash should **decrease**, lockedBalance should **increase**
- [ ] Persist updated `User` entity after balance changes
- [ ] Add concurrency test (simulate concurrent deposits/withdrawals)

**Acceptance:** 1000 concurrent operations → final balance = initial + sum(ops); no lost updates.

---

### P0-6: DTOs Without Input Validation
**Files:** `portfolio-manager/src/main/java/com/capitalfourge/portfoliomanager/application/ports/dto/auth/ChangeEmailCommand.java`, `LoginCommand.java`, `RegisterCommand.java`, `RefreshCommand.java`, and all command/query DTOs

**Tasks:**
- [ ] Add `@NotBlank`, `@Email`, `@Size`, `@Pattern` annotations
- [ ] Add `@Valid` on controller method parameters
- [ ] Configure global validation error handler (return 400 with field errors)
- [ ] Test invalid payloads return 400 with clear messages

**Acceptance:** Invalid request → 400 with field-level errors; valid → 200.

---

### P0-7: Invalid Tailwind Utilities Breaking UI
**Files:** `frontend/app/globals.css`

**Issues:**
- `border-border` → invalid
- `bg-white/[0.xxx]` → invalid (use `bg-white/5`, `bg-white/10`, etc.)
- `@custom-variant dark (&:is(.dark *));` → invalid syntax
- `@import "tw-animate-css/dist/tw-animate.css";` commented but referenced

**Tasks:**
- [ ] Fix all invalid utilities per Tailwind v3/v4 docs
- [ ] Define custom CSS variables for `border`, `ring`, `background` if needed
- [ ] Use `@custom-variant dark (&:where(.dark, .dark *));` (v3) or `@custom-variant dark (&:is(.dark *));` (v4)
- [ ] Remove or uncomment `tw-animate-css` import
- [ ] Verify dark mode works in Storybook / local dev

**Acceptance:** `npm run build` passes; UI renders correctly in light/dark mode.

---

### P0-8: Exception Swallowing (No Stack Traces)
**Files:** `portfolio-manager/src/main/java/com/capitalfourge/portfoliomanager/application/services/PriceMonitorService.java`, `ProcessExecutor.java`, `RedisTokenAdapter.java`, `GlobalExceptionHandler.java`

**Tasks:**
- [ ] Replace `log.error(e.getMessage())` → `log.error("context", e)`
- [ ] In `GlobalExceptionHandler`: add specific `@ExceptionHandler` for known exceptions
- [ ] Remove catch-all `Exception` handler or make it log full stack trace
- [ ] Ensure error responses don't leak sensitive info

**Acceptance:** Production logs show full stack traces for errors; client gets generic message.

---

### P0-9: Render Deployment Failing (503 Service Unavailable)
**Files:** `render.yaml` / `Dockerfile` / `portfolio-manager/src/main/resources/application.yml` / Health endpoint
**Priority:** Critical - App is DOWN in production
**Root Cause:** Service fails health check, Render kills container after timeout. `prefetch cache` = Chrome precargando URLs pero servidor ya caído.

**Tasks:**
- [ ] Verify `server.port=${PORT:10000}` in application.yml (Render injects PORT env var)
- [ ] Add/verify `/health` endpoint returns 200 OK (Spring Boot Actuator)
- [ ] Increase Render health check timeout (default 3min → 5min)
- [ ] Check startup logs for OOM / DB connection failures / WebSocket broker blocking startup
- [ ] Test Docker image locally: `docker run -p 10000:10000 -e PORT=10000 <image>`
- [ ] Configure Render `healthCheckPath: /health` and `healthCheckTimeout: 300`
- [ ] Verify WebSocket broker (SimpleBroker) doesn't block startup thread

**Acceptance:** `docker run` starts in <60s, `/health` returns 200, Render deploy succeeds.

---

## ⚡ P1 - High Correctness & Stability

### P1-1: Unbounded Repository Queries (OOM Risk)
**Files:** `JpaFeedbackRepository.java`, `JpaPortfolioRepository.java`, `JpaTransactionRepository.java`, `JpaUserRepository.java`

**Methods:** `findAll()`, `findByUserId()`, `findPublicPortfolios()`, `findByPortfolioId()`

**Tasks:**
- [ ] Change return types to `Page<T>` or `Slice<T>`
- [ ] Add `Pageable` parameter to repository methods
- [ ] Update service layer to pass `PageRequest.of(page, size)`
- [ ] Update GraphQL resolvers to support pagination args (`first`, `after`)
- [ ] Add default page size limit (e.g., max 50)

**Acceptance:** Large dataset (10k+ rows) → query returns in <500ms, memory stable.

---

### P1-2: Missing `@Transactional` on Write Operations
**Files:** `PortfolioPersistenceAdapter.java` (`save`), `TransactionPersistenceAdapter.java` (`save`), `FeedbackPersistenceAdapter.java` (`save`)

**Tasks:**
- [ ] Add `@Transactional` to all `save*` / `delete*` methods
- [ ] Verify rollback on exception (integration test)

**Acceptance:** Partial failure → no partial data persisted.

---

### P1-3: N+1 Queries in GraphQL Resolvers
**Files:** `PortfolioGraphQLController.java`, `OrderGraphQLController.java`, `FeedbackGraphQLController.java`

**Tasks:**
- [ ] Use `@EntityGraph` or `JOIN FETCH` in repository queries
- [ ] Or use DataLoader pattern for batch loading
- [ ] Enable Hibernate SQL logging to verify query count

**Acceptance:** Single GraphQL query → ≤3 SQL queries (not N+1).

---

### P1-4: BUY_LIMIT Balance Logic Bug
**Files:** `OrderService.java` (lines around `createLimitOrder`, `executeOrder`)

**Bug:** Cash increased, lockedBalance decreased (should be opposite)

**Tasks:**
- [ ] Fix: `cashBalance -= amount`, `lockedBalance += amount` on BUY_LIMIT create
- [ ] On execute: `lockedBalance -= filledAmount`, position added
- [ ] On cancel: `lockedBalance -= remainingAmount`, `cashBalance += remainingAmount`
- [ ] Add unit tests for each transition

**Acceptance:** Balance invariants hold: `cash + locked + positions_value = total_portfolio_value`.

---

### P1-5: Null Pointer Risks in Persistence Adapters
**Files:** `UserPersistenceAdapter.java` (`mapLanguage(null)`), `TransactionPersistenceAdapter.java` (`balanceTransaction`), `PortfolioPersistenceAdapter.java` (`findByIds` with null UUIDs)

**Tasks:**
- [ ] Add null checks / `Objects.requireNonNull`
- [ ] Filter nulls from lists before JPA queries
- [ ] Return `Optional` or empty list instead of throwing NPE

**Acceptance:** Null input → graceful empty result, no NPE.

---

### P1-6: Type Mismatch in Transaction Mapping
**Files:** `TransactionPersistenceAdapter.java` (line `.type(entity.getSymbol())`)

**Bug:** `Transaction.type` mapped from `entity.getSymbol()` instead of `entity.getType()`

**Tasks:**
- [ ] Fix mapping: `.type(entity.getType())`
- [ ] Add test verifying type round-trip

**Acceptance:** Saved transaction type == loaded transaction type.

---

### P1-7: Insecure CORS Configuration
**Files:** `SecurityConfig.java` (duplicate origin lists, `@Order(HIGHEST_PRECEDENCE)` conflict)

**Tasks:**
- [ ] Consolidate CORS config into single `CorsConfigurationSource` bean
- [ ] Remove duplicate origin arrays
- [ ] Review `@Order` — ensure CORS filter runs before Spring Security filter chain
- [ ] Restrict `allowedHeaders` from `*` to explicit list

**Acceptance:** Preflight requests work; no duplicate headers; security scan passes.

---

### P1-8: Missing JwtAuthenticationFilter Bean
**Files:** `SecurityConfig.java` (constructor depends on `JwtAuthenticationFilter` not defined)

**Tasks:**
- [ ] Create `JwtAuthenticationFilter` bean (or remove dependency if unused)
- [ ] Ensure filter chain wiring is correct

**Acceptance:** Application starts without `NoSuchBeanDefinitionException`.

---

### P1-9: Redis Password Parsing Bug
**Files:** `RedisConfig.java` (`lastIndexOf(":")` fails if password contains `:`)

**Tasks:**
- [ ] Use proper URI parsing (`new URI(redisUrl).getUserInfo()`)
- [ ] Handle edge cases: no password, password with special chars

**Acceptance:** Connects to Redis with complex passwords.

---

### P1-10: SSL Config Gap in Redis
**Files:** `RedisConfig.java` (only enables SSL if URL starts with `rediss://`)

**Tasks:**
- [ ] Enable SSL when `sslEnabled=true` regardless of URL scheme
- [ ] Or enforce `rediss://` in config validation

**Acceptance:** TLS connection established when configured.

---

### P1-11: JWT Secret Key Generation Weak
**Files:** `JwtTokenServiceAdapter.java` (`Keys.hmacShaKeyFor(secret.getBytes())`)

**Tasks:**
- [ ] Validate secret length ≥ 256 bits (32 chars) at startup
- [ ] Fail fast if secret too short
- [ ] Consider using `HS512` for stronger signing

**Acceptance:** Startup fails with clear message if JWT secret weak.

---

### P1-12: JWT Claims Without Null Checks
**Files:** `JwtTokenServiceAdapter.java` (`.claim("email", user.getEmail())` etc.)

**Tasks:**
- [ ] Add null checks: `user.getEmail() != null ? user.getEmail() : ""`
- [ ] Or make fields non-null in `User` domain

**Acceptance:** Token generation never throws NPE.

---

## 🔧 P2 - Medium Maintainability & Performance

### P2-1: Cache Thread Safety (GrpcFinancialDataClient)
**Files:** `GrpcFinancialDataClient.java` (`cacheTimestamps` ConcurrentHashMap, but `isExpired` uses non-atomic check)

**Tasks:**
- [ ] Use `computeIfAbsent` / atomic operations for cache timestamps
- [ ] Or move timestamp into `CachedPrice` record

**Acceptance:** Concurrent access → no lost timestamps.

---

### P2-2: Cache Expiration Off-by-Nanos
**Files:** `GrpcFinancialDataClient.java` (`isExpired()` uses `>` instead of `>=`)

**Tasks:**
- [ ] Change to `>=` for correct 1-hour TTL

**Acceptance:** Entry expires at exactly 1 hour, not 1 hour + 1ns.

---

### P2-3: Unsafe URL Construction (Injection Risk)
**Files:** `GrpcFinancialDataClient.java` (`symbolsParam` concatenated raw)

**Tasks:**
- [ ] Use `UriComponentsBuilder` or `URLEncoder.encode(symbol, StandardCharsets.UTF_8)`

**Acceptance:** Symbols with special chars (`AAPL$`, `BRK.B`) → valid request.

---

### P2-4: Unvalidated Response Casting (ClassCastException Risk)
**Files:** `GrpcFinancialDataClient.java` (`@SuppressWarnings("unchecked") Map<String,Object>`)

**Tasks:**
- [ ] Check response structure before cast: `if (response instanceof Map && response.containsKey("prices"))`
- [ ] Or use DTO with Jackson `@JsonIgnoreProperties(ignoreUnknown=true)`

**Acceptance:** Malformed backend response → logged error, not crash.

---

### P2-5: Logging at Wrong Level
**Files:** `GrpcFinancialDataClient.java` (`System.err.println` for errors)

**Tasks:**
- [ ] Replace with SLF4J `log.error("REST GET error for {}", path, e)`
- [ ] Use appropriate levels: WARN for expected failures, ERROR for unexpected

**Acceptance:** Logs structured, searchable, correct level.

---

### P2-6: Dead Code in EmailValidator
**Files:** `EmailValidator.java` (duplicate validation block)

**Tasks:**
- [ ] Remove unreachable code
- [ ] Keep single validation path

**Acceptance:** Code coverage 100% on validator; no dead branches.

---

### P2-7: UserPersistenceAdapter - mapLanguage Dead Code
**Files:** `UserPersistenceAdapter.java` (`mapLanguage(null)` always returns "ES")

**Tasks:**
- [ ] Remove method or fix to use `entity.getLanguage()`
- [ ] Add `@Column(name="language")` default "ES" in entity

**Acceptance:** User language persisted and loaded correctly.

---

### P2-8: findAll() Without Pagination in UserPersistenceAdapter
**Files:** `UserPersistenceAdapter.java` (`findAll()` loads all users)

**Tasks:**
- [ ] Change to `Page<User> findAll(Pageable pageable)`
- [ ] Update callers

**Acceptance:** Admin user list paginated.

---

### P2-9: Portfolio Persistence - Eager Loading All Positions/Transactions
**Files:** `PortfolioPersistenceAdapter.java` (`toEntity` streams all positions/transactions)

**Tasks:**
- [ ] Use `@OneToMany(fetch=LAZY)` on entity relationships
- [ ] Load positions/transactions only when needed (separate query or EntityGraph)

**Acceptance:** Loading portfolio without positions → 1 query, not 3.

---

### P2-10: Defaulting Null Performance to 0.0 (Masks Missing Data)
**Files:** `PortfolioPersistenceAdapter.java` (`.performance(entity.getPerformance() != null ? ... : 0.0)`)

**Tasks:**
- [ ] Return `Optional<Double>` or keep `null` in domain
- [ ] Handle null in UI (show "—" not "0%")

**Acceptance:** New portfolio shows "—" performance, not "0%".

---

### P2-11: Python Report Generator - Thread Safety
**Files:** `PythonReportGeneratorAdapter.java` (`ProcessExecutor.executeWithOutput`)

**Tasks:**
- [ ] Verify `ProcessExecutor` is thread-safe (stateless)
- [ ] If not, synchronize or use pool

**Acceptance:** Concurrent report generation → no interleaved output/crashes.

---

### P2-12: Python Report Generator - Relative Path Resolution
**Files:** `PythonReportGeneratorAdapter.java` (`Paths.get("report-service", "generator.py")`)

**Tasks:**
- [ ] Resolve from `ClassLoader.getResource()` or config property
- [ ] Make path configurable via `@Value("${report.generator.path}")`

**Acceptance:** Works regardless of working directory.

---

### P2-13: Python Report Generator - Generic IOException
**Files:** `PythonReportGeneratorAdapter.java` (throws `IOException` for any non-zero exit)

**Tasks:**
- [ ] Define custom exceptions: `ReportGenerationFailedException`, `ReportTimeoutException`
- [ ] Parse stderr for known error patterns

**Acceptance:** Caller can handle specific failure modes.

---

### P2-14: HealthConfig - RestTemplate Thread Safety
**Files:** `HealthConfig.java` (lambda captures `RestTemplate`)

**Tasks:**
- [ ] Make `RestTemplate` a `@Bean` (singleton, thread-safe)
- [ ] Or use `WebClient` (reactive, thread-safe)

**Acceptance:** Health endpoint works under load.

---

### P2-15: HealthConfig - NPE on Null Cache Metrics
**Files:** `HealthConfig.java` (`metrics.estimatedSize()` without null check)

**Tasks:**
- [ ] Add null check: `if (metrics == null) return Health.down()...`
- [ ] Or ensure `GrpcFinancialDataClient` always returns metrics

**Acceptance:** Health check never throws NPE.

---

### P2-16: HealthConfig - DB Query Timeout Too Short
**Files:** `HealthConfig.java` (`jdbcTemplate.setQueryTimeout(3)`)

**Tasks:**
- [ ] Increase to 10-15s
- [ ] Or make configurable

**Acceptance:** Transient DB slowness → health UP, not DOWN.

---

### P2-17: FeedbackRepository Thread Safety Concern
**Files:** `JpaFeedbackRepository.java` (shared EntityManager)

**Tasks:**
- [ ] Verify Spring Data JPA repository is thread-safe (it is, per-request EntityManager)
- [ ] Document assumption

**Acceptance:** No action needed if confirmed; otherwise fix.

---

### P2-18: Category Enum Stored as String - Mapping Risk
**Files:** `AssetEntity.java` / `Category.java` (enum persisted as String)

**Tasks:**
- [ ] Add `@Enumerated(EnumType.STRING)` (already there?) — verify
- [ ] Handle unknown enum values in mapper: `Category.valueOfOrNull(str)`

**Acceptance:** Unknown category → null, not exception.

---

## 🧹 P3 - Low Technical Debt & Style

### P3-1: Duplicate CORS Origin Lists
**Files:** `SecurityConfig.java`

### P3-2: Commented Import in globals.css
**Files:** `frontend/app/globals.css`

### P3-3: Force Redeploy Comments in next.config.js
**Files:** `frontend/next.config.js`

### P3-4: Backup Files in Repository
**Files:** `*.backup`, `*.bak`, `.repowise/` (already in .gitignore but tracked)

### P3-5: Test Files Skipped by Scanner
**Files:** `*Test.java`, `*.test.tsx` — ensure tests exist for critical paths

### P3-6: Proto Files Not Versioned Properly
**Files:** `protos/financial_data.proto`, `data-collector/protos/financial_data.proto` — deduplicate

### P3-7: Docker Compose Backups
**Files:** `docker-compose.yml.backup`, `docker-compose.yml.bak`

### P3-8: Unused Dependencies
**Files:** `frontend/package.json`, `portfolio-manager/pom.xml` — run `depcheck` / `mvn dependency:analyze`

### P3-9: Missing API Documentation
**Files:** GraphQL schema (`schema.graphqls`) — add descriptions

### P3-10: Inconsistent Error Response Format
**Files:** `GlobalExceptionHandler.java` — standardize on RFC 7807 ProblemDetail

### P3-11: Magic Strings in GraphQL Resolvers
**Files:** Controllers — extract to constants

### P3-12: Hardcoded Timeouts
**Files:** `RestTemplateBuilder` (60s read), `HealthConfig` (3s) — make configurable

### P3-13: System.err.println in Production Code
**Files:** `GrpcFinancialDataClient.java`, `PriceMonitorService.java`

### P3-14: Inconsistent Naming (camelCase vs snake_case in JSON)
**Files:** DTOs — enforce `@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)`

### P3-15: Missing Indexes on Frequently Queried Columns
**Files:** JPA entities — add `@Index` on `user_id`, `portfolio_id`, `symbol`, `timestamp`

### P3-16: No Circuit Breaker on External Calls
**Files:** `GrpcFinancialDataClient.java` (data-collector), `RestTemplate` calls — add Resilience4j

### P3-17: No Request Validation on GraphQL Inputs
**Files:** Controllers — add `@Valid` on input objects

### P3-18: Inconsistent UUID Generation
**Files:** Domain entities — standardize on `UUID.randomUUID()` vs DB-generated

### P3-19: Missing Audit Fields
**Files:** Entities — add `created_at`, `updated_at`, `created_by`, `updated_by`

### P3-20: No Database Migration Strategy Documented
**Files:** Flyway/Liquibase configs — verify versioning

### P3-21: Frontend E2E Tests Flaky
**Files:** `frontend/e2e/critical-flows.spec.ts` — stabilize selectors, add retries

### P3-22: No Load Testing Baseline
**Files:** — add k6/Gatling script for critical paths

### P3-23: Missing OpenTelemetry Tracing
**Files:** — add traces for GraphQL, gRPC, DB

### P3-24: Dependency Updates Needed
**Files:** — run `npm audit`, `mvn versions:display-dependency-updates`

### P3-25: No SBOM Generation
**Files:** — add CycloneDX plugin to CI

---

## 📦 Implementation Order (Suggested)

### Sprint 1 (Week 1) — P0 Only
| Day | Focus |
|-----|-------|
| 1-2 | P0-1, P0-2, P0-3 (Secrets & Passwords) |
| 3-4 | P0-4 (GraphQL Auth), P0-5 (Race Conditions) |
| 5 | P0-6 (DTO Validation), P0-7 (Tailwind), P0-8 (Logging) |

### Sprint 2 (Week 2) — P1
| Day | Focus |
|-----|-------|
| 1-2 | P1-1 (Pagination), P1-2 (@Transactional) |
| 3 | P1-3 (N+1), P1-4 (BUY_LIMIT Bug) |
| 4 | P1-5 (NPE Risks), P1-6 (Type Mismatch) |
| 5 | P1-7 (CORS), P1-8 (JWT Filter), P1-9 (Redis), P1-10 (SSL), P1-11 (JWT Secret), P1-12 (Claims) |

### Sprint 3 (Week 3) — P2
| Day | Focus |
|-----|-------|
| 1-2 | P2-1 to P2-6 (Cache, URLs, Casting, Logging, Dead Code) |
| 3 | P2-7 to P2-12 (Persistence, Python Adapter) |
| 4 | P2-13 to P2-18 (Health, Feedback, Category, Indexes) |

### Sprint 4 (Week 4) — P3 + Polish
| Day | Focus |
|-----|-------|
| 1-2 | P3 cleanup (duplicates, backups, config) |
| 3 | Testing: E2E stabilization, load test baseline |
| 4 | Observability: Tracing, SBOM, Circuit Breakers |
| 5 | Documentation, Migration Guide, Retrospective |

---

## ✅ Definition of Done (Per Issue)

- [ ] Code changed + formatted (Prettier / google-java-format)
- [ ] Unit tests added/updated (≥80% coverage on changed lines)
- [ ] Integration test passes (Testcontainers for DB/Redis)
- [ ] No new lint warnings (`ruff`, `eslint`, `checkstyle`)
- [ ] CI pipeline green
- [ ] Peer review approved
- [ ] Deployed to staging + smoke tested
- [ ] Issue closed with PR link

---

## 🔗 Tracking

Create GitHub Issues with labels:
- `priority:P0` / `P1` / `P2` / `P3`
- `type:security` / `bug` / `tech-debt` / `performance`
- `module:portfolio-manager` / `frontend` / `data-collector` / `infra`

Link Issues → PRs → Milestones (`Sprint 1`, `Sprint 2`, ...)

---

## 📌 Notes

- **Zero mock data policy**: All tests use real DB (Testcontainers), real Redis, real Alpaca paper API
- **Apollo Cache**: Remember `typePolicies.merge: false` for balances, `refetchQueries` on mutations
- **Multi-portfolio isolation**: Every fix must verify user-scoped queries
- **Disk space**: 12GB free — monitor during CI builds

---

*Plan generated from OpenCodeReview full-repo scan. Update as issues are resolved.*