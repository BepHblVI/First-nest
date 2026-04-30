// apps/frontend/src/queries/deleteSurvey.ts
import { graphql } from '../gql';

export const DeleteSurveyMutation = graphql(`
  mutation DeleteSurvey($id: Int!) {
    deleteSurvey(id: $id)
  }
`);
