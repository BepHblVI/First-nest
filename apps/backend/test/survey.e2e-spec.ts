// test/survey.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { sendGql } from './utils/gql-client';
import { signUpAndLogin } from './utils/auth-client';
import { cleanDatabase } from './utils/db-cleaner';

// テスト用のアンケートを即座に作成して返すヘルパー関数
const createTestSurvey = async (
  app: INestApplication,
  token: string,
  title = 'テスト用アンケート',
  questionsGql = '[{ qtext: "テスト", type: TEXT }]',
) => {
  const res = await sendGql(
    app,
    `
    mutation { createSurvey(input: { title: "${title}", questions: ${questionsGql}, published: true }) {
      id, shareId, tokens { token }, questions { id, type, options { id } }
    } }
  `,
    token,
  );
  return res.body.data.createSurvey;
};

describe('Survey GraphQL API (e2e)', () => {
  let app: INestApplication;
  let validToken: string;
  let validTokenB: string;
  let otherUserSurveyId: number;
  let otherUserSurveyshareId: string;

  // ★ アプリ起動は1回だけ（重い処理なので）
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  // ★ 各テストの前にDBをクリア & 初期データを再構築
  beforeEach(async () => {
    await cleanDatabase(app);

    const userA = await signUpAndLogin(app, 'testuser', 'password123');
    validToken = userA.accessToken;

    const userB = await signUpAndLogin(app, 'testuserB', 'password321');
    validTokenB = userB.accessToken;

    const createRes = await createTestSurvey(
      app,
      validTokenB,
      'ユーザーBの秘密のアンケート',
      `[{qtext:"秘密の質問",type:TEXT}]`,
    );
    otherUserSurveyId = createRes.id;
    otherUserSurveyshareId = createRes.shareId;
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  // ───────────────────────────────────────────
  // セキュリティチェック
  // ───────────────────────────────────────────
  describe('セキュリティチェック', () => {
    test('ログインなしのアンケート作成を弾く', async () => {
      const res = await sendGql(app, `query { getSurvey { id title } }`);
      expect(res.status).toBe(200);
      expect(res.body.errors[0].message).toBe('Unauthorized');
    });

    test('他人のアンケート集計を取得しようとした場合、エラーで弾かれること', async () => {
      const res = await sendGql(
        app,
        `query { getSurveyResults(shareId: "${otherUserSurveyshareId}") { title } }`,
        validToken,
      );
      expect(res.body.errors[0].message).toMatch(
        '他人のアンケートを操作する権限がありません',
      );
    });

    test('GraphQLのネストが深すぎる異常なクエリは、DoS攻撃対策として弾かれること', async () => {
      const res = await sendGql(
        app,
        `query { getSurvey { questions { survey { questions { survey { questions { id } } } } } } }`,
        validToken,
      );
      expect(res.body.errors[0].message).toContain(
        'exceeds maximum operation depth',
      );
    });
  });

  // ───────────────────────────────────────────
  // 認証
  // ───────────────────────────────────────────
  describe('認証', () => {
    test('ログイン成功時、アクセストークン(Body)とリフレッシュトークン(Cookie)が正しく発行されること', async () => {
      const res = await sendGql(
        app,
        `mutation { login(username: "testuserB", password: "password321") { access_token } }`,
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
  // 作成
  // ───────────────────────────────────────────
  describe('作成 (createSurvey)', () => {
    test('タイトル(title)が空文字の場合はバリデーションエラーになること', async () => {
      const res = await sendGql(
        app,
        `mutation { createSurvey(input:{ title: "", questions: [{ qtext: "テスト", type: TEXT }] }) { id } }`,
        validToken,
      );
      expect(JSON.stringify(res.body.errors[0])).toContain(
        'タイトルは必須です',
      );
    });
  });

  // ───────────────────────────────────────────
  // 削除
  // ───────────────────────────────────────────
  describe('削除機能 (deleteSurvey)', () => {
    test('自分のアンケートを正常に削除できること', async () => {
      const { id } = await createTestSurvey(app, validToken, '削除用');
      const res = await sendGql(
        app,
        `mutation { deleteSurvey(id: ${id}) }`,
        validToken,
      );
      expect(res.body.data.deleteSurvey).toBe(true);
    });

    test('他人のアンケートを削除しようとした場合、エラーで弾かれること', async () => {
      const res = await sendGql(
        app,
        `mutation { deleteSurvey(id: ${otherUserSurveyId}) }`,
        validToken,
      );
      expect(res.body.errors[0].message).toMatch(
        '他人のアンケートを操作する権限がありません',
      );
    });

    test('削除したアンケートが一覧から消え、共有リンクにアクセスできないこと', async () => {
      const { id, shareId } = await createTestSurvey(
        app,
        validToken,
        '削除整合性',
      );
      await sendGql(app, `mutation { deleteSurvey(id: ${id}) }`, validToken);

      const listRes = await sendGql(
        app,
        `query { getSurvey { id } }`,
        validToken,
      );
      expect(
        listRes.body.data.getSurvey.map((s: { id: number }) => s.id),
      ).not.toContain(id);

      const accessRes = await sendGql(
        app,
        `query { getSurveyForAnswer(shareId: "${shareId}") { title } }`,
      );
      expect(
        accessRes.body.errors !== undefined ||
          accessRes.body.data?.getSurveyForAnswer === null,
      ).toBe(true);
    });
  });

  // ───────────────────────────────────────────
  // 編集
  // ───────────────────────────────────────────
  describe('編集機能 (editSurvey)', () => {
    test('自分のアンケートを正常に編集できること', async () => {
      const { id } = await createTestSurvey(app, validToken, '編集用');
      const res = await sendGql(
        app,
        `mutation { editSurvey(input:{ id: ${id}, title:"編集後", questions: [{ qtext: "テスト", type: TEXT }]}){ title } }`,
        validToken,
      );
      expect(res.body.data.editSurvey.title).toBe('編集後');
    });

    test('他人のアンケートを編集しようとした場合、エラーで弾かれること', async () => {
      const res = await sendGql(
        app,
        `mutation { editSurvey(input:{ id: ${otherUserSurveyId}, title:"不正", questions: [{ qtext: "T", type: TEXT }]}){ id } }`,
        validToken,
      );
      expect(res.body.errors[0].message).toMatch(
        '他人のアンケートを操作する権限がありません',
      );
    });

    test('質問を増やして編集すると、増えた状態で保存されること', async () => {
      const { id } = await createTestSurvey(app, validToken, '追加');
      const res = await sendGql(
        app,
        `mutation { editSurvey(input: { id: ${id}, title: "追加", questions: [ { qtext: "1", type: TEXT }, { qtext: "2", type: TEXT } ] }) { questions { qtext } } }`,
        validToken,
      );
      expect(res.body.data.editSurvey.questions).toHaveLength(2);
    });

    test('質問を減らして編集すると、古い質問が削除されること', async () => {
      const { id } = await createTestSurvey(
        app,
        validToken,
        '削除',
        `[{ qtext: "残", type: TEXT }, { qtext: "消", type: TEXT }]`,
      );
      const res = await sendGql(
        app,
        `mutation { editSurvey(input: { id: ${id}, title: "削除", questions: [{ qtext: "残", type: TEXT }] }) { questions { qtext } } }`,
        validToken,
      );
      expect(res.body.data.editSurvey.questions).toHaveLength(1);
    });

    test('質問タイプをTEXTからSINGLEに変更し、選択肢が保存されること', async () => {
      const { id } = await createTestSurvey(app, validToken, '変更');
      const res = await sendGql(
        app,
        `mutation { editSurvey(input: { id: ${id}, title: "変更", questions: [{ qtext: "Q", type: SINGLE, options: ["A", "B", "C"] }] }) { questions { type, options { text } } } }`,
        validToken,
      );
      expect(res.body.data.editSurvey.questions[0].type).toBe('SINGLE');
      expect(res.body.data.editSurvey.questions[0].options).toHaveLength(3);
    });

    test('回答済みなら編集できない', async () => {
      const { id, questions } = await createTestSurvey(app, validToken);

      // 回答する
      await sendGql(
        app,
        `mutation { submitSurveyAnswer(input: {
          surveyId: ${id},
          answers: [{ questionId: ${questions[0].id}, text: "test" }]
        }) { id } }`,
      );

      // 編集を試みる → エラー
      const res = await sendGql(
        app,
        `mutation { editSurvey(input: {
          id: ${id},
          title: "編集",
          questions: [{ qtext: "新", type: TEXT }]
        }) { id } }`,
        validToken,
      );
      expect(res.body.errors[0].message).toMatch(/すでに回答/);
    });

    describe('編集時のバリデーションエラー', () => {
      test.each([
        ['タイトルが空文字', '""', `[{ qtext: "質問", type: TEXT }]`],
        [
          '質問テキストが空',
          '"空質問"',
          `[{ qtext: "正常", type: TEXT }, { qtext: "", type: TEXT }]`,
        ],
        [
          '選択肢が空(SINGLE)',
          '"選択肢なし"',
          `[{ qtext: "色", type: SINGLE, options: [] }]`,
        ],
      ])(
        '%sに編集しようとするとエラーになること',
        async (_, title, questions) => {
          const { id } = await createTestSurvey(app, validToken);
          const res = await sendGql(
            app,
            `mutation { editSurvey(input: { id: ${id}, title: ${title}, questions: ${questions} }) { id } }`,
            validToken,
          );
          expect(res.body.errors).toBeDefined();
        },
      );
    });
  });

  // ───────────────────────────────────────────
  // 公開切替
  // ───────────────────────────────────────────
  describe('togglePublished', () => {
    test('公開状態を true に変更できる', async () => {
      const { id } = await createTestSurvey(app, validToken);
      const res = await sendGql(
        app,
        `mutation { togglePublished(id: ${id}, published: true) { published } }`,
        validToken,
      );
      expect(res.body.data.togglePublished.published).toBe(true);
    });

    test('回答済みでも公開状態を変更できる', async () => {
      const { id, questions } = await createTestSurvey(app, validToken);
      await sendGql(
        app,
        `mutation { submitSurveyAnswer(input: {
          surveyId: ${id},
          answers: [{ questionId: ${questions[0].id}, text: "test" }]
        }) { id } }`,
      );

      const res = await sendGql(
        app,
        `mutation { togglePublished(id: ${id}, published: false) { published } }`,
        validToken,
      );
      expect(res.body.data.togglePublished.published).toBe(false);
    });

    test('他人のアンケートの公開状態は変更できない', async () => {
      const { id } = await createTestSurvey(app, validToken);
      const res = await sendGql(
        app,
        `mutation { togglePublished(id: ${id}, published: true) { published } }`,
        validTokenB,
      );
      expect(res.body.errors).toBeDefined();
    });
  });

  // ───────────────────────────────────────────
  // 回答送信と集計
  // ───────────────────────────────────────────
  describe('回答送信と集計', () => {
    test('公開中のアンケートに回答を送信でき、集計結果に反映されること', async () => {
      const { id, shareId, questions } = await createTestSurvey(
        app,
        validToken,
        '回答テスト',
        `[{ qtext: "自由記述", type: TEXT }]`,
      );

      const submitRes = await sendGql(
        app,
        `mutation { submitSurveyAnswer(input: { surveyId: ${id}, answers: [{ questionId: ${questions[0].id}, text: "テスト回答" }] }) { id } }`,
      );
      expect(submitRes.body.errors).toBeUndefined();

      const resultRes = await sendGql(
        app,
        `query { getSurveyResults(shareId: "${shareId}") { totalSubmissions } }`,
        validToken,
      );
      expect(
        resultRes.body.data.getSurveyResults.totalSubmissions,
      ).toBeGreaterThanOrEqual(1);
    });
  });

  // ───────────────────────────────────────────
  // 招待制（PRIVATE）
  // ───────────────────────────────────────────
  describe('招待制アンケート (PRIVATE)', () => {
    let inviteId: number;
    let inviteUuid: string;
    let inviteQuestionId: number;
    let tokens: { token: string }[];

    // ★ describe 単位で招待制アンケートをセットアップ
    beforeEach(async () => {
      const res = await sendGql(
        app,
        `mutation { createSurvey(input: { 
          title: "招待制", 
          questions: [{ qtext: "言語？", type: TEXT }], 
          published: true,
          auth: PRIVATE, 
          tokens: 2 
        }) { 
          id, shareId, tokens { token }, 
          questions { id }
        } }`,
        validToken,
      );
      inviteId = res.body.data.createSurvey.id;
      inviteUuid = res.body.data.createSurvey.shareId;
      inviteQuestionId = res.body.data.createSurvey.questions[0].id;
      tokens = res.body.data.createSurvey.tokens;
    });

    test('指定した数のトークンが発行されること', async () => {
      expect(tokens.length).toBe(2);
    });

    test('作成者以外がアンケートを取得した際、トークン情報が隠蔽されること', async () => {
      const res = await sendGql(
        app,
        `query { getSurveyForAnswer(id: "${inviteUuid}") { tokens { token } } }`,
      );
      expect(res.body.errors).toBeDefined();
    });

    test('有効な招待トークンを使用してアンケートに回答できること', async () => {
      const res = await sendGql(
        app,
        `mutation { submitSurveyAnswer(input: { 
          surveyId: ${inviteId}, 
          token: "${tokens[0].token}", 
          answers: [{ questionId: ${inviteQuestionId}, text: "TS" }] 
        }) { id } }`,
      );
      expect(res.body.errors).toBeUndefined();
    });

    test('使用済みのトークンでは回答が拒否されること', async () => {
      // 1回目：成功
      await sendGql(
        app,
        `mutation { submitSurveyAnswer(input: { 
          surveyId: ${inviteId}, 
          token: "${tokens[0].token}", 
          answers: [{ questionId: ${inviteQuestionId}, text: "TS" }] 
        }) { id } }`,
      );
      // 2回目：失敗
      const res = await sendGql(
        app,
        `mutation { submitSurveyAnswer(input: { 
          surveyId: ${inviteId}, 
          token: "${tokens[0].token}", 
          answers: [{ questionId: ${inviteQuestionId}, text: "PY" }] 
        }) { id } }`,
      );
      expect(res.body.errors[0].message).toMatch(
        /すでに回答済み|無効なトークン/,
      );
    });

    test('無効なトークンでは回答が拒否されること', async () => {
      const res = await sendGql(
        app,
        `mutation { submitSurveyAnswer(input: { 
          surveyId: ${inviteId}, 
          token: "invalid_token_xxx", 
          answers: [{ questionId: ${inviteQuestionId}, text: "PY" }] 
        }) { id } }`,
      );
      expect(res.body.errors[0].message).toMatch(
        '無効なトークン、またはすでに回答済みです',
      );
    });

    test('PRIVATEで作成したアンケートに、トークンなしで回答できないこと', async () => {
      const res = await sendGql(
        app,
        `mutation { submitSurveyAnswer(input: { 
          surveyId: ${inviteId}, 
          answers: [{ questionId: ${inviteQuestionId}, text: "すり抜け" }] 
        }) { id } }`,
      );
      expect(res.body.errors).toBeDefined();
    });

    test('1つの有効なトークンで同時に複数リクエストが来ても1つしか成功しないこと', async () => {
      const requests = Array(3)
        .fill(null)
        .map(() =>
          request(app.getHttpServer())
            .post('/graphql')
            .send({
              query: `mutation { submitSurveyAnswer(input: { 
                surveyId: ${inviteId}, 
                token: "${tokens[1].token}", 
                answers: [{ questionId: ${inviteQuestionId}, text: "アタック" }] 
              }) { id } }`,
            }),
        );
      const responses = await Promise.all(requests);
      expect(responses.filter((r) => !r.body.errors).length).toBe(1);
    });
  });

  // ───────────────────────────────────────────
  // 回答送信のバリデーション
  // ───────────────────────────────────────────
  describe('回答送信のバリデーション', () => {
    describe('SINGLE 質問', () => {
      test('1つだけ選択すれば成功', async () => {
        const { id, questions } = await createTestSurvey(
          app,
          validToken,
          'SINGLE',
          `[{ qtext: "Q", type: SINGLE, options: ["A", "B"] }]`,
        );

        const res = await sendGql(
          app,
          `mutation { submitSurveyAnswer(input: {
            surveyId: ${id},
            answers: [{ questionId: ${questions[0].id}, selectionIds: [${questions[0].options[0].id}] }]
          }) { id } }`,
        );
        expect(res.body.errors).toBeUndefined();
      });

      test('複数選択するとエラー', async () => {
        const { id, questions } = await createTestSurvey(
          app,
          validToken,
          'SINGLE',
          `[{ qtext: "Q", type: SINGLE, options: ["A", "B"] }]`,
        );

        const opts = questions[0].options;
        const res = await sendGql(
          app,
          `mutation { submitSurveyAnswer(input: {
            surveyId: ${id},
            answers: [{ questionId: ${questions[0].id}, selectionIds: [${opts[0].id}, ${opts[1].id}] }]
          }) { id } }`,
        );
        expect(res.body.errors[0].message).toMatch(/1つ/);
      });
    });

    describe('MULTIPLE 質問', () => {
      test('複数選択できる', async () => {
        const { id, questions } = await createTestSurvey(
          app,
          validToken,
          'MULTIPLE',
          `[{ qtext: "Q", type: MULTIPLE, options: ["A", "B", "C"] }]`,
        );

        const opts = questions[0].options;
        const res = await sendGql(
          app,
          `mutation { submitSurveyAnswer(input: {
            surveyId: ${id},
            answers: [{ questionId: ${questions[0].id}, selectionIds: [${opts[0].id}, ${opts[1].id}] }]
          }) { id } }`,
        );
        expect(res.body.errors).toBeUndefined();
      });

      test('重複選択するとエラー', async () => {
        const { id, questions } = await createTestSurvey(
          app,
          validToken,
          'MULTIPLE',
          `[{ qtext: "Q", type: MULTIPLE, options: ["A", "B"] }]`,
        );

        const optId = questions[0].options[0].id;
        const res = await sendGql(
          app,
          `mutation { submitSurveyAnswer(input: {
            surveyId: ${id},
            answers: [{ questionId: ${questions[0].id}, selectionIds: [${optId}, ${optId}] }]
          }) { id } }`,
        );
        expect(res.body.errors[0].message).toMatch(/重複/);
      });
    });

    describe('不正な選択肢ID', () => {
      test('存在しない選択肢IDを送るとエラー', async () => {
        const { id, questions } = await createTestSurvey(
          app,
          validToken,
          'テスト',
          `[{ qtext: "Q", type: SINGLE, options: ["A"] }]`,
        );

        const res = await sendGql(
          app,
          `mutation { submitSurveyAnswer(input: {
            surveyId: ${id},
            answers: [{ questionId: ${questions[0].id}, selectionIds: [99999] }]
          }) { id } }`,
        );
        expect(res.body.errors[0].message).toMatch(/存在しない/);
      });
    });

    describe('必須質問', () => {
      test('必須が空だとエラー', async () => {
        const { id, questions } = await createTestSurvey(
          app,
          validToken,
          '必須',
          `[{ qtext: "Q", type: TEXT, required: true }]`,
        );

        const res = await sendGql(
          app,
          `mutation { submitSurveyAnswer(input: {
            surveyId: ${id},
            answers: [{ questionId: ${questions[0].id}, text: "" }]
          }) { id } }`,
        );
        expect(res.body.errors[0].message).toMatch(/必須/);
      });

      test('任意が空でも成功', async () => {
        const { id, questions } = await createTestSurvey(
          app,
          validToken,
          '任意',
          `[{ qtext: "Q", type: TEXT, required: false }]`,
        );

        const res = await sendGql(
          app,
          `mutation { submitSurveyAnswer(input: {
            surveyId: ${id},
            answers: [{ questionId: ${questions[0].id} }]
          }) { id } }`,
        );
        expect(res.body.errors).toBeUndefined();
      });
    });

    describe('トークン保護', () => {
      test('検証失敗時もトークンは温存される', async () => {
        const createRes = await sendGql(
          app,
          `mutation { createSurvey(input: { 
            title: "トークン保護", 
            questions: [{ qtext: "必須", type: TEXT, required: true }],
            published: true,
            auth: PRIVATE,
            tokens: 1
          }) { 
            id, 
            tokens { token },
            questions { id }
          } }`,
          validToken,
        );
        const surveyId = createRes.body.data.createSurvey.id;
        const tokenStr = createRes.body.data.createSurvey.tokens[0].token;
        const questionId = createRes.body.data.createSurvey.questions[0].id;

        // 必須を空で送信 → 失敗
        const failRes = await sendGql(
          app,
          `mutation { submitSurveyAnswer(input: {
            surveyId: ${surveyId},
            token: "${tokenStr}",
            answers: [{ questionId: ${questionId}, text: "" }]
          }) { id } }`,
        );
        expect(failRes.body.errors).toBeDefined();

        // 同じトークンで正しく送信 → 成功するはず
        const successRes = await sendGql(
          app,
          `mutation { submitSurveyAnswer(input: {
            surveyId: ${surveyId},
            token: "${tokenStr}",
            answers: [{ questionId: ${questionId}, text: "回答" }]
          }) { id } }`,
        );
        expect(successRes.body.errors).toBeUndefined();
      });
    });
  });
});
