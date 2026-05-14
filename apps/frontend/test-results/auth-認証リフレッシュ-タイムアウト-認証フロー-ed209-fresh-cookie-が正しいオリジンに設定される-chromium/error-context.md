# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> 認証リフレッシュ / タイムアウト >> 認証フロー（実通信） >> ログイン後、refresh cookie が正しいオリジンに設定される
- Location: e2e/auth.spec.ts:155:5

# Error details

```
Error: page.waitForURL: Test ended.
=========================== logs ===========================
waiting for navigation to "/" until "load"
============================================================
```

# Test source

```ts
  62  |     await expect(page.getByText(/件ヒット/)).toBeVisible();
  63  |     expect(refreshCalled).toBe(true);
  64  |     expect(searchCallCount).toBeGreaterThanOrEqual(2);
  65  | 
  66  |     // localStorage が更新されている
  67  |     const tokenAfter = await page.evaluate(() => localStorage.getItem('access_token'));
  68  |     expect(tokenAfter).toBe('mocked.refreshed.token');
  69  |   });
  70  | 
  71  |   test('refresh も失敗したら /login にリダイレクトされる', async ({ page }) => {
  72  |     // alert ダイアログ自動承認
  73  |     page.on('dialog', (d) => d.accept());
  74  | 
  75  |     await page.route('**/api/graphql', async (route, request) => {
  76  |       // どんなクエリでも Unauthorized
  77  |       // ただし refresh は「リフレッシュトークンが無効」を示すレスポンス
  78  |       if (isQuery(request, 'refresh')) {
  79  |         await route.fulfill({
  80  |           status: 200,
  81  |           contentType: 'application/json',
  82  |           body: JSON.stringify({
  83  |             data: { refresh: null }, // ← refresh失敗
  84  |             errors: [{ message: 'refresh token expired' }],
  85  |           }),
  86  |         });
  87  |         return;
  88  |       }
  89  | 
  90  |       await route.fulfill({
  91  |         status: 200,
  92  |         contentType: 'application/json',
  93  |         body: JSON.stringify({
  94  |           errors: [
  95  |             {
  96  |               message: 'Unauthorized',
  97  |               extensions: { code: 'UNAUTHENTICATED' },
  98  |             },
  99  |           ],
  100 |           data: null,
  101 |         }),
  102 |       });
  103 |     });
  104 | 
  105 |     await page.goto('/');
  106 | 
  107 |     // /login に遷移する
  108 |     await expect(page).toHaveURL(/\/login/);
  109 | 
  110 |     // localStorage がクリアされている
  111 |     const token = await page.evaluate(() => localStorage.getItem('access_token'));
  112 |     expect(token).toBeNull();
  113 |   });
  114 | 
  115 |   test('access_token が無い状態で訪問しても refresh が走って復旧する', async ({
  116 |     page,
  117 |     context,
  118 |   }) => {
  119 |     // ⭐ ページ起動前に localStorage をクリア
  120 |     await context.addInitScript(() => {
  121 |       try {
  122 |         localStorage.removeItem('access_token');
  123 |       } catch {}
  124 |     });
  125 | 
  126 |     let refreshCalled = false;
  127 |     await page.route('**/api/graphql', async (route, request) => {
  128 |       if (isQuery(request, 'refresh')) {
  129 |         refreshCalled = true;
  130 |         await route.fulfill({
  131 |           status: 200,
  132 |           contentType: 'application/json',
  133 |           body: JSON.stringify({
  134 |             data: {
  135 |               refresh: { access_token: 'recovered.token' },
  136 |             },
  137 |           }),
  138 |         });
  139 |         return;
  140 |       }
  141 |       await route.continue();
  142 |     });
  143 | 
  144 |     await page.goto('/');
  145 | 
  146 |     await expect(page.getByText(/件ヒット/)).toBeVisible();
  147 |     expect(refreshCalled).toBe(true);
  148 |   });
  149 | 
  150 |   /**
  151 |    * モック無し・実 backend と通信する認証フロー検証。
  152 |    * これは CORS / cookie / proxy 設定の動作確認に必要。
  153 |    */
  154 |   test.describe('認証フロー（実通信）', () => {
  155 |     test('ログイン後、refresh cookie が正しいオリジンに設定される', async ({ page, context }) => {
  156 |       // ログイン画面から実際にログイン
  157 |       await page.goto('/login');
  158 |       await page.getByPlaceholder(/ユーザー名|username/i).fill('e2e_user');
  159 |       await page.getByPlaceholder(/パスワード|password/i).fill('e2e_pass');
  160 |       await page.getByRole('button', { name: /ログイン/ }).click();
  161 | 
> 162 |       await page.waitForURL('/');
      |                  ^ Error: page.waitForURL: Test ended.
  163 | 
  164 |       // localStorage に access_token があるか
  165 |       const token = await page.evaluate(() => localStorage.getItem('access_token'));
  166 |       expect(token).toBeTruthy();
  167 | 
  168 |       // ⭐ refresh cookie がフロントオリジン(3000) で取得できるか
  169 |       const cookies = await context.cookies('http://localhost:3000');
  170 |       const refreshCookie = cookies.find((c) => /refresh/i.test(c.name));
  171 |       expect(refreshCookie).toBeDefined();
  172 |       expect(refreshCookie?.httpOnly).toBe(true); // セキュリティ要件
  173 |     });
  174 | 
  175 |     test('access_token を消してもページが動く（実 refresh が成功する）', async ({ page }) => {
  176 |       // 一度ログインして cookie を取得
  177 |       await page.goto('/login');
  178 |       await page.getByPlaceholder(/ユーザー名/i).fill('e2e_user');
  179 |       await page.getByPlaceholder(/パスワード/i).fill('e2e_pass');
  180 |       await page.getByRole('button', { name: /ログイン/ }).click();
  181 |       await page.waitForURL('/');
  182 | 
  183 |       // localStorage の access_token だけ消去
  184 |       await page.evaluate(() => localStorage.removeItem('access_token'));
  185 | 
  186 |       // 再度ホームへ → refresh が走って自動復旧するはず
  187 |       await page.reload();
  188 | 
  189 |       // データが見える = refresh 経路で復旧成功
  190 |       await expect(page.getByText(/件ヒット/)).toBeVisible();
  191 | 
  192 |       // 新しい token が入っている
  193 |       const newToken = await page.evaluate(() => localStorage.getItem('access_token'));
  194 |       expect(newToken).toBeTruthy();
  195 |     });
  196 | 
  197 |     test('rewrites が効いていて /api/graphql が backend に届く', async ({ page }) => {
  198 |       // ログイン状態でホームへ
  199 |       await page.goto('/');
  200 | 
  201 |       // 実際の通信ログを取って destination を確認
  202 |       const responses: string[] = [];
  203 |       page.on('response', (res) => {
  204 |         if (res.url().includes('/api/graphql')) {
  205 |           responses.push(res.url());
  206 |         }
  207 |       });
  208 | 
  209 |       await page.waitForTimeout(2000);
  210 | 
  211 |       // /api/graphql で 200 が返ってくる = rewrites が機能している
  212 |       expect(responses.length).toBeGreaterThan(0);
  213 |       for (const url of responses) {
  214 |         // ブラウザから見たURLは 3000、実際の処理は 3001 にプロキシされている
  215 |         expect(url).toContain('localhost:3000/api/graphql');
  216 |       }
  217 |     });
  218 |   });
  219 | });
  220 | 
```