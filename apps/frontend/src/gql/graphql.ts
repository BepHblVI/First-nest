/* eslint-disable */
import { DocumentTypeDecoration } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** A date-time string at UTC, such as 2019-12-03T09:54:33Z, compliant with the date-time format. */
  DateTime: { input: any; output: any; }
};

/** 1問分の回答の入力値 */
export type AnswerInput = {
  /** 回答対象の質問ID */
  questionId: Scalars['Int']['input'];
  /** 選択した選択肢IDの配列(SINGLE/MULTIPLE タイプのときのみ使用) */
  selectionIds?: InputMaybe<Array<Scalars['Int']['input']>>;
  /** 自由記述の回答テキスト(TEXTタイプの質問のときのみ使用) */
  text?: InputMaybe<Scalars['String']['input']>;
};

export type CorrelationResult = {
  __typename?: 'CorrelationResult';
  coOccurrenceCount: Scalars['Int']['output'];
  option1Id: Scalars['Int']['output'];
  option2Id: Scalars['Int']['output'];
};

/** アンケート作成の入力値 */
export type CreateSurveyInput = {
  /** アクセス権限(PUBLIC: 誰でも回答可 / PRIVATE: トークン保有者のみ) */
  auth?: InputMaybe<SurveyAuthType>;
  /** 公開フラグ(true: 即時公開 / false: 下書き保存) */
  published?: InputMaybe<Scalars['Boolean']['input']>;
  /** アンケートに含める設問のリスト(最低1問) */
  questions: Array<QuestionInput>;
  /** アンケートのタイトル */
  title: Scalars['String']['input'];
  /** 生成する回答用トークン数(PRIVATE時のみ有効、0以上) */
  tokens?: InputMaybe<Scalars['Int']['input']>;
};

/** アンケート編集の入力値。回答が1件以上ある場合は編集不可となる */
export type EditSurveyInput = {
  /** アクセス権限(PUBLIC: 誰でも回答可 / PRIVATE: トークン保有者のみ) */
  auth?: InputMaybe<SurveyAuthType>;
  /** 編集対象のアンケートID */
  id: Scalars['Int']['input'];
  /** 更新後の設問リスト。既存の質問はすべて差し替えられる */
  questions: Array<QuestionInput>;
  /** アンケートのタイトル */
  title: Scalars['String']['input'];
  /** 再生成する回答用トークン数(PRIVATE時のみ有効、0以上) */
  tokens?: InputMaybe<Scalars['Int']['input']>;
};

export type LoginResponse = {
  __typename?: 'LoginResponse';
  access_token: Scalars['String']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  createSurvey: Survey;
  deleteSurvey: Scalars['Boolean']['output'];
  editSurvey: Survey;
  login: LoginResponse;
  refresh: LoginResponse;
  signUp: User;
  submitSurveyAnswer: Submission;
  togglePublished: Survey;
};


export type MutationCreateSurveyArgs = {
  input: CreateSurveyInput;
};


export type MutationDeleteSurveyArgs = {
  id: Scalars['Int']['input'];
};


export type MutationEditSurveyArgs = {
  input: EditSurveyInput;
};


export type MutationLoginArgs = {
  password: Scalars['String']['input'];
  username: Scalars['String']['input'];
};


export type MutationSignUpArgs = {
  password: Scalars['String']['input'];
  username: Scalars['String']['input'];
};


export type MutationSubmitSurveyAnswerArgs = {
  input: SubmitSurveyAnswerInput;
};


export type MutationTogglePublishedArgs = {
  id: Scalars['Int']['input'];
  published: Scalars['Boolean']['input'];
};

export type OptionResult = {
  __typename?: 'OptionResult';
  count: Scalars['Int']['output'];
  optionId: Scalars['Int']['output'];
  percentage: Scalars['Float']['output'];
  text: Scalars['String']['output'];
};

