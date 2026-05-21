import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { sendGql, sendGqlOrThrow, expectGqlError } from './utils/gql-client';
import { signUpAndLogin } from './utils/auth-client';
import { cleanDatabase } from './utils/db-cleaner';
import {
  createTestSurvey,
  submitAnswer,
  CreatedSurvey,
} from './utils/survey-helpers';
import { GqlThrottlerGuard } from '../src/auth/guards/gql-throttler.guard';

describe('Survey GraphQL API (e2e)', () => {
  let app: INestApplication;
  let validToken: string;
  let validTokenB: string;
  let otherUserSurvey: CreatedSurvey;

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

    const userA = await signUpAndLogin(app, 'testuser', 'password123');
    validToken = userA.accessToken;

    const userB = await signUpAndLogin(app, 'testuserB', 'password321');
    validTokenB = userB.accessToken;

    otherUserSurvey = await createTestSurvey(app, validTokenB, {
      title: 'ユーザーBの秘密のアンケート',
      questions: [{ qtext: '秘密の質問', type: 'TEXT' }],
    });
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  // ───────────────────────────────────────────
  describe('セキュリティチェック', () => {
    test('ログインなしのアンケート取得を弾く', async () => {
      const res = await sendGql(app, `query { getSurvey { id title } }`);
      expect(res.status).toBe(200);
      expectGqlError(res, 'Unauthorized');
    });

    test('他人のアンケート集計を取得しようとした場合、エラーで弾かれる', async () => {
      const res = await sendGql(
        app,
        `query Get($shareId: String!) {
           getSurveyResults(shareId: $shareId) { title }
         }`,
        validToken,
        { shareId: otherUserSurvey.shareId },
      );
      expectGqlError(res, /他人のアンケートを操作する権限/);
    });

    test('GraphQLのネストが深すぎる異常なクエリは、DoS攻撃対策として弾かれる', async () => {
      const res = await sendGql(
        app,
        `query { getSurvey { questions { survey { questions { survey { questions { id } } } } } } }`,
        validToken,
      );
      expectGqlError(res, /exceeds maximum operation depth/);
    });
  });

  // ───────────────────────────────────────────
  describe('認証', () => {
    test('ログイン成功時、アクセストークン(Body)とリフレッシュトークン(Cookie)が正しく発行される', async () => {
      const res = await sendGql(
        app,
        `mutation Login($username: String!, $password: String!) {
           login(username: $username, password: $password) { access_token }
         }`,
        undefined,
        { username: 'testuserB', password: 'password321' },
      );
      expect(typeof res.body.data.login.access_token).toBe('string');

      const cookies = Array.isArray(res.headers['set-cookie'])
        ? res.headers['set-cookie']
        : [res.headers['set-cookie']];
      const refreshCookie = cookies.find((c: string) =>
        c.startsWith('refresh_token='),
      );
      expect(refreshCookie).toContain('HttpOnly');
    });
  });

  // ───────────────────────────────────────────
  describe('作成 (createSurvey)', () => {
    test('タイトル(title)が空文字の場合はバリデーションエラーになる', async () => {
      const res = await sendGql(
        app,
        `mutation Create($input: CreateSurveyInput!) {
           createSurvey(input: $input) { id }
         }`,
        validToken,
        {
          input: {
            title: '',
            questions: [{ qtext: 'テスト', type: 'TEXT' }],
            published: false,
            auth: 'PUBLIC',
            tokens: 0,
          },
        },
      );
      expectGqlError(res, /タイトルは必須です/);
    });
  });

  // ───────────────────────────────────────────
  describe('削除機能 (deleteSurvey)', () => {
    const DELETE_MUTATION = `mutation Del($id: Int!) { deleteSurvey(id: $id) }`;

    test('自分のアンケートを正常に削除できる', async () => {
      const { id } = await createTestSurvey(app, validToken, {
        title: '削除用',
      });
      const data = await sendGqlOrThrow<{ deleteSurvey: boolean }>(
        app,
        DELETE_MUTATION,
        validToken,
        { id },
      );
      expect(data.deleteSurvey).toBe(true);
    });

    test('他人のアンケートを削除しようとした場合、エラーで弾かれる', async () => {
      const res = await sendGql(app, DELETE_MUTATION, validToken, {
        id: otherUserSurvey.id,
      });
      expectGqlError(res, /他人のアンケートを操作する権限/);
    });

    test('削除したアンケートが一覧から消え、共有リンクにアクセスできない', async () => {
      const { id, shareId } = await createTestSurvey(app, validToken, {
        title: '削除整合性',
      });
      await sendGqlOrThrow(app, DELETE_MUTATION, validToken, { id });

      const list = await sendGqlOrThrow<{ getSurvey: Array<{ id: number }> }>(
        app,
        `query { getSurvey { id } }`,
        validToken,
      );
      expect(list.getSurvey.map((s) => s.id)).not.toContain(id);

      const accessRes = await sendGql(
        app,
        `query Get($shareId: String!) {
           getSurveyForAnswer(shareId: $shareId) { title }
         }`,
        undefined,
        { shareId },
      );
      const isError =
        accessRes.body.errors !== undefined ||
        accessRes.body.data?.getSurveyForAnswer === null;
      expect(isError).toBe(true);
    });
  });

  // ───────────────────────────────────────────
  describe('編集機能 (editSurvey)', () => {
    const EDIT_MUTATION = `
      mutation Edit($input: EditSurveyInput!) {
        editSurvey(input: $input) {
          id
          title
          questions { qtext, type, options { text } }
        }
      }
    `;

    test('自分のアンケートを正常に編集できる', async () => {
      const { id } = await createTestSurvey(app, validToken, {
        title: '編集用',
      });
      const data = await sendGqlOrThrow<{
        editSurvey: { title: string };
      }>(app, EDIT_MUTATION, validToken, {
        input: {
          id,
          title: '編集後',
          questions: [{ qtext: 'テスト', type: 'TEXT' }],
        },
      });
      expect(data.editSurvey.title).toBe('編集後');
    });

    test('他人のアンケートを編集しようとした場合、エラーで弾かれる', async () => {
      const res = await sendGql(app, EDIT_MUTATION, validToken, {
        input: {
          id: otherUserSurvey.id,
          title: '不正',
          questions: [{ qtext: 'T', type: 'TEXT' }],
        },
      });
      expectGqlError(res, /他人のアンケートを操作する権限/);
    });

    test('質問を増やして編集すると、増えた状態で保存される', async () => {
      const { id } = await createTestSurvey(app, validToken, { title: '追加' });
      const data = await sendGqlOrThrow<{
        editSurvey: { questions: unknown[] };
      }>(app, EDIT_MUTATION, validToken, {
        input: {
          id,
          title: '追加',
          questions: [
            { qtext: '1', type: 'TEXT' },
            { qtext: '2', type: 'TEXT' },
          ],
        },
      });
      expect(data.editSurvey.questions).toHaveLength(2);
    });

    test('質問を減らして編集すると、古い質問が削除される', async () => {
      const { id } = await createTestSurvey(app, validToken, {
        title: '削除',
        questions: [
          { qtext: '残', type: 'TEXT' },
          { qtext: '消', type: 'TEXT' },
        ],
      });
      const data = await sendGqlOrThrow<{
        editSurvey: { questions: unknown[] };
      }>(app, EDIT_MUTATION, validToken, {
        input: {
          id,
          title: '削除',
          questions: [{ qtext: '残', type: 'TEXT' }],
        },
      });
      expect(data.editSurvey.questions).toHaveLength(1);
    });

    test('質問タイプをTEXTからSINGLEに変更し、選択肢が保存される', async () => {
      const { id } = await createTestSurvey(app, validToken, { title: '変更' });
      const data = await sendGqlOrThrow<{
        editSurvey: {
          questions: Array<{ type: string; options: unknown[] }>;
        };
      }>(app, EDIT_MUTATION, validToken, {
        input: {
          id,
          title: '変更',
          questions: [{ qtext: 'Q', type: 'SINGLE', options: ['A', 'B', 'C'] }],
        },
      });
      expect(data.editSurvey.questions[0].type).toBe('SINGLE');
      expect(data.editSurvey.questions[0].options).toHaveLength(3);
    });

    test('回答済みなら編集できない', async () => {
      const survey = await createTestSurvey(app, validToken);
      await submitAnswer(app, {
        surveyId: survey.id,
        answers: [{ questionId: survey.questions[0].id, text: 'test' }],
      });

      const res = await sendGql(app, EDIT_MUTATION, validToken, {
        input: {
          id: survey.id,
          title: '編集',
          questions: [{ qtext: '新', type: 'TEXT' }],
        },
      });
      expectGqlError(res, /すでに回答/);
    });

    describe('編集時のバリデーションエラー', () => {
      test.each<{
        name: string;
        title: string;
        questions: any[];
      }>([
        {
          name: 'タイトルが空文字',
          title: '',
          questions: [{ qtext: '質問', type: 'TEXT' }],
        },
        {
          name: '質問テキストが空',
          title: '空質問',
          questions: [
            { qtext: '正常', type: 'TEXT' },
            { qtext: '', type: 'TEXT' },
          ],
        },
        {
          name: '選択肢が空(SINGLE)',
          title: '選択肢なし',
          questions: [{ qtext: '色', type: 'SINGLE', options: [] }],
        },
      ])(
        '$nameに編集しようとするとエラーになる',
        async ({ title, questions }) => {
          const survey = await createTestSurvey(app, validToken);
          const res = await sendGql(app, EDIT_MUTATION, validToken, {
            input: { id: survey.id, title, questions },
          });
          expect(res.body.errors).toBeDefined();
        },
      );
    });
  });

  // ───────────────────────────────────────────
  describe('togglePublished', () => {
    const TOGGLE_MUTATION = `
      mutation Toggle($id: Int!, $published: Boolean!) {
        togglePublished(id: $id, published: $published) { published }
      }
    `;

    test('公開状態を true に変更できる', async () => {
      const { id } = await createTestSurvey(app, validToken);
      const data = await sendGqlOrThrow<{
        togglePublished: { published: boolean };
      }>(app, TOGGLE_MUTATION, validToken, { id, published: true });
      expect(data.togglePublished.published).toBe(true);
    });

    test('回答済みでも公開状態を変更できる', async () => {
      const survey = await createTestSurvey(app, validToken);
      await submitAnswer(app, {
        surveyId: survey.id,
        answers: [{ questionId: survey.questions[0].id, text: 'test' }],
      });

      const data = await sendGqlOrThrow<{
        togglePublished: { published: boolean };
      }>(app, TOGGLE_MUTATION, validToken, {
        id: survey.id,
        published: false,
      });
      expect(data.togglePublished.published).toBe(false);
    });

    test('他人のアンケートの公開状態は変更できない', async () => {
      const { id } = await createTestSurvey(app, validToken);
      const res = await sendGql(app, TOGGLE_MUTATION, validTokenB, {
        id,
        published: true,
      });
      expect(res.body.errors).toBeDefined();
    });
  });

  // ───────────────────────────────────────────
  describe('回答送信と集計', () => {
    test('公開中のアンケートに回答を送信でき、集計結果に反映される', async () => {
      const survey = await createTestSurvey(app, validToken, {
        title: '回答テスト',
        questions: [{ qtext: '自由記述', type: 'TEXT' }],
      });

      const submitRes = await submitAnswer(app, {
        surveyId: survey.id,
        answers: [{ questionId: survey.questions[0].id, text: 'テスト回答' }],
      });
      expect(submitRes.body.errors).toBeUndefined();

      const data = await sendGqlOrThrow<{
        getSurveyResults: { totalSubmissions: number };
      }>(
        app,
        `query Get($shareId: String!) {
           getSurveyResults(shareId: $shareId) { totalSubmissions }
         }`,
        validToken,
        { shareId: survey.shareId },
      );
      expect(data.getSurveyResults.totalSubmissions).toBeGreaterThanOrEqual(1);
    });
  });

  // ───────────────────────────────────────────
  describe('招待制アンケート (PRIVATE)', () => {
    let invite: CreatedSurvey;

    beforeEach(async () => {
      invite = await createTestSurvey(app, validToken, {
        title: '招待制',
        questions: [{ qtext: '言語？', type: 'TEXT' }],
        auth: 'PRIVATE',
        tokens: 2,
      });
    });

    test('指定した数のトークンが発行される', () => {
      expect(invite.tokens).toHaveLength(2);
    });

    test('作成者以外がアンケートを取得した際、トークン情報が隠蔽される', async () => {
      const res = await sendGql(
        app,
        `query Get($id: String!) {
           getSurveyForAnswer(id: $id) { tokens { token } }
         }`,
        undefined,
        { id: invite.shareId },
      );
      expect(res.body.errors).toBeDefined();
    });

    test('有効な招待トークンを使用してアンケートに回答できる', async () => {
      const res = await submitAnswer(app, {
        surveyId: invite.id,
        token: invite.tokens[0].token,
        answers: [{ questionId: invite.questions[0].id, text: 'TS' }],
      });
      expect(res.body.errors).toBeUndefined();
    });

    test('使用済みのトークンでは回答が拒否される', async () => {
      // 1回目: 成功
      await submitAnswer(app, {
        surveyId: invite.id,
        token: invite.tokens[0].token,
        answers: [{ questionId: invite.questions[0].id, text: 'TS' }],
      });

      // 2回目: 失敗
      const res = await submitAnswer(app, {
        surveyId: invite.id,
        token: invite.tokens[0].token,
        answers: [{ questionId: invite.questions[0].id, text: 'PY' }],
      });
      expectGqlError(res, /すでに回答済み|無効なトークン/);
    });

    test('無効なトークンでは回答が拒否される', async () => {
      const res = await submitAnswer(app, {
        surveyId: invite.id,
        token: 'invalid_token_xxx',
        answers: [{ questionId: invite.questions[0].id, text: 'PY' }],
      });
      expectGqlError(res, /無効なトークン、またはすでに回答済み/);
    });

    test('PRIVATEで作成したアンケートに、トークンなしで回答できない', async () => {
      const res = await submitAnswer(app, {
        surveyId: invite.id,
        answers: [{ questionId: invite.questions[0].id, text: 'すり抜け' }],
      });
      expect(res.body.errors).toBeDefined();
    });

    test('1つの有効なトークンで同時に複数リクエストが来ても1つしか成功しない', async () => {
      const responses = await Promise.all(
        Array.from({ length: 3 }, () =>
          submitAnswer(app, {
            surveyId: invite.id,
            token: invite.tokens[1].token,
            answers: [{ questionId: invite.questions[0].id, text: 'アタック' }],
          }),
        ),
      );
      const successes = responses.filter((r) => !r.body.errors);
      expect(successes).toHaveLength(1);
    });
  });

  // ───────────────────────────────────────────
  describe('回答送信のバリデーション', () => {
    describe('SINGLE 質問', () => {
      test('1つだけ選択すれば成功', async () => {
        const survey = await createTestSurvey(app, validToken, {
          questions: [{ qtext: 'Q', type: 'SINGLE', options: ['A', 'B'] }],
        });
        const res = await submitAnswer(app, {
          surveyId: survey.id,
          answers: [
            {
              questionId: survey.questions[0].id,
              selectionIds: [survey.questions[0].options[0].id],
            },
          ],
        });
        expect(res.body.errors).toBeUndefined();
      });

      test('複数選択するとエラー', async () => {
        const survey = await createTestSurvey(app, validToken, {
          questions: [{ qtext: 'Q', type: 'SINGLE', options: ['A', 'B'] }],
        });
        const opts = survey.questions[0].options;
        const res = await submitAnswer(app, {
          surveyId: survey.id,
          answers: [
            {
              questionId: survey.questions[0].id,
              selectionIds: [opts[0].id, opts[1].id],
            },
          ],
        });
        expectGqlError(res, /1つ/);
      });
    });

    describe('MULTIPLE 質問', () => {
      test('複数選択できる', async () => {
        const survey = await createTestSurvey(app, validToken, {
          questions: [
            { qtext: 'Q', type: 'MULTIPLE', options: ['A', 'B', 'C'] },
          ],
        });
        const opts = survey.questions[0].options;
        const res = await submitAnswer(app, {
          surveyId: survey.id,
          answers: [
            {
              questionId: survey.questions[0].id,
              selectionIds: [opts[0].id, opts[1].id],
            },
          ],
        });
        expect(res.body.errors).toBeUndefined();
      });

      test('重複選択するとエラー', async () => {
        const survey = await createTestSurvey(app, validToken, {
          questions: [{ qtext: 'Q', type: 'MULTIPLE', options: ['A', 'B'] }],
        });
        const optId = survey.questions[0].options[0].id;
        const res = await submitAnswer(app, {
          surveyId: survey.id,
          answers: [
            {
              questionId: survey.questions[0].id,
              selectionIds: [optId, optId],
            },
          ],
        });
        expectGqlError(res, /重複/);
      });
    });

    test('存在しない選択肢IDを送るとエラー', async () => {
      const survey = await createTestSurvey(app, validToken, {
        questions: [{ qtext: 'Q', type: 'SINGLE', options: ['A'] }],
      });
      const res = await submitAnswer(app, {
        surveyId: survey.id,
        answers: [
          { questionId: survey.questions[0].id, selectionIds: [99999] },
        ],
      });
      expectGqlError(res, /存在しない/);
    });

    describe('必須質問', () => {
      test('必須が空だとエラー', async () => {
        const survey = await createTestSurvey(app, validToken, {
          questions: [{ qtext: 'Q', type: 'TEXT', required: true }],
        });
        const res = await submitAnswer(app, {
          surveyId: survey.id,
          answers: [{ questionId: survey.questions[0].id, text: '' }],
        });
        expectGqlError(res, /必須/);
      });

      test('任意が空でも成功', async () => {
        const survey = await createTestSurvey(app, validToken, {
          questions: [{ qtext: 'Q', type: 'TEXT', required: false }],
        });
        const res = await submitAnswer(app, {
          surveyId: survey.id,
          answers: [{ questionId: survey.questions[0].id }],
        });
        expect(res.body.errors).toBeUndefined();
      });
    });

    test('検証失敗時もトークンは温存される', async () => {
      const survey = await createTestSurvey(app, validToken, {
        title: 'トークン保護',
        questions: [{ qtext: '必須', type: 'TEXT', required: true }],
        auth: 'PRIVATE',
        tokens: 1,
      });

      // 必須を空で送信 → 失敗
      const failRes = await submitAnswer(app, {
        surveyId: survey.id,
        token: survey.tokens[0].token,
        answers: [{ questionId: survey.questions[0].id, text: '' }],
      });
      expect(failRes.body.errors).toBeDefined();

      // 同じトークンで正しく送信 → 成功するはず(トークンは温存されている)
      const successRes = await submitAnswer(app, {
        surveyId: survey.id,
        token: survey.tokens[0].token,
        answers: [{ questionId: survey.questions[0].id, text: '回答' }],
      });
      expect(successRes.body.errors).toBeUndefined();
    });
  });
});
