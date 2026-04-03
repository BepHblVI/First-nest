// apps/backend/src/practice/practice.resolver.ts
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql'; // Mutationを追加
import { Practice } from './practice.model';
import { PracticeService } from './practice.service';

@Resolver(() => Practice)
export class PracticeResolver {
  constructor(private readonly practiceService: PracticeService) {}

  @Query(() => [Practice], { name: 'getPracticeList' }) // 配列を返すように変更
  async getPracticeList() {
    return this.practiceService.getAllData();
  }

  @Mutation(() => Practice) // 👈 Mutationを定義。戻り値は「作ったデータ」
  async createPracticeData(
    @Args('message') message: string
  ) {
    return this.practiceService.createData(message);
  }
}