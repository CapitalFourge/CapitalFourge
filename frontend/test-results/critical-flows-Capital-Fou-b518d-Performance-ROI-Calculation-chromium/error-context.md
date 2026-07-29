# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: critical-flows.spec.ts >> Capital Fourge E2E Tests >> E2E-07: Performance/ROI Calculation
- Location: e2e/critical-flows.spec.ts:277:7

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.fill: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('input[type="email"]')

```

# Page snapshot

```yaml
- generic:
  - generic [active]:
    - generic [ref=f1e3]:
      - generic [ref=f1e4]:
        - navigation [ref=f1e6]:
          - button [disabled] [ref=f1e7]:
            - img "previous" [ref=f1e8]
          - generic [ref=f1e10]:
            - generic [ref=f1e11]: 1/
            - text: "1"
          - button [disabled] [ref=f1e12]:
            - img "next" [ref=f1e13]
        - link "Next.js 16.1.6 (stale) Turbopack" [ref=f1e16] [cursor=pointer]:
          - /url: https://nextjs.org/docs/messages/version-staleness
          - generic "There is a newer version (16.2.12) available, upgrade recommended!" [ref=f1e19]: Next.js 16.1.6 (stale)
          - generic [ref=f1e20]: Turbopack
      - dialog "Build Error" [ref=f1e22]:
        - generic [ref=f1e25]:
          - generic [ref=f1e26]:
            - generic [ref=f1e27]:
              - generic [ref=f1e28]: Build Error
              - generic [ref=f1e30]:
                - button "Copy Error Info" [ref=f1e31] [cursor=pointer]
                - button "No related documentation found" [disabled] [ref=f1e34]
                - button "Attach Node.js inspector" [ref=f1e37] [cursor=pointer]
            - generic [ref=f1e46]: Error evaluating Node.js code
          - generic [ref=f1e49]:
            - generic [ref=f1e51]:
              - generic [ref=f1e55]: ./app/globals.css
              - button "Open in editor" [ref=f1e56] [cursor=pointer]
            - generic [ref=f1e60]: "Error evaluating Node.js code CssSyntaxError: tailwindcss: /home/ubuntu/repositorios/CapitalFourge/frontend/app/globals.css:1:1: Can't resolve 'tw-animate-css' in '/home/ubuntu/repositorios/CapitalFourge/frontend/app' [at Input.error (turbopack:///[project]/node_modules/.pnpm/postcss@8.4.31/node_modules/postcss/lib/input.js:106:16)] [at Root.error (turbopack:///[project]/node_modules/.pnpm/postcss@8.4.31/node_modules/postcss/lib/node.js:115:32)] [at Object.Once (/home/ubuntu/repositorios/CapitalFourge/frontend/node_modules/.pnpm/@tailwindcss+postcss@4.3.3/node_modules/@tailwindcss/postcss/dist/index.js:10:7013)] [at process.processTicksAndRejections (node:internal/process/task_queues:103:5)] [at async LazyResult.runAsync (turbopack:///[project]/node_modules/.pnpm/postcss@8.4.31/node_modules/postcss/lib/lazy-result.js:261:11)] [at async transform (turbopack:///[turbopack-node]/transforms/postcss.ts:70:34)] [at async run (turbopack:///[turbopack-node]/ipc/evaluate.ts:92:23)] Import trace: Client Component Browser: ./app/globals.css [Client Component Browser] ./app/layout.tsx [Server Component]"
        - generic [ref=f1e63]: "1"
        - generic [ref=f1e64]: "2"
    - generic [ref=f1e69] [cursor=pointer]:
      - button "Open Next.js Dev Tools" [ref=f1e70]
      - button "Open issues overlay" [ref=f1e75]:
        - generic [ref=f1e76]:
          - generic [ref=f1e77]: "0"
          - generic [ref=f1e78]: "1"
        - generic [ref=f1e79]: Issue
  - alert [ref=f1e80]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | const TEST_USER = {
  4   |   email: 'analyst@firma.com',
  5   |   password: 'TestPass123!',
  6   | };
  7   | 
  8   | const PORTFOLIO_NAME = 'Test E2E Portfolio';
  9   | const SYMBOL = 'AAPL';
  10  | const QUANTITY = 10;
  11  | 
  12  | async function getDialog(page: import('@playwright/test').Page) {
  13  |   // Get the currently open dialog
  14  |   return page.locator('[role="dialog"]').first();
  15  | }
  16  | 
  17  | async function waitForDialog(page: import('@playwright/test').Page) {
  18  |   await page.waitForSelector('[role="dialog"]', { state: 'visible', timeout: 10000 });
  19  |   return getDialog(page);
  20  | }
  21  | 
  22  | async function closeDialog(page: import('@playwright/test').Page) {
  23  |   // Try to close dialog by pressing Escape
  24  |   await page.keyboard.press('Escape');
  25  |   await page.waitForTimeout(300);
  26  |   // Also try clicking the close button if visible
  27  |   const closeBtn = page.locator('[role="dialog"] button:has(svg.lucide-x), [role="dialog"] button[aria-label="Close"]').first();
  28  |   if (await closeBtn.isVisible({ timeout: 500 }).catch(() => false)) {
  29  |     await closeBtn.click({ force: true });
  30  |     await page.waitForTimeout(300);
  31  |   }
  32  | }
  33  | 
  34  | async function click(page: import('@playwright/test').Page, locator: import('@playwright/test').Locator) {
  35  |   await locator.click({ force: true, timeout: 15000 });
  36  |   await page.waitForTimeout(500);
  37  | }
  38  | 
  39  | async function fill(page: import('@playwright/test').Page, locator: import('@playwright/test').Locator, value: string) {
> 40  |   await locator.fill(value);
      |                 ^ Error: locator.fill: Test timeout of 60000ms exceeded.
  41  |   await page.waitForTimeout(200);
  42  | }
  43  | 
  44  | async function login(page: import('@playwright/test').Page) {
  45  |   await page.goto('/login');
  46  |   await page.waitForLoadState('networkidle');
  47  |   await fill(page, page.locator('input[type="email"]'), TEST_USER.email);
  48  |   await fill(page, page.locator('input[type="password"]'), TEST_USER.password);
  49  |   await click(page, page.locator('button:has-text("Ingresar")'));
  50  |   await page.waitForURL('/dashboard');
  51  |   await page.waitForTimeout(1000);
  52  | }
  53  | 
  54  | async function navigateToPortfolios(page: import('@playwright/test').Page) {
  55  |   const portfoliosLink = page.locator('a[href="/portfolio"]').first();
  56  |   await click(page, portfoliosLink);
  57  |   await page.waitForURL('/portfolio');
  58  |   await page.waitForTimeout(1000);
  59  | }
  60  | 
  61  | async function gotoPortfolioDetail(page: import('@playwright/test').Page, portfolioName = PORTFOLIO_NAME) {
  62  |   await page.goto('/portfolio');
  63  |   await page.waitForLoadState('networkidle');
  64  |   await page.waitForTimeout(1000);
  65  |   const portfolioLink = page.locator(`a:has-text("${portfolioName}")`).first();
  66  |   await click(page, portfolioLink);
  67  |   await page.waitForURL(/\/portfolio\/[a-f0-9-]+/);
  68  |   await page.waitForTimeout(1000);
  69  | }
  70  | 
  71  | async function createPortfolio(page: import('@playwright/test').Page, name: string, description: string) {
  72  |   const createBtn = page.locator('button:has-text("NUEVA ESTRATEGIA")').first();
  73  |   await click(page, createBtn);
  74  |   
  75  |   const dialog = await waitForDialog(page);
  76  |   
  77  |   await fill(page, dialog.locator('input[placeholder*="Ej:"]'), name);
  78  |   await fill(page, dialog.locator('input[placeholder*="Detalles"]'), description);
  79  |   
  80  |   await click(page, dialog.locator('button:has-text("DESPLEGAR ESTRATEGIA")').first());
  81  |   
  82  |   await page.waitForSelector(`text=${name}`, { timeout: 10000 });
  83  |   await closeDialog(page);
  84  | }
  85  | 
  86  | async function deposit(page: import('@playwright/test').Page, amount: string) {
  87  |   const depositBtn = page.locator('button:has-text("Recarga")').first();
  88  |   await click(page, depositBtn);
  89  |   
  90  |   const dialog = await waitForDialog(page);
  91  |   
  92  |   await fill(page, dialog.locator('input[placeholder*="0.00"]').first(), amount);
  93  |   
  94  |   await click(page, dialog.locator('button:has-text("CONFIRMAR DEPÓSITO")').first());
  95  |   
  96  |   await page.waitForSelector('text=/Depósito|depósito|exitoso/i', { timeout: 10000 });
  97  |   await closeDialog(page);
  98  | }
  99  | 
  100 | async function buyAsset(page: import('@playwright/test').Page, symbol: string, quantity: string) {
  101 |   const buyBtn = page.locator('button[aria-haspopup="dialog"]').filter({ hasText: 'COMPRAR' }).first();
  102 |   await click(page, buyBtn);
  103 |   
  104 |   const dialog = await waitForDialog(page);
  105 |   
  106 |   // Symbol input
  107 |   await fill(page, dialog.locator('input[placeholder*="AAPL"], input[placeholder*="BTC"], input[placeholder*="ETH"]'), symbol);
  108 |   
  109 |   // Quantity input - first number input
  110 |   const quantityInput = dialog.locator('input[type="number"]').first();
  111 |   await fill(page, quantityInput, quantity);
  112 |   
  113 |   await click(page, dialog.locator('button:has-text("Comprar ahora")').first());
  114 |   
  115 |   await page.waitForSelector('text=/Compra|compra|exitoso|ejecutada/i', { timeout: 15000 });
  116 |   await closeDialog(page);
  117 | }
  118 | 
  119 | async function sellAsset(page: import('@playwright/test').Page, symbol: string, quantity: string) {
  120 |   const sellBtn = page.locator('button[aria-haspopup="dialog"]').filter({ hasText: 'VENDER' }).first();
  121 |   await click(page, sellBtn);
  122 |   
  123 |   await page.waitForTimeout(500);
  124 |   const dialog = await waitForDialog(page);
  125 |   
  126 |   // Symbol input (uses SymbolAutocomplete like buy)
  127 |   await fill(page, dialog.locator('input[placeholder*="AAPL"], input[placeholder*="BTC"], input[placeholder*="ETH"]'), symbol);
  128 |   
  129 |   const quantityInput = dialog.locator('input[type="number"]').first();
  130 |   await fill(page, quantityInput, quantity);
  131 |   
  132 |   await click(page, dialog.locator('button:has-text("Vender ahora")').first());
  133 |   
  134 |   await page.waitForSelector('text=/Venta|venta|exitoso|ejecutada/i', { timeout: 15000 });
  135 |   await closeDialog(page);
  136 | }
  137 | 
  138 | async function withdraw(page: import('@playwright/test').Page, amount: string) {
  139 |   const withdrawBtn = page.locator('button:has-text("Retiro")').first();
  140 |   await click(page, withdrawBtn);
```