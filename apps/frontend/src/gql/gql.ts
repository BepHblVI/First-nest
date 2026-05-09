/* eslint-disable */
import * as types from './graphql';



/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  query GetSurveys {\n    getSurvey {\n      id\n      title\n      published\n      auth\n      owner {\n        username\n      }\n      shareId\n      questions {\n        id\n        qtext\n        type\n        required\n        options {\n          id\n          text\n        }\n      }\n      tokens {\n        token\n        isUsed\n        createdAt\n      }\n      submissionCount\n    }\n  }\n": typeof types.GetSurveysDocument,
    "\n  mutation CreateSurvey($input: CreateSurveyInput!) {\n    createSurvey(input: $input) {\n      id\n      title\n      shareId\n      auth\n      published\n      tokens {\n        token\n        isUsed\n      }\n    }\n  }\n": typeof types.CreateSurveyDocument,
    "\n  mutation DeleteSurvey($id: Int!) {\n    deleteSurvey(id: $id)\n  }\n": typeof types.DeleteSurveyDocument,
    "\n  mutation EditSurvey($input: EditSurveyInput!) {\n    editSurvey(input: $input) {\n      id\n      title\n      auth\n      questions {\n        id\n        qtext\n        type\n        required\n        options {\n          id\n          text\n        }\n      }\n    }\n  }\n": typeof types.EditSurveyDocument,
    "\n  query GetSurveyResults($shareId: String!) {\n    getSurveyResults(shareId: $shareId) {\n      surveyId\n      title\n      totalSubmissions\n      questions {\n        questionId\n        qtext\n        type\n        totalAnswersForThisQuestion\n        options {\n          optionId\n          text\n          count\n          percentage\n        }\n      }\n    }\n  }\n": typeof types.GetSurveyResultsDocument,
    "\n  query SearchSurveys($input: SearchSurveyInput!) {\n    searchSurvey(input: $input) {\n      totalCount\n      hasNext\n      items {\n        id\n        title\n        published\n        auth\n        owner {\n          username\n        }\n        shareId\n        questions {\n          id\n          qtext\n          type\n          required\n          options {\n            id\n            text\n          }\n        }\n        tokens {\n          token\n          isUsed\n          createdAt\n        }\n        submissionCount\n      }\n    }\n  }\n": typeof types.SearchSurveysDocument,
    "\n  mutation TogglePublished($id: Int!, $published: Boolean!) {\n    togglePublished(id: $id, published: $published) {\n      id\n      published\n    }\n  }\n": typeof types.TogglePublishedDocument,
};
const documents: Documents = {
    "\n  query GetSurveys {\n    getSurvey {\n      id\n      title\n      published\n      auth\n      owner {\n        username\n      }\n      shareId\n      questions {\n        id\n        qtext\n        type\n        required\n        options {\n          id\n          text\n        }\n      }\n      tokens {\n        token\n        isUsed\n        createdAt\n      }\n      submissionCount\n    }\n  }\n": types.GetSurveysDocument,
    "\n  mutation CreateSurvey($input: CreateSurveyInput!) {\n    createSurvey(input: $input) {\n      id\n      title\n      shareId\n      auth\n      published\n      tokens {\n        token\n        isUsed\n      }\n    }\n  }\n": types.CreateSurveyDocument,
    "\n  mutation DeleteSurvey($id: Int!) {\n    deleteSurvey(id: $id)\n  }\n": types.DeleteSurveyDocument,
    "\n  mutation EditSurvey($input: EditSurveyInput!) {\n    editSurvey(input: $input) {\n      id\n      title\n      auth\n      questions {\n        id\n        qtext\n        type\n        required\n        options {\n          id\n          text\n        }\n      }\n    }\n  }\n": types.EditSurveyDocument,
    "\n  query GetSurveyResults($shareId: String!) {\n    getSurveyResults(shareId: $shareId) {\n      surveyId\n      title\n      totalSubmissions\n      questions {\n        questionId\n        qtext\n        type\n        totalAnswersForThisQuestion\n        options {\n          optionId\n          text\n          count\n          percentage\n        }\n      }\n    }\n  }\n": types.GetSurveyResultsDocument,
    "\n  query SearchSurveys($input: SearchSurveyInput!) {\n    searchSurvey(input: $input) {\n      totalCount\n      hasNext\n      items {\n        id\n        title\n        published\n        auth\n        owner {\n          username\n        }\n        shareId\n        questions {\n          id\n          qtext\n          type\n          required\n          options {\n            id\n            text\n          }\n        }\n        tokens {\n          token\n          isUsed\n          createdAt\n        }\n        submissionCount\n      }\n    }\n  }\n": types.SearchSurveysDocument,
    "\n  mutation TogglePublished($id: Int!, $published: Boolean!) {\n    togglePublished(id: $id, published: $published) {\n      id\n      published\n    }\n  }\n": types.TogglePublishedDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetSurveys {\n    getSurvey {\n      id\n      title\n      published\n      auth\n      owner {\n        username\n      }\n      shareId\n      questions {\n        id\n        qtext\n        type\n        required\n        options {\n          id\n          text\n        }\n      }\n      tokens {\n        token\n        isUsed\n        createdAt\n      }\n      submissionCount\n    }\n  }\n"): typeof import('./graphql').GetSurveysDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateSurvey($input: CreateSurveyInput!) {\n    createSurvey(input: $input) {\n      id\n      title\n      shareId\n      auth\n      published\n      tokens {\n        token\n        isUsed\n      }\n    }\n  }\n"): typeof import('./graphql').CreateSurveyDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteSurvey($id: Int!) {\n    deleteSurvey(id: $id)\n  }\n"): typeof import('./graphql').DeleteSurveyDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation EditSurvey($input: EditSurveyInput!) {\n    editSurvey(input: $input) {\n      id\n      title\n      auth\n      questions {\n        id\n        qtext\n        type\n        required\n        options {\n          id\n          text\n        }\n      }\n    }\n  }\n"): typeof import('./graphql').EditSurveyDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetSurveyResults($shareId: String!) {\n    getSurveyResults(shareId: $shareId) {\n      surveyId\n      title\n      totalSubmissions\n      questions {\n        questionId\n        qtext\n        type\n        totalAnswersForThisQuestion\n        options {\n          optionId\n          text\n          count\n          percentage\n        }\n      }\n    }\n  }\n"): typeof import('./graphql').GetSurveyResultsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query SearchSurveys($input: SearchSurveyInput!) {\n    searchSurvey(input: $input) {\n      totalCount\n      hasNext\n      items {\n        id\n        title\n        published\n        auth\n        owner {\n          username\n        }\n        shareId\n        questions {\n          id\n          qtext\n          type\n          required\n          options {\n            id\n            text\n          }\n        }\n        tokens {\n          token\n          isUsed\n          createdAt\n        }\n        submissionCount\n      }\n    }\n  }\n"): typeof import('./graphql').SearchSurveysDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation TogglePublished($id: Int!, $published: Boolean!) {\n    togglePublished(id: $id, published: $published) {\n      id\n      published\n    }\n  }\n"): typeof import('./graphql').TogglePublishedDocument;


export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}
