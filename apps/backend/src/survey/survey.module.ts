import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SurveyService } from './survey.service';
import { SurveyResolver } from './survey.resolver';
import { Survey } from './survey.model';
import { Question } from './question.model';

@Module({
  imports: [
    TypeOrmModule.forFeature([Survey, Question]),], 
  providers: [SurveyService,SurveyResolver],
})
export class SurveyModule {}