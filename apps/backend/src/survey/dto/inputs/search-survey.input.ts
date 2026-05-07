import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsOptional, Max, MaxLength, Min } from 'class-validator';
import { SurveyAuthType } from '../../models/survey.model';
import {
  AnswerState,
  PublishState,
  SearchScope,
  SortOrder,
  SurveySortField,
} from '../enums';

@InputType({ description: '日時の範囲指定。両方省略可' })
export class DateRangeInput {
  @Field({ nullable: true, description: '開始日時(この日時以降)' })
  @IsOptional()
  from?: Date;

  @Field({ nullable: true, description: '終了日時(この日時以前)' })
  @IsOptional()
  to?: Date;
}

@InputType({ description: '整数値の範囲指定。両方省略可' })
export class IntRangeInput {
  @Field(() => Int, { nullable: true, description: '最小値(この値以上)' })
  @IsOptional()
  min?: number;

  @Field(() => Int, { nullable: true, description: '最大値(この値以下)' })
  @IsOptional()
  max?: number;
}

@InputType({ description: 'アンケート一覧の検索・絞り込み・並び替え条件' })
export class SearchSurveyInput {
  // ── 検索 ──────────────────────────────
  @Field({
    nullable: true,
    description: '検索キーワード(100文字以内)',
  })
  @IsOptional()
  @MaxLength(100)
  keyword?: string;

  @Field(() => SearchScope, {
    defaultValue: SearchScope.TITLE_ONLY,
    description: 'キーワードの検索対象範囲',
  })
  scope!: SearchScope;

  // ── 絞り込み ──────────────────────────
  @Field(() => [PublishState], {
    nullable: true,
    description: '公開状態でのフィルタ。指定なし=すべて',
  })
  @IsOptional()
  publishStates?: PublishState[];

  @Field(() => [SurveyAuthType], {
    nullable: true,
    description: 'アクセス権限タイプでのフィルタ。指定なし=すべて',
  })
  @IsOptional()
  authTypes?: SurveyAuthType[];

  @Field(() => [AnswerState], {
    nullable: true,
    description: '回答有無でのフィルタ。指定なし=すべて',
  })
  @IsOptional()
  answerStates?: AnswerState[];

  // ── 範囲条件 ──────────────────────────
  @Field(() => DateRangeInput, {
    nullable: true,
    description: '作成日時の範囲条件',
  })
  @IsOptional()
  createdAt?: DateRangeInput;

  @Field(() => IntRangeInput, {
    nullable: true,
    description: '回答件数の範囲条件',
  })
  @IsOptional()
  submissionCount?: IntRangeInput;

  // ── 並び替え ──────────────────────────
  @Field(() => SurveySortField, {
    defaultValue: SurveySortField.CREATED_AT,
    description: '並び替えの基準フィールド',
  })
  sortBy!: SurveySortField;

  @Field(() => SortOrder, {
    defaultValue: SortOrder.DESC,
    description: '並び順(昇順/降順)',
  })
  order!: SortOrder;

  // ── ページング ────────────────────────
  @Field(() => Int, {
    defaultValue: 20,
    description: '1ページあたりの取得件数(1〜100)',
  })
  @IsInt()
  @Min(1)
  @Max(100)
  limit!: number;

  @Field(() => Int, {
    defaultValue: 0,
    description: '取得開始位置(0以上)',
  })
  @IsInt()
  @Min(0)
  offset!: number;
}
