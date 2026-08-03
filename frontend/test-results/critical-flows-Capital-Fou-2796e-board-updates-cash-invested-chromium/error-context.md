# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: critical-flows.spec.ts >> Capital Fourge E2E Tests >> E2E-04: Sell Asset -> Dashboard updates cash/invested
- Location: e2e/critical-flows.spec.ts:311:7

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: page.waitForFunction: Test timeout of 60000ms exceeded.
```

# Page snapshot

```yaml
- generic [active] [ref=f1e1]:
  - generic [ref=f1e4]:
    - complementary [ref=f1e5]:
      - generic [ref=f1e6]:
        - link [ref=f1e8] [cursor=pointer]:
          - /url: /dashboard
          - img "Capital Fourge" [ref=f1e9]
        - navigation [ref=f1e10]:
          - link "Resumen" [ref=f1e11] [cursor=pointer]:
            - /url: /dashboard
          - link "Portafolios" [ref=f1e18] [cursor=pointer]:
            - /url: /portfolio
          - link "Mercados" [ref=f1e23] [cursor=pointer]:
            - /url: /explorer
          - link "Estrategias" [ref=f1e28] [cursor=pointer]:
            - /url: /strategies
          - link "Movimientos" [ref=f1e32] [cursor=pointer]:
            - /url: /transactions
          - link "Configuración" [ref=f1e38] [cursor=pointer]:
            - /url: /settings
        - generic [ref=f1e43]:
          - generic [ref=f1e44]:
            - paragraph [ref=f1e45]: Tu cuenta
            - paragraph [ref=f1e46]: Lista para operar
            - generic [ref=f1e47]: Datos en tiempo real
          - button "Cerrar sesión" [ref=f1e49]
    - main [ref=f1e54]:
      - generic [ref=f1e55]:
        - generic [ref=f1e57]:
          - generic [ref=f1e58]:
            - generic [ref=f1e59]:
              - paragraph [ref=f1e60]: Resumen ejecutivo
              - heading "Hola, analyst." [level=1] [ref=f1e61]
              - paragraph [ref=f1e62]: Supervisa caja, exposicion y estado general de tus carteras desde una sola superficie de trabajo.
            - generic [ref=f1e63]:
              - generic [ref=f1e64]:
                - button "Recarga" [ref=f1e65]
                - button "Retiro" [ref=f1e71]
              - generic [ref=f1e80]:
                - paragraph [ref=f1e81]: Sistema
                - paragraph [ref=f1e82]: Conectado en tiempo real
          - generic [ref=f1e83]:
            - generic [ref=f1e84]:
              - paragraph [ref=f1e86]: Patrimonio total
              - paragraph [ref=f1e89]: $0.00
            - generic [ref=f1e90]:
              - paragraph [ref=f1e92]: Caja disponible
              - paragraph [ref=f1e96]: $0.00
            - generic [ref=f1e97]:
              - paragraph [ref=f1e99]: Capital invertido
              - paragraph [ref=f1e103]: $0.00
            - generic [ref=f1e104]:
              - paragraph [ref=f1e106]: Saldo retenido
              - paragraph [ref=f1e110]: $0.00
        - generic [ref=f1e111]:
          - generic [ref=f1e113]:
            - generic [ref=f1e114]:
              - generic [ref=f1e115]:
                - paragraph [ref=f1e116]: Portafolios
                - heading "Vista consolidada de tus carteras" [level=2] [ref=f1e118]
                - paragraph [ref=f1e121]: Revisa desempeno, posiciones activas y accesos directos para operar sin salir del tablero.
              - generic [ref=f1e122]:
                - button "COMPRAR" [ref=f1e123]
                - button "VENDER" [ref=f1e128]
            - generic [ref=f1e133]:
              - generic [ref=f1e134]:
                - generic [ref=f1e135]:
                  - paragraph [ref=f1e136]: Test E2E Portfolio
                  - paragraph [ref=f1e137]: 0 posiciones activas
                - generic [ref=f1e138]:
                  - paragraph [ref=f1e139]: +0.00%
                  - paragraph [ref=f1e140]: Rendimiento
              - generic [ref=f1e141]:
                - generic [ref=f1e142]:
                  - paragraph [ref=f1e143]: Test E2E Portfolio
                  - paragraph [ref=f1e144]: 0 posiciones activas
                - generic [ref=f1e145]:
                  - paragraph [ref=f1e146]: +0.00%
                  - paragraph [ref=f1e147]: Rendimiento
              - generic [ref=f1e148]:
                - generic [ref=f1e149]:
                  - paragraph [ref=f1e150]: Test E2E Portfolio
                  - paragraph [ref=f1e151]: 0 posiciones activas
                - generic [ref=f1e152]:
                  - paragraph [ref=f1e153]: +0.00%
                  - paragraph [ref=f1e154]: Rendimiento
              - generic [ref=f1e155]:
                - generic [ref=f1e156]:
                  - paragraph [ref=f1e157]: Test E2E Portfolio
                  - paragraph [ref=f1e158]: 0 posiciones activas
                - generic [ref=f1e159]:
                  - paragraph [ref=f1e160]: +0.00%
                  - paragraph [ref=f1e161]: Rendimiento
              - generic [ref=f1e162]:
                - generic [ref=f1e163]:
                  - paragraph [ref=f1e164]: Test E2E Portfolio
                  - paragraph [ref=f1e165]: 0 posiciones activas
                - generic [ref=f1e166]:
                  - paragraph [ref=f1e167]: +0.00%
                  - paragraph [ref=f1e168]: Rendimiento
              - generic [ref=f1e169]:
                - generic [ref=f1e170]:
                  - paragraph [ref=f1e171]: Test E2E Portfolio
                  - paragraph [ref=f1e172]: 0 posiciones activas
                - generic [ref=f1e173]:
                  - paragraph [ref=f1e174]: +0.00%
                  - paragraph [ref=f1e175]: Rendimiento
              - generic [ref=f1e176]:
                - generic [ref=f1e177]:
                  - paragraph [ref=f1e178]: Test E2E Portfolio
                  - paragraph [ref=f1e179]: 0 posiciones activas
                - generic [ref=f1e180]:
                  - paragraph [ref=f1e181]: +0.00%
                  - paragraph [ref=f1e182]: Rendimiento
              - generic [ref=f1e183]:
                - generic [ref=f1e184]:
                  - paragraph [ref=f1e185]: Test E2E Portfolio
                  - paragraph [ref=f1e186]: 0 posiciones activas
                - generic [ref=f1e187]:
                  - paragraph [ref=f1e188]: +0.00%
                  - paragraph [ref=f1e189]: Rendimiento
          - generic [ref=f1e190]:
            - generic [ref=f1e192]:
              - paragraph [ref=f1e193]: Volatilidad
              - heading "Activos mas volatiles" [level=2] [ref=f1e194]
              - paragraph [ref=f1e195]: Sigue los instrumentos con mayor desplazamiento reciente junto con su actividad operada para entender por que dominan el flujo.
            - generic [ref=f1e199]:
              - button "Mas volatiles" [ref=f1e200]
              - button "Ganancias" [ref=f1e201]
              - button "Perdidas" [ref=f1e202]
            - generic [ref=f1e203]:
              - generic [ref=f1e204]:
                - generic [ref=f1e205]:
                  - generic [ref=f1e206]:
                    - paragraph [ref=f1e207]: AMZN
                    - paragraph [ref=f1e208]: Amazon.com Inc.
                  - generic [ref=f1e209]:
                    - paragraph [ref=f1e210]: $$271.58
                    - paragraph [ref=f1e211]: +15.32%
                    - paragraph [ref=f1e212]: +$36.08
                - generic [ref=f1e213]:
                  - generic [ref=f1e214]:
                    - paragraph [ref=f1e215]: Volumen operado
                    - paragraph [ref=f1e216]: "0.00"
                  - generic [ref=f1e217]:
                    - paragraph [ref=f1e218]: Lectura
                    - paragraph [ref=f1e219]: Alta variacion con poca actividad interna registrada.
              - generic [ref=f1e220]:
                - generic [ref=f1e221]:
                  - generic [ref=f1e222]:
                    - paragraph [ref=f1e223]: AAPL
                    - paragraph [ref=f1e224]: Apple Inc.
                  - generic [ref=f1e225]:
                    - paragraph [ref=f1e226]: $$308.91
                    - paragraph [ref=f1e227]: "-7.35%"
                    - paragraph [ref=f1e228]: "-$24.52"
                - generic [ref=f1e229]:
                  - generic [ref=f1e230]:
                    - paragraph [ref=f1e231]: Volumen operado
                    - paragraph [ref=f1e232]: "0.00"
                  - generic [ref=f1e233]:
                    - paragraph [ref=f1e234]: Lectura
                    - paragraph [ref=f1e235]: Alta variacion con poca actividad interna registrada.
              - generic [ref=f1e236]:
                - generic [ref=f1e237]:
                  - generic [ref=f1e238]:
                    - paragraph [ref=f1e239]: GOOGL
                    - paragraph [ref=f1e240]: Alphabet Inc.
                  - generic [ref=f1e241]:
                    - paragraph [ref=f1e242]: $$356.13
                    - paragraph [ref=f1e243]: +6.73%
                    - paragraph [ref=f1e244]: +$22.47
                - generic [ref=f1e245]:
                  - generic [ref=f1e246]:
                    - paragraph [ref=f1e247]: Volumen operado
                    - paragraph [ref=f1e248]: "0.00"
                  - generic [ref=f1e249]:
                    - paragraph [ref=f1e250]: Lectura
                    - paragraph [ref=f1e251]: Alta variacion con poca actividad interna registrada.
              - generic [ref=f1e252]:
                - generic [ref=f1e253]:
                  - generic [ref=f1e254]:
                    - paragraph [ref=f1e255]: ADA-USD
                    - paragraph [ref=f1e256]: Cardano
                  - generic [ref=f1e257]:
                    - paragraph [ref=f1e258]: $$0.19
                    - paragraph [ref=f1e259]: +6.48%
                    - paragraph [ref=f1e260]: +$0.01
                - generic [ref=f1e261]:
                  - generic [ref=f1e262]:
                    - paragraph [ref=f1e263]: Volumen operado
                    - paragraph [ref=f1e264]: "0.00"
                  - generic [ref=f1e265]:
                    - paragraph [ref=f1e266]: Lectura
                    - paragraph [ref=f1e267]: Alta variacion con poca actividad interna registrada.
              - generic [ref=f1e268]:
                - generic [ref=f1e269]:
                  - generic [ref=f1e270]:
                    - paragraph [ref=f1e271]: CIBEST
                    - paragraph [ref=f1e272]: CIBEST
                  - generic [ref=f1e273]:
                    - paragraph [ref=f1e274]: $$89,420.00
                    - paragraph [ref=f1e275]: +3.98%
                    - paragraph [ref=f1e276]: +$3,420.00
                - generic [ref=f1e277]:
                  - generic [ref=f1e278]:
                    - paragraph [ref=f1e279]: Volumen operado
                    - paragraph [ref=f1e280]: "0.00"
                  - generic [ref=f1e281]:
                    - paragraph [ref=f1e282]: Lectura
                    - paragraph [ref=f1e283]: Alta variacion con poca actividad interna registrada.
              - generic [ref=f1e284]:
                - generic [ref=f1e285]:
                  - generic [ref=f1e286]:
                    - paragraph [ref=f1e287]: CELSIA
                    - paragraph [ref=f1e288]: CELSIA Energía
                  - generic [ref=f1e289]:
                    - paragraph [ref=f1e290]: $$5,010.00
                    - paragraph [ref=f1e291]: +3.41%
                    - paragraph [ref=f1e292]: +$165.00
                - generic [ref=f1e293]:
                  - generic [ref=f1e294]:
                    - paragraph [ref=f1e295]: Volumen operado
                    - paragraph [ref=f1e296]: "0.00"
                  - generic [ref=f1e297]:
                    - paragraph [ref=f1e298]: Lectura
                    - paragraph [ref=f1e299]: Alta variacion con poca actividad interna registrada.
              - generic [ref=f1e300]:
                - generic [ref=f1e301]:
                  - generic [ref=f1e302]:
                    - paragraph [ref=f1e303]: META
                    - paragraph [ref=f1e304]: Meta Platforms, Inc.
                  - generic [ref=f1e305]:
                    - paragraph [ref=f1e306]: $$556.71
                    - paragraph [ref=f1e307]: +3.28%
                    - paragraph [ref=f1e308]: +$17.68
                - generic [ref=f1e309]:
                  - generic [ref=f1e310]:
                    - paragraph [ref=f1e311]: Volumen operado
                    - paragraph [ref=f1e312]: "0.00"
                  - generic [ref=f1e313]:
                    - paragraph [ref=f1e314]: Lectura
                    - paragraph [ref=f1e315]: Alta variacion con poca actividad interna registrada.
              - generic [ref=f1e316]:
                - generic [ref=f1e317]:
                  - generic [ref=f1e318]:
                    - paragraph [ref=f1e319]: BOGOTA
                    - paragraph [ref=f1e320]: Banco de Bogotá
                  - generic [ref=f1e321]:
                    - paragraph [ref=f1e322]: $$38,720.00
                    - paragraph [ref=f1e323]: +3.25%
                    - paragraph [ref=f1e324]: +$1,220.00
                - generic [ref=f1e325]:
                  - generic [ref=f1e326]:
                    - paragraph [ref=f1e327]: Volumen operado
                    - paragraph [ref=f1e328]: "0.00"
                  - generic [ref=f1e329]:
                    - paragraph [ref=f1e330]: Lectura
                    - paragraph [ref=f1e331]: Alta variacion con poca actividad interna registrada.
  - contentinfo [ref=f1e332]:
    - generic [ref=f1e333]:
      - generic [ref=f1e334]:
        - generic [ref=f1e335]:
          - link [ref=f1e336] [cursor=pointer]:
            - /url: /
            - img "Capital Fourge" [ref=f1e337]
          - paragraph [ref=f1e338]: Empoderando a las personas para aprender, practicar y dominar la inversión a través de la educación y simulaciones realistas del mercado.
          - generic [ref=f1e339]:
            - link "Twitter" [ref=f1e340] [cursor=pointer]:
              - /url: "#"
            - link "Instagram" [ref=f1e343] [cursor=pointer]:
              - /url: "#"
            - link "LinkedIn" [ref=f1e347] [cursor=pointer]:
              - /url: "#"
            - link "GitHub" [ref=f1e352] [cursor=pointer]:
              - /url: "#"
            - link "Email" [ref=f1e356] [cursor=pointer]:
              - /url: mailto:hola@capitalfourge.com
        - generic [ref=f1e360]:
          - paragraph [ref=f1e361]: Plataforma
          - list [ref=f1e362]:
            - listitem [ref=f1e363]:
              - link "Estrategias" [ref=f1e364] [cursor=pointer]:
                - /url: /strategies
            - listitem [ref=f1e365]:
              - link "Portafolios" [ref=f1e366] [cursor=pointer]:
                - /url: /portfolio
            - listitem [ref=f1e367]:
              - link "Mercados" [ref=f1e368] [cursor=pointer]:
                - /url: /explorer
            - listitem [ref=f1e369]:
              - link "Movimientos" [ref=f1e370] [cursor=pointer]:
                - /url: /transactions
        - generic [ref=f1e371]:
          - paragraph [ref=f1e372]: Empresa
          - list [ref=f1e373]:
            - listitem [ref=f1e374]:
              - link "Sobre nosotros" [ref=f1e375] [cursor=pointer]:
                - /url: /about
            - listitem [ref=f1e376]:
              - link "Términos" [ref=f1e377] [cursor=pointer]:
                - /url: /terms
            - listitem [ref=f1e378]:
              - link "Privacidad" [ref=f1e379] [cursor=pointer]:
                - /url: /privacy
            - listitem [ref=f1e380]:
              - generic [ref=f1e384]: Buenos Aires, Argentina
      - generic [ref=f1e385]:
        - paragraph [ref=f1e386]: © 2026 Capital Fourge. Todos los derechos reservados.
        - paragraph [ref=f1e387]: Where Financial Knowledge Takes Shape.
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=f1e393] [cursor=pointer]
  - alert [ref=f1e397]
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
  13  |   return page.locator('[role="dialog"]').first();
  14  | }
  15  | 
  16  | async function waitForDialog(page: import('@playwright/test').Page) {
  17  |   await page.waitForSelector('[role="dialog"]', { state: 'visible', timeout: 10000 });
  18  |   return getDialog(page);
  19  | }
  20  | 
  21  | async function closeDialog(page: import('@playwright/test').Page) {
  22  |   await page.keyboard.press('Escape');
  23  |   await page.waitForTimeout(300);
  24  |   const closeBtn = page.locator('[role="dialog"] button:has(svg.lucide-x), [role="dialog"] button[aria-label="Close"]').first();
  25  |   if (await closeBtn.isVisible({ timeout: 500 }).catch(() => false)) {
  26  |     await closeBtn.click({ force: true });
  27  |     await page.waitForTimeout(300);
  28  |   }
  29  | }
  30  | 
  31  | async function click(page: import('@playwright/test').Page, locator: import('@playwright/test').Locator) {
  32  |   await locator.click({ force: true, timeout: 15000 });
  33  |   await page.waitForTimeout(500);
  34  | }
  35  | 
  36  | async function fill(page: import('@playwright/test').Page, locator: import('@playwright/test').Locator, value: string) {
  37  |   await locator.fill(value);
  38  |   await page.waitForTimeout(200);
  39  | }
  40  | 
  41  | async function login(page: import('@playwright/test').Page) {
  42  |   await page.goto('/login');
  43  |   await page.waitForLoadState('networkidle');
  44  | 
  45  |   if (!process.env.CI) {
  46  |     const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:10000';
  47  |     try {
  48  |       const response = await page.request.post(`${apiBaseUrl}/api/auth/register`, {
  49  |         data: { username: 'analyst', email: 'analyst@firma.com', password: 'TestPass123!' }
  50  |       });
  51  |       console.log('Local register response:', response.status());
  52  |     } catch (e) {
  53  |       console.log('Local register attempt failed:', e);
  54  |     }
  55  |   }
  56  | 
  57  |   await fill(page, page.locator('input[type="email"]'), TEST_USER.email);
  58  |   await fill(page, page.locator('input[type="password"]'), TEST_USER.password);
  59  | 
  60  |   // Click login button - no API response to wait for (handled by AuthContext)
  61  |   await click(page, page.locator('button:has-text("Ingresar")'));
  62  | 
  63  |   // Wait for navigation to dashboard
  64  |   await page.waitForURL('**/dashboard', { timeout: 30000 });
  65  |   await page.waitForLoadState('networkidle');
  66  |   
  67  |   // Wait for Apollo cache to refetch and dashboard data to load (auth token now in localStorage)
  68  |   await page.waitForSelector('.metric-tile', { timeout: 30000 });
  69  |   
  70  |   // Additional wait to ensure GraphQL queries with auth token complete
> 71  |   await page.waitForFunction(
      |              ^ Error: page.waitForFunction: Test timeout of 60000ms exceeded.
  72  |     () => {
  73  |       const elements = document.querySelectorAll('*');
  74  |       return Array.from(elements).some(el => {
  75  |         const text = el.textContent || '';
  76  |         return text.match(/\\$[0-9,.]+/) && !text.includes('$0.00');
  77  |       });
  78  |     },
  79  |     { timeout: 30000 }
  80  |   );
  81  |   
  82  |   await page.waitForTimeout(2000);
  83  | }
  84  | 
  85  | async function navigateToPortfolios(page: import('@playwright/test').Page) {
  86  |   const portfoliosLink = page.locator('a[href="/portfolio"]').first();
  87  |   await click(page, portfoliosLink);
  88  |   await page.waitForURL('/portfolio');
  89  |   await page.waitForTimeout(1000);
  90  | }
  91  | 
  92  | async function gotoPortfolioDetail(page: import('@playwright/test').Page, portfolioName = PORTFOLIO_NAME) {
  93  |   await page.goto('/portfolio');
  94  |   await page.waitForLoadState('networkidle');
  95  |   await page.waitForTimeout(1000);
  96  |   const portfolioLink = page.locator(`a:has-text("${portfolioName}")`).first();
  97  |   await click(page, portfolioLink);
  98  |   await page.waitForURL(/\/portfolio\/[a-f0-9-]+/);
  99  |   await page.waitForTimeout(1000);
  100 | }
  101 | 
  102 | async function createPortfolio(page: import('@playwright/test').Page, name: string, description: string) {
  103 |   const createBtn = page.locator('button:has-text("NUEVA ESTRATEGIA")').first();
  104 |   await expect(createBtn).toBeVisible({ timeout: 15000 });
  105 |   await click(page, createBtn);
  106 | 
  107 |   const dialog = await waitForDialog(page);
  108 | 
  109 |   await fill(page, dialog.locator('input[placeholder*="Ej:"]'), name);
  110 |   await fill(page, dialog.locator('input[placeholder*="Detalles"]'), description);
  111 | 
  112 |   await click(page, dialog.locator('button:has-text("DESPLEGAR ESTRATEGIA")').first());
  113 | 
  114 |   await page.waitForSelector(`text=${name}`, { timeout: 10000 });
  115 |   await closeDialog(page);
  116 | }
  117 | 
  118 | async function deposit(page: import('@playwright/test').Page, amount: string) {
  119 |   const depositBtn = page.locator('button:has-text("Recarga")').first();
  120 |   await click(page, depositBtn);
  121 | 
  122 |   const dialog = await waitForDialog(page);
  123 | 
  124 |   await fill(page, dialog.locator('input[placeholder*="0.00"]').first(), amount);
  125 | 
  126 |   await click(page, dialog.locator('button:has-text("CONFIRMAR DEPÓSITO")').first());
  127 | 
  128 |   await page.waitForSelector('text=/Depósito|depósito|exitoso/i', { timeout: 10000 });
  129 |   await closeDialog(page);
  130 | }
  131 | 
  132 | async function buyAsset(page: import('@playwright/test').Page, symbol: string, quantity: string) {
  133 |   // Wait for dashboard to be fully loaded
  134 |   await page.waitForSelector('.metric-tile', { timeout: 30000 });
  135 |   
  136 |   const buyBtn = page.locator('button[aria-haspopup="dialog"]').filter({ hasText: 'COMPRAR' }).first();
  137 |   await expect(buyBtn).toBeVisible({ timeout: 15000 });
  138 |   await click(page, buyBtn);
  139 | 
  140 |   const dialog = await waitForDialog(page);
  141 | 
  142 |   await fill(page, dialog.locator('input[placeholder*="AAPL"], input[placeholder*="BTC"], input[placeholder*="ETH"]'), symbol);
  143 | 
  144 |   const quantityInput = dialog.locator('input[type="number"]').first();
  145 |   await fill(page, quantityInput, quantity);
  146 | 
  147 |   await click(page, dialog.locator('button:has-text("Comprar ahora")').first());
  148 | 
  149 |   await page.waitForSelector('text=/Compra|compra|exitoso|ejecutada/i', { timeout: 15000 });
  150 |   await closeDialog(page);
  151 | }
  152 | 
  153 | async function sellAsset(page: import('@playwright/test').Page, symbol: string, quantity: string) {
  154 |   const sellBtn = page.locator('button[aria-haspopup="dialog"]').filter({ hasText: 'VENDER' }).first();
  155 |   await click(page, sellBtn);
  156 | 
  157 |   await page.waitForTimeout(1000);
  158 |   const dialog = await waitForDialog(page);
  159 | 
  160 |   // Wait for both comboboxes to render - first Portfolio, then Symbol
  161 |   await page.waitForFunction(
  162 |     () => {
  163 |       const dialogEl = document.querySelector('[role="dialog"]');
  164 |       if (!dialogEl) return false;
  165 |       const comboboxes = dialogEl.querySelectorAll('[role="combobox"]');
  166 |       return comboboxes.length >= 2;
  167 |     },
  168 |     { timeout: 15000 }
  169 |   );
  170 |   
  171 |   // Symbol combobox - second combobox in dialog (first is Portfolio, second is Symbol)
```