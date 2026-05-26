// test/utils/auth-client.ts
import { sendGql } from './gql-client';
import type { INestApplication } from '@nestjs/common';

// ═════════════════════════════════════════
// 型定義
// ═════════════════════════════════════════

export interface LoginResult {
  accessToken: string;
  /** "refresh_token=xxx" 形式 (リクエストの Cookie ヘッダにそのまま使える) */
  refreshCookie: string | undefined;
  /** "refresh_token=xxx; HttpOnly; ..." 形式 (Cookie属性検証用) */
  rawSetCookie: string | undefined;
  response: any;
}

export interface RefreshResult {
  accessToken: string;
  /** ローテーション後の新 Cookie */
  newRefreshCookie: string | undefined;
  rawSetCookie: string | undefined;
  response: any;
}

/**
 * 認証系ユーティリティの共通オプション
 */
export interface AuthOptions {
  /** 対象のテナントサブドメイン（例: 'alice'） */
  subdomain?: string;
}

// ═════════════════════════════════════════
// Cookie ユーティリティ
// ═════════════════════════════════════════

/**
 * HTTPレスポンスの `set-cookie` ヘッダーから `refresh_token` の文字列を抽出します。
 *
 * @param response supertest の生レスポンスオブジェクト
 * @returns 抽出された Cookie 文字列、存在しない場合は undefined
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
 * サーバーから送られた `set-cookie` の値（属性付き）から、
 * クライアントが送信するための純粋なキー＆バリュー形式に変換します。
 *
 * @example
 * // "refresh_token=xxx; HttpOnly; Path=/" → "refresh_token=xxx"
 * @param setCookieValue サーバーから受信した生の Cookie 文字列
 * @returns リクエストヘッダー用の Cookie 文字列
 */
export const cookieToHeader = (setCookieValue: string): string => {
  return setCookieValue.split(';')[0];
};

// ═════════════════════════════════════════
// 認証フロー
// ═════════════════════════════════════════

/**
 * 指定したユーザー名とパスワードで新規ユーザー登録（サインアップ）を行います。
 *
 * @param app NestJSのアプリケーションインスタンス
 * @param username 登録するユーザー名
 * @param password 登録するパスワード
 * @param options サブドメイン指定などのオプション
 * @returns ユーザーの `id` を含む GraphQLの生レスポンス
 */
export const signUp = async (
  app: INestApplication,
  username: string,
  password: string,
  options?: AuthOptions,
) => {
  return await sendGql(
    app,
    `mutation { signUp(input: {username: "${username}", password: "${password}"}) { id } }`,
    { subdomain: options?.subdomain },
  );
};

/**
 * ログインを実行し、アクセストークンと抽出されたリフレッシュ Cookie をまとめて返します。
 *
 * @param app NestJSのアプリケーションインスタンス
 * @param username ユーザー名
 * @param password パスワード
 * @param options サブドメイン指定などのオプション
 * @returns アクセストークン、Cookie、生レスポンスを含む LoginResult オブジェクト
 */
export const login = async (
  app: INestApplication,
  username: string,
  password: string,
  options?: AuthOptions,
): Promise<LoginResult> => {
  const res = await sendGql(
    app,
    `mutation { login(username: "${username}", password: "${password}") { access_token } }`,
    { subdomain: options?.subdomain },
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
 * サインアップとログインを連続して実行するコンビニエンスメソッドです。
 * テストデータの準備を迅速に行いたい場合に使用します。
 *
 * @param app NestJSのアプリケーションインスタンス
 * @param username ユーザー名
 * @param password パスワード
 * @param options サブドメイン指定などのオプション
 * @returns ログイン完了後の LoginResult オブジェクト
 */
export const signUpAndLogin = async (
  app: INestApplication,
  username: string,
  password: string,
  options?: AuthOptions,
): Promise<LoginResult> => {
  await signUp(app, username, password, options);
  return await login(app, username, password, options);
};

/**
 * Cookieを使用してアクセストークンのリフレッシュリクエストを送信します。
 * トークンの抽出は行わず、エラー検証などのために生レスポンスを取得したい場合に使用します。
 *
 * @param app NestJSのアプリケーションインスタンス
 * @param cookie 送信するリフレッシュ Cookie 文字列（"refresh_token=xxx"）
 * @param options サブドメイン指定などのオプション
 * @returns GraphQLの生レスポンス
 */
export const refreshAccessToken = async (
  app: INestApplication,
  cookie: string,
  options?: AuthOptions,
) => {
  return await sendGql(app, `mutation { refresh { access_token } }`, {
    cookie,
    subdomain: options?.subdomain,
  });
};

/**
 * リフレッシュリクエストを実行し、新しく発行されたアクセストークンと
 * ローテーションされた新しい Cookie を抽出して返します。
 * 成功を前提とした正常系の検証に使用します。
 *
 * @param app NestJSのアプリケーションインスタンス
 * @param cookie 現在のリフレッシュ Cookie 文字列
 * @param options サブドメイン指定などのオプション
 * @returns 新しいアクセストークンと Cookie を含む RefreshResult オブジェクト
 */
export const refreshWithNewCookie = async (
  app: INestApplication,
  cookie: string,
  options?: AuthOptions,
): Promise<RefreshResult> => {
  const res = await refreshAccessToken(app, cookie, options);

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
 * ログアウトリクエストを送信し、セッション（Cookie）を破棄します。
 *
 * @param app NestJSのアプリケーションインスタンス
 * @param cookie 現在のリフレッシュ Cookie 文字列
 * @param options サブドメイン指定などのオプション
 * @returns GraphQLの生レスポンス
 */
export const logout = async (
  app: INestApplication,
  cookie?: string,
  options?: AuthOptions,
) => {
  return await sendGql(app, `mutation { logout }`, {
    cookie,
    subdomain: options?.subdomain,
  });
};
