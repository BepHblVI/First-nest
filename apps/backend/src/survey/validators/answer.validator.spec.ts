import { BadRequestException } from '@nestjs/common';
import { AnswerValidator } from './answer.validator';
import { Question, QuestionType } from '../models/question.model';

describe('AnswerValidator', () => {
  let validator: AnswerValidator;

  beforeEach(() => {
    validator = new AnswerValidator();
  });

  // ── テストデータ用ヘルパー ──────────────────────────
  const textQ = (overrides: Partial<Question> = {}): Question =>
    ({
      id: 1,
      qtext: 'お名前は?',
      type: QuestionType.TEXT,
      required: false,
      options: [],
      ...overrides,
    }) as Question;

  const singleQ = (overrides: Partial<Question> = {}): Question =>
    ({
      id: 2,
      qtext: '好きな色は?',
      type: QuestionType.SINGLE,
      required: false,
      options: [
        { id: 10, text: '赤' },
        { id: 11, text: '青' },
      ],
      ...overrides,
    }) as Question;

  const multipleQ = (overrides: Partial<Question> = {}): Question =>
    ({
      id: 3,
      qtext: '使ったことがある言語は?',
      type: QuestionType.MULTIPLE,
      required: false,
      options: [
        { id: 20, text: 'TS' },
        { id: 21, text: 'Python' },
        { id: 22, text: 'Go' },
      ],
      ...overrides,
    }) as Question;

  describe('共通: 質問IDの整合性', () => {
    it('回答が参照する質問IDが存在しないとエラー', () => {
      expect(() =>
        validator.validate([textQ()], [{ questionId: 999, text: 'a' }]),
      ).toThrow(BadRequestException);
    });

    it('質問があっても回答がなければスキップされる(任意質問)', () => {
      expect(() => validator.validate([textQ()], [])).not.toThrow();
    });
  });

  describe('TEXT 質問', () => {
    it('必須でテキストありなら成功', () => {
      expect(() =>
        validator.validate(
          [textQ({ required: true })],
          [{ questionId: 1, text: '太郎' }],
        ),
      ).not.toThrow();
    });

    it('必須でテキスト未入力ならエラー', () => {
      expect(() =>
        validator.validate([textQ({ required: true })], [{ questionId: 1 }]),
      ).toThrow(/必須質問/);
    });

    it('必須で空白のみのテキストはエラー(trim判定)', () => {
      expect(() =>
        validator.validate(
          [textQ({ required: true })],
          [{ questionId: 1, text: '   ' }],
        ),
      ).toThrow(BadRequestException);
    });

    it('任意ならテキスト未入力でも成功', () => {
      expect(() =>
        validator.validate([textQ({ required: false })], []),
      ).not.toThrow();
    });

    it('テキスト質問に選択肢を送るとエラー', () => {
      expect(() =>
        validator.validate([textQ()], [{ questionId: 1, selectionIds: [10] }]),
      ).toThrow(/選択肢は送らないでください/);
    });
  });

  describe('SINGLE 質問', () => {
    it('1つだけ選択すれば成功', () => {
      expect(() =>
        validator.validate(
          [singleQ()],
          [{ questionId: 2, selectionIds: [10] }],
        ),
      ).not.toThrow();
    });

    it('必須で未選択ならエラー', () => {
      expect(() =>
        validator.validate([singleQ({ required: true })], [{ questionId: 2 }]),
      ).toThrow(/必須質問/);
    });

    it('複数選択するとエラー', () => {
      expect(() =>
        validator.validate(
          [singleQ()],
          [{ questionId: 2, selectionIds: [10, 11] }],
        ),
      ).toThrow(/1つだけ選択/);
    });

    it('存在しない選択肢IDを送るとエラー', () => {
      expect(() =>
        validator.validate(
          [singleQ()],
          [{ questionId: 2, selectionIds: [999] }],
        ),
      ).toThrow(/存在しない選択肢/);
    });

    it('選択式なのにtextを送るとエラー', () => {
      expect(() =>
        validator.validate(
          [singleQ()],
          [{ questionId: 2, selectionIds: [10], text: 'extra' }],
        ),
      ).toThrow(/選択式/);
    });
  });

  describe('MULTIPLE 質問', () => {
    it('複数選択できる', () => {
      expect(() =>
        validator.validate(
          [multipleQ()],
          [{ questionId: 3, selectionIds: [20, 21, 22] }],
        ),
      ).not.toThrow();
    });

    it('1つだけの選択でも成功', () => {
      expect(() =>
        validator.validate(
          [multipleQ()],
          [{ questionId: 3, selectionIds: [20] }],
        ),
      ).not.toThrow();
    });

    it('必須で未選択ならエラー', () => {
      expect(() =>
        validator.validate(
          [multipleQ({ required: true })],
          [{ questionId: 3 }],
        ),
      ).toThrow(/必須質問/);
    });

    it('重複選択するとエラー', () => {
      expect(() =>
        validator.validate(
          [multipleQ()],
          [{ questionId: 3, selectionIds: [20, 20] }],
        ),
      ).toThrow(/重複選択/);
    });

    it('存在しない選択肢IDを送るとエラー', () => {
      expect(() =>
        validator.validate(
          [multipleQ()],
          [{ questionId: 3, selectionIds: [999] }],
        ),
      ).toThrow(/存在しない選択肢/);
    });
  });

  describe('複合シナリオ', () => {
    it('TEXT + SINGLE + MULTIPLE をまとめて正しく回答できる', () => {
      const questions = [
        textQ({ id: 1, required: true }),
        singleQ({ id: 2, required: true }),
        multipleQ({ id: 3 }),
      ];
      const answers = [
        { questionId: 1, text: '太郎' },
        { questionId: 2, selectionIds: [10] },
        { questionId: 3, selectionIds: [20, 21] },
      ];
      expect(() => validator.validate(questions, answers)).not.toThrow();
    });

    it('1つでも違反があれば全体がエラーで止まる', () => {
      const questions = [textQ({ id: 1, required: true }), singleQ({ id: 2 })];
      const answers = [
        { questionId: 2, selectionIds: [10] }, // textが抜けている
      ];
      expect(() => validator.validate(questions, answers)).toThrow(
        BadRequestException,
      );
    });
  });
});
