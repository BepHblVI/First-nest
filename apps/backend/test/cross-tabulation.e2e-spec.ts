// test/cross-tabulation.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { sendGql, expectGqlError } from './utils/gql-client';
import { signUpAndLogin } from './utils/auth-client';
import { cleanDatabase } from './utils/db-cleaner';
import { createTestSurvey, submitAnswer } from './utils/survey-helpers';
import { getCrossTab, rawCrossTab } from './utils/cross-tabulation.helper';

describe('Cross Tabulation (e2e)', () => {
  let app: INestApplication;
  let tokenA: string;
  let tokenB: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  beforeEach(async () => {
    await cleanDatabase(app);
    tokenA = (await signUpAndLogin(app, 'userA', 'pwA12345')).accessToken;
    tokenB = (await signUpAndLogin(app, 'userB', 'pwB12345')).accessToken;
  });

  afterAll(async () => await app.close());

  // ─────────────────────────────────────────────
  describe('セキュリティ', () => {
    test('未認証なら弾かれる', async () => {
      const { surveyId, q1Id, q2Id } = await setupBasicSurvey(app, tokenA);

      const res = await rawCrossTab(app, undefined, {
        surveyId,
        rowQuestionId: q1Id,
        columnQuestionId: q2Id,
      });

      expectGqlError(res, /Unauthorized/);
    });

    test('他ユーザーのアンケートには 403 相当', async () => {
      const { surveyId, q1Id, q2Id } = await setupBasicSurvey(app, tokenA);

      const res = await rawCrossTab(app, tokenB, {
        surveyId,
        rowQuestionId: q1Id,
        columnQuestionId: q2Id,
      });

      expect(res.body.errors).toBeDefined();
    });

    test('存在しない surveyId は エラー', async () => {
      const res = await rawCrossTab(app, tokenA, {
        surveyId: 999999,
        rowQuestionId: 1,
        columnQuestionId: 2,
      });
      expect(res.body.errors).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────
  describe('バリデーション', () => {
    test('rowQuestionId == columnQuestionId は不正', async () => {
      const { surveyId, q1Id } = await setupBasicSurvey(app, tokenA);
      const res = await rawCrossTab(app, tokenA, {
        surveyId,
        rowQuestionId: q1Id,
        columnQuestionId: q1Id,
      });
      expect(res.body.errors).toBeDefined();
    });

    test('TEXT 型の質問を指定するとエラー', async () => {
      const survey = await createTestSurvey(app, tokenA, {
        title: 'with text',
        questions: [
          { qtext: 'free', type: 'TEXT' },
          {
            qtext: 'choice',
            type: 'SINGLE',
            options: ['A', 'B'],
          },
        ],
      });

      const res = await rawCrossTab(app, tokenA, {
        surveyId: survey.id,
        rowQuestionId: survey.questions[0].id, // TEXT
        columnQuestionId: survey.questions[1].id,
      });
      expect(res.body.errors).toBeDefined();
    });

    test('別アンケートに属する質問IDを混ぜるとエラー', async () => {
      const s1 = await setupBasicSurvey(app, tokenA);
      const s2 = await setupBasicSurvey(app, tokenA);

      const res = await rawCrossTab(app, tokenA, {
        surveyId: s1.surveyId,
        rowQuestionId: s1.q1Id,
        columnQuestionId: s2.q1Id, // 別サーベイの質問
      });
      expect(res.body.errors).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────
  describe('SINGLE × SINGLE 基本集計', () => {
    test('1人だけ回答した最小ケース', async () => {
      const setup = await setupBasicSurvey(app, tokenA);
      const { surveyId, q1Id, q2Id, q1Options, q2Options } = setup;

      await submitAnswer(app, {
        surveyId,
        answers: [
          { questionId: q1Id, selectionIds: [q1Options[0].id] }, // A
          { questionId: q2Id, selectionIds: [q2Options[0].id] }, // X
        ],
      });

      const data = await getCrossTab(app, tokenA, {
        surveyId,
        rowQuestionId: q1Id,
        columnQuestionId: q2Id,
      });

      expect(data.grandTotal).toBe(1);
      // 直積で4セル
      expect(data.cells).toHaveLength(q1Options.length * q2Options.length);

      // (A, X) は 1、他は 0
      const ax = cellOf(data, q1Options[0].id, q2Options[0].id);
      expect(ax.count).toBe(1);
      const others = data.cells.filter(
        (c: any) =>
          !(
            c.rowOptionId === q1Options[0].id &&
            c.columnOptionId === q2Options[0].id
          ),
      );
      others.forEach((c: any) => expect(c.count).toBe(0));
    });

    test('複数人の回答を正しく集計', async () => {
      const setup = await setupBasicSurvey(app, tokenA);
      const { surveyId, q1Id, q2Id, q1Options, q2Options } = setup;
      const [A, B] = q1Options;
      const [X, Y] = q2Options;

      // (A, X) ×3, (A, Y) ×1, (B, X) ×2, (B, Y) ×0
      await submitMany(app, surveyId, q1Id, q2Id, [
        ...repeat([A.id, X.id] as const, 3),
        ...repeat([A.id, Y.id] as const, 1),
        ...repeat([B.id, X.id] as const, 2),
      ]);

      const data = await getCrossTab(app, tokenA, {
        surveyId,
        rowQuestionId: q1Id,
        columnQuestionId: q2Id,
      });

      expect(data.grandTotal).toBe(6);
      expect(cellOf(data, A.id, X.id).count).toBe(3);
      expect(cellOf(data, A.id, Y.id).count).toBe(1);
      expect(cellOf(data, B.id, X.id).count).toBe(2);
      expect(cellOf(data, B.id, Y.id).count).toBe(0);
    });

    test('全選択肢の組合せ（直積）が必ず返る', async () => {
      const setup = await setupBasicSurvey(app, tokenA);
      const { surveyId, q1Id, q2Id, q1Options, q2Options } = setup;

      const data = await getCrossTab(app, tokenA, {
        surveyId,
        rowQuestionId: q1Id,
        columnQuestionId: q2Id,
      });

      // 回答0でも直積分のセルが揃う
      for (const r of q1Options) {
        for (const c of q2Options) {
          const cell = cellOf(data, r.id, c.id);
          expect(cell).toBeDefined();
          expect(cell.count).toBe(0);
        }
      }
    });
  });

  // ─────────────────────────────────────────────
  describe('比率計算', () => {
    test('rowPercentage / columnPercentage / totalPercentage が正しい', async () => {
      const setup = await setupBasicSurvey(app, tokenA);
      const { surveyId, q1Id, q2Id, q1Options, q2Options } = setup;
      const [A, B] = q1Options;
      const [X, Y] = q2Options;

      // 行A: 4, 行B: 6 → grandTotal: 10
      // 列X: 5, 列Y: 5
      // (A,X)=3, (A,Y)=1, (B,X)=2, (B,Y)=4
      await submitMany(app, surveyId, q1Id, q2Id, [
        ...repeat([A.id, X.id] as const, 3),
        ...repeat([A.id, Y.id] as const, 1),
        ...repeat([B.id, X.id] as const, 2),
        ...repeat([B.id, Y.id] as const, 4),
      ]);

      const data = await getCrossTab(app, tokenA, {
        surveyId,
        rowQuestionId: q1Id,
        columnQuestionId: q2Id,
      });

      // (A, X): count=3, rowPct=3/4=75, colPct=3/5=60, totalPct=3/10=30
      const ax = cellOf(data, A.id, X.id);
      expect(ax.count).toBe(3);
      expect(ax.rowPercentage).toBeCloseTo(75, 1);
      expect(ax.columnPercentage).toBeCloseTo(60, 1);
      expect(ax.totalPercentage).toBeCloseTo(30, 1);
    });

    test('rowSummary の合計が grandTotal と一致', async () => {
      const setup = await setupBasicSurvey(app, tokenA);
      const { surveyId, q1Id, q2Id, q1Options, q2Options } = setup;
      const [A, B] = q1Options;
      const [X, Y] = q2Options;

      await submitMany(app, surveyId, q1Id, q2Id, [
        ...repeat([A.id, X.id] as const, 5),
        ...repeat([B.id, Y.id] as const, 3),
      ]);

      const data = await getCrossTab(app, tokenA, {
        surveyId,
        rowQuestionId: q1Id,
        columnQuestionId: q2Id,
      });

      const rowSum = data.rowSummary.reduce(
        (s: number, r: any) => s + r.count,
        0,
      );
      const colSum = data.columnSummary.reduce(
        (s: number, c: any) => s + c.count,
        0,
      );
      expect(rowSum).toBe(data.grandTotal);
      expect(colSum).toBe(data.grandTotal);
    });
  });

  // ─────────────────────────────────────────────
  describe('エッジケース', () => {
    test('回答0件: grandTotal=0、全セル count=0、比率は 0.0', async () => {
      const setup = await setupBasicSurvey(app, tokenA);
      const { surveyId, q1Id, q2Id, q1Options, q2Options } = setup;

      const data = await getCrossTab(app, tokenA, {
        surveyId,
        rowQuestionId: q1Id,
        columnQuestionId: q2Id,
      });

      expect(data.grandTotal).toBe(0);
      expect(data.cells).toHaveLength(q1Options.length * q2Options.length);
      data.cells.forEach((c: any) => {
        expect(c.count).toBe(0);
        expect(c.rowPercentage).toBe(0);
        expect(c.columnPercentage).toBe(0);
        expect(c.totalPercentage).toBe(0);
      });
    });

    test('行の合計が0でも rowPercentage は NaN ではなく 0.0', async () => {
      const setup = await setupBasicSurvey(app, tokenA);
      const { surveyId, q1Id, q2Id, q1Options, q2Options } = setup;
      const [A, B] = q1Options;
      const [X, Y] = q2Options;

      // 行Aだけ回答、行Bは0件
      await submitMany(app, surveyId, q1Id, q2Id, [
        ...repeat([A.id, X.id] as const, 2),
      ]);

      const data = await getCrossTab(app, tokenA, {
        surveyId,
        rowQuestionId: q1Id,
        columnQuestionId: q2Id,
      });

      // 行B 配下のセルは count=0、rowPercentage も 0
      const bx = cellOf(data, B.id, X.id);
      const by = cellOf(data, B.id, Y.id);
      expect(bx.count).toBe(0);
      expect(bx.rowPercentage).toBe(0);
      expect(by.rowPercentage).toBe(0);
    });
  });

  // ─────────────────────────────────────────────
  describe('MULTIPLE 質問', () => {
    test('MULTIPLE × SINGLE: 1人が複数選択肢を選ぶと複数行に加算される', async () => {
      const survey = await createTestSurvey(app, tokenA, {
        title: 'mul x single',
        questions: [
          { qtext: 'Q1', type: 'MULTIPLE', options: ['A', 'B', 'C'] },
          { qtext: 'Q2', type: 'SINGLE', options: ['X', 'Y'] },
        ],
      });
      const q1 = survey.questions[0];
      const q2 = survey.questions[1];
      const [A, B, C] = q1.options;
      const [X, Y] = q2.options;

      // 1人が Q1=[A, B], Q2=X を回答
      await submitAnswer(app, {
        surveyId: survey.id,
        answers: [
          { questionId: q1.id, selectionIds: [A.id, B.id] },
          { questionId: q2.id, selectionIds: [X.id] },
        ],
      });

      const data = await getCrossTab(app, tokenA, {
        surveyId: survey.id,
        rowQuestionId: q1.id,
        columnQuestionId: q2.id,
      });

      // (A, X), (B, X) はカウントされ、(C, *) は 0
      expect(cellOf(data, A.id, X.id).count).toBe(1);
      expect(cellOf(data, B.id, X.id).count).toBe(1);
      expect(cellOf(data, C.id, X.id).count).toBe(0);
      expect(cellOf(data, A.id, Y.id).count).toBe(0);
      // grandTotal は重複カウント込み
      expect(data.grandTotal).toBe(2);
    });

    test('rowQuestion.type が MULTIPLE と返る', async () => {
      const survey = await createTestSurvey(app, tokenA, {
        title: 'type check',
        questions: [
          { qtext: 'Q1', type: 'MULTIPLE', options: ['A', 'B'] },
          { qtext: 'Q2', type: 'SINGLE', options: ['X', 'Y'] },
        ],
      });

      const data = await getCrossTab(app, tokenA, {
        surveyId: survey.id,
        rowQuestionId: survey.questions[0].id,
        columnQuestionId: survey.questions[1].id,
      });

      expect(data.rowQuestion.type).toBe('MULTIPLE');
      expect(data.columnQuestion.type).toBe('SINGLE');
    });
  });
});

// ─────────────────────────────────────────────
// テスト内ヘルパー
// ─────────────────────────────────────────────

/**
 * Q1(SINGLE: A, B) × Q2(SINGLE: X, Y) の最小構成サーベイを作成。
 */
async function setupBasicSurvey(app: INestApplication, token: string) {
  const survey = await createTestSurvey(app, token, {
    title: 'cross-tab basic',
    published: true,
    questions: [
      { qtext: 'Q1', type: 'SINGLE', options: ['A', 'B'] },
      { qtext: 'Q2', type: 'SINGLE', options: ['X', 'Y'] },
    ],
  });
  const [q1, q2] = survey.questions;
  return {
    surveyId: survey.id,
    q1Id: q1.id,
    q2Id: q2.id,
    q1Options: q1.options as Array<{ id: number; text: string }>,
    q2Options: q2.options as Array<{ id: number; text: string }>,
  };
}

/**
 * (q1OptionId, q2OptionId) の組合せを指定回数 submit する。
 */
async function submitMany(
  app: INestApplication,
  surveyId: number,
  q1Id: number,
  q2Id: number,
  pairs: ReadonlyArray<readonly [number, number]>,
) {
  for (const [opt1, opt2] of pairs) {
    await submitAnswer(app, {
      surveyId,
      answers: [
        { questionId: q1Id, selectionIds: [opt1] },
        { questionId: q2Id, selectionIds: [opt2] },
      ],
    });
  }
}

function repeat<T>(value: T, times: number): T[] {
  return Array.from({ length: times }, () => value);
}

function cellOf(data: any, rowId: number, colId: number) {
  return data.cells.find(
    (c: any) => c.rowOptionId === rowId && c.columnOptionId === colId,
  );
}
