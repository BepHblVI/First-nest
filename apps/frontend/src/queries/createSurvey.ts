// apps/frontend/src/queries/createSurvey.ts
import { graphql } from '../gql';

export const CreateSurveyMutation = graphql(`
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
`);
