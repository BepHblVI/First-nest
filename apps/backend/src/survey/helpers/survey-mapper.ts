import { DeepPartial } from 'typeorm';
import { Question } from '../models/question.model';
import { SurveyAuthType } from '../models/survey.model';
import { QuestionInput } from '../dto/inputs';

export function buildTokenEntities(
  auth: SurveyAuthType,
  tokens: number,
): Record<string, never>[] {
  if (auth !== SurveyAuthType.PRIVATE || tokens <= 0) return [];
  return Array.from({ length: tokens }).map(() => ({}));
}

/**
 * Inputから保存用のQuestion形に変換する。
 * 配列のindexをそのまま order として付与する。
 * options も同様に index で order を付ける。
 */
export function mapQuestionInputs(
  questions: QuestionInput[],
): DeepPartial<Question>[] {
  return questions.map((q, order) => ({
    // ← 第2引数で index を受け取る
    qtext: q.qtext,
    type: q.type,
    required: q.required,
    order, // ← これを追加！
    options: q.options?.map((text, order) => ({ text, order })) ?? [],
  }));
}
