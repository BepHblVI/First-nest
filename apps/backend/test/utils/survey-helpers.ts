import { INestApplication } from '@nestjs/common';
import { sendGql, sendGqlOrThrow } from './gql-client';

type QuestionType = 'TEXT' | 'SINGLE' | 'MULTIPLE';
type SurveyAuth = 'PUBLIC' | 'PRIVATE';

export interface QuestionInput {
  qtext: string;
  type: QuestionType;
  required?: boolean;
  options?: string[];
}

export interface CreateSurveyOptions {
  title?: string;
  questions?: QuestionInput[];
  published?: boolean;
  auth?: SurveyAuth;
  tokens?: number;
}

export interface CreatedSurvey {
  id: number;
  shareId: string;
  questions: Array<{
    id: number;
    type: QuestionType;
    options: Array<{ id: number; text: string }>;
  }>;
  tokens: Array<{ token: string }>;
}

const CREATE_SURVEY_MUTATION = `
  mutation Create($input: CreateSurveyInput!) {
    createSurvey(input: $input) {
      id
      shareId
      questions { id, type, options { id, text } }
      tokens { token }
    }
  }
`;

/**
 * テスト用のアンケートを作成。
 * デフォルトは「TEXT質問1問・公開・PUBLIC」。
 */
export const createTestSurvey = async (
  app: INestApplication,
  token: string,
  options: CreateSurveyOptions = {},
): Promise<CreatedSurvey> => {
  const input = {
    title: options.title ?? 'テスト用アンケート',
    questions: options.questions ?? [{ qtext: 'テスト', type: 'TEXT' }],
    published: options.published ?? true,
    auth: options.auth ?? 'PUBLIC',
    tokens: options.tokens ?? 0,
  };

  const data = await sendGqlOrThrow<{ createSurvey: CreatedSurvey }>(
    app,
    CREATE_SURVEY_MUTATION,
    token,
    { input },
  );
  return data.createSurvey;
};

const SUBMIT_ANSWER_MUTATION = `
  mutation Submit($input: SubmitSurveyAnswerInput!) {
    submitSurveyAnswer(input: $input) { id }
  }
`;

interface SubmitAnswerOptions {
  surveyId: number;
  answers: Array<{
    questionId: number;
    text?: string;
    selectionIds?: number[];
  }>;
  token?: string;
  authToken?: string; // ログインユーザーのアクセストークン(任意)
}

/**
 * 回答送信。エラーは生レスポンスとして返す(失敗ケースも検証したいため)。
 */
export const submitAnswer = (
  app: INestApplication,
  options: SubmitAnswerOptions,
) => {
  const { authToken, token, ...rest } = options;
  return sendGql(app, SUBMIT_ANSWER_MUTATION, authToken, {
    input: { ...rest, token },
  });
};

/** 回答送信(成功を期待する場合) */
export const submitAnswerOrThrow = async (
  app: INestApplication,
  options: SubmitAnswerOptions,
): Promise<{ id: number }> => {
  const { authToken, token, ...rest } = options;
  const data = await sendGqlOrThrow<{ submitSurveyAnswer: { id: number } }>(
    app,
    SUBMIT_ANSWER_MUTATION,
    authToken,
    { input: { ...rest, token } },
  );
  return data.submitSurveyAnswer;
};

interface CreateMultipleOptions {
  count: number;
  titlePrefix?: string;
  authPattern?: ('PUBLIC' | 'PRIVATE')[];
  publishedPattern?: boolean[];
}

/**
 * テスト用に複数のアンケートをまとめて作成。
 * 検索テストで多様なデータを用意するために使う。
 */
export const createMultipleTestSurveys = async (
  app: INestApplication,
  token: string,
  options: CreateMultipleOptions,
): Promise<CreatedSurvey[]> => {
  const surveys: CreatedSurvey[] = [];
  const prefix = options.titlePrefix ?? 'テスト';

  for (let i = 0; i < options.count; i++) {
    const auth =
      options.authPattern?.[i % options.authPattern.length] ?? 'PUBLIC';
    const published =
      options.publishedPattern?.[i % options.publishedPattern.length] ?? true;

    const survey = await createTestSurvey(app, token, {
      title: `${prefix}${i + 1}`,
      published,
      auth,
      tokens: auth === 'PRIVATE' ? 1 : 0,
    });
    surveys.push(survey);
  }
  return surveys;
};

const SEARCH_SURVEY_QUERY = `
  query Search($input: SearchSurveyInput!) {
    searchSurvey(input: $input) {
      items {
        id
        title
        published
        auth
        createdAt
        submissionCount
      }
      totalCount
      hasNext
    }
  }
`;

interface SearchInput {
  keyword?: string;
  scope?: 'TITLE_ONLY' | 'TITLE_AND_QUESTIONS';
  publishStates?: ('PUBLISHED' | 'DRAFT')[];
  authTypes?: ('PUBLIC' | 'PRIVATE')[];
  answerStates?: ('UNANSWERED' | 'HAS_ANSWERS')[];
  createdAt?: { from?: string; to?: string };
  submissionCount?: { min?: number; max?: number };
  sortBy?: 'CREATED_AT' | 'UPDATED_AT' | 'TITLE' | 'SUBMISSION_COUNT';
  order?: 'ASC' | 'DESC';
  limit?: number;
  offset?: number;
}

interface SearchResult {
  searchSurvey: {
    items: Array<{
      id: number;
      title: string;
      published: boolean;
      auth: string;
      createdAt: string;
      submissionCount: number;
    }>;
    totalCount: number;
    hasNext: boolean;
  };
}

/** 検索クエリを実行(成功を期待) */
export const searchSurvey = async (
  app: INestApplication,
  token: string,
  input: SearchInput = {},
): Promise<SearchResult['searchSurvey']> => {
  // デフォルト値補完(scopeなど必須項目)
  const fullInput = {
    scope: 'TITLE_ONLY' as const,
    sortBy: 'CREATED_AT' as const,
    order: 'DESC' as const,
    limit: 20,
    offset: 0,
    ...input,
  };
  const data = await sendGqlOrThrow<SearchResult>(
    app,
    SEARCH_SURVEY_QUERY,
    token,
    { input: fullInput },
  );
  return data.searchSurvey;
};
