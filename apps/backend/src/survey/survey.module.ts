import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SurveyService } from './survey.service';
import { SurveyResolver } from './survey.resolver';

import { Survey } from './survey.model';
import { Question } from './question.model';
import { Answer } from './answer.model';
import { Submission } from './submission.model';
import { QuestionOption } from './options.model';

@Module({
  imports: [
    TypeOrmModule.forFeature([Survey, Question,Answer,Submission,QuestionOption]),], 
  providers: [SurveyService,SurveyResolver],
})
export class SurveyModule {}