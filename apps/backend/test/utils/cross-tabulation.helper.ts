// test/utils/cross-tab-helpers.ts
import { INestApplication } from '@nestjs/common';
import { sendGql } from './gql-client';

export type CrossTabInput = {
  surveyId: number;
  rowQuestionId: number;
  columnQuestionId: number;
};

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
 * 成功時のレスポンスを取得。エラー時の検証は sendGql を直接使う。
 */
export async function getCrossTab(
  app: INestApplication,
  token: string,
  input: CrossTabInput,
) {
  const res = await sendGql(app, CROSS_TAB_QUERY, token, { input });
  if (res.body.errors) {
    throw new Error(
      `Cross tab query failed: ${JSON.stringify(res.body.errors)}`,
    );
  }
  return res.body.data.getCrossTabulationResults;
}

/**
 * エラーケース検証用。errors を含むレスポンス全体を返す。
 */
export async function rawCrossTab(
  app: INestApplication,
  token: string | undefined,
  input: CrossTabInput,
) {
  return await sendGql(app, CROSS_TAB_QUERY, token, { input });
}
