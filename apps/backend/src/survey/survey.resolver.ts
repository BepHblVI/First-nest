// apps/backend/src/practice/practice.resolver.ts
import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { SurveyService } from './survey.service';
import { Survey } from './models/survey.model';
import { Submission } from './models/submission.model';
import { SurveyResult } from './dto/result.output';
import {
  CreateSurveyInput,
  SubmitSurveyAnswerInput,
  EditSurveyInput,
} from './dto/input';

import { UseGuards, UseInterceptors } from '@nestjs/common';
import { SurveyAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { publish } from 'rxjs';

@Resolver(() => Survey)
@UseInterceptors(LoggingInterceptor)
export class SurveyResolver {
  constructor(private readonly surveyService: SurveyService) {}

  @Query(() => [Survey])
  @UseGuards(SurveyAuthGuard)
  async getSurvey(@CurrentUser() currentUser: any): Promise<Survey[]> {
    return this.surveyService.getData(currentUser);
  }

  @Mutation(() => Survey)
  @UseGuards(SurveyAuthGuard)
  async createSurvey(
    @Args('input') input: CreateSurveyInput,
    @CurrentUser() currentUser: any,
  ): Promise<Survey> {
    return this.surveyService.createData(input, currentUser);
  }

  @Mutation(() => Survey)
  @UseGuards(SurveyAuthGuard)
  async editSurvey(
    @Args('input') input: EditSurveyInput,
    @CurrentUser() currentUser: any,
  ): Promise<Survey> {
    return this.surveyService.editData(input, currentUser);
  }

  @Mutation(() => Boolean)
  @UseGuards(SurveyAuthGuard)
  async deleteSurvey(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() currentUser: any,
  ) {
    return await this.surveyService.deleteData(id, currentUser);
  }

  @Mutation(() => Survey)
  @UseGuards(SurveyAuthGuard)
  async togglePublished(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() currentUser: any,
    @Args('published') published: boolean,
  ) {
    return await this.surveyService.togglePublished(id, currentUser, published);
  }

  @Query(() => Survey)
  async getSurveyForAnswer(@Args('shareId') shareId: string): Promise<Survey> {
    return this.surveyService.getSurveyByShareId(shareId);
  }

  @Mutation(() => Submission)
  async submitSurveyAnswer(
    @Args('input') input: SubmitSurveyAnswerInput,
  ): Promise<Submission> {
    return this.surveyService.submitAnswer(input);
  }

  @Query(() => SurveyResult)
  @UseGuards(SurveyAuthGuard)
  async getSurveyResults(
    @Args('shareId') shareId: string,
    @CurrentUser() currentUser: any,
  ): Promise<SurveyResult> {
    return this.surveyService.getResults(shareId, currentUser);
  }
}
