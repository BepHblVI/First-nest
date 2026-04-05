// apps/backend/src/practice/practice.resolver.ts
import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { PracticeService } from './practice.service';
import { Practice } from './practice.model';
import { Comment } from './comment.model'; // 👈 追加
import { UseGuards } from '@nestjs/common';
import { PracticeAuthGuard } from './practice-auth.guard'; // 門番

@Resolver(() => Practice)
export class PracticeResolver {
  constructor(private readonly practiceService: PracticeService) {}

  @Query(() => [Practice])
  async getAllPractices(): Promise<Practice[]> {
    return this.practiceService.getAllData();
  }

  @Mutation(() => Practice)
  @UseGuards(PracticeAuthGuard)
  async createPractice(@Args('message') message: string): Promise<Practice> {
    return this.practiceService.createData(message);
  }

  // 👇 【新規】コメント追加用のGraphQLの入り口
  @Mutation(() => Comment)
  async addComment(
    @Args('practiceId', { type: () => Int }) practiceId: number,
    @Args('text') text: string,
  ): Promise<Comment> {
    return this.practiceService.addComment(practiceId, text);
  }
}