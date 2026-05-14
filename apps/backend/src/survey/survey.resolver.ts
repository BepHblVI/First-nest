// apps/backend/src/practice/practice.resolver.ts
import {
  Resolver,
  Query,
  Mutation,
  Args,
  Int,
  ResolveField, // ← 追加
  Parent, // ← 追加
} from '@nestjs/graphql';
import { SurveyService } from './survey.service';
import { SurveyResultService } from './survey-result.service';
import { SurveySearchService } from './survey-search.service';
import { CrossResultService } from './cross-result.service';
import { Survey } from './models/survey.model';
import { Submission } from './models/submission.model';
import {
  SurveyResult,
  SearchSurveyResult,
  CrossTabulationResult,
} from './dto/outputs';
import {
  CreateSurveyInput,
  SubmitSurveyAnswerInput,
  EditSurveyInput,
  SearchSurveyInput,
  CrossTabulationInput,
} from './dto/inputs';

import { UseGuards, UseInterceptors } from '@nestjs/common';
import { SurveyAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../auth/user.model';
import { LoggingInterceptor } from './interceptors/logging.interceptor';

@Resolver(() => Survey)
@UseInterceptors(LoggingInterceptor)
export class SurveyResolver {
  constructor(
    private readonly surveyService: SurveyService,
    private readonly surveyResultService: SurveyResultService,
    private readonly surveySearchService: SurveySearchService,
    private readonly crossResultService: CrossResultService,
  ) {}

  // ─── Queries ───────────────────────────────
  @Query(() => [Survey])
  @UseGuards(SurveyAuthGuard)
  async getSurvey(@CurrentUser() currentUser: User): Promise<Survey[]> {
    return this.surveyService.getData(currentUser);
  }

  @Query(() => Survey)
  async getSurveyForAnswer(@Args('shareId') shareId: string): Promise<Survey> {
    return this.surveyService.getSurveyByShareId(shareId);
  }

  @Query(() => SurveyResult)
  @UseGuards(SurveyAuthGuard)
  async getSurveyResults(
    @Args('shareId') shareId: string,
    @CurrentUser() currentUser: User,
  ): Promise<SurveyResult> {
    return this.surveyResultService.getResults(shareId, currentUser);
  }

  @Query(() => CrossTabulationResult)
  @UseGuards(SurveyAuthGuard)
  async getCrossTabulationResults(
    @Args('input') input: CrossTabulationInput,
    @CurrentUser() currentUser: User,
  ): Promise<CrossTabulationResult> {
    return this.crossResultService.getCrossResults(input, currentUser);
  }

  @Query(() => SearchSurveyResult)
  @UseGuards(SurveyAuthGuard)
  async searchSurvey(
    @Args('input') input: SearchSurveyInput,
    @CurrentUser() currentUser: User,
  ): Promise<SearchSurveyResult> {
    return this.surveySearchService.searchData(input, currentUser);
  }

  // ─── Mutations ─────────────────────────────
  @Mutation(() => Survey)
  @UseGuards(SurveyAuthGuard)
  async createSurvey(
    @Args('input') input: CreateSurveyInput,
    @CurrentUser() currentUser: User,
  ): Promise<Survey> {
    return this.surveyService.createData(input, currentUser);
  }

  @Mutation(() => Survey)
  @UseGuards(SurveyAuthGuard)
  async editSurvey(
    @Args('input') input: EditSurveyInput,
    @CurrentUser() currentUser: User,
  ): Promise<Survey> {
    return this.surveyService.editData(input, currentUser);
  }

  @Mutation(() => Boolean)
  @UseGuards(SurveyAuthGuard)
  async deleteSurvey(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() currentUser: User,
  ) {
    return this.surveyService.deleteData(id, currentUser);
  }

  @Mutation(() => Survey)
  @UseGuards(SurveyAuthGuard)
  async togglePublished(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() currentUser: User,
    @Args('published') published: boolean,
  ) {
    return this.surveyService.togglePublished(id, currentUser, published);
  }

  @Mutation(() => Submission)
  async submitSurveyAnswer(
    @Args('input') input: SubmitSurveyAnswerInput,
  ): Promise<Submission> {
    return this.surveyService.submitAnswer(input);
  }

  // ─── ResolveField ──────────────────────────
  /**
   * 受信した回答件数。
   * Survey.submissions リレーションは内部用のため非公開だが、
   * 件数だけは集計値としてフロントに公開する。
   */
  @ResolveField(() => Int, { description: '受信した回答件数' })
  async submissionCount(@Parent() survey: Survey): Promise<number> {
    return this.surveyResultService.countSubmissions(survey.id);
  }
}
