import { registerEnumType } from '@nestjs/graphql';

/** キーワード検索の対象範囲 */
export enum SearchScope {
  TITLE_ONLY = 'TITLE_ONLY',
  TITLE_AND_QUESTIONS = 'TITLE_AND_QUESTIONS',
}
registerEnumType(SearchScope, {
  name: 'SearchScope',
  description: 'キーワード検索の対象範囲',
  valuesMap: {
    TITLE_ONLY: { description: 'タイトルのみを検索対象にする' },
    TITLE_AND_QUESTIONS: {
      description: 'タイトルと質問文の両方を検索対象にする',
    },
  },
});

/** アンケートの公開状態 */
export enum PublishState {
  PUBLISHED = 'PUBLISHED',
  DRAFT = 'DRAFT',
}
registerEnumType(PublishState, {
  name: 'PublishState',
  description: 'アンケートの公開状態',
  valuesMap: {
    PUBLISHED: { description: '公開中' },
    DRAFT: { description: '下書き(非公開)' },
  },
});

/** 回答の有無 */
export enum AnswerState {
  UNANSWERED = 'UNANSWERED',
  HAS_ANSWERS = 'HAS_ANSWERS',
}
registerEnumType(AnswerState, {
  name: 'AnswerState',
  description: 'アンケートに対する回答の有無',
  valuesMap: {
    UNANSWERED: { description: '未回答(回答が1件もない)' },
    HAS_ANSWERS: { description: '回答済み(回答が1件以上ある)' },
  },
});

/** アンケート一覧の並び替え基準 */
export enum SurveySortField {
  CREATED_AT = 'CREATED_AT',
  UPDATED_AT = 'UPDATED_AT',
  TITLE = 'TITLE',
  SUBMISSION_COUNT = 'SUBMISSION_COUNT',
}
registerEnumType(SurveySortField, {
  name: 'SurveySortField',
  description: 'アンケート一覧の並び替え基準フィールド',
  valuesMap: {
    CREATED_AT: { description: '作成日時' },
    UPDATED_AT: { description: '更新日時' },
    TITLE: { description: 'タイトル(辞書順)' },
    SUBMISSION_COUNT: { description: '回答件数' },
  },
});

/** 並び順 */
export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}
registerEnumType(SortOrder, {
  name: 'SortOrder',
  description: '並び順',
  valuesMap: {
    ASC: { description: '昇順' },
    DESC: { description: '降順' },
  },
});