export type Query = {
  __typename?: 'Query';
  getSurvey: Array<Survey>;
  getSurveyForAnswer: Survey;
  getSurveyResults: SurveyResult;
};


export type QueryGetSurveyForAnswerArgs = {
  shareId: Scalars['String']['input'];
};


export type QueryGetSurveyResultsArgs = {
  shareId: Scalars['String']['input'];
};

/** アンケートの設問 */
export type Question = {
  __typename?: 'Question';
  /** 設問ID(自動採番) */
  id: Scalars['Int']['output'];
  /** 選択肢(SINGLE/MULTIPLEのときのみ要素を持つ。orderの昇順) */
  options: Array<QuestionOption>;
  /** 同一アンケート内での表示順(0始まり、昇順) */
  order: Scalars['Int']['output'];
  /** 設問のテキスト(本文) */
  qtext: Scalars['String']['output'];
  /** 回答必須フラグ */
  required: Scalars['Boolean']['output'];
  /** この設問が属するアンケート */
  survey: Survey;
  /** 設問の形式 */
  type: QuestionType;
};

/** アンケートの設問の入力値 */
export type QuestionInput = {
  /** 選択肢の一覧。SINGLE / MULTIPLE のときは必須 */
  options?: InputMaybe<Array<Scalars['String']['input']>>;
  /** 質問文(本文) */
  qtext: Scalars['String']['input'];
  /** 回答必須フラグ */
  required?: InputMaybe<Scalars['Boolean']['input']>;
  /** 質問のタイプ(TEXT: 自由記述 / SINGLE: 単一選択 / MULTIPLE: 複数選択) */
  type?: InputMaybe<QuestionType>;
};

/** 選択式質問の1つの選択肢 */
export type QuestionOption = {
  __typename?: 'QuestionOption';
  /** 選択肢ID(自動採番) */
  id: Scalars['Int']['output'];
  /** 同一質問内での表示順(0始まり、昇順) */
  order: Scalars['Int']['output'];
  /** この選択肢が属する設問 */
  question: Question;
  /** 選択肢の表示テキスト */
  text: Scalars['String']['output'];
};

export type QuestionResult = {
  __typename?: 'QuestionResult';
  options: Array<OptionResult>;
  qtext: Scalars['String']['output'];
  questionId: Scalars['Int']['output'];
  totalAnswersForThisQuestion: Scalars['Int']['output'];
  type: Scalars['String']['output'];
};

/** 質問の形式 */
export enum QuestionType {
  /** 複数選択(選択肢から複数選択可) */
  Multiple = 'MULTIPLE',
  /** 単一選択(選択肢から1つだけ) */
  Single = 'SINGLE',
  /** テキスト入力(自由記述) */
  Text = 'TEXT'
}

/** アンケートへの1回分の回答送信 */
export type Submission = {
  __typename?: 'Submission';
  /** 送信ID(自動採番) */
  id: Scalars['Int']['output'];
  /** 回答者を識別する任意のID(クライアント発行、匿名集計用) */
  respondentId?: Maybe<Scalars['String']['output']>;
  /** 送信日時 */
  submittedAt: Scalars['DateTime']['output'];
  /** 回答対象のアンケート */
  survey: Survey;
};

/** アンケートへの回答送信の入力値 */
export type SubmitSurveyAnswerInput = {
  /** 各設問への回答(最低1件、各回答は対応する質問IDを持つ) */
  answers: Array<AnswerInput>;
  /** 回答者を識別する任意のID(クライアント発行、匿名集計に利用) */
  respondentId?: InputMaybe<Scalars['String']['input']>;
  /** 回答対象のアンケートID */
  surveyId: Scalars['Int']['input'];
  /** 回答用トークン(PRIVATEアンケートの場合は必須) */
  token?: InputMaybe<Scalars['String']['input']>;
};

