# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: search.spec.ts >> リセットで全件に戻る
- Location: e2e/search.spec.ts:72:1

# Error details

```
Error: expect(locator).toBeHidden() failed

Locator:  getByText(/0件ヒット/)
Expected: hidden
Received: visible

Call log:
  - Expect "toBeHidden" with timeout 5000ms
  - waiting for getByText(/0件ヒット/)
    8 × locator resolved to <div>0件ヒット</div>
      - unexpected value "visible"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.skip('🔧 通信デバッグ', async ({ page }) => {
  4  |   // ブラウザのコンソールログ
  5  |   page.on('console', (msg) => console.log(`[browser ${msg.type()}]`, msg.text()));
  6  |   page.on('pageerror', (err) => console.log('[browser error]', err.message));
  7  | 
  8  |   // ダイアログがあれば出力（aleart で止まると静かに失敗するので）
  9  |   page.on('dialog', async (dialog) => {
  10 |     console.log('[dialog]', dialog.type(), dialog.message());
  11 |     await dialog.dismiss();
  12 |   });
  13 | 
  14 |   // GraphQL 通信
  15 |   page.on('request', (req) => {
  16 |     if (req.url().includes('graphql')) {
  17 |       console.log('=== REQ ===');
  18 |       console.log('URL :', req.url());
  19 |       console.log('AUTH:', req.headers()['authorization'] ?? '(none)');
  20 |       console.log('BODY:', req.postData()?.slice(0, 200));
  21 |     }
  22 |   });
  23 |   page.on('response', async (res) => {
  24 |     if (res.url().includes('graphql')) {
  25 |       console.log('=== RES ===');
  26 |       console.log('URL   :', res.url());
  27 |       console.log('STATUS:', res.status());
  28 |       try {
  29 |         const body = await res.text();
  30 |         console.log('BODY  :', body.slice(0, 500));
  31 |       } catch (e) {
  32 |         console.log('BODY  : (read error)', e);
  33 |       }
  34 |     }
  35 |   });
  36 | 
  37 |   await page.goto('/');
  38 |   // 5秒だけ待って通信を観測
  39 |   await page.waitForTimeout(5000);
  40 | 
  41 |   // 画面に何件と表示されているか
  42 |   const headerText = await page
  43 |     .getByText(/件ヒット/)
  44 |     .textContent()
  45 |     .catch(() => 'not found');
  46 |   console.log('🖥️ 画面表示:', headerText);
  47 | });
  48 | 
  49 | test.beforeEach(async ({ page }) => {
  50 |   await page.goto('/');
  51 |   // 検索結果が表示されるまで待つ
  52 |   await expect(page.getByText(/件ヒット/)).toBeVisible();
  53 | });
  54 | 
  55 | test('キーワードで件数が絞られる', async ({ page }) => {
  56 |   await page.getByPlaceholder(/キーワード/).fill('E2E アンケートA');
  57 |   await page.getByRole('button', { name: /検索/ }).click();
  58 | 
  59 |   await expect(page.getByText(/1件ヒット/)).toBeVisible();
  60 |   await expect(page.getByText('E2E アンケートA')).toBeVisible();
  61 | });
  62 | 
  63 | test('「下書き」のみで絞り込み', async ({ page }) => {
  64 |   // ⭐ 「下書きとして保存」(radio) と区別するため role を明示
  65 |   await page.getByRole('checkbox', { name: '下書き' }).check();
  66 |   await page.getByRole('button', { name: /検索/ }).click();
  67 | 
  68 |   await expect(page.getByText('E2E アンケートB')).toBeVisible();
  69 |   await expect(page.getByText('E2E アンケートA')).toBeHidden();
  70 | });
  71 | 
  72 | test('リセットで全件に戻る', async ({ page }) => {
  73 |   await page.getByPlaceholder(/キーワード/).fill('xyz_存在しない');
  74 |   await page.getByRole('button', { name: /検索/ }).click();
  75 |   await expect(page.getByText(/0件ヒット/)).toBeVisible();
  76 | 
  77 |   await page.getByRole('button', { name: /リセット/ }).click();
  78 | 
> 79 |   await expect(page.getByText(/0件ヒット/)).toBeHidden();
     |                                         ^ Error: expect(locator).toBeHidden() failed
  80 | });
  81 | 
  82 | test('ページング: 次へボタン', async ({ page }) => {
  83 |   // limit=10 を超えるデータがある前提
  84 |   const nextButton = page.getByRole('button', { name: /次へ/ });
  85 |   if (await nextButton.isEnabled()) {
  86 |     await nextButton.click();
  87 |     await expect(page.getByText(/2 \/ \d+ ページ/)).toBeVisible();
  88 |   }
  89 | });
  90 | 
  91 | test('SUBMISSION_COUNT 降順で並び替え', async ({ page }) => {
  92 |   await page.locator('select').filter({ hasText: '作成日時' }).selectOption('SUBMISSION_COUNT');
  93 |   await page.getByRole('button', { name: /検索/ }).click();
  94 | 
  95 |   // 1件目のタイトルが何か（具体的検証はデータに合わせて）
  96 |   await expect(page.locator('h3').first()).toBeVisible();
  97 | });
  98 | 
```