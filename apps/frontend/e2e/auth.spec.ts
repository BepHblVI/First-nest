import { test, expect, Route, Request } from '@playwright/test';

/**
 * GraphQL リクエストの query 文に特定の文字列が含まれるか判定
 */
function isQuery(req: Request, name: string): boolean {
  const body = req.postDataJSON?.();
  return typeof body?.query === 'string' && body.query.includes(name);
}

test.describe('認証リフレッシュ / タイムアウト', () => {
  test('access_token が期限切れでも refresh で自動更新され、データ取得が成功する', async ({
    page,
  }) => {
    let searchCallCount = 0;
    let refreshCalled = false;

    await page.route('**/api/graphql', async (route, request) => {
      // 1回目の Search クエリは Unauthorized を返す
      if (isQuery(request, 'SearchSurveys')) {
        searchCallCount++;
        if (searchCallCount === 1) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              errors: [
                {
                  message: 'Unauthorized',
                  extensions: { code: 'UNAUTHENTICATED' },
                },
              ],
              data: null,
            }),
          });
          return;
        }
      }

      // refresh は成功（新しいトークンを発行）
      if (isQuery(request, 'refresh')) {
        refreshCalled = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              refresh: { access_token: 'mocked.refreshed.token' },
            },
          }),
        });
        return;
      }

      // 2回目以降の Search は実 backend に通す（or 任意の応答に差し替え）
      await route.continue();
    });

    await page.goto('/');

    // 期待: refresh が走って2回目の取得が成功する
    await expect(page.getByText(/件ヒット/)).toBeVisible();
    expect(refreshCalled).toBe(true);
    expect(searchCallCount).toBeGreaterThanOrEqual(2);

    // localStorage が更新されている
    const tokenAfter = await page.evaluate(() => localStorage.getItem('access_token'));
    expect(tokenAfter).toBe('mocked.refreshed.token');
  });

  test('refresh も失敗したら /login にリダイレクトされる', async ({ page }) => {
    // alert ダイアログ自動承認
    page.on('dialog', (d) => d.accept());

    await page.route('**/api/graphql', async (route, request) => {
      // どんなクエリでも Unauthorized
      // ただし refresh は「リフレッシュトークンが無効」を示すレスポンス
      if (isQuery(request, 'refresh')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: { refresh: null }, // ← refresh失敗
            errors: [{ message: 'refresh token expired' }],
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          errors: [
            {
              message: 'Unauthorized',
              extensions: { code: 'UNAUTHENTICATED' },
            },
          ],
          data: null,
        }),
      });
    });

    await page.goto('/');

    // /login に遷移する
    await expect(page).toHaveURL(/\/login/);

    // localStorage がクリアされている
    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    expect(token).toBeNull();
  });

  test('access_token が無い状態で訪問しても refresh が走って復旧する', async ({
    page,
    context,
  }) => {
    // ⭐ ページ起動前に localStorage をクリア
    await context.addInitScript(() => {
      try {
        localStorage.removeItem('access_token');
      } catch {}
    });

    let refreshCalled = false;
    await page.route('**/api/graphql', async (route, request) => {
      if (isQuery(request, 'refresh')) {
        refreshCalled = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              refresh: { access_token: 'recovered.token' },
            },
          }),
        });
        return;
      }
      await route.continue();
    });

    await page.goto('/');

    await expect(page.getByText(/件ヒット/)).toBeVisible();
    expect(refreshCalled).toBe(true);
  });

  /**
   * モック無し・実 backend と通信する認証フロー検証。
   * これは CORS / cookie / proxy 設定の動作確認に必要。
   */
  test.describe('認証フロー（実通信）', () => {
    test('ログイン後、refresh cookie が正しいオリジンに設定される', async ({ page, context }) => {
      // ログイン画面から実際にログイン
      await page.goto('/login');
      await page.getByPlaceholder(/ユーザー名|username/i).fill('e2e-user');
      await page.getByPlaceholder(/パスワード|password/i).fill('e2e-pass');
      await page.getByRole('button', { name: /ログイン/ }).click();

      await page.waitForURL('/');

      // localStorage に access_token があるか
      const token = await page.evaluate(() => localStorage.getItem('access_token'));
      expect(token).toBeTruthy();

      // ⭐ refresh cookie がフロントオリジン(3000) で取得できるか
      const cookies = await context.cookies('http://localhost:3000');
      const refreshCookie = cookies.find((c) => /refresh/i.test(c.name));
      expect(refreshCookie).toBeDefined();
      expect(refreshCookie?.httpOnly).toBe(true); // セキュリティ要件
    });

    test('access_token を消してもページが動く（実 refresh が成功する）', async ({ page }) => {
      // 一度ログインして cookie を取得
      await page.goto('/login');
      await page.getByPlaceholder(/ユーザー名/i).fill('e2e-user');
      await page.getByPlaceholder(/パスワード/i).fill('e2e-pass');
      await page.getByRole('button', { name: /ログイン/ }).click();
      await page.waitForURL('/');

      // localStorage の access_token だけ消去
      await page.evaluate(() => localStorage.removeItem('access_token'));

      // 再度ホームへ → refresh が走って自動復旧するはず
      await page.reload();

      // データが見える = refresh 経路で復旧成功
      await expect(page.getByText(/件ヒット/)).toBeVisible();

      // 新しい token が入っている
      const newToken = await page.evaluate(() => localStorage.getItem('access_token'));
      expect(newToken).toBeTruthy();
    });

    test('rewrites が効いていて /api/graphql が backend に届く', async ({ page }) => {
      // ログイン状態でホームへ
      await page.goto('/');

      // 実際の通信ログを取って destination を確認
      const responses: string[] = [];
      page.on('response', (res) => {
        if (res.url().includes('/api/graphql')) {
          responses.push(res.url());
        }
      });

      await page.waitForTimeout(2000);

      // /api/graphql で 200 が返ってくる = rewrites が機能している
      expect(responses.length).toBeGreaterThan(0);
      for (const url of responses) {
        // ブラウザから見たURLは 3000、実際の処理は 3001 にプロキシされている
        expect(url).toContain('localhost:3000/api/graphql');
      }
    });
  });
});
