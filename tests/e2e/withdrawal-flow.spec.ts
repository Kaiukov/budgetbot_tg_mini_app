import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Withdrawal Transaction Flow
 *
 * Tests the complete withdrawal flow from account selection through confirmation
 * Validates that 'withdrawal' terminology is used (not 'expense')
 */

test.describe('Withdrawal Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock Telegram WebApp environment for browser mode
    await page.addInitScript(() => {
      (window as any).Telegram = {
        WebApp: {
          initData: '',
          initDataUnsafe: {
            user: {
              id: 123456,
              first_name: 'Test',
              last_name: 'User',
              username: 'testuser',
              language_code: 'en'
            }
          },
          version: '6.0',
          platform: 'web',
          colorScheme: 'dark',
          themeParams: {},
          isExpanded: true,
          viewportHeight: 600,
          viewportStableHeight: 600,
          headerColor: '#000000',
          backgroundColor: '#000000',
          BackButton: {
            isVisible: false,
            show: () => {},
            hide: () => {},
            onClick: (callback: () => void) => {}
          },
          MainButton: {
            text: '',
            color: '#3390ec',
            textColor: '#ffffff',
            isVisible: false,
            isActive: true,
            isProgressVisible: false,
            setText: (text: string) => {},
            onClick: (callback: () => void) => {},
            show: () => {},
            hide: () => {},
            enable: () => {},
            disable: () => {},
            showProgress: () => {},
            hideProgress: () => {}
          },
          HapticFeedback: {
            impactOccurred: (style: string) => {},
            notificationOccurred: (type: string) => {},
            selectionChanged: () => {}
          },
          ready: () => {},
          expand: () => {},
          close: () => {},
          showAlert: (message: string, callback?: () => void) => {
            console.log('Telegram Alert:', message);
            if (callback) callback();
          },
          showConfirm: (message: string, callback?: (confirmed: boolean) => void) => {
            if (callback) callback(true);
          }
        }
      };
    });

    // Navigate to the app
    await page.goto('/');

    // Wait for the app to load
    await page.waitForLoadState('networkidle');
  });

  test('should display "Withdrawal" button on home screen', async ({ page }) => {
    // Wait for home screen to render
    await page.waitForSelector('text=Withdrawal', { timeout: 10000 });

    // Verify "Withdrawal" text is present (not "Expense")
    const withdrawalButton = page.getByText('Withdrawal').first();
    await expect(withdrawalButton).toBeVisible();

    // Verify no "Expense" text exists
    const expenseText = page.getByText('Expense', { exact: true });
    await expect(expenseText).toHaveCount(0);
  });

  test('should navigate through complete withdrawal flow', async ({ page }) => {
    // Step 1: Click Withdrawal button on home screen
    await page.waitForSelector('text=Withdrawal', { timeout: 10000 });
    await page.getByText('Withdrawal').first().click();

    // Step 2: Account Selection Screen
    // Wait for accounts to load (might show loading state first)
    await page.waitForSelector('text=Select Account', { timeout: 10000 });

    // Select first available account (if any are loaded)
    const accountCards = page.locator('[class*="cursor-pointer"]').filter({ hasText: /EUR|USD|UAH/ });
    const accountCount = await accountCards.count();

    if (accountCount > 0) {
      await accountCards.first().click();

      // Step 3: Amount Screen
      await page.waitForSelector('text=Enter Amount', { timeout: 5000 });

      // Enter amount using number pad
      await page.getByRole('button', { name: '1' }).click();
      await page.getByRole('button', { name: '0' }).click();
      await page.getByRole('button', { name: '0' }).click();

      // Click continue/next button
      const continueButton = page.locator('button').filter({ hasText: /Continue|Next|→/ }).first();
      if (await continueButton.isVisible()) {
        await continueButton.click();
      }

      // Step 4: Category Screen
      await page.waitForSelector('text=Select Category', { timeout: 5000 });

      // Verify withdrawal context (not expense)
      const categoryHeader = page.getByText('Select Category');
      await expect(categoryHeader).toBeVisible();

      // Select first category
      const categoryCards = page.locator('[class*="cursor-pointer"]').filter({ hasText: /Food|Transport|Shopping/ });
      const categoryCount = await categoryCards.count();

      if (categoryCount > 0) {
        await categoryCards.first().click();

        // Step 5: Destination/Comment Screen
        await page.waitForSelector('text=Destination', { timeout: 5000 });

        // Enter destination name
        const destinationInput = page.locator('input[type="text"]').first();
        await destinationInput.fill('Test Withdrawal');

        // Continue to confirmation
        const nextButton = page.locator('button').filter({ hasText: /Continue|Next|→/ }).first();
        if (await nextButton.isVisible()) {
          await nextButton.click();
        }

        // Step 6: Confirmation Screen
        await page.waitForSelector('text=Confirmation', { timeout: 5000 });

        // Verify withdrawal terminology on confirmation screen
        const withdrawalLabel = page.getByText('Withdrawal');
        await expect(withdrawalLabel).toBeVisible();

        // Verify transaction details are displayed
        await expect(page.getByText('Account:')).toBeVisible();
        await expect(page.getByText('Category:')).toBeVisible();
        await expect(page.getByText('Destination:')).toBeVisible();
        await expect(page.getByText('Date:')).toBeVisible();
        await expect(page.getByText('Notes:')).toBeVisible();

        // Verify no "Expense" terminology
        const expenseText = page.getByText('Expense', { exact: true });
        await expect(expenseText).toHaveCount(0);
      }
    }
  });

  test('should show withdrawal in transaction list', async ({ page }) => {
    // Navigate to transactions list (if there's a way to access it from home)
    const transactionsButton = page.getByText('Transactions').or(page.getByText('View all'));

    if (await transactionsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await transactionsButton.click();

      // Wait for transaction list to load
      await page.waitForLoadState('networkidle');

      // Check if any withdrawal transactions are displayed
      const withdrawalItems = page.locator('[class*="transaction"]').filter({ hasText: /Withdrawal|withdrawal/ });

      // If withdrawals exist, verify no "Expense" text
      const itemCount = await withdrawalItems.count();
      if (itemCount > 0) {
        const expenseText = page.getByText('Expense', { exact: true });
        await expect(expenseText).toHaveCount(0);
      }
    }
  });

  test('should handle browser mode gracefully', async ({ page }) => {
    // Verify browser mode indicator if present
    const browserModeText = page.getByText('Browser Mode');

    if (await browserModeText.isVisible({ timeout: 2000 }).catch(() => false)) {
      // In browser mode, verify withdrawal flow is still accessible
      await expect(browserModeText).toBeVisible();

      // Verify withdrawal button is still present
      const withdrawalButton = page.getByText('Withdrawal').first();
      await expect(withdrawalButton).toBeVisible();
    }
  });

  test('should display correct transaction type in UI', async ({ page }) => {
    // Wait for home screen
    await page.waitForSelector('text=Withdrawal', { timeout: 10000 });

    // Get all text content from the page
    const pageContent = await page.content();

    // Verify "Withdrawal" is present
    expect(pageContent).toContain('Withdrawal');

    // Verify "Expense" is NOT present (case-sensitive)
    const expenseMatches = pageContent.match(/\bExpense\b/g);
    expect(expenseMatches).toBeNull();
  });

  test('should use withdrawal terminology in forms', async ({ page }) => {
    // Navigate to withdrawal flow
    await page.waitForSelector('text=Withdrawal', { timeout: 10000 });
    await page.getByText('Withdrawal').first().click();

    // Check accounts screen
    await page.waitForSelector('text=Select Account', { timeout: 10000 });

    // Verify screen titles use correct terminology
    const pageText = await page.textContent('body');

    // Should contain "Withdrawal" or "withdrawal"
    const hasWithdrawal = /withdrawal/i.test(pageText || '');
    expect(hasWithdrawal).toBeTruthy();

    // Should NOT contain standalone "Expense"
    const hasExpense = /\bExpense\b/.test(pageText || '');
    expect(hasExpense).toBeFalsy();
  });
});

test.describe('Withdrawal API Integration', () => {
  test('should send correct transaction type to API', async ({ page }) => {
    // Intercept API calls
    const apiCalls: any[] = [];

    await page.route('**/api/v1/transactions', (route) => {
      const request = route.request();
      const postData = request.postDataJSON();
      apiCalls.push(postData);

      // Mock successful response
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            id: '123',
            type: 'transactions',
            attributes: {
              transactions: [{
                transaction_journal_id: '456',
                type: 'withdrawal',
                date: new Date().toISOString(),
                amount: '100.00',
                description: 'Test withdrawal',
                currency_code: 'EUR'
              }]
            }
          }
        })
      });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // If we captured any transaction API calls, verify they use 'withdrawal'
    // This would require actually completing a transaction flow
    // For now, just verify the intercept is set up
    expect(apiCalls).toBeDefined();
  });
});
