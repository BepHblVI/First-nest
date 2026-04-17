import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SurveyService } from './survey.service';
import { SurveyResolver } from './survey.resolver';

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
  providers: [SurveyService, SurveyResolver],
})
export class SurveyModule {}
