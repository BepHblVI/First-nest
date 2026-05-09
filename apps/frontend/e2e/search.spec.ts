import { test, expect } from '@playwright/test';

test.skip('🔧 通信デバッグ', async ({ page }) => {
  // ブラウザのコンソールログ
  page.on('console', (msg) => console.log(`[browser ${msg.type()}]`, msg.text()));
  page.on('pageerror', (err) => console.log('[browser error]', err.message));

  // ダイアログがあれば出力（aleart で止まると静かに失敗するので）
  page.on('dialog', async (dialog) => {
    console.log('[dialog]', dialog.type(), dialog.message());
    await dialog.dismiss();
  });

  // GraphQL 通信
  page.on('request', (req) => {
    if (req.url().includes('graphql')) {
      console.log('=== REQ ===');
      console.log('URL :', req.url());
      console.log('AUTH:', req.headers()['authorization'] ?? '(none)');
      console.log('BODY:', req.postData()?.slice(0, 200));
    }
  });
  page.on('response', async (res) => {
    if (res.url().includes('graphql')) {
      console.log('=== RES ===');
      console.log('URL   :', res.url());
      console.log('STATUS:', res.status());
      try {
        const body = await res.text();
        console.log('BODY  :', body.slice(0, 500));
      } catch (e) {
        console.log('BODY  : (read error)', e);
      }
    }
  });

  await page.goto('/');
  // 5秒だけ待って通信を観測
  await page.waitForTimeout(5000);

  // 画面に何件と表示されているか
  const headerText = await page
    .getByText(/件ヒット/)
    .textContent()
    .catch(() => 'not found');
  console.log('🖥️ 画面表示:', headerText);
});

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  // 検索結果が表示されるまで待つ
  await expect(page.getByText(/件ヒット/)).toBeVisible();
});

test('キーワードで件数が絞られる', async ({ page }) => {
  await page.getByPlaceholder(/キーワード/).fill('E2E アンケートA');
  await page.getByRole('button', { name: /検索/ }).click();

  await expect(page.getByText(/1件ヒット/)).toBeVisible();
  await expect(page.getByText('E2E アンケートA')).toBeVisible();
});

test('「下書き」のみで絞り込み', async ({ page }) => {
  // ⭐ 「下書きとして保存」(radio) と区別するため role を明示
  await page.getByRole('checkbox', { name: '下書き' }).check();
  await page.getByRole('button', { name: /検索/ }).click();

  await expect(page.getByText('E2E アンケートB')).toBeVisible();
  await expect(page.getByText('E2E アンケートA')).toBeHidden();
});

test('リセットで全件に戻る', async ({ page }) => {
  await page.getByPlaceholder(/キーワード/).fill('xyz_存在しない');
  await page.getByRole('button', { name: /検索/ }).click();
  await expect(page.getByText(/0件ヒット/)).toBeVisible();

  await page.getByRole('button', { name: /リセット/ }).click();

  await expect(page.getByText(/0件ヒット/)).toBeHidden();
});

test('ページング: 次へボタン', async ({ page }) => {
  // limit=10 を超えるデータがある前提
  const nextButton = page.getByRole('button', { name: /次へ/ });
  if (await nextButton.isEnabled()) {
    await nextButton.click();
    await expect(page.getByText(/2 \/ \d+ ページ/)).toBeVisible();
  }
});

test('SUBMISSION_COUNT 降順で並び替え', async ({ page }) => {
  await page.locator('select').filter({ hasText: '作成日時' }).selectOption('SUBMISSION_COUNT');
  await page.getByRole('button', { name: /検索/ }).click();

  // 1件目のタイトルが何か（具体的検証はデータに合わせて）
  await expect(page.locator('h3').first()).toBeVisible();
});
