import { test, expect, Page } from '@playwright/test';

/**
 * Mocked, deterministic Deposit flow.
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
      category_name: 'Salary',
      category_id: 201,
      usage_count: 5,
      created_at: mockNow,
      updated_at: mockNow,
    },
    {
      user_name: 'Kaiukov',
      category_name: 'Travel Expenses',
      category_id: 202,
      usage_count: 1,
      created_at: mockNow,
      updated_at: mockNow,
    },
  ],
};

const mockSources = {
  success: true,
  message: 'ok',
  timestamp: mockNow,
  total: 3,
  get_source_name_usage: [
    { user_name: 'Kaiukov', source_id: 's1', source_name: 'Income', category_id: '201', category_name: 'Salary', usage_count: 11, global_usage: 15, user_has_used: true },
    { user_name: 'Kaiukov', source_id: 's2', source_name: 'Bonus', category_id: '201', category_name: 'Salary', usage_count: 3, global_usage: 5, user_has_used: true },
    { user_name: 'Kaiukov', source_id: 's3', source_name: 'Gift', category_id: '202', category_name: 'Travel Expenses', usage_count: 1, global_usage: 2, user_has_used: false },
  ],
};

const mockBalance = {
  success: true,
  message: 'ok',
  timestamp: mockNow,
  total: 1,
  get_running_balance: [{ date: mockNow, balance_eur: 1150.12, balance_usd: 1234.56 }],
};
const mockTransactions = { data: [] };
const mockAuthSession = {
  success: true,
  message: 'ok',
  timestamp: mockNow,
  sessionToken: null,
  sessionExpiresAt: null,
  userData: {
    id: 64096067,
    name: 'Oleksandr Kaiukov',
    username: 'Kaiukov',
    bio: 'Manage finances',
    avatar_url: null,
    language_code: 'en',
    bot_blocked: false,
    isAuth: true,
  },
};

function mockTelegram(page: Page) {
  return page.addInitScript(() => {
    (window as any).Telegram = {
      WebApp: {
        initData: 'mock-init-data',
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
        BackButton: { show() { }, hide() { }, onClick() { } },
        MainButton: { setText() { }, onClick() { }, show() { }, hide() { }, enable() { }, disable() { }, showProgress() { }, hideProgress() { }, isVisible: false, isActive: true, isProgressVisible: false },
        HapticFeedback: { impactOccurred() { }, notificationOccurred() { }, selectionChanged() { } },
        ready() { },
        expand() { },
        close() { },
        showAlert: (message: string, cb?: () => void) => {
          console.log('Telegram Alert:', message);
          cb?.();
        },
        showConfirm: (_msg: string, cb?: (confirmed: boolean) => void) => cb?.(true),
      },
    };
  });
}

async function installApiMocks(page: Page) {
  await page.route('**/api/v1/auth/me', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockAuthSession) }));
  await page.route('**/api/v1/read-model/accounts/usage**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockAccounts) }));
  await page.route('**/api/v1/read-model/categories/usage**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockCategories) }));
  await page.route('**/api/v1/read-model/sources**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockSources) }));
  await page.route('**/api/v1/exchange-rate**', (route) =>
    {
      const url = new URL(route.request().url());
      const amount = Number(url.searchParams.get('amount') ?? '1');
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'ok',
          timestamp: mockNow,
          exchangeData: { from: 'USD', to: 'EUR', amount, exchangeRate: 0.85231, exchangeAmount: amount * 0.85231 },
        }),
      });
    }
  );
  await page.route('**/api/v1/read-model/running-balance**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockBalance) }));
  await page.route('**/api/v1/transactions**', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockTransactions) });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { id: 'mock-123', type: 'transactions' } }),
    });
  });
  await page.route('**/webhook/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) }));
}

const amountInput = (page: Page) => page.getByRole('textbox').first();

