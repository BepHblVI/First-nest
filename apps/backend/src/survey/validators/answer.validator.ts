import { BadRequestException, Injectable } from '@nestjs/common';
import { Question, QuestionType } from '../models/question.model';
import { AnswerInput } from '../dto/inputs';

/**
 * 回答内容のバリデーション。
 * DBに依存しない純粋なロジックなので、ユニットテストで網羅的に検証する。
 */
@Injectable()
export class AnswerValidator {
  /** エントリーポイント。質問群と回答群を突き合わせて検証する */
  validate(questions: Question[], answers: AnswerInput[]): void {
    const questionMap = new Map(questions.map((q) => [q.id, q]));

    // 1. 存在しない質問IDが回答に含まれていないか
    for (const ans of answers) {
      if (!questionMap.has(ans.questionId)) {
        throw new BadRequestException(`存在しない質問ID: ${ans.questionId}`);
      }
    }

    // 2. 各質問について、対応する回答を検証
    for (const question of questions) {
      const answer = answers.find((a) => a.questionId === question.id);
      this.validateOne(question, answer);
    }
  }

  private validateOne(
    question: Question,
    answer: AnswerInput | undefined,
  ): void {
    switch (question.type) {
      case QuestionType.TEXT:
        return this.validateText(question, answer);
      case QuestionType.SINGLE:
        return this.validateSingle(question, answer);
      case QuestionType.MULTIPLE:
        return this.validateMultiple(question, answer);
      default:
        throw new BadRequestException(
          `不正な質問タイプ: ${String(question.type)}`,
        );
    }
  }

  private validateText(
    question: Question,
    answer: AnswerInput | undefined,
  ): void {
    if (question.required && !answer?.text?.trim()) {
      throw new BadRequestException(
        `必須質問「${question.qtext}」に回答してください`,
      );
    }
    if (answer?.selectionIds?.length) {
      throw new BadRequestException(
        `「${question.qtext}」はテキスト質問です。選択肢は送らないでください`,
      );
    }
  }

  private validateSingle(
    question: Question,
    answer: AnswerInput | undefined,
  ): void {
    if (question.required && !answer?.selectionIds?.length) {
      throw new BadRequestException(
        `必須質問「${question.qtext}」を選択してください`,
      );
    }
    if (answer?.selectionIds?.length) {
      if (answer.selectionIds.length > 1) {
        throw new BadRequestException(
          `「${question.qtext}」は1つだけ選択してください`,
        );
      }
      this.validateSelectionIds(question, answer.selectionIds);
    }
    if (answer?.text) {
      throw new BadRequestException(`「${question.qtext}」は選択式です`);
    }
  }

  private validateMultiple(
    question: Question,
    answer: AnswerInput | undefined,
  ): void {
    if (question.required && !answer?.selectionIds?.length) {
      throw new BadRequestException(
        `必須質問「${question.qtext}」を1つ以上選択してください`,
      );
    }
    if (answer?.selectionIds?.length) {
      const unique = new Set(answer.selectionIds);
      if (unique.size !== answer.selectionIds.length) {
        throw new BadRequestException(
          `「${question.qtext}」で同じ選択肢を重複選択しています`,
        );
      }
      this.validateSelectionIds(question, answer.selectionIds);
    }
    if (answer?.text) {
      throw new BadRequestException(`「${question.qtext}」は選択式です`);
    }
  }

  private validateSelectionIds(
    question: Question,
    selectionIds: number[],
  ): void {
    const validIds = new Set(question.options?.map((o) => o.id) ?? []);
    for (const id of selectionIds) {
      if (!validIds.has(id)) {
        throw new BadRequestException(
          `「${question.qtext}」に存在しない選択肢が指定されています`,
        );
      }
    }
  }
}
