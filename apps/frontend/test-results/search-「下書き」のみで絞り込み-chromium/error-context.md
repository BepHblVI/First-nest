# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: search.spec.ts >> 「下書き」のみで絞り込み
- Location: e2e/search.spec.ts:63:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('E2E アンケートB')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('E2E アンケートB')

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e3]:
      - heading "📊 マイ・アンケート管理" [level=1] [ref=e4]
      - button "ログアウト" [ref=e5] [cursor=pointer]
    - generic [ref=e6]:
      - heading "1. 新規アンケート作成" [level=2] [ref=e7]
      - generic [ref=e8]:
        - textbox "アンケートのタイトル" [ref=e9]
        - generic [ref=e10]:
          - generic [ref=e11]: "回答者の認証:"
          - combobox [ref=e13]:
            - option "🌐 誰でも回答可能" [selected]
            - option "🔑 招待者のみ"
        - generic [ref=e14]:
          - generic [ref=e15]: "公開設定:"
          - generic [ref=e16]:
            - generic [ref=e17] [cursor=pointer]:
              - radio "🌐 公開して回答受付を開始" [checked] [ref=e18]
              - generic [ref=e19]: 🌐 公開して回答受付を開始
            - generic [ref=e20] [cursor=pointer]:
              - radio "📝 下書きとして保存" [ref=e21]
              - generic [ref=e22]: 📝 下書きとして保存
          - paragraph [ref=e23]: ✅ 作成後すぐに共有リンクから回答を受け付けます
        - generic [ref=e24]:
          - text: "質問リスト:"
          - generic [ref=e25]:
            - generic [ref=e26]:
              - textbox "質問 1" [ref=e27]
              - button "✕" [ref=e28] [cursor=pointer]
            - generic [ref=e29]:
              - generic [ref=e30]:
                - text: "回答形式:"
                - combobox [ref=e31]:
                  - option "テキスト入力" [selected]
                  - option "単一選択(ラジオ)"
                  - option "複数選択(チェックボックス)"
              - generic [ref=e32] [cursor=pointer]:
                - checkbox "必須にする" [ref=e33]
                - generic [ref=e34]: 必須にする
          - button "＋ 質問を追加" [ref=e35] [cursor=pointer]
        - button "🚀 アンケートを公開する" [ref=e36] [cursor=pointer]
    - generic [ref=e37]:
      - heading "2. あなたの作成済みアンケート" [level=2] [ref=e38]
      - generic [ref=e39]:
        - heading "🔍 検索・絞り込み" [level=3] [ref=e40]
        - generic [ref=e41]:
          - textbox "キーワード(100文字以内)" [ref=e42]
          - combobox [ref=e43]:
            - option "タイトルのみ" [selected]
            - option "タイトル+質問文"
        - generic [ref=e44]:
          - generic [ref=e45]: 公開状態
          - generic [ref=e46]:
            - checkbox "公開" [ref=e47]
            - text: 公開
          - generic [ref=e48]:
            - checkbox "下書き" [checked] [ref=e49]
            - text: 下書き
        - generic [ref=e50]:
          - generic [ref=e51]: アクセス権限
          - generic [ref=e52]:
            - checkbox "🌐 公開" [ref=e53]
            - text: 🌐 公開
          - generic [ref=e54]:
            - checkbox "🔑 招待制" [ref=e55]
            - text: 🔑 招待制
        - generic [ref=e56]:
          - generic [ref=e57]: 回答状態
          - generic [ref=e58]:
            - checkbox "回答あり" [ref=e59]
            - text: 回答あり
          - generic [ref=e60]:
            - checkbox "未回答" [ref=e61]
            - text: 未回答
        - generic [ref=e62]:
          - generic [ref=e63]: 回答件数
          - spinbutton [ref=e64]
          - text: 〜
          - spinbutton [ref=e65]
        - generic [ref=e66]:
          - generic [ref=e67]: 作成日
          - textbox [ref=e68]
          - text: 〜
          - textbox [ref=e69]
        - generic [ref=e70]:
          - generic [ref=e71]: 並び替え
          - combobox [ref=e72]:
            - option "作成日時" [selected]
            - option "更新日時"
            - option "タイトル"
            - option "回答件数"
          - combobox [ref=e73]:
            - option "降順" [selected]
            - option "昇順"
        - generic [ref=e74]:
          - button "🔍 検索" [active] [ref=e75] [cursor=pointer]
          - button "リセット" [ref=e76] [cursor=pointer]
      - generic [ref=e77]: 0件ヒット
      - paragraph [ref=e78]: アンケートが見つかりません
  - button "Open Next.js Dev Tools" [ref=e84] [cursor=pointer]:
    - img [ref=e85]
  - alert [ref=e88]
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
> 68 |   await expect(page.getByText('E2E アンケートB')).toBeVisible();
     |                                              ^ Error: expect(locator).toBeVisible() failed
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
  79 |   await expect(page.getByText(/0件ヒット/)).toBeHidden();
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