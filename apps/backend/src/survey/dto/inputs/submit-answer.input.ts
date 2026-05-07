import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { AnswerInput } from './answer.input';

@InputType({ description: 'アンケートへの回答送信の入力値' })
export class SubmitSurveyAnswerInput {
  @Field(() => Int, { description: '回答対象のアンケートID' })
  @IsInt()
  surveyId!: number;

  @Field(() => [AnswerInput], {
    description: '各設問への回答(最低1件、各回答は対応する質問IDを持つ)',
  })
  @IsArray()
  @ArrayMinSize(1, { message: '最低1つの回答が必要です' })
  @ValidateNested({ each: true })
  @Type(() => AnswerInput)
  answers!: AnswerInput[];

  @Field({
    nullable: true,
    description: '回答用トークン(PRIVATEアンケートの場合は必須)',
  })
  @IsOptional()
  @IsString()
  token?: string;

  @Field({
    nullable: true,
    description: '回答者を識別する任意のID(クライアント発行、匿名集計に利用)',
  })
  @IsOptional()
  @IsString()
  respondentId?: string;
}
