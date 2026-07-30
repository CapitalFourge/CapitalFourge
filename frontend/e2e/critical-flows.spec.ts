import { test, expect } from '@playwright/test';

const TEST_USER = {
  email: 'analyst@firma.com',
  password: 'TestPass123!',
};

const PORTFOLIO_NAME = 'Test E2E Portfolio';
const SYMBOL = 'AAPL';
const QUANTITY = 10;

async function getDialog(page: import('@playwright/test').Page) {
  // Get the currently open dialog
  return page.locator('[role="dialog"]').first();
}

async function waitForDialog(page: import('@playwright/test').Page) {
  await page.waitForSelector('[role="dialog"]', { state: 'visible', timeout: 10000 });
  return getDialog(page);
}

async function closeDialog(page: import('@playwright/test').Page) {
  // Try to close dialog by pressing Escape
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  // Also try clicking the close button if visible
  const closeBtn = page.locator('[role="dialog"] button:has(svg.lucide-x), [role="dialog"] button[aria-label="Close"]').first();
  if (await closeBtn.isVisible({ timeout: 500 }).catch(() => false)) {
    await closeBtn.click({ force: true });
    await page.waitForTimeout(300);
  }
}

async function click(page: import('@playwright/test').Page, locator: import('@playwright/test').Locator) {
  await locator.click({ force: true, timeout: 15000 });
  await page.waitForTimeout(500);
}

