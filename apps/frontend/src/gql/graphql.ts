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

/** 回答 */
export type Answer = {
  __typename?: 'Answer';
  id: Scalars['Int']['output'];
  question: Question;
  /** 選ばれた選択肢配列 */
  selectedOptions?: Maybe<Array<QuestionOption>>;
  submission: Submission;
  text?: Maybe<Scalars['String']['output']>;
};

export type AnswerInputType = {
  questionId: Scalars['Int']['input'];
  selectionIds?: InputMaybe<Array<Scalars['Int']['input']>>;
  text?: InputMaybe<Scalars['String']['input']>;
};

export type CorrelationResult = {
  __typename?: 'CorrelationResult';
  coOccurrenceCount: Scalars['Int']['output'];
  option1Id: Scalars['Int']['output'];
  option2Id: Scalars['Int']['output'];
};

export type CreateSurveyInput = {
  auth?: InputMaybe<SurveyAuthType>;
  published?: InputMaybe<Scalars['Boolean']['input']>;
  questions: Array<QuestionInput>;
  title: Scalars['String']['input'];
  tokens?: InputMaybe<Scalars['Int']['input']>;
};

export type EditSurveyInput = {
  auth?: InputMaybe<SurveyAuthType>;
  id: Scalars['Float']['input'];
  questions: Array<QuestionInput>;
  title: Scalars['String']['input'];
  tokens?: InputMaybe<Scalars['Float']['input']>;
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

/** アンケート設問 */
export type Question = {
  __typename?: 'Question';
  answers: Array<Answer>;
  id: Scalars['Int']['output'];
  options: Array<QuestionOption>;
  qtext: Scalars['String']['output'];
  required: Scalars['Boolean']['output'];
  survey: Survey;
  type: QuestionType;
};

export type QuestionInput = {
  options?: InputMaybe<Array<Scalars['String']['input']>>;
  qtext: Scalars['String']['input'];
  required?: InputMaybe<Scalars['Boolean']['input']>;
  type?: InputMaybe<QuestionType>;
};

/** 選択肢 */
export type QuestionOption = {
  __typename?: 'QuestionOption';
  id: Scalars['Int']['output'];
  order: Scalars['Int']['output'];
  question: Question;
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
  /** 複数選択 */
  Multiple = 'MULTIPLE',
  /** 単一選択 */
  Single = 'SINGLE',
  /** テキスト入力 */
  Text = 'TEXT'
}

/** 提出一覧 */
export type Submission = {
  __typename?: 'Submission';
  answers: Array<Answer>;
  id: Scalars['Int']['output'];
  respondentId?: Maybe<Scalars['String']['output']>;
  submittedAt: Scalars['DateTime']['output'];
  survey: Survey;
};

export type SubmitSurveyAnswerInput = {
  answers: Array<AnswerInputType>;
  respondentId?: InputMaybe<Scalars['String']['input']>;
  surveyId: Scalars['Int']['input'];
  token?: InputMaybe<Scalars['String']['input']>;
};

/** アンケート本体 */
export type Survey = {
  __typename?: 'Survey';
  /** アンケートのセキュリティ */
  auth: SurveyAuthType;
  /** アンケート作成日時 */
  createdAt: Scalars['DateTime']['output'];
  /** アンケートID */
  id: Scalars['Int']['output'];
  /** アンケート作成者 */
  owner: User;
  /** アンケート公開状態 */
  published: Scalars['Boolean']['output'];
  /** 設問 */
  questions: Array<Question>;
  /** アンケートURL識別子 */
  shareId: Scalars['String']['output'];
  /** 提出一覧 */
  submissions: Array<Submission>;
  /** アンケートタイトル */
  title: Scalars['String']['output'];
  /** 回答用トークン（セキュリティ設定時のみ） */
  tokens: Array<SurveyToken>;
  /** アンケート更新日時 */
  updatedAt: Scalars['DateTime']['output'];
};

/** アンケート回答時の認証方式 */
export enum SurveyAuthType {
  /** トークンが必要 */
  Private = 'PRIVATE',
  /** 誰でも回答可能 */
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

/** アンケート回答用トークン */
export type SurveyToken = {
  __typename?: 'SurveyToken';
  createdAt: Scalars['DateTime']['output'];
  expiredAt: Scalars['DateTime']['output'];
  isUsed: Scalars['Boolean']['output'];
  survey: Survey;
  token: Scalars['String']['output'];
};

export type User = {
  __typename?: 'User';
  id: Scalars['ID']['output'];
  surveys: Array<Survey>;
  username: Scalars['String']['output'];
};

export type GetSurveysQueryVariables = Exact<{ [key: string]: never; }>;


export type GetSurveysQuery = { __typename?: 'Query', getSurvey: Array<{ __typename?: 'Survey', id: number, title: string, published: boolean, auth: SurveyAuthType, shareId: string, owner: { __typename?: 'User', username: string }, questions: Array<{ __typename?: 'Question', id: number, qtext: string, type: QuestionType, required: boolean, options: Array<{ __typename?: 'QuestionOption', id: number, text: string }> }>, tokens: Array<{ __typename?: 'SurveyToken', token: string, isUsed: boolean, createdAt: any }>, submissions: Array<{ __typename?: 'Submission', id: number }> }> };

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
    submissions {
      id
    }
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