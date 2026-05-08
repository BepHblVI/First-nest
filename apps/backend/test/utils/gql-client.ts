import request from 'supertest';
import { INestApplication } from '@nestjs/common';

interface GqlError {
  message: string;
  path?: readonly (string | number)[];
  extensions?: Record<string, unknown>;
}

export interface GqlResponse<T = any> {
  data: T | null;
  errors?: GqlError[];
}

/**
 * GraphQLリクエストを送信する(既存)。生レスポンスをそのまま返す。
 * 「エラーが返ること」を検証するテストではこちらを使う。
 *
 * @param variables GraphQL variables(任意)
 */
export const sendGql = async (
  app: INestApplication,
  query: string,
  token?: string,
  variables?: Record<string, unknown>,
) => {
  const req = request(app.getHttpServer()).post('/graphql');
  if (token) {
    req.set('Authorization', `Bearer ${token}`);
  }
  return req.send({ query, variables });
};

/**
 * GraphQLリクエストを送信し、成功時のdataだけを返す。
 * errors があれば、内容を含む例外を投げる(原因がメッセージで見える)。
 * 「成功を期待するテスト」やヘルパー関数で使う。
 */
export const sendGqlOrThrow = async <T = any>(
  app: INestApplication,
  query: string,
  token?: string,
  variables?: Record<string, unknown>,
): Promise<T> => {
  const res = await sendGql(app, query, token, variables);

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
 * 「errorsが返ること」を検証するアサーション補助。
 * パターン指定でメッセージを部分一致チェックできる。
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
    // NestJS の ValidationPipe は extensions.originalError.message に
    // 配列で詳細を入れるため、両方をまとめて文字列化して照合する。
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