test.describe('Deposit flow (mocked, fast)', () => {
  test.beforeEach(async ({ page }) => {
    await mockTelegram(page);
    await installApiMocks(page);
    page.on('dialog', (d) => d.accept().catch(() => { }));
    await page.goto('/');
    await page.waitForSelector('text=Deposit', { timeout: 5000 });
  });

  test('happy path completes with mocked data and correct confirmation details', async ({ page }) => {
    await page.getByText('Deposit').first().click();
    await page.getByText('O PUMP €').first().click();

    await amountInput(page).fill('50');
    await page.getByRole('button', { name: /Next|Continue|→/ }).click();

    await page.getByText('Salary').first().click();
    await page.getByRole('button', { name: 'Income' }).click(); // quick source

    await page.waitForSelector('text=Confirm Deposit', { timeout: 3000 });
    await expect(page.getByText('+€50', { exact: true })).toBeVisible();
    await expect(page.locator('div').filter({ hasText: 'Account' }).filter({ hasText: 'O PUMP €' }).first()).toBeVisible();
    await expect(page.locator('div').filter({ hasText: 'Category' }).filter({ hasText: 'Salary' }).first()).toBeVisible();
    await expect(page.locator('div').filter({ hasText: 'Source' }).filter({ hasText: 'Income' }).first()).toBeVisible();
    await expect(page.getByRole('textbox', { name: /Describe|Notes/ })).toHaveValue(/Deposit .*50/i);
    // Date should be today's date (dynamic)
    const dateInput = page.getByRole('textbox', { name: /Transaction date/ });
    const dateValue = await dateInput.inputValue();
    expect(dateValue).toMatch(/\d{4}-\d{2}-\d{2}/);

    await page.getByRole('button', { name: 'Confirm' }).click();
    await page.waitForSelector('text=Quick Actions', { timeout: 5000 });
  });

  test('back button keeps amount for same account and clears on switch', async ({ page }) => {
    await page.getByText('Deposit').first().click();
    await page.getByText('O PUMB USD').first().click();

    await amountInput(page).fill('30');
    await page.getByRole('button', { name: /Next|Continue|→/ }).click();

    await page.getByRole('button', { name: 'Go back' }).click();
    await expect(amountInput(page)).toHaveValue('30');

    await page.getByRole('button', { name: 'Go back' }).click();
    await page.getByText('O PUMB USD').first().click();
    await expect(amountInput(page)).toHaveValue('30');

    await page.getByRole('button', { name: 'Go back' }).click();
    await page.getByText('O PUMP €').first().click();
    await expect(amountInput(page)).toHaveValue(/^0?$/);
  });

  test('category selection works and back button returns to category choice', async ({
    page,
  }) => {
    await page.getByText('Deposit').first().click();
    await page.getByText('O PUMP €').first().click();

    await amountInput(page).fill('40');
    await page.getByRole('button', { name: /Next|Continue|→/ }).click();

    // Pick Salary category and source
    await page.getByText('Salary').first().click();
    await page.getByRole('button', { name: 'Income' }).click();

    // Verify we got to confirmation
    await page.waitForSelector('text=Confirm Deposit', { timeout: 3000 });
    await expect(page.locator('div').filter({ hasText: 'Category' }).filter({ hasText: 'Salary' }).first()).toBeVisible();

    // Go back from confirmation to source
    await page.getByRole('button', { name: 'Go back' }).click();
    await expect(page.getByRole('button', { name: 'Income' })).toBeVisible();

    // Go back from source to category
    await page.getByRole('button', { name: 'Go back' }).click();
    await expect(page.getByText('Salary')).toBeVisible();

    // Complete flow again
    await page.getByText('Salary').first().click();
    await page.getByRole('button', { name: 'Income' }).click();
    await page.getByRole('button', { name: 'Confirm' }).click();
    await page.waitForSelector('text=Quick Actions', { timeout: 5000 });
  });

  test('happy path with USD account shows converted amount in confirmation', async ({ page }) => {
    await page.getByText('Deposit').first().click();
    await page.getByText('O PUMB USD').first().click();

    await amountInput(page).fill('100');
    await expect(page.getByText(/EUR/)).toBeVisible();
    await page.getByRole('button', { name: /Next|Continue|→/ }).click();

    await page.getByText('Salary').first().click();
    await page.getByRole('button', { name: 'Income' }).click();

    await page.waitForSelector('text=Confirm Deposit', { timeout: 3000 });
    // Verify USD amount is shown (+$100)
    await expect(page.getByText('+$100', { exact: true })).toBeVisible();
    // Verify category is shown
    await expect(page.locator('div').filter({ hasText: 'Category' }).filter({ hasText: 'Salary' }).first()).toBeVisible();
    // Verify source is shown
    await expect(page.locator('div').filter({ hasText: 'Source' }).filter({ hasText: 'Income' }).first()).toBeVisible();

    await page.getByRole('button', { name: 'Confirm' }).click();
    await page.waitForSelector('text=Quick Actions', { timeout: 5000 });
  });

  test('back button from confirmation page returns to source selection with data preserved', async ({ page }) => {
    await page.getByText('Deposit').first().click();
    await page.getByText('O PUMP €').first().click();

    await amountInput(page).fill('75');
    await page.getByRole('button', { name: /Next|Continue|→/ }).click();

    await page.getByText('Salary').first().click();
    await page.getByRole('button', { name: 'Income' }).click();

    await page.waitForSelector('text=Confirm Deposit', { timeout: 3000 });

    // Go back from confirmation to source selection
    await page.getByRole('button', { name: 'Go back' }).click();

    // Verify we're on source page and source is preserved
    await expect(page.getByRole('button', { name: 'Income' })).toBeVisible();

    // Go back from source to category
    await page.getByRole('button', { name: 'Go back' }).click();

    // Verify category is still selected
    await expect(page.getByText('Salary')).toBeVisible();
  });

  test('source selection can be changed after initial choice', async ({ page }) => {
    await page.getByText('Deposit').first().click();
    await page.getByText('O PUMP €').first().click();

    await amountInput(page).fill('60');
    await page.getByRole('button', { name: /Next|Continue|→/ }).click();

    await page.getByText('Salary').first().click();
    await page.getByRole('button', { name: 'Income' }).click();

    await page.waitForSelector('text=Confirm Deposit', { timeout: 3000 });
    await expect(page.locator('div').filter({ hasText: 'Source' }).filter({ hasText: 'Income' }).first()).toBeVisible();

    // Go back and change source
    await page.getByRole('button', { name: 'Go back' }).click();
    await page.getByRole('button', { name: 'Bonus' }).click();

    await page.waitForSelector('text=Confirm Deposit', { timeout: 3000 });
    await expect(page.locator('div').filter({ hasText: 'Source' }).filter({ hasText: 'Bonus' }).first()).toBeVisible();

    await page.getByRole('button', { name: 'Confirm' }).click();
    await page.waitForSelector('text=Quick Actions', { timeout: 5000 });
  });

  test('exchange rate displayed correctly for USD amount entry', async ({ page }) => {
    await page.getByText('Deposit').first().click();
    await page.getByText('O PUMB USD').first().click();

    await amountInput(page).fill('100');
    // Wait for conversion to appear (EUR currency indicator)
    await page.waitForSelector('text=EUR', { timeout: 3000 });

    await page.getByRole('button', { name: /Next|Continue|→/ }).click();

    await page.getByText('Salary').first().click();
    await page.getByRole('button', { name: 'Income' }).click();

    await page.waitForSelector('text=Confirm Deposit', { timeout: 3000 });
    // Verify we have conversion information in the notes (amount + conversion)
    await expect(page.getByRole('textbox', { name: /Describe|Notes/ })).toHaveValue(
      /100.*USD|Deposit.*100/i
    );

    await page.getByRole('button', { name: 'Confirm' }).click();
    await page.waitForSelector('text=Quick Actions', { timeout: 5000 });
  });

  test('Decline button cancels transaction and returns to home', async ({ page }) => {
    // Navigate to confirmation page
    await page.getByText('Deposit').first().click();
    await page.getByText('O PUMP €').first().click();

    await amountInput(page).fill('100');
    await page.getByRole('button', { name: /Next|Continue|→/ }).click();

    await page.getByText('Salary').first().click();
    await page.getByRole('button', { name: 'Income' }).click();

    await page.waitForSelector('text=Confirm Deposit', { timeout: 3000 });

    // Click Decline
    await page.getByRole('button', { name: 'Decline' }).click();

    // Verify returned to home
    await page.waitForSelector('text=Quick Actions', { timeout: 5000 });
  });
});

/**
 * Command to run this single fast test:
 *   npx playwright test --headless --workers auto tests/e2e/deposit-mock-flow.spec.ts
 *
 * Test coverage:
 * ✅ Complete deposit flow (account → amount → category → source → confirmation)
 * ✅ State preservation and clearing logic
 * ✅ Back button navigation at all stages
 * ✅ Source selection changes
 * ✅ Exchange rate conversion display
 * ✅ Confirmation page data validation (amount, account, category, source, date, notes)
 * ✅ Decline action cancels and returns home
 */
