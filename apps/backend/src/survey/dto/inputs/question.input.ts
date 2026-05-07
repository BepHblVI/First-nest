import { Field, InputType } from '@nestjs/graphql';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsString,
  ValidateIf,
} from 'class-validator';
import { QuestionType } from '../../models/question.model';

@InputType({ description: 'アンケートの設問の入力値' })
export class QuestionInput {
  @Field({ description: '質問文(本文)' })
  @IsString()
  @IsNotEmpty({ message: '質問文は空にしないでください！' })
  qtext!: string;

  @Field(() => QuestionType, {
    nullable: true,
    defaultValue: QuestionType.TEXT,
    description:
      '質問のタイプ(TEXT: 自由記述 / SINGLE: 単一選択 / MULTIPLE: 複数選択)',
  })
  @IsEnum(QuestionType, { message: '質問タイプが不正です！' })
  type!: QuestionType;

  @Field({
    nullable: true,
    defaultValue: false,
    description: '回答必須フラグ',
  })
  @IsBoolean()
  required!: boolean;

  @Field(() => [String], {
    nullable: true,
    description: '選択肢の一覧。SINGLE / MULTIPLE のときは必須',
  })
  @ValidateIf((o: QuestionInput) => o.type !== QuestionType.TEXT)
  @IsArray({ message: '選択肢は配列で指定してください' })
  @ArrayNotEmpty({ message: '選択式の質問には選択肢が必須です' })
  @IsString({ each: true, message: '選択肢は文字列で指定してください' })
  @IsNotEmpty({ each: true, message: '選択肢に空の項目があります' })
  options?: string[];
}
