// test/utils/auth-client.ts
import request from 'supertest';
import { sendGql } from './gql-client';
import type { INestApplication } from '@nestjs/common';

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
    `mutation { signUp(username: "${username}", password: "${password}") { id } }`,
  );
};

/**
 * ログイン → access_token と refresh_token Cookie を返す
 */
export const login = async (
  app: INestApplication,
  username: string,
  password: string,
) => {
  const res = await sendGql(
    app,
    `mutation { login(username: "${username}", password: "${password}") { access_token } }`,
  );

  const accessToken = res.body.data?.login?.access_token;
  const setCookie = extractRefreshCookie(res);
  const refreshCookie = setCookie ? cookieToHeader(setCookie) : undefined;

  return {
    accessToken,
    refreshCookie, // "refresh_token=xxx" 形式
    rawSetCookie: setCookie, // "refresh_token=xxx; HttpOnly; ..." 形式(検証用)
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
) => {
  await signUp(app, username, password);
  return await login(app, username, password);
};

/**
 * リフレッシュリクエスト(Cookieを送って新トークン取得)
 */
export const refreshAccessToken = async (
  app: INestApplication,
  cookie: string,
) => {
  return await sendGqlWithCookie(app, `mutation { refresh { access_token } }`, {
    cookie,
  });
};
