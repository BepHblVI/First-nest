// test/auth.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { sendGql } from './utils/gql-client';
import {
  signUp,
  login,
  signUpAndLogin,
  refreshAccessToken,
  sendGqlWithCookie,
} from './utils/auth-client';

describe('Auth GraphQL API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  // ---------------------------
  // signUp / login の基本確認
  // ---------------------------
  describe('ログイン', () => {
    const user = `loginuser_${Date.now()}`;
    const pass = 'password123';

    beforeAll(async () => {
      await signUp(app, user, pass);
    });

    test('access_token(Body)とrefresh_token(Cookie)が発行される', async () => {
      const { accessToken, rawSetCookie } = await login(app, user, pass);

      expect(typeof accessToken).toBe('string');
      expect(accessToken.split('.')).toHaveLength(3); // JWT形式
      expect(rawSetCookie).toBeDefined();
      expect(rawSetCookie).toContain('HttpOnly');
    });

    test('間違ったパスワードでログインできない', async () => {
      const res = await sendGql(
        app,
        `mutation { login(username: "${user}", password: "wrong") { access_token } }`,
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
        `mutation { login(username: "${user}", password: "wrong") { access_token } }`,
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

  // ---------------------------
  // リフレッシュ機能
  // ---------------------------
  describe('リフレッシュ機能 (refresh)', () => {
    let validCookie: string;
    let originalAccessToken: string;
    const user = `refreshuser_${Date.now()}`;
    const pass = 'password123';

    beforeAll(async () => {
      const result = await signUpAndLogin(app, user, pass);
      validCookie = result.refreshCookie!;
      originalAccessToken = result.accessToken;
    });

    test('有効なrefresh_token Cookieで新しいaccess_tokenを取得できる', async () => {
      const res = await refreshAccessToken(app, validCookie);

      expect(res.body.errors).toBeUndefined();
      const newToken = res.body.data?.refresh?.access_token;
      expect(typeof newToken).toBe('string');
      expect(newToken.split('.')).toHaveLength(3);
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
      // ランダムなJWT風の文字列(署名検証で弾かれる)
      const fakeJwt =
        'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOjEsInVzZXJuYW1lIjoiaGFja2VyIn0.invalid_signature';
      const res = await sendGqlWithCookie(
        app,
        `mutation { refresh { access_token } }`,
        { cookie: `refresh_token=${fakeJwt}` },
      );
      expect(res.body.errors).toBeDefined();
    });

    test('refreshで取得した新トークンで認証付きAPIにアクセスできる', async () => {
      // 1. refresh で新しいトークンを取得
      const refreshRes = await refreshAccessToken(app, validCookie);
      const newToken = refreshRes.body.data.refresh.access_token;

      // 2. 新トークンで認証必須APIを叩く
      const res = await sendGql(app, `query { getSurvey { id } }`, newToken);
      expect(res.body.errors).toBeUndefined();
      expect(Array.isArray(res.body.data?.getSurvey)).toBe(true);
    });

    test('refreshで取得したトークンの payload が正しい(sub に userId が入っている)', async () => {
      const refreshRes = await refreshAccessToken(app, validCookie);
      const newToken = refreshRes.body.data.refresh.access_token;

      // JWT を base64 デコードして payload を確認
      const payloadPart = newToken.split('.')[1];
      const payload = JSON.parse(
        Buffer.from(payloadPart, 'base64').toString('utf8'),
      );

      expect(payload.sub).toBeDefined();
      expect(typeof payload.sub).toBe('number');
      expect(payload.username).toBe(user);
      expect(payload.exp).toBeDefined(); // 有効期限が設定されている
    });

    test('複数回連続してrefreshを呼んでも毎回新しいトークンが取得できる', async () => {
      const res1 = await refreshAccessToken(app, validCookie);
      // JWT の iat(発行時刻)を変えるためにわずかに待機
      await new Promise((r) => setTimeout(r, 1100));
      const res2 = await refreshAccessToken(app, validCookie);

      const token1 = res1.body.data.refresh.access_token;
      const token2 = res2.body.data.refresh.access_token;

      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      // iat が違うので必ず別文字列になる
      expect(token1).not.toBe(token2);
    });

    test('refreshしてもrefresh_token自体は同じものが使い続けられる', async () => {
      // ローテーションを実装していないことの確認
      // (実装した場合はこのテストは逆になる)
      const res1 = await refreshAccessToken(app, validCookie);
      const res2 = await refreshAccessToken(app, validCookie);
      expect(res1.body.errors).toBeUndefined();
      expect(res2.body.errors).toBeUndefined();
    });
  });

  // ---------------------------
  // アクセストークン検証
  // ---------------------------
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

  // ---------------------------
  // signUp の検証
  // ---------------------------
  describe('signUp', () => {
    test('同じユーザー名で2回登録するとエラー', async () => {
      const username = `dupuser_${Date.now()}`;
      const res1 = await signUp(app, username, 'pass1234');
      expect(res1.body.errors).toBeUndefined();

      const res2 = await signUp(app, username, 'pass5678');
      expect(res2.body.errors).toBeDefined();
      expect(res2.body.errors[0].message).toMatch(/既に使用|重複/);
    });
  });
});