async function fill(page: import('@playwright/test').Page, locator: import('@playwright/test').Locator, value: string) {
  await locator.fill(value);
  await page.waitForTimeout(200);
}

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  
  // First, try to register the test user (idempotent - will fail silently if exists)
  try {
    const response = await page.request.post('/api/auth/register', {
      data: {
        username: 'analyst',
        email: 'analyst@firma.com',
        password: 'TestPass123!'
      }
    });
    console.log('Register response:', response.status());
  } catch (e) {
    console.log('Register attempt failed (user may exist):', e);
  }
  
  await fill(page, page.locator('input[type="email"]'), TEST_USER.email);
  await fill(page, page.locator('input[type="password"]'), TEST_USER.password);
  await click(page, page.locator('button:has-text("Ingresar")'));
  
  // Wait for navigation with longer timeout and better condition
  await page.waitForURL('**/dashboard', { timeout: 30000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
}

async function navigateToPortfolios(page: import('@playwright/test').Page) {
  const portfoliosLink = page.locator('a[href="/portfolio"]').first();
  await click(page, portfoliosLink);
  await page.waitForURL('/portfolio');
  await page.waitForTimeout(1000);
}

async function gotoPortfolioDetail(page: import('@playwright/test').Page, portfolioName = PORTFOLIO_NAME) {
  await page.goto('/portfolio');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  const portfolioLink = page.locator(`a:has-text("${portfolioName}")`).first();
  await click(page, portfolioLink);
  await page.waitForURL(/\/portfolio\/[a-f0-9-]+/);
  await page.waitForTimeout(1000);
}

async function createPortfolio(page: import('@playwright/test').Page, name: string, description: string) {
  const createBtn = page.locator('button:has-text("NUEVA ESTRATEGIA")').first();
  await click(page, createBtn);
  
  const dialog = await waitForDialog(page);
  
  await fill(page, dialog.locator('input[placeholder*="Ej:"]'), name);
  await fill(page, dialog.locator('input[placeholder*="Detalles"]'), description);
  
  await click(page, dialog.locator('button:has-text("DESPLEGAR ESTRATEGIA")').first());
  
  await page.waitForSelector(`text=${name}`, { timeout: 10000 });
  await closeDialog(page);
}

async function deposit(page: import('@playwright/test').Page, amount: string) {
  const depositBtn = page.locator('button:has-text("Recarga")').first();
  await click(page, depositBtn);
  
  const dialog = await waitForDialog(page);
  
  await fill(page, dialog.locator('input[placeholder*="0.00"]').first(), amount);
  
  await click(page, dialog.locator('button:has-text("CONFIRMAR DEPÓSITO")').first());
  
  await page.waitForSelector('text=/Depósito|depósito|exitoso/i', { timeout: 10000 });
  await closeDialog(page);
}

async function buyAsset(page: import('@playwright/test').Page, symbol: string, quantity: string) {
  const buyBtn = page.locator('button[aria-haspopup="dialog"]').filter({ hasText: 'COMPRAR' }).first();
  await click(page, buyBtn);
  
  const dialog = await waitForDialog(page);
  
  // Symbol input
  await fill(page, dialog.locator('input[placeholder*="AAPL"], input[placeholder*="BTC"], input[placeholder*="ETH"]'), symbol);
  
  // Quantity input - first number input
  const quantityInput = dialog.locator('input[type="number"]').first();
  await fill(page, quantityInput, quantity);
  
  await click(page, dialog.locator('button:has-text("Comprar ahora")').first());
  
  await page.waitForSelector('text=/Compra|compra|exitoso|ejecutada/i', { timeout: 15000 });
  await closeDialog(page);
}

async function sellAsset(page: import('@playwright/test').Page, symbol: string, quantity: string) {
  const sellBtn = page.locator('button[aria-haspopup="dialog"]').filter({ hasText: 'VENDER' }).first();
  await click(page, sellBtn);
  
  await page.waitForTimeout(500);
  const dialog = await waitForDialog(page);
  
  // Symbol input (uses SymbolAutocomplete like buy)
  await fill(page, dialog.locator('input[placeholder*="AAPL"], input[placeholder*="BTC"], input[placeholder*="ETH"]'), symbol);
  
  const quantityInput = dialog.locator('input[type="number"]').first();
  await fill(page, quantityInput, quantity);
  
  await click(page, dialog.locator('button:has-text("Vender ahora")').first());
  
  await page.waitForSelector('text=/Venta|venta|exitoso|ejecutada/i', { timeout: 15000 });
  await closeDialog(page);
}

async function withdraw(page: import('@playwright/test').Page, amount: string) {
  const withdrawBtn = page.locator('button:has-text("Retiro")').first();
  await click(page, withdrawBtn);
  
  const dialog = await waitForDialog(page);
  
  // Switch to Retiro tab
  await click(page, dialog.locator('button:has-text("RETIRO")').first());
  
  await fill(page, dialog.locator('input[placeholder*="0.00"]').first(), amount);
  
  await click(page, dialog.locator('button:has-text("CONFIRMAR RETIRO")').first());
  
  await page.waitForSelector('text=/Retiro|retiro|exitoso/i', { timeout: 10000 });
  await closeDialog(page);
}

test.describe('Capital Fourge E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForTimeout(500);
  });

  test('E2E-01: Login → Dashboard shows data (not 0)', async ({ page }) => {
    await test.step('Login', async () => {
      await login(page);
    });

    await test.step('Verify Dashboard loads with non-zero data', async () => {
      await expect(page.locator('h1, h2').filter({ hasText: /Hola|Welcome|testuser|Panel principal/i })).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=/Patrimonio|Total|Balance/i')).toBeVisible({ timeout: 10000 });
      const totalTile = page.locator('text=/Patrimonio|Total|Balance/i').locator('..').locator('..');
      await expect(totalTile).not.toContainText('$0.00');
    });
  });

  test('E2E-02: Create Portfolio → Deposit → Dashboard updates', async ({ page }) => {
    await test.step('Login', async () => {
      await login(page);
    });

    await test.step('Navigate to Portfolios', async () => {
      await navigateToPortfolios(page);
    });

    await test.step('Create new portfolio', async () => {
      await createPortfolio(page, PORTFOLIO_NAME, 'E2E Test Portfolio');
    });

    await test.step('Navigate to Portfolio Detail', async () => {
      await gotoPortfolioDetail(page);
    });

    await test.step('Go back to Dashboard for deposit', async () => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    });

    await test.step('Deposit cash', async () => {
      await deposit(page, '10000');
    });

    await test.step('Verify Dashboard reflects deposit', async () => {
      await page.goto('/dashboard');
      await expect(page.locator('text=/Patrimonio|Total|Balance/i')).toBeVisible({ timeout: 10000 });
      const totalTile = page.locator('text=/Patrimonio|Total|Balance/i').locator('..').locator('..');
      await expect(totalTile).not.toContainText('$0.00');
    });
  });

  test('E2E-03: Buy Asset → Dashboard updates invested/total', async ({ page }) => {
    await test.step('Login', async () => {
      await login(page);
    });

    await test.step('Buy asset from Dashboard', async () => {
      await buyAsset(page, SYMBOL, String(QUANTITY));
    });

    await test.step('Verify Dashboard shows invested amount', async () => {
      await page.goto('/dashboard');
      await expect(page.locator('text=/Capital invertido|Invertido|Invested/i')).toBeVisible({ timeout: 10000 });
      const investedTile = page.locator('text=/Capital invertido|Invertido|Invested/i').locator('..').locator('..');
      await expect(investedTile).not.toContainText('$0.00');
    });
  });

  test('E2E-04: Sell Asset → Dashboard updates cash/invested', async ({ page }) => {
    await test.step('Login', async () => {
      await login(page);
    });

    await test.step('Sell asset from Dashboard', async () => {
      await sellAsset(page, SYMBOL, String(QUANTITY));
    });

    await test.step('Verify Dashboard shows updated cash', async () => {
      await page.goto('/dashboard');
      await expect(page.locator('text=/Caja disponible|Disponible|Cash|Available/i')).toBeVisible({ timeout: 10000 });
      const cashTile = page.locator('text=/Caja disponible|Disponible|Cash|Available/i').locator('..').locator('..');
      await expect(cashTile).not.toContainText('$0.00');
    });
  });

  test('E2E-05: Withdraw Cash → Dashboard updates', async ({ page }) => {
    await test.step('Login', async () => {
      await login(page);
    });

    await test.step('Withdraw cash from Dashboard', async () => {
      await withdraw(page, '500');
    });

    await test.step('Verify Dashboard reflects withdrawal', async () => {
      await page.goto('/dashboard');
      await expect(page.locator('text=/Patrimonio|Total|Balance/i')).toBeVisible({ timeout: 10000 });
      const totalTile = page.locator('text=/Patrimonio|Total|Balance/i').locator('..').locator('..');
      await expect(totalTile).not.toContainText('$0.00');
    });
  });

  test('E2E-06: Multi-Portfolio → Dashboard shows all', async ({ page }) => {
    await test.step('Login', async () => {
      await login(page);
    });

    await test.step('Create second portfolio', async () => {
      await navigateToPortfolios(page);
      await createPortfolio(page, 'Second Portfolio', 'Second E2E Test');
    });

    await test.step('Verify Dashboard shows both portfolios', async () => {
      await page.goto('/dashboard');
      await expect(page.locator(`text=${PORTFOLIO_NAME}`).first()).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=Second Portfolio').first()).toBeVisible({ timeout: 10000 });
    });
  });

  test('E2E-07: Performance/ROI Calculation', async ({ page }) => {
    await test.step('Login', async () => {
      await login(page);
    });

    await test.step('Verify performance calculation', async () => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      const performanceElements = page.locator('text=/^\\+.*%/');
      await expect(performanceElements.first()).toBeVisible({ timeout: 10000 });
      const performanceTile = page.locator(`text=${PORTFOLIO_NAME}`).first().locator('..').locator('..');
      await expect(performanceTile).toContainText('%');
    });
  });

  test('E2E-08: Leaderboard Public Access (if available)', async ({ page }) => {
    await test.step('Navigate to Leaderboard', async () => {
      await page.goto('/leaderboard');
      const heading = page.locator('h1, h2, h3').filter({ hasText: /Leaderboard|Ranking|Clasificación|Líderes/i });
      if (await heading.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(heading.first()).toBeVisible();
      } else {
        test.skip();
      }
    });

    await test.step('Verify public portfolios visible', async () => {
      await expect(page.locator(`text=${PORTFOLIO_NAME}`)).toBeVisible({ timeout: 10000 });
    });
  });

  test('E2E-09: Refresh Persistence (F5)', async ({ page }) => {
    await test.step('Login and get initial data', async () => {
      await login(page);
      const initialTotal = await page.locator('text=/Patrimonio|Total|Balance/i').locator('..').locator('..').textContent();
      
      await test.step('Refresh page', async () => {
        await page.reload();
        await page.waitForURL('/dashboard');
        // Wait for the data to load after refresh
        await page.waitForLoadState('networkidle');
        await expect(page.locator('text=/Patrimonio|Total|Balance/i')).toBeVisible({ timeout: 10000 });
        
        const afterRefreshTotal = await page.locator('text=/Patrimonio|Total|Balance/i').locator('..').locator('..').textContent();
        
        await expect(afterRefreshTotal).toBe(initialTotal);
      });
    });
  });

  test('E2E-10: Logout/Login Data Isolation', async ({ page }) => {
    await test.step('Login', async () => {
      await login(page);
    });

    await test.step('Logout', async () => {
      const logoutBtn = page.locator('button:has-text("Cerrar sesión")').first();
      await click(page, logoutBtn);
      await page.waitForURL('/');
    });

    await test.step('Login again', async () => {
      await login(page);
    });

    await test.step('Verify data persists', async () => {
      await expect(page.locator('text=/Patrimonio|Total|Balance/i')).toBeVisible({ timeout: 10000 });
      const totalTile = page.locator('text=/Patrimonio|Total|Balance/i').locator('..').locator('..');
      await expect(totalTile).not.toContainText('$0.00');
      await expect(page.locator(`text=${PORTFOLIO_NAME}`).first()).toBeVisible({ timeout: 10000 });
    });
  });
});