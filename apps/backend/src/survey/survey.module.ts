import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SurveyService } from './services/survey.service';
import { SurveyResolver } from './survey.resolver';
import { SurveyResultService } from './services/survey-result.service';
import { SurveySearchService } from './services/survey-search.service';
import { CrossResultService } from './services/cross-result.service';
import { AnswerValidator } from './validators/answer.validator';

import { Survey } from './models/survey.model';
import { Question } from './models/question.model';
import { Answer } from './models/answer.model';
import { Submission } from './models/submission.model';
import { QuestionOption } from './models/options.model';
import { SurveyToken } from './models/survey-token.model';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Survey,
      Question,
      Answer,
      Submission,
      QuestionOption,
      SurveyToken,
    ]),
  ],
  providers: [
    SurveyService,
    SurveyResolver,
    SurveyResultService,
    SurveySearchService,
    CrossResultService,
    AnswerValidator,
  ],
})
export class SurveyModule {}