/** アンケート本体(設問・回答送信・トークンの集約) */
export type Survey = {
  __typename?: 'Survey';
  /** アクセス制御方式 */
  auth: SurveyAuthType;
  /** 作成日時 */
  createdAt: Scalars['DateTime']['output'];
  /** アンケートID(自動採番、内部用) */
  id: Scalars['Int']['output'];
  /** アンケートの作成者・所有者 */
  owner: User;
  /** 公開状態(true: 回答受付中 / false: 下書き、回答不可) */
  published: Scalars['Boolean']['output'];
  /** 設問の一覧(orderの昇順) */
  questions: Array<Question>;
  /** URL共有用の識別子(UUID。所有者以外でもこの値で参照可) */
  shareId: Scalars['String']['output'];
  /** 受信した回答件数 */
  submissionCount: Scalars['Int']['output'];
  /** アンケートのタイトル */
  title: Scalars['String']['output'];
  /** 招待トークン一覧(PRIVATE時のみ。所有者にのみ返すこと。loadは明示ロードのみ) */
  tokens: Array<SurveyToken>;
  /** 最終更新日時 */
  updatedAt: Scalars['DateTime']['output'];
};

/** アンケート回答時のアクセス制御方式 */
export enum SurveyAuthType {
  /** 発行された招待トークン保有者のみ回答可能 */
  Private = 'PRIVATE',
  /** 誰でもURLを知っていれば回答可能 */
  Public = 'PUBLIC'
}

export type SurveyResult = {
  __typename?: 'SurveyResult';
  correlations?: Maybe<Array<CorrelationResult>>;
  questions: Array<QuestionResult>;
  surveyId: Scalars['Int']['output'];
  title: Scalars['String']['output'];
  totalSubmissions: Scalars['Int']['output'];
};

/** PRIVATEアンケートへの回答を許可する招待トークン */
export type SurveyToken = {
  __typename?: 'SurveyToken';
  /** トークン発行日時 */
  createdAt: Scalars['DateTime']['output'];
  /** 使用済みフラグ(trueは消費済み) */
  isUsed: Scalars['Boolean']['output'];
  /** このトークンが対象とするアンケート */
  survey: Survey;
  /** 回答用トークン値(UUID)。所有者にのみ公開すること。1回使うと無効になる */
  token: Scalars['String']['output'];
};

export type User = {
  __typename?: 'User';
  id: Scalars['ID']['output'];
  surveys: Array<Survey>;
  username: Scalars['String']['output'];
};

export type GetSurveysQueryVariables = Exact<{ [key: string]: never; }>;


export type GetSurveysQuery = { __typename?: 'Query', getSurvey: Array<{ __typename?: 'Survey', id: number, title: string, published: boolean, auth: SurveyAuthType, shareId: string, submissionCount: number, owner: { __typename?: 'User', username: string }, questions: Array<{ __typename?: 'Question', id: number, qtext: string, type: QuestionType, required: boolean, options: Array<{ __typename?: 'QuestionOption', id: number, text: string }> }>, tokens: Array<{ __typename?: 'SurveyToken', token: string, isUsed: boolean, createdAt: any }> }> };

export type CreateSurveyMutationVariables = Exact<{
  input: CreateSurveyInput;
}>;


export type CreateSurveyMutation = { __typename?: 'Mutation', createSurvey: { __typename?: 'Survey', id: number, title: string, shareId: string, auth: SurveyAuthType, published: boolean, tokens: Array<{ __typename?: 'SurveyToken', token: string, isUsed: boolean }> } };

export type DeleteSurveyMutationVariables = Exact<{
  id: Scalars['Int']['input'];
}>;


export type DeleteSurveyMutation = { __typename?: 'Mutation', deleteSurvey: boolean };

export type EditSurveyMutationVariables = Exact<{
  input: EditSurveyInput;
}>;


export type EditSurveyMutation = { __typename?: 'Mutation', editSurvey: { __typename?: 'Survey', id: number, title: string, auth: SurveyAuthType, questions: Array<{ __typename?: 'Question', id: number, qtext: string, type: QuestionType, required: boolean, options: Array<{ __typename?: 'QuestionOption', id: number, text: string }> }> } };

