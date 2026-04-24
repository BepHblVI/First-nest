import { InputType, Field, Int } from '@nestjs/graphql';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsIn,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsInt,
  IsBoolean,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SurveyAuthType } from '../models/survey.model';

@InputType()
export class QuestionInput {
  @Field()
  @IsNotEmpty({ message: '質問文は空にしないでください！' })
  qtext!: string;

  @Field()
  @IsIn(['TEXT', 'SINGLE', 'MULTIPLE'], { message: '質問タイプが不正です！' })
  type!: string;

  @Field(() => [String], { nullable: true })
  options?: string[];
}

@InputType()
export class AnswerInputType {
  @Field(() => Int)
  questionId!: number;

  @Field({ nullable: true })
  @ValidateIf((o) => !o.selectionIds || o.selectionIds.length === 0)
  @IsNotEmpty({ message: '回答は必須です' })
  text?: string;

  @Field(() => [Int], { nullable: true })
  @ValidateIf((o) => !o.text || o.text.trim() === '')
  @ArrayMinSize(1, { message: '回答は必須です' })
  selectionIds?: number[];
}

// 📦 1. createSurvey用のInputType
@InputType()
export class CreateSurveyInput {
  @Field()
  @IsString()
  @IsNotEmpty({ message: 'タイトルは必須です' })
  title!: string;

  @Field(() => [QuestionInput])
  @IsArray()
  @ArrayMinSize(1, { message: 'アンケートには最低1つの質問が必要です' })
  @ValidateNested({ each: true })
  @Type(() => QuestionInput)
  questions!: QuestionInput[];

  @Field(() => SurveyAuthType, {
    nullable: true,
    defaultValue: SurveyAuthType.PUBLIC,
  })
  @IsEnum(SurveyAuthType, {
    message: '公開レベルを設定してください',
  })
  auth!: SurveyAuthType;

  @Field({ nullable: true, defaultValue: 0 })
  @IsInt()
  tokens!: number;
}

@InputType()
export class EditSurveyInput {
  @Field()
  @IsNotEmpty({ message: 'IDは必須です' })
  @IsInt()
  id!: number;

  @Field()
  @IsString()
  @IsNotEmpty({ message: 'タイトルは必須です' })
  title!: string;

  @Field(() => [QuestionInput])
  @IsArray()
  @ArrayMinSize(1, { message: 'アンケートには最低1つの質問が必要です' })
  @ValidateNested({ each: true })
  @Type(() => QuestionInput)
  questions!: QuestionInput[];

  @Field()
  @IsNotEmpty()
  @IsBoolean({ message: '公開または非公開の設定は必須です' })
  published!: boolean;

  @Field(() => SurveyAuthType, {
    nullable: true,
    defaultValue: SurveyAuthType.PUBLIC,
  })
  @IsEnum(SurveyAuthType, {
    message: '公開レベルを設定してください',
  })
  auth!: SurveyAuthType;

  @Field({ nullable: true, defaultValue: 0 })
  @IsInt()
  tokens!: number;
}

// 📦 2. submitSurveyAnswer用のInputType
@InputType()
export class SubmitSurveyAnswerInput {
  @Field(() => Int)
  @IsInt()
  @IsNotEmpty()
  surveyId!: number;

  @Field(() => [AnswerInputType])
  @IsArray()
  @ArrayMinSize(1, { message: '最低1つの回答が必要です' })
  @ValidateNested({ each: true })
  @Type(() => AnswerInputType)
  answers!: AnswerInputType[];

  @Field({ nullable: true })
  token?: string;

  @Field({ nullable: true })
  respondentId?: string;
}
