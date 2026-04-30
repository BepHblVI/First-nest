// apps/frontend/src/queries/editSurvey.ts
import { graphql } from '../gql';

export const EditSurveyMutation = graphql(`
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
`);