export type GetSurveyResultsQueryVariables = Exact<{
  shareId: Scalars['String']['input'];
}>;


export type GetSurveyResultsQuery = { __typename?: 'Query', getSurveyResults: { __typename?: 'SurveyResult', surveyId: number, title: string, totalSubmissions: number, questions: Array<{ __typename?: 'QuestionResult', questionId: number, qtext: string, type: string, totalAnswersForThisQuestion: number, options: Array<{ __typename?: 'OptionResult', optionId: number, text: string, count: number, percentage: number }> }> } };

export type TogglePublishedMutationVariables = Exact<{
  id: Scalars['Int']['input'];
  published: Scalars['Boolean']['input'];
}>;


export type TogglePublishedMutation = { __typename?: 'Mutation', togglePublished: { __typename?: 'Survey', id: number, published: boolean } };

export class TypedDocumentString<TResult, TVariables>
  extends String
  implements DocumentTypeDecoration<TResult, TVariables>
{
  __apiType?: NonNullable<DocumentTypeDecoration<TResult, TVariables>['__apiType']>;
  private value: string;
  public __meta__?: Record<string, any> | undefined;

  constructor(value: string, __meta__?: Record<string, any> | undefined) {
    super(value);
    this.value = value;
    this.__meta__ = __meta__;
  }

  override toString(): string & DocumentTypeDecoration<TResult, TVariables> {
    return this.value;
  }
}

export const GetSurveysDocument = new TypedDocumentString(`
    query GetSurveys {
  getSurvey {
    id
    title
    published
    auth
    owner {
      username
    }
    shareId
    questions {
      id
      qtext
      type
      required
      options {
        id
        text
      }
    }
    tokens {
      token
      isUsed
      createdAt
    }
    submissionCount
  }
}
    `) as unknown as TypedDocumentString<GetSurveysQuery, GetSurveysQueryVariables>;
export const CreateSurveyDocument = new TypedDocumentString(`
    mutation CreateSurvey($input: CreateSurveyInput!) {
  createSurvey(input: $input) {
    id
    title
    shareId
    auth
    published
    tokens {
      token
      isUsed
    }
  }
}
    `) as unknown as TypedDocumentString<CreateSurveyMutation, CreateSurveyMutationVariables>;
export const DeleteSurveyDocument = new TypedDocumentString(`
    mutation DeleteSurvey($id: Int!) {
  deleteSurvey(id: $id)
}
    `) as unknown as TypedDocumentString<DeleteSurveyMutation, DeleteSurveyMutationVariables>;
export const EditSurveyDocument = new TypedDocumentString(`
    mutation EditSurvey($input: EditSurveyInput!) {
  editSurvey(input: $input) {
    id
    title
    auth
    questions {
      id
      qtext
      type
      required
      options {
        id
        text
      }
    }
  }
}
    `) as unknown as TypedDocumentString<EditSurveyMutation, EditSurveyMutationVariables>;
export const GetSurveyResultsDocument = new TypedDocumentString(`
    query GetSurveyResults($shareId: String!) {
  getSurveyResults(shareId: $shareId) {
    surveyId
    title
    totalSubmissions
    questions {
      questionId
      qtext
      type
      totalAnswersForThisQuestion
      options {
        optionId
        text
        count
        percentage
      }
    }
  }
}
    `) as unknown as TypedDocumentString<GetSurveyResultsQuery, GetSurveyResultsQueryVariables>;
export const TogglePublishedDocument = new TypedDocumentString(`
    mutation TogglePublished($id: Int!, $published: Boolean!) {
  togglePublished(id: $id, published: $published) {
    id
    published
  }
}
    `) as unknown as TypedDocumentString<TogglePublishedMutation, TogglePublishedMutationVariables>;