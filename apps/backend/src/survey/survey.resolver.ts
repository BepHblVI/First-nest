// apps/backend/src/practice/practice.resolver.ts
import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { SurveyService } from './survey.service';
import { Survey } from './survey.model';

@Resolver(() => Survey)
export class SurveyResolver {
  constructor(private readonly surveyService: SurveyService) {}

  @Query(() => [Survey])
  async getSurvey(@Args('user') user: string): Promise<Survey[]> {
    return this.surveyService.getData(user);
  }

  @Mutation(() => Survey)
  async createSurvey(@Args('title') title: string,@Args('user') user:string, @Args('qtexts', { type: () => [String] }) qtexts:string[]): Promise<Survey> {
    return this.surveyService.createData(title,user,qtexts);
  }
}