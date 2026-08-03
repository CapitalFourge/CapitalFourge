import { test, expect } from '@playwright/test';

const TEST_USER = {
  email: 'analyst@firma.com',
  password: 'TestPass123!',
};

const PORTFOLIO_NAME = 'Test E2E Portfolio';
const SYMBOL = 'AAPL';
const QUANTITY = 10;

async function getDialog(page: import('@playwright/test').Page) {
  return page.locator('[role="dialog"]').first();
}

async function waitForDialog(page: import('@playwright/test').Page) {
  await page.waitForSelector('[role="dialog"]', { state: 'visible', timeout: 10000 });
  return getDialog(page);
}

async function closeDialog(page: import('@playwright/test').Page) {
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
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

  if (!process.env.CI) {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:10000';
    try {
      const response = await page.request.post(`${apiBaseUrl}/api/auth/register`, {
        data: { username: 'analyst', email: 'analyst@firma.com', password: 'TestPass123!' }
      });
      console.log('Local register response:', response.status());
    } catch (e) {
      console.log('Local register attempt failed:', e);
    }
  }

  await fill(page, page.locator('input[type="email"]'), TEST_USER.email);
  await fill(page, page.locator('input[type="password"]'), TEST_USER.password);

  // Click login button - no API response to wait for (handled by AuthContext)
  await click(page, page.locator('button:has-text("Ingresar")'));

  // Wait for navigation to dashboard
  await page.waitForURL('**/dashboard', { timeout: 30000 });
  await page.waitForLoadState('networkidle');
  
  // Wait for dashboard to be ready
  await waitForDashboardReady(page);
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
  await expect(createBtn).toBeVisible({ timeout: 15000 });
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
  // Wait for dashboard to be fully loaded
  await page.waitForSelector('.metric-tile', { timeout: 30000 });
  
  const buyBtn = page.locator('button[aria-haspopup="dialog"]').filter({ hasText: 'COMPRAR' }).first();
  await expect(buyBtn).toBeVisible({ timeout: 15000 });
  await click(page, buyBtn);

  const dialog = await waitForDialog(page);

  await fill(page, dialog.locator('input[placeholder*="AAPL"], input[placeholder*="BTC"], input[placeholder*="ETH"]'), symbol);

  const quantityInput = dialog.locator('input[type="number"]').first();
  await fill(page, quantityInput, quantity);

  await click(page, dialog.locator('button:has-text("Comprar ahora")').first());

  await page.waitForSelector('text=/Compra|compra|exitoso|ejecutada/i', { timeout: 15000 });
  await closeDialog(page);
}

async function sellAsset(page: import('@playwright/test').Page, symbol: string, quantity: string) {
  const sellBtn = page.locator('button[aria-haspopup="dialog"]').filter({ hasText: 'VENDER' }).first();
  await click(page, sellBtn);

  // Wait for the NEW sell dialog to appear (not a stale one from buy)
  const dialog = page.locator('[role="dialog"]').first();
  await expect(dialog).toBeVisible({ timeout: 10000 });
  
  // Verify it's the sell dialog by checking for "Vender ahora" button
  await expect(dialog.locator('button:has-text("Vender ahora")')).toBeVisible({ timeout: 5000 });

  // In sell mode with positions, Symbol is a native <select>, not a combobox
  // Wait for either the native select OR combobox to be present
  const nativeSelect = dialog.locator('select').first();
  const symbolCombobox = dialog.locator('[role="combobox"]').nth(1); // 2nd combobox if exists
  
  let symbolField;
  const hasNativeSelect = await nativeSelect.isVisible({ timeout: 5000 }).catch(() => false);
  if (hasNativeSelect) {
    symbolField = nativeSelect;
  } else {
    // Fallback to combobox (sell without positions uses autocomplete)
    await expect(symbolCombobox).toBeVisible({ timeout: 10000 });
    symbolField = symbolCombobox;
  }
  
  await expect(symbolField).toBeVisible({ timeout: 10000 });
  
  if (hasNativeSelect) {
    // Native select - use selectOption
    await symbolField.selectOption(symbol);
  } else {
    // Combobox - click to open, wait for option, click
    await click(page, symbolField);
    await page.waitForTimeout(500);
    await dialog.locator('[role="option"]:has-text("Seleccionar activo")').first().waitFor({ state: 'attached', timeout: 10000 });
    const symbolOption = dialog.locator('[role="option"]:has-text("AAPL")').first();
    await expect(symbolOption).toBeVisible({ timeout: 5000 });
    await click(page, symbolOption);
  }
  await page.waitForTimeout(500);

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

  await click(page, dialog.locator('button:has-text("RETIRO")').first());

  await fill(page, dialog.locator('input[placeholder*="0.00"]').first(), amount);

  await click(page, dialog.locator('button:has-text("CONFIRMAR RETIRO")').first());

  await page.waitForSelector('text=/Retiro|retiro|exitoso/i', { timeout: 10000 });
  await closeDialog(page);
}

async function checkDashboardValues(page: import('@playwright/test').Page) {
  const values = page.locator('text=/\\$[0-9,.]+/');
  await expect(values.first()).toBeVisible({ timeout: 10000 });
  const count = await values.count();
  let foundNonZero = false;
  for (let i = 0; i < count; i++) {
    const text = await values.nth(i).textContent();
    if (text && !text.includes('$0.00') && !text.includes('$0,00')) {
      foundNonZero = true;
      break;
    }
  }
  expect(foundNonZero).toBeTruthy();
}

