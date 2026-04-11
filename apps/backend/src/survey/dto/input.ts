import { InputType, Field, Int } from '@nestjs/graphql';
import { 
  IsString, 
  IsNotEmpty, 
  IsIn,
  IsArray, 
  ValidateNested, 
  ArrayMinSize,
  IsInt
} from 'class-validator';
import { Type } from 'class-transformer';
@InputType()
export class QuestionInput {
  @Field()
  @IsNotEmpty({message:'質問文は空にしないでください！'})
  qtext!: string;

  @Field()
  @IsIn(['TEXT','SINGLE','MULTIPLE'],{message:'質問タイプが不正です！'})
  type!: string;

  @Field(() => [String], { nullable: true })
  options?: string[];
}

@InputType()
export class AnswerInputType {
  @Field(() => Int)
  questionId!: number;

  @Field({ nullable: true })
  @IsNotEmpty({message:'回答は必須です'})
  text?: string;

  @Field(() => [Int], { nullable: true })
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
}