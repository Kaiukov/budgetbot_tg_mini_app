import { test, expect, Page } from '@playwright/test';

const mockNow = '2026-04-12T10:00:00.000Z';

const authenticatedUser = {
  id: 64096067,
  name: 'Oleksandr Kaiukov',
  username: 'Kaiukov',
  bio: 'Manage finances',
  avatar_url: null,
  language_code: 'en',
  bot_blocked: false,
  isAuth: true,
};

function installApiMocks(page: Page) {
  let loggedIn = false;

  page.route('**/api/v1/auth/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        loggedIn
          ? {
              success: true,
              message: 'Authenticated session found',
              timestamp: mockNow,
              userData: authenticatedUser,
              sessionToken: null,
              sessionExpiresAt: null,
            }
          : {
              success: false,
              message: 'No active session',
              timestamp: mockNow,
              userData: null,
              sessionToken: null,
              sessionExpiresAt: null,
            }
      ),
    })
  );

  page.route('**/api/v1/auth/code/redeem', async (route) => {
    const body = route.request().postDataJSON() as { code?: string } | undefined;
    if (!body?.code || body.code.trim().length < 4) {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: 'Invalid login code',
          timestamp: mockNow,
          userData: null,
          sessionToken: null,
          sessionExpiresAt: null,
        }),
      });
      return;
    }

    loggedIn = true;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: 'Login code redeemed',
        timestamp: mockNow,
        userData: authenticatedUser,
        sessionToken: null,
        sessionExpiresAt: '2026-04-12T10:30:00.000Z',
      }),
    });
  });

  page.route('**/api/v1/auth/logout', (route) => {
    loggedIn = false;
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: 'Logged out',
        timestamp: mockNow,
      }),
    });
  });

  page.route('**/api/v1/read-model/accounts/usage**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: 'ok',
        timestamp: mockNow,
        total_sync: 0,
        get_accounts_usage: [],
      }),
    })
  );

  page.route('**/api/v1/read-model/running-balance**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: 'ok',
        timestamp: mockNow,
        total: 0,
        get_running_balance: [],
      }),
    })
  );

  page.route('**/api/v1/transactions**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [] }),
    })
  );
}

test.describe('Code login flow', () => {
  test('redeems a short-lived code, keeps the session on refresh, and logs out cleanly', async ({ page }) => {
    await installApiMocks(page);

    await page.goto('/');
    await expect(page.getByText(/paste it here/i)).toBeVisible();

    await page.getByPlaceholder('ABCD-EFGH-IJKL').fill('ABCD-EFGH-IJKL');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText('Quick Actions')).toBeVisible({ timeout: 5000 });

    const storage = await page.evaluate(() => ({
      localStorage: Object.keys(localStorage),
      sessionStorage: Object.keys(sessionStorage),
    }));
    expect(storage.localStorage.filter((key) => /auth|token|session/i.test(key))).toHaveLength(0);
    expect(storage.sessionStorage.filter((key) => /auth|token|session/i.test(key))).toHaveLength(0);

    await page.reload();
    await expect(page.getByText('Quick Actions')).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: /Logout/i }).click();
    await expect(page.getByText(/paste it here/i)).toBeVisible({ timeout: 5000 });
  });

  test('shows a clear error for an invalid code', async ({ page }) => {
    await installApiMocks(page);
    await page.goto('/');

    await page.getByPlaceholder('ABCD-EFGH-IJKL').fill('BAD');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText('Invalid login code')).toBeVisible();
  });
});
