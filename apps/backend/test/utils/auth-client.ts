// test/utils/auth-client.ts
import request from 'supertest';
import { sendGql } from './gql-client';
import type { INestApplication } from '@nestjs/common';

// ═════════════════════════════════════════
// 型定義
// ═════════════════════════════════════════

/**
 * ログイン成功時の戻り値
 */
export interface LoginResult {
  accessToken: string;
  /** "refresh_token=xxx" 形式 (リクエストの Cookie ヘッダにそのまま使える) */
  refreshCookie: string | undefined;
  /** "refresh_token=xxx; HttpOnly; ..." 形式 (Cookie属性検証用) */
  rawSetCookie: string | undefined;
  response: any;
}

/**
 * リフレッシュ成功時の戻り値
 */
export interface RefreshResult {
  accessToken: string;
  /** ローテーション後の新 Cookie */
  newRefreshCookie: string | undefined;
  rawSetCookie: string | undefined;
  response: any;
}

// ═════════════════════════════════════════
// Cookie ユーティリティ
// ═════════════════════════════════════════

/**
 * set-cookie ヘッダーから refresh_token の Cookie 文字列を抽出
 */
export const extractRefreshCookie = (response: any): string | undefined => {
  const setCookieHeader = response.headers['set-cookie'];
  if (!setCookieHeader) return undefined;

  const cookies = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : [setCookieHeader];

  return cookies.find((c: string) => c?.startsWith('refresh_token='));
};

/**
 * Cookie を含む形式に変換(Cookie ヘッダー用)
 * "refresh_token=xxx; HttpOnly; ..." → "refresh_token=xxx"
 */
export const cookieToHeader = (setCookieValue: string): string => {
  return setCookieValue.split(';')[0];
};

// ═════════════════════════════════════════
// 基本リクエスト
// ═════════════════════════════════════════

/**
 * GraphQL リクエスト(Cookie 対応)
 */
export const sendGqlWithCookie = (
  app: INestApplication,
  query: string,
  options: { cookie?: string; token?: string } = {},
) => {
  const req = request(app.getHttpServer()).post('/graphql');

  if (options.token) {
    req.set('Authorization', `Bearer ${options.token}`);
  }
  if (options.cookie) {
    req.set('Cookie', options.cookie);
  }

  return req.send({ query });
};

// ═════════════════════════════════════════
// 認証フロー
// ═════════════════════════════════════════

/**
 * ユーザー作成
 */
export const signUp = async (
  app: INestApplication,
  username: string,
  password: string,
) => {
  return await sendGql(
    app,
    `mutation { signUp(input: {username: "${username}", password: "${password}"}) { id } }`,
  );
};

/**
 * ログイン → access_token と refresh_token Cookie を返す
 */
export const login = async (
  app: INestApplication,
  username: string,
  password: string,
): Promise<LoginResult> => {
  const res = await sendGql(
    app,
    `mutation { login(username: "${username}", password: "${password}") { access_token } }`,
  );

  const accessToken = res.body.data?.login?.access_token;
  const setCookie = extractRefreshCookie(res);
  const refreshCookie = setCookie ? cookieToHeader(setCookie) : undefined;

  return {
    accessToken,
    refreshCookie,
    rawSetCookie: setCookie,
    response: res,
  };
};

/**
 * サインアップ + ログイン
 */
export const signUpAndLogin = async (
  app: INestApplication,
  username: string,
  password: string,
): Promise<LoginResult> => {
  await signUp(app, username, password);
  return await login(app, username, password);
};

/**
 * リフレッシュリクエスト(Cookie送信のみ)
 * - access_token と Cookie 抽出までは行わない、生レスポンスが欲しい時用
 * - エラーレスポンスを検証するテストに最適
 */
export const refreshAccessToken = async (
  app: INestApplication,
  cookie: string,
) => {
  return await sendGqlWithCookie(app, `mutation { refresh { access_token } }`, {
    cookie,
  });
};

/**
 * リフレッシュリクエスト + accessToken/新Cookie 抽出
 * - ローテーション後の Cookie 連鎖検証にこちらを使う
 * - 成功を期待するテストに最適
 */
export const refreshWithNewCookie = async (
  app: INestApplication,
  cookie: string,
): Promise<RefreshResult> => {
  const res = await refreshAccessToken(app, cookie);

  const accessToken = res.body.data?.refresh?.access_token;
  const setCookie = extractRefreshCookie(res);
  const newRefreshCookie = setCookie ? cookieToHeader(setCookie) : undefined;

  return {
    accessToken,
    newRefreshCookie,
    rawSetCookie: setCookie,
    response: res,
  };
};

/**
 * ログアウトリクエスト
 */
export const logout = async (app: INestApplication, cookie?: string) => {
  return await sendGqlWithCookie(app, `mutation { logout }`, {
    cookie,
  });
};
