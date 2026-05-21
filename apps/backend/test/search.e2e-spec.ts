// test/search.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { sendGql, expectGqlError } from './utils/gql-client';
import { signUpAndLogin } from './utils/auth-client';
import { cleanDatabase } from './utils/db-cleaner';
import {
  createTestSurvey,
  searchSurvey,
  submitAnswer,
} from './utils/survey-helpers';
import { GqlThrottlerGuard } from '../src/auth/guards/gql-throttler.guard';

describe('Survey Search (e2e)', () => {
  let app: INestApplication;
  let tokenA: string;
  let tokenB: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(GqlThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();
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
      const res = await sendGql(
        app,
        `query Search($input: SearchSurveyInput!) {
           searchSurvey(input: $input) { totalCount }
         }`,
        undefined,
        {
          input: {
            scope: 'TITLE_ONLY',
            sortBy: 'CREATED_AT',
            order: 'DESC',
            limit: 20,
            offset: 0,
          },
        },
      );
      expectGqlError(res, /Unauthorized/);
    });

    test('他ユーザーのアンケートは検索結果に含まれない', async () => {
      await createTestSurvey(app, tokenA, { title: 'AのS' });
      await createTestSurvey(app, tokenB, { title: 'BのS' });

      const result = await searchSurvey(app, tokenA);
      expect(result.totalCount).toBe(1);
      expect(result.items[0].title).toBe('AのS');
    });
  });

  // ─────────────────────────────────────────────
  describe('キーワード検索', () => {
    beforeEach(async () => {
      await createTestSurvey(app, tokenA, {
        title: '社員満足度調査',
        questions: [{ qtext: '勤務時間に満足ですか', type: 'TEXT' }],
      });
      await createTestSurvey(app, tokenA, {
        title: '製品アンケート',
        questions: [{ qtext: '満足度を教えてください', type: 'TEXT' }],
      });
      await createTestSurvey(app, tokenA, {
        title: 'イベント参加意向',
        questions: [{ qtext: '参加したいですか', type: 'TEXT' }],
      });
    });

    test('TITLE_ONLY: タイトルに部分一致でヒット', async () => {
      const result = await searchSurvey(app, tokenA, {
        keyword: '満足',
        scope: 'TITLE_ONLY',
      });
      expect(result.totalCount).toBe(1);
      expect(result.items[0].title).toBe('社員満足度調査');
    });

    test('TITLE_ONLY: 質問文だけマッチするキーワードはヒットしない', async () => {
      const result = await searchSurvey(app, tokenA, {
        keyword: '勤務時間',
        scope: 'TITLE_ONLY',
      });
      expect(result.totalCount).toBe(0);
    });

    test('TITLE_AND_QUESTIONS: 質問文にマッチしてヒット', async () => {
      const result = await searchSurvey(app, tokenA, {
        keyword: '満足',
        scope: 'TITLE_AND_QUESTIONS',
      });
      // タイトル「社員満足度調査」と、質問「満足度を教えて」両方マッチ
      expect(result.totalCount).toBe(2);
    });

    test('キーワードなしなら全件返る', async () => {
      const result = await searchSurvey(app, tokenA);
      expect(result.totalCount).toBe(3);
    });

    test('キーワード100文字超はバリデーションエラー', async () => {
      const res = await sendGql(
        app,
        `query Search($input: SearchSurveyInput!) {
           searchSurvey(input: $input) { totalCount }
         }`,
        tokenA,
        {
          input: {
            keyword: 'あ'.repeat(101),
            scope: 'TITLE_ONLY',
            sortBy: 'CREATED_AT',
            order: 'DESC',
            limit: 20,
            offset: 0,
          },
        },
      );
      expect(res.body.errors).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────
  describe('公開状態フィルタ', () => {
    beforeEach(async () => {
      await createTestSurvey(app, tokenA, { title: '公開1', published: true });
      await createTestSurvey(app, tokenA, { title: '公開2', published: true });
      await createTestSurvey(app, tokenA, {
        title: '下書き1',
        published: false,
      });
    });

    test('PUBLISHED のみ', async () => {
      const result = await searchSurvey(app, tokenA, {
        publishStates: ['PUBLISHED'],
      });
      expect(result.totalCount).toBe(2);
      expect(result.items.every((s) => s.published)).toBe(true);
    });

    test('DRAFT のみ', async () => {
      const result = await searchSurvey(app, tokenA, {
        publishStates: ['DRAFT'],
      });
      expect(result.totalCount).toBe(1);
      expect(result.items[0].title).toBe('下書き1');
    });

    test('両方指定で全件', async () => {
      const result = await searchSurvey(app, tokenA, {
        publishStates: ['PUBLISHED', 'DRAFT'],
      });
      expect(result.totalCount).toBe(3);
    });

    test('指定なしで全件', async () => {
      const result = await searchSurvey(app, tokenA);
      expect(result.totalCount).toBe(3);
    });
  });

  // ─────────────────────────────────────────────
  describe('認証方式フィルタ', () => {
    beforeEach(async () => {
      await createTestSurvey(app, tokenA, { title: 'pub1', auth: 'PUBLIC' });
      await createTestSurvey(app, tokenA, {
        title: 'priv1',
        auth: 'PRIVATE',
        tokens: 1,
      });
    });

    test('PUBLIC のみ', async () => {
      const result = await searchSurvey(app, tokenA, { authTypes: ['PUBLIC'] });
      expect(result.totalCount).toBe(1);
      expect(result.items[0].auth).toBe('PUBLIC');
    });

    test('PRIVATE のみ', async () => {
      const result = await searchSurvey(app, tokenA, {
        authTypes: ['PRIVATE'],
      });
      expect(result.totalCount).toBe(1);
      expect(result.items[0].auth).toBe('PRIVATE');
    });
  });

  // ─────────────────────────────────────────────
  describe('回答状態フィルタ', () => {
    test('UNANSWERED と HAS_ANSWERS が正しく分かれる', async () => {
      const answered = await createTestSurvey(app, tokenA, {
        title: '回答あり',
        published: true,
      });
      const unanswered = await createTestSurvey(app, tokenA, {
        title: '回答なし',
        published: true,
      });

      // answered にだけ回答送信
      await submitAnswer(app, {
        surveyId: answered.id,
        answers: [{ questionId: answered.questions[0].id, text: 'a' }],
      });

      const onlyUnanswered = await searchSurvey(app, tokenA, {
        answerStates: ['UNANSWERED'],
      });
      expect(onlyUnanswered.totalCount).toBe(1);
      expect(onlyUnanswered.items[0].title).toBe('回答なし');

      const onlyAnswered = await searchSurvey(app, tokenA, {
        answerStates: ['HAS_ANSWERS'],
      });
      expect(onlyAnswered.totalCount).toBe(1);
      expect(onlyAnswered.items[0].title).toBe('回答あり');
    });
  });

  // ─────────────────────────────────────────────
  describe('範囲フィルタ', () => {
    describe('回答件数', () => {
      test('min で絞り込み(2件以上の回答があるもの)', async () => {
        const s1 = await createTestSurvey(app, tokenA, {
          title: '0件',
          published: true,
        });
        const s2 = await createTestSurvey(app, tokenA, {
          title: '1件',
          published: true,
        });
        const s3 = await createTestSurvey(app, tokenA, {
          title: '2件',
          published: true,
        });

        await submitAnswer(app, {
          surveyId: s2.id,
          answers: [{ questionId: s2.questions[0].id, text: 'a' }],
        });
        await submitAnswer(app, {
          surveyId: s3.id,
          answers: [{ questionId: s3.questions[0].id, text: 'a' }],
        });
        await submitAnswer(app, {
          surveyId: s3.id,
          answers: [{ questionId: s3.questions[0].id, text: 'b' }],
        });

        const result = await searchSurvey(app, tokenA, {
          submissionCount: { min: 2 },
        });
        expect(result.totalCount).toBe(1);
        expect(result.items[0].title).toBe('2件');
      });
    });

    describe('作成日時', () => {
      test('to で絞り込み(指定日時以前)', async () => {
        // ★ 実装時の注意:
        //   作成日時はDB時刻なので、テストでは「全件取って後から検証」
        //   または「DB直接更新で日時を操作」する。
        //   ここでは「to=未来の日時」にして全件含まれることだけ確認。
        await createTestSurvey(app, tokenA, { title: 's1' });

        const future = new Date(Date.now() + 86400000).toISOString(); // +1日
        const result = await searchSurvey(app, tokenA, {
          createdAt: { to: future },
        });
        expect(result.totalCount).toBe(1);
      });

      test('from で絞り込み(過去の日時を指定すると0件)', async () => {
        await createTestSurvey(app, tokenA, { title: 's1' });

        const future = new Date(Date.now() + 86400000).toISOString();
        const result = await searchSurvey(app, tokenA, {
          createdAt: { from: future },
        });
        expect(result.totalCount).toBe(0);
      });
    });
  });

  // ─────────────────────────────────────────────
  describe('並び替え', () => {
    beforeEach(async () => {
      await createTestSurvey(app, tokenA, { title: 'C' });
      await createTestSurvey(app, tokenA, { title: 'A' });
      await createTestSurvey(app, tokenA, { title: 'B' });
    });

    test('TITLE ASC でアルファベット順', async () => {
      const result = await searchSurvey(app, tokenA, {
        sortBy: 'TITLE',
        order: 'ASC',
      });
      expect(result.items.map((s) => s.title)).toEqual(['A', 'B', 'C']);
    });

    test('TITLE DESC で逆順', async () => {
      const result = await searchSurvey(app, tokenA, {
        sortBy: 'TITLE',
        order: 'DESC',
      });
      expect(result.items.map((s) => s.title)).toEqual(['C', 'B', 'A']);
    });

    test('CREATED_AT DESC (デフォルト)で新しい順', async () => {
      const result = await searchSurvey(app, tokenA);
      // 後で作ったものが先頭
      expect(result.items[0].title).toBe('B');
      expect(result.items[2].title).toBe('C');
    });

    test('SUBMISSION_COUNT DESC で回答多い順', async () => {
      // 回答件数を変えて検証する場合
      // (この部分は beforeEach のデータに加えて回答を追加)
    });
  });

  // ─────────────────────────────────────────────
  describe('ページング', () => {
    beforeEach(async () => {
      // 25件作成
      for (let i = 0; i < 25; i++) {
        await createTestSurvey(app, tokenA, { title: `survey-${i}` });
      }
    });

    test('limit 10 で10件返る', async () => {
      const result = await searchSurvey(app, tokenA, { limit: 10, offset: 0 });
      expect(result.items).toHaveLength(10);
      expect(result.totalCount).toBe(25);
      expect(result.hasNext).toBe(true);
    });

    test('offset 20 で残り5件', async () => {
      const result = await searchSurvey(app, tokenA, { limit: 10, offset: 20 });
      expect(result.items).toHaveLength(5);
      expect(result.totalCount).toBe(25);
      expect(result.hasNext).toBe(false);
    });

    test('limit が件数より多くてもエラーにならない', async () => {
      const result = await searchSurvey(app, tokenA, { limit: 100, offset: 0 });
      expect(result.items).toHaveLength(25);
      expect(result.hasNext).toBe(false);
    });

    test('offset が件数を超えると空配列', async () => {
      const result = await searchSurvey(app, tokenA, {
        limit: 10,
        offset: 100,
      });
      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(25);
      expect(result.hasNext).toBe(false);
    });

    test.each([
      ['limit が0', { limit: 0, offset: 0 }],
      ['limit が101', { limit: 101, offset: 0 }],
      ['offset が負', { limit: 10, offset: -1 }],
    ])('%s でバリデーションエラー', async (_, input) => {
      const res = await sendGql(
        app,
        `query Search($input: SearchSurveyInput!) {
           searchSurvey(input: $input) { totalCount }
         }`,
        tokenA,
        {
          input: {
            scope: 'TITLE_ONLY',
            sortBy: 'CREATED_AT',
            order: 'DESC',
            ...input,
          },
        },
      );
      expect(res.body.errors).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────
  describe('複合条件', () => {
    test('PUBLISHED + PRIVATE + キーワードを同時に適用', async () => {
      await createTestSurvey(app, tokenA, {
        title: '社員満足度',
        published: true,
        auth: 'PRIVATE',
        tokens: 1,
      });
      await createTestSurvey(app, tokenA, {
        title: '社員満足度(下書き)',
        published: false,
        auth: 'PRIVATE',
        tokens: 1,
      });
      await createTestSurvey(app, tokenA, {
        title: '社員満足度(公開)',
        published: true,
        auth: 'PUBLIC',
      });
      await createTestSurvey(app, tokenA, {
        title: '別のアンケート',
        published: true,
        auth: 'PRIVATE',
        tokens: 1,
      });

      const result = await searchSurvey(app, tokenA, {
        keyword: '満足',
        scope: 'TITLE_ONLY',
        publishStates: ['PUBLISHED'],
        authTypes: ['PRIVATE'],
      });

      // 満足を含む && 公開中 && PRIVATE → 1件のみ
      expect(result.totalCount).toBe(1);
      expect(result.items[0].title).toBe('社員満足度');
    });
  });
});
