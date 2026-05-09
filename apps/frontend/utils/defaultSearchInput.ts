import type { SearchSurveyInput } from '../src/gql/graphql';
import { SearchScope, SortOrder, SurveySortField } from '../src/gql/graphql';

export const PAGE_SIZE = 10;

export const defaultSearchInput: SearchSurveyInput = {
  keyword: '',
  scope: SearchScope.TitleOnly, // codegen の enum 名に注意（PascalCase になる場合あり）
  publishStates: [],
  authTypes: [],
  answerStates: [],
  createdAt: null,
  submissionCount: null,
  sortBy: SurveySortField.CreatedAt,
  order: SortOrder.Desc,
  limit: PAGE_SIZE,
  offset: 0,
};
