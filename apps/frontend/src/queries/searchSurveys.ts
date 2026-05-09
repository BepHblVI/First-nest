import { graphql } from '../gql';

export const SearchSurveysQuery = graphql(`
  query SearchSurveys($input: SearchSurveyInput!) {
    searchSurvey(input: $input) {
      totalCount
      hasNext
      items {
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
  }
`);
