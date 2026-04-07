// apps/backend/src/practice/practice.resolver.ts
import { Resolver, Query, Mutation, Args, Context, InputType, Field, Int, ObjectType } from '@nestjs/graphql';
import { SurveyService } from './survey.service';
import { Survey } from './survey.model';
import { Submission } from './submission.model';
import { SurveyResult } from './dto/result.output';

import { UseGuards } from '@nestjs/common';
import { SurveyAuthGuard } from '../auth/auth.guard';

@InputType()
class QuestionInput {
  @Field()
  qtext!: string;

  @Field()
  type!: string;

  @Field(() => [String], { nullable: true })
  options?: string[];
}

@InputType()
class AnswerInputType {
  @Field(() => Int)
  questionId!: number;

  @Field({ nullable: true })
  text?: string;

  @Field(() => [Int], { nullable: true })
  selectionIds?: number[];
}

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
  async createSurvey(@Args('title') title: string, 
  @Args('questions', { type: () => [QuestionInput] }) questions:QuestionInput[],@Context() context: any): Promise<Survey> {
    const currentUser = context.req.user;
    return this.surveyService.createData(title,currentUser,questions);
  }

  @Query(() => Survey)
  async getSurveyForAnswer(@Args('shareId') shareId: string): Promise<Survey> {
    return this.surveyService.getSurveyByShareId(shareId);
  }

  @Mutation(() => Submission)
  async submitSurveyAnswer(
    @Args('surveyId', { type: () => Int }) surveyId: number,
    @Args('answers', { type: () => [AnswerInputType] }) answers: AnswerInputType[],
  ): Promise<Submission> {
    return this.surveyService.submitAnswer(surveyId, answers);
  }

  @Query(() => SurveyResult)
  @UseGuards(SurveyAuthGuard)
  async getSurveyResults(@Args('shareId') shareId: string): Promise<SurveyResult>{
    return this.surveyService.getResults(shareId);
  }
}