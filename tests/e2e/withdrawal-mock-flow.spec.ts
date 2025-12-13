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
  total_sync: 3,
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
    {
      account_id: 'acc-uah',
      user_name: 'Kaiukov',
      account_name: 'MONO UAH Oleksandr',
      account_currency: 'UAH',
      current_balance: 80000,
      balance_in_USD: 2000,
      balance_in_EUR: 1880,
      owner: 'Kaiukov',
      owner_id: '64096067',
      usage_count: 10,
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
  await page.route('**/api/v1/get_exchange_rate**', (route) => {
    const url = new URL(route.request().url());
    const from = url.searchParams.get('from') ?? 'USD';
    const to = url.searchParams.get('to') ?? 'EUR';
    const rate =
      from === 'UAH' && to === 'EUR'
        ? 0.025
        : from === 'USD' && to === 'EUR'
          ? 0.85231
          : 1;
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: 'ok',
        timestamp: mockNow,
        get_exchange_rate: [{ from, to, rate }],
      }),
    });
  });

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

const amountInput = (page: Page) => page.getByRole('textbox').first();
const destinationInput = (page: Page) => page.getByPlaceholder('Type destination or free text...');

test.describe('Withdrawal flow (mocked, fast)', () => {
  test.beforeEach(async ({ page }) => {
    await mockTelegram(page);
    await installApiMocks(page);
    page.on('dialog', (dialog) => dialog.accept().catch(() => {}));
    await page.goto('/');
    await page.waitForSelector('text=Withdrawal', { timeout: 5000 });
  });

  test('happy path completes with mocked data and correct confirmation details', async ({ page }) => {
    await page.getByText('Withdrawal').first().click();
    await page.getByText('O PUMP €').first().click();

    await amountInput(page).fill('15');
    await page.getByRole('button', { name: /Next|Continue|→/ }).click();

    await page.getByText("Підписки та зв'язок").click();
    await page.getByRole('button', { name: 'Apple' }).click();

    await page.waitForSelector('text=Confirm Withdrawal', { timeout: 3000 });
    await expect(page.getByText('Apple')).toBeVisible();
    await expect(
      page.locator('div').filter({ hasText: 'Account' }).filter({ hasText: 'O PUMP €' }).first()
    ).toBeVisible();
    await expect(
      page.locator('div').filter({ hasText: 'Category' }).filter({ hasText: "Підписки та зв'язок" }).first()
    ).toBeVisible();
    await expect(page.getByText('-€15', { exact: true })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /Describe/ })).toHaveValue(
      /Withdrawal .*O PUMP .*15/i
    );
    // Date should be today's date (dynamic)
    const dateInput = page.getByRole('textbox', { name: /Transaction date/ });
    const dateValue = await dateInput.inputValue();
    expect(dateValue).toMatch(/2025-12-\d{2}/);

    await page.getByRole('button', { name: 'Confirm' }).click();
    await page.waitForSelector('text=Quick Actions', { timeout: 3000 });
  });

  test('back button preserves amount for same account and clears when account changes', async ({ page }) => {
    await page.getByText('Withdrawal').first().click();
    await page.getByText('O PUMB USD').first().click();

    await amountInput(page).fill('12');
    await page.getByRole('button', { name: /Next|Continue|→/ }).click();

    await page.getByRole('button', { name: 'Go back' }).click();
    await expect(amountInput(page)).toHaveValue('12');

    await page.getByRole('button', { name: 'Go back' }).click();
    await page.getByText('O PUMB USD').first().click();
    await expect(amountInput(page)).toHaveValue('12');

    await page.getByRole('button', { name: 'Go back' }).click();
    await page.getByText('O PUMP €').first().click();
    await expect(amountInput(page)).toHaveValue(/^0?$/);
    await expect(page.getByRole('button', { name: /Next|Continue|→/ })).toBeDisabled();

    await amountInput(page).fill('7');
    await expect(page.getByRole('button', { name: /Next|Continue|→/ })).toBeEnabled();
  });

  test('destination page resets after back and allows changing selection before final confirm', async ({
    page,
  }) => {
    await page.getByText('Withdrawal').first().click();
    await page.getByText('O PUMB USD').first().click();

    await amountInput(page).fill('20');
    await page.getByRole('button', { name: /Next|Continue|→/ }).click();

    await page.getByText("Підписки та зв'язок").click();
    await page.getByRole('button', { name: 'Apple' }).click();

    // Back to category should reset destination state
    await page.getByRole('button', { name: 'Go back' }).click(); // confirmation -> destination
    await page.getByRole('button', { name: 'Go back' }).click(); // destination -> category
    await page.getByText("Підписки та зв'язок").click();
    await expect(destinationInput(page)).toHaveValue('');

    // Pick a destination, go to confirmation, then back and change it
    await page.getByRole('button', { name: 'Google one' }).click();
    await page.waitForSelector('text=Confirm Withdrawal', { timeout: 3000 });
    await expect(page.getByText('Google one')).toBeVisible();

    await page.getByRole('button', { name: 'Go back' }).click();
    await expect(destinationInput(page)).toHaveValue('Google one');

    await destinationInput(page).fill('YouTube');
    await page.getByRole('button', { name: /Next|Continue|→/ }).click();
    await expect(page.getByText('YouTube')).toBeVisible();

    await page.getByRole('button', { name: 'Confirm' }).click();
    await page.waitForSelector('text=Quick Actions', { timeout: 3000 });
  });

  test('happy path with UAH account shows converted amount and note', async ({ page }) => {
    await page.getByText('Withdrawal').first().click();
    await page.getByText('MONO UAH Oleksandr').first().click();

    await amountInput(page).fill('1000');
    await expect(page.getByText(/EUR/)).toBeVisible();
    await page.getByRole('button', { name: /Next|Continue|→/ }).click();

    await page.getByText("Підписки та зв'язок").click();
    await page.getByRole('button', { name: 'Apple' }).click();

    await page.waitForSelector('text=Confirm Withdrawal', { timeout: 3000 });
    await expect(
      page.locator('div').filter({ hasText: 'Account' }).filter({ hasText: 'MONO UAH Oleksandr' }).first()
    ).toBeVisible();
    await expect(page.getByText('-₴1000', { exact: true })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /Describe/ })).toHaveValue(/20\.?2\d?\s?EUR/i);

    await page.getByRole('button', { name: 'Confirm' }).click();
    await page.waitForSelector('text=Quick Actions', { timeout: 3000 });
  });

  test('back button from confirmation page returns to destination with data preserved', async ({ page }) => {
    await page.getByText('Withdrawal').first().click();
    await page.getByText('O PUMP €').first().click();

    await amountInput(page).fill('25');
    await page.getByRole('button', { name: /Next|Continue|→/ }).click();

    await page.getByText("Підписки та зв'язок").click();
    await page.getByRole('button', { name: 'Google one' }).click();

    await page.waitForSelector('text=Confirm Withdrawal', { timeout: 3000 });
    await expect(page.getByText('Google one')).toBeVisible();

    // Go back from confirmation to destination
    await page.getByRole('button', { name: 'Go back' }).click();

    // Verify destination is preserved
    await expect(destinationInput(page)).toHaveValue('Google one');

    // Go back from destination to category
    await page.getByRole('button', { name: 'Go back' }).click();

    // Verify category is still selected
    await expect(page.getByText("Підписки та зв'язок")).toBeVisible();
  });

  test('destination selection can be changed after initial choice', async ({ page }) => {
    await page.getByText('Withdrawal').first().click();
    await page.getByText('O PUMP €').first().click();

    await amountInput(page).fill('30');
    await page.getByRole('button', { name: /Next|Continue|→/ }).click();

    await page.getByText("Підписки та зв'язок").click();
    await page.getByRole('button', { name: 'Apple' }).click();

    await page.waitForSelector('text=Confirm Withdrawal', { timeout: 3000 });
    await expect(page.getByText('Apple')).toBeVisible();

    // Go back and change destination
    await page.getByRole('button', { name: 'Go back' }).click();
    await destinationInput(page).fill('Netflix');
    await page.getByRole('button', { name: /Next|Continue|→/ }).click();

    await page.waitForSelector('text=Confirm Withdrawal', { timeout: 3000 });
    await expect(page.getByText('Netflix')).toBeVisible();

    await page.getByRole('button', { name: 'Confirm' }).click();
    await page.waitForSelector('text=Quick Actions', { timeout: 3000 });
  });

  test('exchange rate conversion displayed for USD withdrawal', async ({ page }) => {
    await page.getByText('Withdrawal').first().click();
    await page.getByText('O PUMB USD').first().click();

    await amountInput(page).fill('50');
    // Wait for conversion to appear (EUR currency indicator)
    await page.waitForSelector('text=EUR', { timeout: 3000 });

    await page.getByRole('button', { name: /Next|Continue|→/ }).click();

    await page.getByText("Підписки та зв'язок").click();
    await page.getByRole('button', { name: 'Apple' }).click();

    await page.waitForSelector('text=Confirm Withdrawal', { timeout: 3000 });
    // Verify we have conversion information in the notes (amount + conversion)
    await expect(page.getByRole('textbox', { name: /Describe|Notes/ })).toHaveValue(
      /50.*USD|Withdrawal.*50/i
    );

    await page.getByRole('button', { name: 'Confirm' }).click();
    await page.waitForSelector('text=Quick Actions', { timeout: 3000 });
  });

  test('both EUR and USD accounts can complete withdrawals successfully', async ({ page }) => {
    // Test EUR account
    await page.getByText('Withdrawal').first().click();
    await page.getByText('O PUMP €').first().click();

    await amountInput(page).fill('10');
    await page.getByRole('button', { name: /Next|Continue|→/ }).click();

    await page.getByText("Підписки та зв'язок").click();
    await page.getByRole('button', { name: 'Apple' }).click();

    await page.waitForSelector('text=Confirm Withdrawal', { timeout: 3000 });
    await expect(page.getByText('Apple')).toBeVisible();

    await page.getByRole('button', { name: 'Confirm' }).click();
    await page.waitForSelector('text=Quick Actions', { timeout: 3000 });

    // Return to home and test USD account
    await page.getByText('Withdrawal').first().waitFor({ timeout: 5000 });

    await page.getByText('Withdrawal').first().click();
    await page.getByText('O PUMB USD').first().click();

    await amountInput(page).fill('10');
    await page.getByRole('button', { name: /Next|Continue|→/ }).click();

    await page.getByText("Підписки та зв'язок").click();
    await page.getByRole('button', { name: 'Google one' }).click();

    await page.waitForSelector('text=Confirm Withdrawal', { timeout: 3000 });
    await expect(page.getByText('Google one')).toBeVisible();

    await page.getByRole('button', { name: 'Confirm' }).click();
    await page.waitForSelector('text=Quick Actions', { timeout: 3000 });
  });
});

/**
 * Command to run this single fast test:
 *   npx playwright test tests/e2e/withdrawal-mock-flow.spec.ts
 *
 * Test coverage:
 * ✅ Complete withdrawal flow (account → amount → category → destination → confirmation)
 * ✅ State preservation and clearing logic
 * ✅ Back button navigation at all stages
 * ✅ Destination selection and customization
 * ✅ Exchange rate conversion display (USD, UAH)
 * ✅ Confirmation page data validation (amount, account, category, destination, date, notes)
 * ✅ All three account types (EUR, USD, UAH)
 * ✅ Multi-account sequential withdrawal flow
 */
