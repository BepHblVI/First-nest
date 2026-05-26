import { INestApplication } from '@nestjs/common';
import { sendGql, sendGqlOrThrow } from './gql-client'; // 💡 sendGqlOrThrow を追加インポート

export type CrossTabInput = {
  surveyId: number;
  rowQuestionId: number;
  columnQuestionId: number;
};

/** クロス集計用オプション */
export interface CrossTabOptions {
  /** アクセス先のテナントを指定するサブドメイン (例: 'alice') */
  subdomain?: string;
}

const CROSS_TAB_QUERY = `
  query GetCrossTab($input: CrossTabulationInput!) {
    getCrossTabulationResults(input: $input) {
      rowQuestion {
        id
        qtext
        type
        options { id text }
      }
      columnQuestion {
        id
        qtext
        type
        options { id text }
      }
      cells {
        rowOptionId
        columnOptionId
        count
        rowPercentage
        columnPercentage
        totalPercentage
      }
      rowSummary { optionId count percentage }
      columnSummary { optionId count percentage }
      grandTotal
    }
  }
`;

/**
 * クロス集計結果を取得します（正常系）。
 * エラーが返ってきた場合は例外(Error)を投げて詳細を表示します。
 *
 * @param app NestJSのアプリケーションインスタンス
 * @param token 実行者のJWTアクセストークン
 * @param input 集計対象のアンケートID、行・列の質問ID
 * @param options (任意) アクセス先のサブドメイン指定など
 * @returns クロス集計結果のデータオブジェクト
 *
 * @example
 * const result = await getCrossTab(app, token, { surveyId: 1, rowQuestionId: 1, columnQuestionId: 2 }, { subdomain: 'alice' });
 */
export async function getCrossTab(
  app: INestApplication,
  token: string,
  input: CrossTabInput,
  options?: CrossTabOptions,
) {
  // 💡 手動でのエラーチェックを削除し、sendGqlOrThrow を使ってスッキリ記述！
  const data = await sendGqlOrThrow(app, CROSS_TAB_QUERY, {
    token,
    variables: { input },
    subdomain: options?.subdomain,
  });

  return data.getCrossTabulationResults;
}

/**
 * クロス集計クエリを送信し、エラーを含む生のHTTPレスポンスを返します。
 * 「無効な質問IDでエラーになること」などを検証するテストで使用します。
 *
 * @param app NestJSのアプリケーションインスタンス
 * @param token 実行者のJWTアクセストークン（未ログインのテストの場合は undefined）
 * @param input 集計対象のアンケートID、行・列の質問ID
 * @param options (任意) アクセス先のサブドメイン指定など
 * @returns GraphQLの生レスポンスオブジェクト
 *
 * @example
 * const res = await rawCrossTab(app, token, { surveyId: 999, ... });
 * expectGqlError(res, /アンケートが見つかりません/);
 */
export async function rawCrossTab(
  app: INestApplication,
  token: string | undefined,
  input: CrossTabInput,
  options?: CrossTabOptions,
) {
  // 💡 gql-clientの新しいシグネチャ（オブジェクト形式）に修正
  return await sendGql(app, CROSS_TAB_QUERY, {
    token,
    variables: { input },
    subdomain: options?.subdomain,
  });
}
