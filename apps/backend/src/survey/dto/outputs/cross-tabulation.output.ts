import { ObjectType, Field, Int, Float } from '@nestjs/graphql';
import { QuestionType } from '../../models/question.model';

@ObjectType({ description: '選択肢のメタ情報(クロス集計用)' })
export class CrossTabOptionMeta {
  @Field(() => Int, { description: '選択肢ID' })
  id!: number;

  @Field({ description: '選択肢の表示テキスト' })
  text!: string;
}

@ObjectType({ description: 'クロス集計に使う質問のメタ情報' })
export class CrossTabQuestionMeta {
  @Field(() => Int, { description: '質問ID' })
  id!: number;

  @Field({ description: '質問文(本文)' })
  qtext!: string;

  @Field(() => QuestionType, {
    description:
      '質問の形式(SINGLE/MULTIPLE)。MULTIPLEのとき同一回答者が複数セルに重複してカウントされうる',
  })
  type!: QuestionType;

  @Field(() => [CrossTabOptionMeta], {
    description: '選択肢の一覧(orderの昇順)',
  })
  options!: CrossTabOptionMeta[];
}

@ObjectType({
  description:
    'クロス集計表の1セル。(rowOptionId, columnOptionId)の組合せごとに1つ存在し、回答0件のセルも含まれる',
})
export class CrossTabCell {
  @Field(() => Int, { description: '行の選択肢ID' })
  rowOptionId!: number;

  @Field(() => Int, { description: '列の選択肢ID' })
  columnOptionId!: number;

  @Field(() => Int, {
    description:
      '該当する回答件数。MULTIPLE質問が絡む場合、同一回答者が複数セルに加算されることがある',
  })
  count!: number;

  @Field(() => Float, {
    description:
      '行内比率(%)。同じ行の合計に対するこのセルの割合。行合計が0なら0.0を返す',
  })
  rowPercentage!: number;

  @Field(() => Float, {
    description:
      '列内比率(%)。同じ列の合計に対するこのセルの割合。列合計が0なら0.0を返す',
  })
  columnPercentage!: number;

  @Field(() => Float, {
    description:
      '全体比率(%)。grandTotalに対するこのセルの割合。grandTotalが0なら0.0を返す',
  })
  totalPercentage!: number;
}

@ObjectType({ description: 'クロス集計表の行/列ごとの合計情報' })
export class AxisSummary {
  @Field(() => Int, { description: '行または列の選択肢ID' })
  optionId!: number;

  @Field(() => Int, {
    description: 'この行/列の合計件数。MULTIPLEを含む場合は重複カウントを含む',
  })
  count!: number;

  @Field(() => Float, {
    description: 'grandTotalに対するこの行/列の割合(%)',
  })
  percentage!: number;
}

@ObjectType({
  description:
    '2つの選択式質問のクロス集計結果。行(rowQuestion) × 列(columnQuestion)の表形式データを返す',
})
export class CrossTabulationResult {
  @Field(() => CrossTabQuestionMeta, {
    description: '行(縦軸)に展開された質問の情報',
  })
  rowQuestion!: CrossTabQuestionMeta;

  @Field(() => CrossTabQuestionMeta, {
    description: '列(横軸)に展開された質問の情報',
  })
  columnQuestion!: CrossTabQuestionMeta;

  @Field(() => [CrossTabCell], {
    description:
      '集計表の全セル(0件セルも含む直積)。要素数 = rowOptions.length × columnOptions.length',
  })
  cells!: CrossTabCell[];

  @Field(() => [AxisSummary], {
    description: '各行の合計(rowQuestion.optionsの順序に対応)',
  })
  rowSummary!: AxisSummary[];

  @Field(() => [AxisSummary], {
    description: '各列の合計(columnQuestion.optionsの順序に対応)',
  })
  columnSummary!: AxisSummary[];

  @Field(() => Int, {
    description:
      '集計対象の総件数。SINGLEのみなら回答者数と一致、MULTIPLEを含む場合は重複カウント込みとなる',
  })
  grandTotal!: number;
}
