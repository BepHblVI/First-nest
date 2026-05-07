import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { SurveyAuthType } from '../../models/survey.model';
import { QuestionInput } from './question.input';

@InputType({
  description: 'アンケート編集の入力値。回答が1件以上ある場合は編集不可となる',
})
export class EditSurveyInput {
  @Field(() => Int, { description: '編集対象のアンケートID' })
  @IsInt()
  id!: number;

  @Field({ description: 'アンケートのタイトル' })
  @IsString()
  @IsNotEmpty({ message: 'タイトルは必須です' })
  title!: string;

  @Field(() => [QuestionInput], {
    description: '更新後の設問リスト。既存の質問はすべて差し替えられる',
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'アンケートには最低1つの質問が必要です' })
  @ValidateNested({ each: true })
  @Type(() => QuestionInput)
  questions!: QuestionInput[];

  @Field(() => SurveyAuthType, {
    nullable: true,
    defaultValue: SurveyAuthType.PUBLIC,
    description:
      'アクセス権限(PUBLIC: 誰でも回答可 / PRIVATE: トークン保有者のみ)',
  })
  @IsEnum(SurveyAuthType, { message: '公開レベルを設定してください' })
  auth!: SurveyAuthType;

  @Field(() => Int, {
    nullable: true,
    defaultValue: 0,
    description: '再生成する回答用トークン数(PRIVATE時のみ有効、0以上)',
  })
  @IsInt()
  @Min(0)
  tokens!: number;
}
