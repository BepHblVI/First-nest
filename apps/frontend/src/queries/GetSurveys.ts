// apps/frontend/src/queries/getSurveys.ts
import { graphql } from '../gql';

export const GetSurveysQuery = graphql(`
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
`);
