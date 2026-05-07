import { DeepPartial } from 'typeorm';
import { Question } from '../models/question.model';
import { SurveyAuthType } from '../models/survey.model';
import { QuestionInput } from '../dto/inputs';

/**
 * 招待トークンのエンティティを必要数生成する。
 * PRIVATE かつ tokens > 0 のときのみ生成、それ以外は空配列。
 */
export function buildTokenEntities(
  auth: SurveyAuthType,
  tokens: number,
): Record<string, never>[] {
  if (auth !== SurveyAuthType.PRIVATE || tokens <= 0) return [];
  return Array.from({ length: tokens }).map(() => ({}));
}

/**
 * Inputから保存用のQuestion形に変換する。
 * 選択肢は配列のindexをorderとして付与する。
 */
export function mapQuestionInputs(
  questions: QuestionInput[],
): DeepPartial<Question>[] {
  return questions.map((q) => ({
    qtext: q.qtext,
    type: q.type,
    required: q.required,
    options: q.options?.map((text, order) => ({ text, order })) ?? [],
  }));
}
