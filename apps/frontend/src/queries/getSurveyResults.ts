// apps/frontend/src/queries/getSurveyResults.ts
import { graphql } from '../gql';

export const GetSurveyResultsQuery = graphql(`
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
`);
