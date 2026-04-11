// apps/backend/src/practice/practice.resolver.ts
import {
  Resolver,
  Query,
  Mutation,
  Args,
  Context,
  InputType,
  Field,
  Int,
  ObjectType,
} from '@nestjs/graphql';
import { SurveyService } from './survey.service';
import { Survey } from './survey.model';
import { Submission } from './submission.model';
import { SurveyResult } from './dto/result.output';
import { CreateSurveyInput, SubmitSurveyAnswerInput } from './dto/input';

import { UseGuards } from '@nestjs/common';
import { SurveyAuthGuard } from '../auth/auth.guard';

@Resolver(() => Survey)
export class SurveyResolver {
  constructor(private readonly surveyService: SurveyService) {}

  @Query(() => [Survey])
  @UseGuards(SurveyAuthGuard)
  async getSurvey(@Context() context: any): Promise<Survey[]> {
    const currentUser = context.req.user;
    return this.surveyService.getData(currentUser);
  }

  @Mutation(() => Survey)
  @UseGuards(SurveyAuthGuard)
  async createSurvey(
    @Args('input') input: CreateSurveyInput,
    @Context() context: any,
  ): Promise<Survey> {
    const currentUser = context.req.user;
    return this.surveyService.createData(
      input.title,
      currentUser,
      input.questions,
    );
  }

  @Mutation(() => Boolean)
  @UseGuards(SurveyAuthGuard)
  async deleteSurvey(
    @Args('id', { type: () => Int }) id: number,
    @Context() context: any,
  ) {
    const currentUser = context.req.user;
    return await this.surveyService.deleteData(id, currentUser);
  }

  @Query(() => Survey)
  async getSurveyForAnswer(@Args('shareId') shareId: string): Promise<Survey> {
    return this.surveyService.getSurveyByShareId(shareId);
  }

  @Mutation(() => Submission)
  async submitSurveyAnswer(
    @Args('input') input: SubmitSurveyAnswerInput,
  ): Promise<Submission> {
    return this.surveyService.submitAnswer(input.surveyId, input.answers);
  }

  @Query(() => SurveyResult)
  @UseGuards(SurveyAuthGuard)
  async getSurveyResults(
    @Args('shareId') shareId: string,
    @Context() context: any,
  ): Promise<SurveyResult> {
    const currentUser = context.req.user;
    return this.surveyService.getResults(shareId, currentUser);
  }
}
