# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: critical-flows.spec.ts >> Capital Fourge E2E Tests >> E2E-01: Login → Dashboard shows data (not 0)
- Location: e2e/critical-flows.spec.ts:201:7

# Error details

```
Error: page.waitForResponse: Target page, context or browser has been closed
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
  40  |   await locator.fill(value);
  41  |   await page.waitForTimeout(200);
  42  | }
  43  | 
  44  | async function login(page: import('@playwright/test').Page) {
  45  |   await page.goto('/login');
  46  |   await page.waitForLoadState('networkidle');
  47  |   
  48  |   // In CI, user is pre-seeded via REST API. Locally, try to register if needed.
  49  |   if (!process.env.CI) {
  50  |     const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:10000';
  51  |     try {
  52  |       const response = await page.request.post(`${apiBaseUrl}/api/auth/register`, {
  53  |         data: { username: 'analyst', email: 'analyst@firma.com', password: 'TestPass123!' }
  54  |       });
  55  |       console.log('Local register response:', response.status());
  56  |     } catch (e) {
  57  |       console.log('Local register attempt failed:', e);
  58  |     }
  59  |   }
  60  |   
  61  |   await fill(page, page.locator('input[type="email"]'), TEST_USER.email);
  62  |   await fill(page, page.locator('input[type="password"]'), TEST_USER.password);
  63  |   
  64  |   // Wait for login response
  65  |   const [response] = await Promise.all([
> 66  |     page.waitForResponse(r => r.url().includes('/api/auth/login') && r.request().method() === 'POST'),
      |          ^ Error: page.waitForResponse: Target page, context or browser has been closed
  67  |     click(page, page.locator('button:has-text("Ingresar")'))
  68  |   ]);
  69  |   console.log('Login form submit response:', response.status());
  70  |   const respBody = await response.text();
  71  |   console.log('Login form submit body:', respBody);
  72  |   
  73  |   // Check for error messages ONLY (not success toasts)
  74  |   const errorToast = page.locator('[role="alert"], .sonner-toast, [data-sonner-toast], .toast-error').first();
  75  |   // Only consider it an error if it contains error-like text
  76  |   if (await errorToast.isVisible({ timeout: 3000 }).catch(() => false)) {
  77  |     const toastText = await errorToast.textContent();
  78  |     if (toastText && /error|failed|invalid|incorrect|denied|unauthorized/i.test(toastText)) {
  79  |       console.log('Error toast visible:', toastText);
  80  |       throw new Error(`Login error: ${toastText}`);
  81  |     } else {
  82  |       console.log('Success/info toast visible (ignored):', toastText);
  83  |     }
  84  |   }
  85  |   
  86  |   // Wait for navigation
  87  |   await page.waitForURL('**/dashboard', { timeout: 30000 });
  88  |   await page.waitForLoadState('networkidle');
  89  |   await page.waitForTimeout(1000);
  90  | }
  91  | 
  92  | async function navigateToPortfolios(page: import('@playwright/test').Page) {
  93  |   const portfoliosLink = page.locator('a[href="/portfolio"]').first();
  94  |   await click(page, portfoliosLink);
  95  |   await page.waitForURL('/portfolio');
  96  |   await page.waitForTimeout(1000);
  97  | }
  98  | 
  99  | async function gotoPortfolioDetail(page: import('@playwright/test').Page, portfolioName = PORTFOLIO_NAME) {
  100 |   await page.goto('/portfolio');
  101 |   await page.waitForLoadState('networkidle');
  102 |   await page.waitForTimeout(1000);
  103 |   const portfolioLink = page.locator(`a:has-text("${portfolioName}")`).first();
  104 |   await click(page, portfolioLink);
  105 |   await page.waitForURL(/\/portfolio\/[a-f0-9-]+/);
  106 |   await page.waitForTimeout(1000);
  107 | }
  108 | 
  109 | async function createPortfolio(page: import('@playwright/test').Page, name: string, description: string) {
  110 |   const createBtn = page.locator('button:has-text("NUEVA ESTRATEGIA")').first();
  111 |   // Wait for button to be visible and enabled
  112 |   await expect(createBtn).toBeVisible({ timeout: 15000 });
  113 |   await click(page, createBtn);
  114 |   
  115 |   const dialog = await waitForDialog(page);
  116 |   
  117 |   await fill(page, dialog.locator('input[placeholder*="Ej:"]'), name);
  118 |   await fill(page, dialog.locator('input[placeholder*="Detalles"]'), description);
  119 |   
  120 |   await click(page, dialog.locator('button:has-text("DESPLEGAR ESTRATEGIA")').first());
  121 |   
  122 |   await page.waitForSelector(`text=${name}`, { timeout: 10000 });
  123 |   await closeDialog(page);
  124 | }
  125 | 
  126 | async function deposit(page: import('@playwright/test').Page, amount: string) {
  127 |   const depositBtn = page.locator('button:has-text("Recarga")').first();
  128 |   await click(page, depositBtn);
  129 |   
  130 |   const dialog = await waitForDialog(page);
  131 |   
  132 |   await fill(page, dialog.locator('input[placeholder*="0.00"]').first(), amount);
  133 |   
  134 |   await click(page, dialog.locator('button:has-text("CONFIRMAR DEPÓSITO")').first());
  135 |   
  136 |   await page.waitForSelector('text=/Depósito|depósito|exitoso/i', { timeout: 10000 });
  137 |   await closeDialog(page);
  138 | }
  139 | 
  140 | async function buyAsset(page: import('@playwright/test').Page, symbol: string, quantity: string) {
  141 |   const buyBtn = page.locator('button[aria-haspopup="dialog"]').filter({ hasText: 'COMPRAR' }).first();
  142 |   await click(page, buyBtn);
  143 |   
  144 |   const dialog = await waitForDialog(page);
  145 |   
  146 |   // Symbol input
  147 |   await fill(page, dialog.locator('input[placeholder*="AAPL"], input[placeholder*="BTC"], input[placeholder*="ETH"]'), symbol);
  148 |   
  149 |   // Quantity input - first number input
  150 |   const quantityInput = dialog.locator('input[type="number"]').first();
  151 |   await fill(page, quantityInput, quantity);
  152 |   
  153 |   await click(page, dialog.locator('button:has-text("Comprar ahora")').first());
  154 |   
  155 |   await page.waitForSelector('text=/Compra|compra|exitoso|ejecutada/i', { timeout: 15000 });
  156 |   await closeDialog(page);
  157 | }
  158 | 
  159 | async function sellAsset(page: import('@playwright/test').Page, symbol: string, quantity: string) {
  160 |   const sellBtn = page.locator('button[aria-haspopup="dialog"]').filter({ hasText: 'VENDER' }).first();
  161 |   await click(page, sellBtn);
  162 |   
  163 |   await page.waitForTimeout(500);
  164 |   const dialog = await waitForDialog(page);
  165 |   
  166 |   // Symbol input (uses SymbolAutocomplete like buy)
```