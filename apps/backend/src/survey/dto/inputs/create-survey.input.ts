import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { SurveyAuthType } from '../../models/survey.model';
import { QuestionInput } from './question.input';

@InputType({ description: 'アンケート作成の入力値' })
export class CreateSurveyInput {
  @Field({ description: 'アンケートのタイトル' })
  @IsString()
  @IsNotEmpty({ message: 'タイトルは必須です' })
  title!: string;

  @Field(() => [QuestionInput], {
    description: 'アンケートに含める設問のリスト(最低1問)',
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'アンケートには最低1つの質問が必要です' })
  @ValidateNested({ each: true })
  @Type(() => QuestionInput)
  questions!: QuestionInput[];

  @Field({
    nullable: true,
    defaultValue: false,
    description: '公開フラグ(true: 即時公開 / false: 下書き保存)',
  })
  @IsBoolean({ message: '公開設定はboolean値で指定してください' })
  published!: boolean;

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
    description: '生成する回答用トークン数(PRIVATE時のみ有効、0以上)',
  })
  @IsInt()
  @Min(0)
  tokens!: number;
}
