import request from 'supertest';
import { INestApplication } from '@nestjs/common';

export interface GqlError {
  message: string;
  path?: readonly (string | number)[];
  extensions?: Record<string, unknown>;
}

export interface GqlResponse<T = any> {
  data: T | null;
  errors?: GqlError[];
}

/**
 * 送信オプションのインターフェース
 */
export interface GqlRequestOptions {
  /** JWTアクセストークン（Authorization: Bearer <token>） */
  token?: string;
  /** GraphQLのvariables */
  variables?: Record<string, unknown>;
  /**
   * テナントを特定するためのサブドメイン（例: 'alice'）。
   * 指定した場合、内部で Host ヘッダーが `${subdomain}.example.com` に設定されます。
   */
  subdomain?: string;
  /**
   * Cookieヘッダー（例: "refresh_token=xxx"）
   * リフレッシュトークンの検証など、Cookieが必要なリクエストで使用します。
   */
  cookie?: string;
}

/**
 * GraphQLリクエストを送信し、生のHTTPレスポンスオブジェクトをそのまま返します。
 * 「エラー（errors）が返ること」や、Cookieの取得など HTTPレベルの検証をするテストで使用します。
 *
 * @param app NestJSのアプリケーションインスタンス
 * @param query 送信するGraphQLのクエリまたはミューテーション文字列
 * @param options (任意) リクエストの追加設定
 * @param options.token {string} JWTアクセストークン（Authorizationヘッダー用）
 * @param options.variables {Record<string, unknown>} GraphQLの変数（variables）
 * @param options.subdomain {string} アクセス先のテナントサブドメイン (例: 'alice')
 * @param options.cookie {string} リフレッシュトークンなどのCookie文字列
 * @returns supertestのHTTPレスポンスオブジェクト（Promise）
 *
 * @example
 * // 共通ルート(localhost)からのアクセス
 * const res = await sendGql(app, `mutation { ... }`);
 *
 * @example
 * // 'alice' テナントのサブドメインからのアクセス（Hostヘッダー偽装）
 * const res = await sendGql(app, `query { ... }`, { subdomain: 'alice' });
 */
export const sendGql = async (
  app: INestApplication,
  query: string,
  options?: GqlRequestOptions,
) => {
  const req = request(app.getHttpServer()).post('/graphql');

  // トークンのセット
  if (options?.token) {
    req.set('Authorization', `Bearer ${options.token}`);
  }
  if (options?.cookie) req.set('Cookie', options.cookie);

  // サブドメインの指定があれば、Hostヘッダーを偽装する（TenantMiddlewareの検証用）
  if (options?.subdomain) {
    req.set('Host', `${options.subdomain}.example.com`);
  }

  return req.send({ query, variables: options?.variables });
};

/**
 * GraphQLリクエストを送信し、成功時の `data` オブジェクトだけを返します。
 * もし `errors` が返ってきた場合は、内容をフォーマットして例外（Error）を投げるため、
 * コンソールで何が原因で失敗したのかが一目でわかります。
 * 「成功を期待するテスト（正常系）」や、テストデータ作成時のヘルパーとして使用します。
 *
 * @param app NestJSのアプリケーションインスタンス
 * @param query 送信するGraphQLのクエリまたはミューテーション文字列
 * @param options (任意) リクエストの追加設定
 * @param options.token {string} JWTアクセストークン（Authorizationヘッダー用）
 * @param options.variables {Record<string, unknown>} GraphQLの変数（variables）
 * @param options.subdomain {string} アクセス先のテナントサブドメイン (例: 'alice')
 * @param options.cookie {string} リフレッシュトークンなどのCookie文字列
 * @returns GraphQLレスポンスの `data` 部分のオブジェクト（Promise）
 *
 * @example
 * // 成功した場合、dataの中身が直接返る
 * const { createTenant } = await sendGqlOrThrow(app, `mutation { createTenant(slug: "test") { id } }`);
 *
 * @example
 * // 特定のサブドメイン環境でのリクエスト
 * const data = await sendGqlOrThrow(app, `query { getSurvey { id } }`, { token, subdomain: 'alice' });
 */
export const sendGqlOrThrow = async <T = any>(
  app: INestApplication,
  query: string,
  options?: GqlRequestOptions,
): Promise<T> => {
  const res = await sendGql(app, query, options);

  if (res.status !== 200) {
    throw new Error(
      `GraphQL HTTP ${res.status}\nBody: ${JSON.stringify(res.body, null, 2)}`,
    );
  }

  const errors = res.body?.errors as GqlError[] | undefined;
  if (errors?.length) {
    const formatted = errors
      .map(
        (e, i) =>
          `  [${i}] ${e.message}` +
          (e.path ? ` (path: ${e.path.join('.')})` : '') +
          (e.extensions?.code ? ` (code: ${e.extensions.code})` : ''),
      )
      .join('\n');
    throw new Error(`GraphQL errors:\n${formatted}`);
  }

  if (res.body?.data == null) {
    throw new Error(
      `GraphQL returned null data without errors. Body:\n${JSON.stringify(
        res.body,
        null,
        2,
      )}`,
    );
  }

  return res.body.data as T;
};

/**
 * 「errorsが返ること」を検証するアサーション補助関数。
 * バリデーションエラーなどで深くネストされたメッセージもフラットにして部分一致検索します。
 *
 * @param res `sendGql` から返されたHTTPレスポンスオブジェクト（bodyにGqlResponseを含むもの）
 * @param matcher (任意) エラーメッセージに含まれると期待する文字列または正規表現
 * @returns 検証を通過した最初のエラーオブジェクト (詳細なアサーションを続けたい場合に使用)
 *
 * @example
 * const res = await sendGql(app, `mutation { createTenant(slug: "A") }`);
 * expectGqlError(res, /小文字で入力してください/); // メッセージが正規表現にマッチするか検証
 */
export const expectGqlError = (
  res: { body: GqlResponse },
  matcher?: string | RegExp,
): GqlError => {
  expect(res.body.errors).toBeDefined();
  expect(res.body.errors!.length).toBeGreaterThan(0);
  const error = res.body.errors![0];

  if (matcher) {
    // 検索対象: トップレベルの message と、extensions に埋もれた詳細
    const original = (error.extensions as any)?.originalError;
    const searchTargets: string[] = [error.message];

    if (original?.message) {
      if (Array.isArray(original.message)) {
        searchTargets.push(...original.message);
      } else {
        searchTargets.push(String(original.message));
      }
    }

    const combined = searchTargets.join('\n');
    expect(combined).toMatch(matcher);
  }

  return error;
};