async function waitForDashboardReady(page: import('@playwright/test').Page) {
  await page.waitForURL('**/dashboard');
  await page.waitForLoadState('networkidle');

  // Wait for dashboard query to complete - wait for stats grid
  await page.waitForSelector('.metric-tile', { timeout: 30000 });

  // Close welcome dialog if present
  const welcomeDialog = page.locator('button:has-text("Entendido, empecemos")');
  if (await welcomeDialog.isVisible({ timeout: 3000 }).catch(() => false)) {
    await welcomeDialog.click();
    await page.waitForTimeout(500);
  }
}

test.describe('Capital Fourge E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForTimeout(500);
  });

  test('E2E-01: Login -> Dashboard shows data (not 0)', async ({ page }) => {
    await test.step('Login', async () => {
      await login(page);
    });

    await test.step('Verify Dashboard loads with non-zero data', async () => {
      await waitForDashboardReady(page);
      await checkDashboardValues(page);
    });
  });

  test('E2E-02: Create Portfolio -> Deposit -> Dashboard updates', async ({ page }) => {
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
      await waitForDashboardReady(page);
      await checkDashboardValues(page);
    });
  });

  test('E2E-03: Buy Asset -> Dashboard updates invested/total', async ({ page }) => {
    await test.step('Login', async () => {
      await login(page);
    });

    await test.step('Buy asset from Dashboard', async () => {
      await buyAsset(page, SYMBOL, String(QUANTITY));
    });

    await test.step('Verify Dashboard shows invested amount', async () => {
      await waitForDashboardReady(page);
      await checkDashboardValues(page);
    });
  });

  test('E2E-04: Sell Asset -> Dashboard updates cash/invested', async ({ page }) => {
    await test.step('Login', async () => {
      await login(page);
    });

    await test.step('Navigate to Portfolios and create one', async () => {
      await navigateToPortfolios(page);
      await createPortfolio(page, PORTFOLIO_NAME, 'E2E Test Portfolio');
    });

    await test.step('Go back to Dashboard', async () => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await waitForDashboardReady(page);
    });

    await test.step('Buy asset first (need position to sell)', async () => {
      await buyAsset(page, SYMBOL, String(QUANTITY));
    });

    await test.step('Sell asset from Dashboard', async () => {
      await sellAsset(page, SYMBOL, String(QUANTITY));
    });

    await test.step('Verify Dashboard shows updated cash', async () => {
      await waitForDashboardReady(page);
      await checkDashboardValues(page);
    });
  });

  test('E2E-05: Withdraw Cash -> Dashboard updates', async ({ page }) => {
    await test.step('Login', async () => {
      await login(page);
    });

    await test.step('Withdraw cash from Dashboard', async () => {
      await withdraw(page, '500');
    });

    await test.step('Verify Dashboard reflects withdrawal', async () => {
      await waitForDashboardReady(page);
      await checkDashboardValues(page);
    });
  });

  test('E2E-06: Multi-Portfolio -> Dashboard shows all', async ({ page }) => {
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
      await waitForDashboardReady(page);
      // Check for any percentage value (positive or negative)
      const percentageValues = page.locator('text=/[+-]\\d+(\\.\\d+)?%/');
      await expect(percentageValues.first()).toBeVisible({ timeout: 10000 });
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
      await waitForDashboardReady(page);
      const values = page.locator('text=/\\$[0-9,.]+/');
      await expect(values.first()).toBeVisible({ timeout: 10000 });
      const count = await values.count();
      let initialValue = '';
      for (let i = 0; i < count; i++) {
        const text = await values.nth(i).textContent();
        if (text && !text.includes('$0.00') && !text.includes('$0,00')) {
          initialValue = text;
          break;
        }
      }

      await test.step('Refresh page', async () => {
        await page.reload();
        await page.waitForURL('/dashboard');
        await waitForDashboardReady(page);
        const afterValues = page.locator('text=/\\$[0-9,.]+/');
        await expect(afterValues.first()).toBeVisible({ timeout: 10000 });
        const afterCount = await afterValues.count();
        let foundMatch = false;
        for (let i = 0; i < afterCount; i++) {
          const text = await afterValues.nth(i).textContent();
          if (text === initialValue) {
            foundMatch = true;
            break;
          }
        }
        expect(foundMatch).toBeTruthy();
      });
    });
  });

  test('E2E-10: Logout/Login Data Isolation', async ({ page }) => {
    await test.step('Login', async () => {
      await login(page);
    });

    await test.step('Logout', async () => {
      const logoutBtn = page.locator('button:has-text("Cerrar sesión")').first();
      if (!(await logoutBtn.isVisible({ timeout: 3000 }).catch(() => false))) {
        const altLogout = page.locator('button:has-text("Salir"), button:has-text("Logout"), [aria-label="Cerrar sesión"]').first();
        if (await altLogout.isVisible({ timeout: 3000 }).catch(() => false)) {
          await click(page, altLogout);
        } else {
          const userMenu = page.locator('[aria-label="Usuario"], [aria-label="Perfil"], button:has-text("analyst")').first();
          if (await userMenu.isVisible({ timeout: 3000 }).catch(() => false)) {
            await click(page, userMenu);
            await page.waitForTimeout(500);
            const menuLogout = page.locator('button:has-text("Cerrar sesión"), button:has-text("Salir")').first();
            if (await menuLogout.isVisible({ timeout: 3000 }).catch(() => false)) {
              await click(page, menuLogout);
            }
          }
        }
      } else {
        await click(page, logoutBtn);
      }
      await page.waitForURL('/');
    });

    await test.step('Login again', async () => {
      await login(page);
    });

    await test.step('Verify data persists', async () => {
      await waitForDashboardReady(page);
      await checkDashboardValues(page);
    });
  });
});