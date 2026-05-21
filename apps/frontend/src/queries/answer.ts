// src/queries/answer.ts
import { graphql } from '../gql';

export const GetSurveyForAnswerQuery = graphql(`
  query GetSurveyForAnswer($shareId: String!) {
    getSurveyForAnswer(shareId: $shareId) {
      id
      title
      auth
      owner {
        username
      }
      questions {
        id
        qtext
        type
        options {
          id
          text
        }
      }
    }
  }
`);

export const SubmitSurveyAnswerMutation = graphql(`
  mutation SubmitSurveyAnswer($input: SubmitSurveyAnswerInput!) {
    submitSurveyAnswer(input: $input) {
      id
      submittedAt
    }
  }
`);
