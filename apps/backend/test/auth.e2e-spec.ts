// test/auth.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from './../src/app.module';

import { GqlThrottlerGuard } from '../src/auth/guards/gql-throttler.guard';
import { sendGql } from './utils/gql-client';
import {
  signUp,
  login,
  signUpAndLogin,
  refreshAccessToken,
  refreshWithNewCookie,
  logout,
  sendGqlWithCookie,
} from './utils/auth-client';
import { cleanDatabase } from './utils/db-cleaner';

describe('Auth GraphQL API (e2e)', () => {
  let app: INestApplication;

  // ★ アプリ起動は1回だけ
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(GqlThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  // ★ 各テスト前にDBクリア
  beforeEach(async () => {
    await cleanDatabase(app);
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  // ─────────────────────────────────────────
  // ログイン
  // ─────────────────────────────────────────
  describe('ログイン', () => {
    const username = 'loginuser';
    const password = 'password123';

    beforeEach(async () => {
      await signUp(app, username, password);
    });

    test('access_token(Body)とrefresh_token(Cookie)が発行される', async () => {
      const { accessToken, rawSetCookie } = await login(
        app,
        username,
        password,
      );

      expect(typeof accessToken).toBe('string');
      expect(accessToken.split('.')).toHaveLength(3); // JWT形式
      expect(rawSetCookie).toBeDefined();
      expect(rawSetCookie).toContain('HttpOnly');
    });

    test('間違ったパスワードでログインできない', async () => {
      const res = await sendGql(
        app,
        `mutation { login(username: "${username}", password: "wrong") { access_token } }`,
      );
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].message).toMatch(/パスワード|ユーザー/);
    });

    test('存在しないユーザーでログインできない', async () => {
      const res = await sendGql(
        app,
        `mutation { login(username: "nonexistent_xxx", password: "any") { access_token } }`,
      );
      expect(res.body.errors).toBeDefined();
    });

    test('エラーメッセージから「ユーザー存在/不存在」が判別できないこと', async () => {
      const wrongPassRes = await sendGql(
        app,
        `mutation { login(username: "${username}", password: "wrong") { access_token } }`,
      );
      const noUserRes = await sendGql(
        app,
        `mutation { login(username: "nonexistent_xxx", password: "any") { access_token } }`,
      );
      // 同じメッセージが返る = User Enumeration対策
      expect(wrongPassRes.body.errors[0].message).toBe(
        noUserRes.body.errors[0].message,
      );
    });
  });

  // ─────────────────────────────────────────
  // リフレッシュ機能 (Refresh Token Rotation 対応版)
  // ─────────────────────────────────────────
  describe('リフレッシュ機能 (refresh)', () => {
    const username = 'refreshuser';
    const password = 'password123';
    let validCookie: string;

    beforeEach(async () => {
      const result = await signUpAndLogin(app, username, password);
      validCookie = result.refreshCookie!;
    });

    test('有効なrefresh_token Cookieで新しいaccess_tokenを取得できる', async () => {
      const res = await refreshAccessToken(app, validCookie);

      expect(res.body.errors).toBeUndefined();
      const newToken = res.body.data?.refresh?.access_token;
      expect(typeof newToken).toBe('string');
      expect(newToken.split('.')).toHaveLength(3);
    });

    test('refresh時に新しい refresh_token Cookie がセットされる(ローテーション)', async () => {
      // セキュリティ: refresh の度に新トークンが発行され、Cookie が更新される
      const { newRefreshCookie, rawSetCookie } = await refreshWithNewCookie(
        app,
        validCookie,
      );

      expect(newRefreshCookie).toBeDefined();
      expect(rawSetCookie).toContain('HttpOnly');
      // 新Cookie の値が古い Cookie と異なること
      expect(newRefreshCookie).not.toBe(validCookie);
    });

    test('ローテーション: 同じrefresh_tokenを2回使うとエラーになる', async () => {
      // OAuth 2.0 BCP 準拠: 一度使った refresh_token は無効化される
      const res1 = await refreshAccessToken(app, validCookie);
      expect(res1.body.errors).toBeUndefined();

      // 同じ古い Cookie で2回目を試行 → revoked 済みなのでエラー
      const res2 = await refreshAccessToken(app, validCookie);
      expect(res2.body.errors).toBeDefined();
      expect(res2.body.errors[0].message).toMatch(
        /リフレッシュトークン|Unauthorized/,
      );
    });

    test('ローテーション: 新しいCookieを使えば連続してrefreshできる', async () => {
      // 1回目: validCookie → newCookie1
      const r1 = await refreshWithNewCookie(app, validCookie);
      expect(r1.newRefreshCookie).toBeDefined();

      // 2回目: newCookie1 → newCookie2
      const r2 = await refreshWithNewCookie(app, r1.newRefreshCookie!);
      expect(r2.newRefreshCookie).toBeDefined();
      expect(r2.accessToken).toBeDefined();

      // 各段階で異なる Cookie になっている
      expect(r1.newRefreshCookie).not.toBe(validCookie);
      expect(r2.newRefreshCookie).not.toBe(r1.newRefreshCookie);
    });

    test('Cookieなしでrefreshを呼ぶとエラーになる', async () => {
      const res = await sendGql(app, `mutation { refresh { access_token } }`);
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].message).toMatch(
        /リフレッシュトークン|Unauthorized/,
      );
    });

    test('不正な値のrefresh_tokenでrefreshを呼ぶとエラーになる', async () => {
      const res = await sendGqlWithCookie(
        app,
        `mutation { refresh { access_token } }`,
        { cookie: 'refresh_token=this.is.invalid.jwt' },
      );
      expect(res.body.errors).toBeDefined();
    });

    test('別のsecretで署名されたトークンを送ってもrefreshできない', async () => {
      // 署名検証で弾かれる
      const fakeJwt =
        'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOjEsInVzZXJuYW1lIjoiaGFja2VyIn0.invalid_signature';
      const res = await sendGqlWithCookie(
        app,
        `mutation { refresh { access_token } }`,
        { cookie: `refresh_token=${fakeJwt}` },
      );
      expect(res.body.errors).toBeDefined();
    });

    test('JWT署名は有効だがDBに登録されていないトークンはrefreshできない(盗難検知)', async () => {
      // refresh して revoke させた古いトークンを再使用 → DB照合で弾かれる
      await refreshAccessToken(app, validCookie); // 1回目: revoked になる
      const res = await refreshAccessToken(app, validCookie); // 2回目: 拒否

      expect(res.body.errors).toBeDefined();
    });

    test('refreshで取得した新トークンで認証付きAPIにアクセスできる', async () => {
      const refreshRes = await refreshAccessToken(app, validCookie);
      const newToken = refreshRes.body.data.refresh.access_token;

      const res = await sendGql(app, `query { getSurvey { id } }`, newToken);
      expect(res.body.errors).toBeUndefined();
      expect(Array.isArray(res.body.data?.getSurvey)).toBe(true);
    });

    test('refreshで取得したトークンの payload が正しい(sub に userId が入っている)', async () => {
      const refreshRes = await refreshAccessToken(app, validCookie);
      const newToken = refreshRes.body.data.refresh.access_token;

      const payloadPart = newToken.split('.')[1];
      const payload = JSON.parse(
        Buffer.from(payloadPart, 'base64').toString('utf8'),
      );

      expect(payload.sub).toBeDefined();
      expect(typeof payload.sub).toBe('number');
      expect(payload.username).toBe(username);
      expect(payload.exp).toBeDefined();
    });
  });

  // ─────────────────────────────────────────
  // ログアウト機能 (新規)
  // ─────────────────────────────────────────
  describe('ログアウト機能 (logout)', () => {
    const username = 'logoutuser';
    const password = 'password123';
    let validCookie: string;

    beforeEach(async () => {
      const result = await signUpAndLogin(app, username, password);
      validCookie = result.refreshCookie!;
    });

    test('logoutが成功するとtrueが返る', async () => {
      const res = await logout(app, validCookie);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data?.logout).toBe(true);
    });

    test('logout後はrefresh_token Cookieがクリアされる', async () => {
      const res = await logout(app, validCookie);
      const setCookieHeader = res.headers['set-cookie'];

      // Set-Cookie で refresh_token を消すヘッダが含まれる
      // (空文字 or Max-Age=0 のような形)
      expect(setCookieHeader).toBeDefined();
      const cookies = Array.isArray(setCookieHeader)
        ? setCookieHeader
        : [setCookieHeader];
      const clearCookie = cookies.find((c: string) =>
        c?.startsWith('refresh_token='),
      );
      expect(clearCookie).toBeDefined();
      // 値が空 or Max-Age=0 / Expires=過去の日付 のいずれか
      expect(clearCookie).toMatch(
        /refresh_token=;|Max-Age=0|Expires=Thu, 01 Jan 1970/,
      );
    });

    test('logout後、古いrefresh_tokenでrefreshを呼ぶとエラー', async () => {
      // ログアウト前のCookieを保持しておく
      const oldCookie = validCookie;

      await logout(app, validCookie);

      // 同じCookieでrefresh → サーバ側で revoked なので拒否
      const res = await refreshAccessToken(app, oldCookie);
      expect(res.body.errors).toBeDefined();
    });

    test('Cookieなしでlogoutを呼んでも成功する(冪等性)', async () => {
      // 既にログアウト済みのユーザーが logout を叩く想定
      const res = await logout(app);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data?.logout).toBe(true);
    });

    test('無効な値のrefresh_tokenでlogoutを呼んでも成功する(冪等性)', async () => {
      // セキュリティ: 「無効なトークンです」と教えるとattackerの探索を助けるので
      // 常に成功扱いにする
      const res = await sendGqlWithCookie(app, `mutation { logout }`, {
        cookie: 'refresh_token=invalid.token.here',
      });

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data?.logout).toBe(true);
    });
  });

  // ─────────────────────────────────────────
  // アクセストークン検証
  // ─────────────────────────────────────────
  describe('access_tokenの検証', () => {
    test('access_tokenなしで認証必須APIにアクセスするとエラー', async () => {
      const res = await sendGql(app, `query { getSurvey { id } }`);
      expect(res.body.errors).toBeDefined();
    });

    test('不正なaccess_tokenで認証必須APIにアクセスするとエラー', async () => {
      const res = await sendGql(
        app,
        `query { getSurvey { id } }`,
        'invalid.token.here',
      );
      expect(res.body.errors).toBeDefined();
    });
  });

  // ─────────────────────────────────────────
  // サインアップ
  // ─────────────────────────────────────────
  describe('signUp', () => {
    test('同じユーザー名で2回登録するとエラー', async () => {
      const username = 'dupuser';
      const res1 = await signUp(app, username, 'pass1234');
      expect(res1.body.errors).toBeUndefined();

      const res2 = await signUp(app, username, 'pass5678');
      expect(res2.body.errors).toBeDefined();
      expect(res2.body.errors[0].message).toMatch(/既に使用|重複/);
    });

    test('正常な情報でユーザー登録できる', async () => {
      const res = await signUp(app, 'newuser', 'password123');
      expect(res.body.errors).toBeUndefined();
    });

    // ─── パスワード強度 (新規) ───
    describe('パスワード強度バリデーション', () => {
      test('短すぎるパスワード(7文字以下)は拒否される', async () => {
        const res = await signUp(app, 'shortpass', 'abc123');
        expect(res.body.errors).toBeDefined();
      });

      test('英字を含まないパスワードは拒否される', async () => {
        const res = await signUp(app, 'noletter', '12345678');
        expect(res.body.errors).toBeDefined();
      });

      test('数字を含まないパスワードは拒否される', async () => {
        const res = await signUp(app, 'nonumber', 'onlyletters');
        expect(res.body.errors).toBeDefined();
      });

      test('英字+数字なら通る', async () => {
        const res = await signUp(app, 'goodpass1', 'abc12345');
        expect(res.body.errors).toBeUndefined();
      });
    });

    // ─── ユーザー名強度 (新規) ───
    describe('ユーザー名バリデーション', () => {
      test('短すぎるユーザー名(2文字以下)は拒否される', async () => {
        const res = await signUp(app, 'ab', 'valid12345');
        expect(res.body.errors).toBeDefined();
      });

      test('長すぎるユーザー名(51文字以上)は拒否される', async () => {
        const res = await signUp(app, 'a'.repeat(51), 'valid12345');
        expect(res.body.errors).toBeDefined();
      });
    });
  });
});
