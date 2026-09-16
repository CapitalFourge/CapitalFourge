# Portfolio Improvements Plan

## Context
User requested 4 improvements after reviewing the portfolio lookup implementation:
1. All portfolios in `/portfolio` list should be accessed by name (already done - verify)
2. Show public/private status on `/portfolio` listing page
3. Fix missing transactions on portfolio detail page
4. Create a public portfolios page sorted by performance

## Issue Analysis

### Item 1: Portfolio naming (verify existing)
- `/portfolio/page.tsx` already links to `/portfolio/${encodeURIComponent(portfolio.name)}`
- `/portfolio/[slug]/page.tsx` already queries `portfolioByName(name: $name)`
- Backend: `PortfolioGraphQLController.portfolioByName()` calls `portfolioUseCase.getPortfolioByName(userId, name)` → `portfolioRepository.findByUserIdAndName(userId, name)`
- **Status: Already correct. No changes needed.**

### Item 2: Show public/private status on `/portfolio` page
- `PORTFOLIOS_QUERY` in `portfolio/page.tsx` does NOT include `isPublic` field
- Need to add `isPublic` to the query, interface, and UI (badge/icon)

### Item 3: Missing transactions on portfolio detail page
- **Root cause**: `JpaPortfolioRepository.findByUserIdAndName` (line 20-21) has no `@EntityGraph` to fetch `transactions` (which are `FetchType.LAZY` on `PortfolioEntity`)
- `PortfolioMapper.toDomain()` (line 85) checks `Hibernate.isInitialized(entity.getTransactions())` — returns false for lazy collections not loaded by the query
- `OrdersDialog` works independently — it queries `ordersByPortfolio(portfolioId)` which is a separate query, not affected by this issue
- **Fix**: Add `@EntityGraph(attributePaths = {"positions", "transactions"})` to `findByUserIdAndName` query, OR use `JOIN FETCH`

### Item 4: Public portfolios page
- Existing `/leaderboard` page is under `/(dashboard)/` (authenticated route)
- User wants a public page (no auth required) for public portfolios sorted by performance
- The `leaderboard` GraphQL query already returns public portfolios sorted by performance
- **Solution**: Create `frontend/app/public-portfolios/page.tsx` as a standalone public page using the same `leaderboard` query, with a cleaner layout suitable for non-authenticated visitors

## Tasks

### Backend: Fix missing transactions (Item 3)
- [ ] Add `@EntityGraph(attributePaths = {"positions", "transactions"})` to `findByUserIdAndName` in `JpaPortfolioRepository.java:20`
- [ ] Verify `PortfolioMapper.toDomain()` handles the loaded transactions (already does — line 85 checks `Hibernate.isInitialized` which will now be true)
- [ ] Run `PortfolioPersistenceAdapterTest` and `PortfolioServiceTest` to verify

### Frontend: Public/private badge (Item 2)
- [ ] Add `isPublic` field to `PORTFOLIOS_QUERY` in `portfolio/page.tsx:13`
- [ ] Add `isPublic: boolean` to `Portfolio` interface (line 38-44)
- [ ] Add visual indicator (lock/globe icon + badge) in the portfolio card UI

### Frontend: Public portfolios page (Item 4)
- [ ] Create `frontend/app/public-portfolios/page.tsx`:
  - Query `leaderboard` GraphQL query
  - Display portfolios sorted by performance (already sorted by backend)
  - Link each to `/share/${shareSlug}`
  - Include search by portfolio name or symbol
  - No authentication required (public route)
- [ ] Add navigation link to this page (e.g., in the main nav)

### Testing
- [ ] Run frontend tests (`pnpm test`)
- [ ] Run backend tests (`mvn test`)
- [ ] Run lint (`npx eslint .`)

## Risks
- Adding `@EntityGraph` to `findByUserIdAndName` changes query behavior — verify no existing tests break
- The `Hibernate.isInitialized` check in `PortfolioMapper` will now pass, so transactions will be mapped
- Public portfolios page reuses existing `leaderboard` query — no backend changes needed
