import { test, expect } from '@playwright/test';

test('debug login', async ({ page }) => {
  // Enable console logging
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  
  // Monitor network requests
  page.on('request', req => {
    if (req.url().includes('/api/auth/login')) {
      console.log('LOGIN REQUEST:', req.url(), req.method());
    }
  });
  
  page.on('response', res => {
    if (res.url().includes('/api/auth/login')) {
      console.log('LOGIN RESPONSE:', res.status(), res.url());
    }
  });

  await page.goto('http://localhost:3001/login');
  await page.waitForLoadState('networkidle');
  
  console.log('Page loaded, filling form...');
  await page.fill('input[type="email"]', 'analyst@firma.com');
  await page.fill('input[type="password"]', 'TestPass123!');
  
  console.log('Clicking Ingresar...');
  await page.click('button:has-text("Ingresar")');
  
  // Wait longer and see what happens
  await page.waitForTimeout(10000);
  
  console.log('Current URL:', page.url());
  console.log('Page content:', await page.textContent('body'));
});
