import request from 'supertest';
import { INestApplication } from '@nestjs/common';

/**
 * GraphQLリクエストを送信する共通関数
 * * @param app NestJSアプリケーションインスタンス
 * @param query 実行したいGraphQLのクエリ（mutation/query）
 * @param token 認証用のアクセストークン（オプション）
 * @returns supertestのResponseオブジェクト
 */
export const sendGql = async (
  app: INestApplication,
  query: string,
  token?: string,
) => {
  const req = request(app.getHttpServer()).post('/graphql');

  // トークンが渡された場合のみ Authorization ヘッダーを付与
  if (token) {
    req.set('Authorization', `Bearer ${token}`);
  }

  // リクエストを送信し、そのまま Response オブジェクトを返す
  return req.send({ query });
};
