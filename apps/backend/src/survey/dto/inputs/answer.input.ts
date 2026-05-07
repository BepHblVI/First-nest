import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsOptional, IsString } from 'class-validator';

@InputType({ description: '1問分の回答の入力値' })
export class AnswerInput {
  @Field(() => Int, { description: '回答対象の質問ID' })
  @IsInt()
  questionId!: number;

  @Field({
    nullable: true,
    description: '自由記述の回答テキスト(TEXTタイプの質問のときのみ使用)',
  })
  @IsOptional()
  @IsString()
  text?: string;

  @Field(() => [Int], {
    nullable: true,
    description: '選択した選択肢IDの配列(SINGLE/MULTIPLE タイプのときのみ使用)',
  })
  @IsOptional()
  @IsInt({ each: true })
  selectionIds?: number[];
}

/** @deprecated `AnswerInput` を使ってください */
export { AnswerInput as AnswerInputType };
