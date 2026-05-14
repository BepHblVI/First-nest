import { InputType, Field, Int } from '@nestjs/graphql';
import { IsInt, Min } from 'class-validator';

@InputType({ description: '2つの選択式質問のクロス集計' })
export class CrossTabulationInput {
  @Field(() => Int, { description: '対象アンケートID' })
  @IsInt()
  @Min(1)
  surveyId!: number;

  @Field(() => Int, { description: '行に展開する質問ID' })
  @IsInt()
  @Min(1)
  rowQuestionId!: number;

  @Field(() => Int, { description: '列に展開する質問ID' })
  @IsInt()
  @Min(1)
  columnQuestionId!: number;
}
