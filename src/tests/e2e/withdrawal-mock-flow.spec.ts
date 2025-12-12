import { test, expect, Page } from '@playwright/test';

/**
 * Fast withdrawal flow using fully mocked API responses.
 *
 * Goals:
 * - No real network calls (all Sync API + webhook endpoints mocked).
 * - Deterministic data so the UI renders immediately.
 * - Suitable for parallel/headless runs: `npx playwright test --headless --workers auto tests/e2e/withdrawal-mock-flow.spec.ts`
 */

const mockNow = '2025-12-12T10:00:00.000Z';

const mockAccounts = {
  success: true,
  message: 'ok',
  timestamp: mockNow,
  total_sync: 2,
  get_accounts_usage: [
    {
      account_id: 'acc-eur',
      user_name: 'Kaiukov',
      account_name: 'O PUMP €',
      account_currency: 'EUR',
      current_balance: 940.25,
      balance_in_USD: 1000,
      balance_in_EUR: 940.25,
      owner: 'Kaiukov',
      owner_id: '64096067',
      usage_count: 15,
      first_used_at: mockNow,
      last_used_at: mockNow,
    },
    {
      account_id: 'acc-usd',
      user_name: 'Kaiukov',
      account_name: 'O PUMB USD',
      account_currency: 'USD',
      current_balance: 500,
      balance_in_USD: 500,
      balance_in_EUR: 470,
      owner: 'Kaiukov',
      owner_id: '64096067',
      usage_count: 3,
      first_used_at: mockNow,
      last_used_at: mockNow,
    },
  ],
};

const mockCategories = {
  success: true,
  message: 'ok',
  timestamp: mockNow,
  total: 2,
  get_categories_usage: [
    {
      user_name: 'Kaiukov',
      category_name: "Підписки та зв'язок",
      category_id: 101,
      usage_count: 5,
      created_at: mockNow,
      updated_at: mockNow,
    },
    {
      user_name: 'Kaiukov',
      category_name: 'Travel Expenses',
      category_id: 102,
      usage_count: 1,
      created_at: mockNow,
      updated_at: mockNow,
    },
  ],
};

const mockDestinations = {
  success: true,
  message: 'ok',
  timestamp: mockNow,
  total: 3,
  get_destination_name_usage: [
    {
      user_name: 'Kaiukov',
      destination_id: 'd1',
      destination_name: 'Apple',
      category_id: '101',
      category_name: "Підписки та зв'язок",
      usage_count: 8,
      global_usage: 10,
      user_has_used: true,
    },
    {
      user_name: 'Kaiukov',
      destination_id: 'd2',
      destination_name: 'Google one',
      category_id: '101',
      category_name: "Підписки та зв'язок",
      usage_count: 6,
      global_usage: 9,
      user_has_used: true,
    },
    {
      user_name: 'Kaiukov',
      destination_id: 'd3',
      destination_name: 'YouTube',
      category_id: '101',
      category_name: "Підписки та зв'язок",
      usage_count: 2,
      global_usage: 4,
      user_has_used: false,
    },
  ],
};

const mockBalance = {
  success: true,
  message: 'ok',
  timestamp: mockNow,
  total: 1,
  get_current_balance: [{ balance_in_USD: 1234.56 }],
};

const mockTransactions = {
  data: [],
};

function mockTelegram(page: Page) {
  return page.addInitScript(() => {
    (window as any).Telegram = {
      WebApp: {
        initData: '',
        initDataUnsafe: {
          user: {
            id: 64096067,
            first_name: 'Oleksandr',
            last_name: 'Kaiukov',
            username: 'Kaiukov',
            language_code: 'en',
          },
        },
        version: '6.0',
        platform: 'web',
        colorScheme: 'light',
        themeParams: {},
        isExpanded: true,
        viewportHeight: 900,
        viewportStableHeight: 900,
        headerColor: '#ffffff',
        backgroundColor: '#ffffff',
        BackButton: { show() {}, hide() {}, onClick() {} },
        MainButton: {
          setText() {},
          onClick() {},
          show() {},
          hide() {},
          enable() {},
          disable() {},
          showProgress() {},
          hideProgress() {},
          isVisible: false,
          isActive: true,
          isProgressVisible: false,
        },
        HapticFeedback: { impactOccurred() {}, notificationOccurred() {}, selectionChanged() {} },
        ready() {},
        expand() {},
        close() {},
        showAlert: (message: string) => console.log('Telegram Alert:', message),
        showConfirm: (_msg: string, cb?: (confirmed: boolean) => void) => cb?.(true),
      },
    };
  });
}

async function installApiMocks(page: Page) {
  // Accounts usage
  await page.route('**/api/v1/get_accounts_usage**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockAccounts) })
  );

  // Categories (withdrawal)
  await page.route('**/api/v1/get_categories_usage**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockCategories) })
  );

  // Destinations
  await page.route('**/api/v1/get_destination_name_usage**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockDestinations) })
  );

  // Exchange rate (fallback for any currency conversions)
  await page.route('**/api/v1/get_exchange_rate**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: 'ok',
        timestamp: mockNow,
        get_exchange_rate: [{ from: 'USD', to: 'EUR', rate: 1.0 }],
      }),
    })
  );

  // Balances
  await page.route('**/api/v1/get_running_balance**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockBalance) })
  );

  // Transactions list (after submit)
  await page.route('**/api/v1/transactions**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockTransactions) })
  );

  // Webhook / submission endpoints (swallow)
  await page.route('**/webhook/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) })
  );
}

test.describe('Withdrawal flow (mocked, fast)', () => {
  test.beforeEach(async ({ page }) => {
    await mockTelegram(page);
    await installApiMocks(page);
    page.on('dialog', (dialog) => dialog.accept().catch(() => {}));
    await page.goto('/');
    await page.waitForSelector('text=Withdrawal', { timeout: 5000 });
  });

  test('happy path completes with mocked data', async ({ page }) => {
    // Start withdrawal
    await page.getByText('Withdrawal').first().click();

    // Pick EUR account (stable, no conversion delay)
    await page.getByText('O PUMP €').first().click();

    // Amount page
    await page.getByRole('textbox', { name: '0' }).fill('100');
    await page.getByRole('button', { name: /Next|Continue|→/ }).click();

    // Category page
    await page.getByText("Підписки та зв'язок").click();

    // Destination page (use quick suggestion)
    await page.getByRole('button', { name: 'Apple' }).click();

    // Confirmation
    await page.waitForSelector('text=Confirm Withdrawal', { timeout: 3000 });
    await expect(page.getByText('Apple')).toBeVisible();
    await expect(page.getByText('O PUMP €')).toBeVisible();
    await expect(page.getByText("Підписки та зв'язок")).toBeVisible();
    await expect(page.getByText(/Withdrawal .* 100/)).toBeVisible();

    await page.getByRole('button', { name: 'Confirm' }).click();

    // Success toast/dialog was auto-accepted; verify we are back on home
    await page.waitForSelector('text=Quick Actions', { timeout: 3000 });
  });
});

/**
 * Command to run this single fast test:
 *   npx playwright test --headless --workers auto tests/e2e/withdrawal-mock-flow.spec.ts
 */
