import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class OptionResult {
  @Field(() => Int)
  optionId!: number;

  @Field()
  text!: string;

  @Field(() => Int)
  count!: number;

  @Field(() => Float) // 割合は小数になるためFloatを明示
  percentage!: number;
}

@ObjectType()
export class QuestionResult {
  @Field(() => Int)
  questionId!: number;

  @Field()
  qtext!: string;

  @Field()
  type!: string; // TEXT, SINGLE, MULTIPLE

  @Field(() => Int)
  totalAnswersForThisQuestion!: number;

  @Field(() => [OptionResult])
  options?: OptionResult[];
}

@ObjectType()
export class CorrelationResult {
  @Field(() => Int)
  option1Id!: number;

  @Field(() => Int)
  option2Id!: number;

  @Field(() => Int)
  coOccurrenceCount!: number; // 同時に選ばれた回数
}

@ObjectType()
export class SurveyResult {
  @Field(() => Int)
  surveyId!: number;

  @Field()
  title!: string;

  @Field(() => Int)
  totalSubmissions!: number; // アンケート全体の回答者数

  @Field(() => [QuestionResult])
  questions!: QuestionResult[];

  @Field(() => [CorrelationResult], { nullable: true })
  correlations?: CorrelationResult[];
}