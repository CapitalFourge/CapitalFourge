# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: critical-flows.spec.ts >> Capital Fourge E2E Tests >> E2E-10: Logout/Login Data Isolation
- Location: e2e/critical-flows.spec.ts:327:7

# Error details

```
Error: Channel closed
```

```
Error: locator.fill: Target page, context or browser has been closed
Call log:
  - waiting for locator('input[type="email"]')

```

```
Error: browserContext.close: Target page, context or browser has been closed
```