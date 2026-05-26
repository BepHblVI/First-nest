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
  /** アクセス先のテナントを指定するサブドメイン (例: 'alice') */
  subdomain?: string;
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
 * アンケート作成クエリを送信し、エラーを含む生のHTTPレスポンスを返します。
 * 「特定のテナントから作成しようとするとエラーになること」などを検証するテストで使用します。
 */
export const rawCreateTestSurvey = async (
  app: INestApplication,
  token: string | undefined,
  options: CreateSurveyOptions = {},
) => {
  const input = {
    title: options.title ?? 'テスト用アンケート',
    questions: options.questions ?? [{ qtext: 'テスト', type: 'TEXT' }],
    published: options.published ?? true,
    auth: options.auth ?? 'PUBLIC',
    tokens: options.tokens ?? 0,
  };

  // 💡 sendGqlOrThrow ではなく、生レスポンスを返す sendGql を使用
  return await sendGql(app, CREATE_SURVEY_MUTATION, {
    token,
    variables: { input },
    subdomain: options.subdomain,
  });
};

/**
 * テスト用のアンケートを作成します。
 * デフォルトでは「TEXT質問1問・公開・PUBLIC」のアンケートが作成されます。
 *
 * @param app NestJSのアプリケーションインスタンス
 * @param token 作成者（ログインユーザー）のJWTアクセストークン
 * @param options アンケートの設定や、アクセスするサブドメインの指定
 * @returns 作成されたアンケート情報のオブジェクト
 *
 * @example
 * const survey = await createTestSurvey(app, adminToken, {
 * title: 'テナントAのアンケート',
 * subdomain: 'tenant-a'
 * });
 */
export const createTestSurvey = async (
  app: INestApplication,
  token: string,
  options: CreateSurveyOptions = {},
): Promise<CreatedSurvey> => {
  // 💡 共通ロジックを rawCreateTestSurvey に任せる
  const res = await rawCreateTestSurvey(app, token, options);

  // 💡 エラーがあれば綺麗にフォーマットして throw する（既存の挙動を保証）
  if (res.body.errors) {
    throw new Error(
      `createTestSurvey failed: ${JSON.stringify(res.body.errors, null, 2)}`,
    );
  }

  return res.body.data.createSurvey;
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
  /** プライベートアンケート回答用のワンタイムトークン */
  token?: string;
  /** ログインユーザーとして回答する場合のアクセストークン(任意) */
  authToken?: string;
  /** アクセス先のテナントを指定するサブドメイン (例: 'alice') */
  subdomain?: string;
}

/**
 * アンケートに回答を送信します。
 * エラーが発生した場合も例外を投げず、生のHTTPレスポンスを返します。
 * 「無効なデータでエラーになること」などを検証するテストで使用します。
 *
 * @param app NestJSのアプリケーションインスタンス
 * @param options 回答内容、サブドメイン、各種トークンを含むオプション
 * @returns GraphQLの生レスポンスオブジェクト
 */
export const submitAnswer = (
  app: INestApplication,
  options: SubmitAnswerOptions,
) => {
  const { authToken, token, subdomain, ...rest } = options;
  return sendGql(app, SUBMIT_ANSWER_MUTATION, {
    token: authToken,
    variables: { input: { ...rest, token } },
    subdomain,
  });
};

/**
 * アンケートに回答を送信します（正常系）。
 * 成功を期待するテストで使用し、エラーが返ってきた場合は例外(Error)を投げて詳細を表示します。
 *
 * @param app NestJSのアプリケーションインスタンス
 * @param options 回答内容、サブドメイン、各種トークンを含むオプション
 * @returns 作成された回答のIDを含むオブジェクト
 */
export const submitAnswerOrThrow = async (
  app: INestApplication,
  options: SubmitAnswerOptions,
): Promise<{ id: number }> => {
  const { authToken, token, subdomain, ...rest } = options;
  const data = await sendGqlOrThrow<{ submitSurveyAnswer: { id: number } }>(
    app,
    SUBMIT_ANSWER_MUTATION,
    { token: authToken, variables: { input: { ...rest, token } }, subdomain },
  );
  return data.submitSurveyAnswer;
};

interface CreateMultipleOptions {
  count: number;
  titlePrefix?: string;
  authPattern?: ('PUBLIC' | 'PRIVATE')[];
  publishedPattern?: boolean[];
  /** アクセス先のテナントを指定するサブドメイン (例: 'alice') */
  subdomain?: string;
}

/**
 * テスト用に複数のアンケートをまとめて連続作成します。
 * ページネーションや複雑な検索ロジックのテストデータ準備に最適です。
 *
 * @param app NestJSのアプリケーションインスタンス
 * @param token 作成者（ログインユーザー）のJWTアクセストークン
 * @param options 作成件数、タイトルプレフィックス、サブドメインなどの設定
 * @returns 作成されたアンケート情報の配列
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
      subdomain: options.subdomain, // 💡 サブドメインを伝播させる
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

/**
 * アンケートの検索クエリを実行します（成功を期待）。
 *
 * @param app NestJSのアプリケーションインスタンス
 * @param token 検索実行者のJWTアクセストークン
 * @param input 検索条件、ソート順、ページネーションの設定
 * @param options (任意) アクセス先のサブドメイン指定など
 * @returns 検索結果（アイテム一覧、総件数、次ページの有無）
 *
 * @example
 * const res = await searchSurvey(app, token, { keyword: 'テスト' }, { subdomain: 'alice' });
 */
export const searchSurvey = async (
  app: INestApplication,
  token: string,
  input: SearchInput = {},
  options?: { subdomain?: string },
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

  const data = await sendGqlOrThrow<SearchResult>(app, SEARCH_SURVEY_QUERY, {
    token,
    variables: { input: fullInput },
    subdomain: options?.subdomain,
  });
  return data.searchSurvey;
};
