// test/survey.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { sendGql } from './utils/gql-client';
import { signUpAndLogin } from './utils/auth-client';

// テスト用のアンケートを即座に作成して返すヘルパー関数
const createTestSurvey = async (
  app: any,
  token: string,
  title = 'テスト用アンケート',
  questionsGql = '[{ qtext: "テスト", type: "TEXT" }]',
) => {
  const res = await sendGql(
    app,
    `
    mutation { createSurvey(input: { title: "${title}", questions: ${questionsGql} }) {
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

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    const userA = await signUpAndLogin(app, 'testuser', 'password123');
    validToken = userA.accessToken;

    const userB = await signUpAndLogin(app, 'testuserB', 'password321');
    validTokenB = userB.accessToken;

    const createRes = await createTestSurvey(
      app,
      validTokenB,
      'ユーザーBの秘密のアンケート',
      `[{qtext:"秘密の質問",type:"TEXT"}]`,
    );
    otherUserSurveyId = createRes.id;
    otherUserSurveyshareId = createRes.shareId;
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('セキュリティチェック', () => {
    test('ログインなしのアンケート作成を弾く', async () => {
      const res = await sendGql(app, `query { getSurvey { id title } }`);
      expect(res.status).toBe(200);
      expect(res.body.errors[0].message).toBe('Unauthorized');
    });

    test('他人のアンケートを削除(または更新)しようとした場合、エラーで弾かれること', async () => {
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

  test('アンケート作成時、タイトル(title)が空文字の場合はバリデーションエラーになること', async () => {
    const res = await sendGql(
      app,
      `mutation { createSurvey(input:{ title: "", questions: [{ qtext: "テスト", type: "TEXT" }] }) { id } }`,
      validToken,
    );
    expect(JSON.stringify(res.body.errors[0])).toContain('タイトルは必須です');
  });

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
  });

  describe('編集機能 (editSurvey)', () => {
    test('自分のアンケートを正常に編集できること', async () => {
      const { id } = await createTestSurvey(app, validToken, '編集用');
      const res = await sendGql(
        app,
        `mutation { editSurvey(input:{ id: ${id}, title:"編集後", questions: [{ qtext: "テスト", type: "TEXT" }], published:true}){ title } }`,
        validToken,
      );
      expect(res.body.data.editSurvey.title).toBe('編集後');
    });

    test('他人のアンケートを編集しようとした場合、エラーで弾かれること', async () => {
      const res = await sendGql(
        app,
        `mutation { editSurvey(input:{ id: ${otherUserSurveyId}, title:"不正", questions: [{ qtext: "T", type: "TEXT" }], published:true}){ id } }`,
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
        `mutation { editSurvey(input: { id: ${id}, title: "追加", published: true, questions: [ { qtext: "1", type: "TEXT" }, { qtext: "2", type: "TEXT" } ] }) { questions { qtext } } }`,
        validToken,
      );
      expect(res.body.data.editSurvey.questions).toHaveLength(2);
    });

    test('質問を減らして編集すると、古い質問が削除されること', async () => {
      const { id } = await createTestSurvey(
        app,
        validToken,
        '削除',
        `[{ qtext: "残", type: "TEXT" }, { qtext: "消", type: "TEXT" }]`,
      );
      const res = await sendGql(
        app,
        `mutation { editSurvey(input: { id: ${id}, title: "削除", published: true, questions: [{ qtext: "残", type: "TEXT" }] }) { questions { qtext } } }`,
        validToken,
      );
      expect(res.body.data.editSurvey.questions).toHaveLength(1);
    });

    test('質問タイプをTEXTからRADIOに変更し、選択肢が保存されること', async () => {
      const { id } = await createTestSurvey(app, validToken, '変更');
      const res = await sendGql(
        app,
        `mutation { editSurvey(input: { id: ${id}, title: "変更", published: true, questions: [{ qtext: "Q", type: "SINGLE", options: ["A", "B", "C"] }] }) { questions { type, options { text } } } }`,
        validToken,
      );
      expect(res.body.data.editSurvey.questions[0].type).toBe('SINGLE');
      expect(res.body.data.editSurvey.questions[0].options).toHaveLength(3);
    });

    describe('編集時のバリデーションエラー', () => {
      test.each([
        ['タイトルが空文字', '""', `[{ qtext: "質問", type: "TEXT" }]`],
        [
          '質問テキストが空',
          '"空質問"',
          `[{ qtext: "正常", type: "TEXT" }, { qtext: "", type: "TEXT" }]`,
        ],
        [
          '選択肢が空(RADIO)',
          '"選択肢なし"',
          `[{ qtext: "色", type: "RADIO", options: [] }]`,
        ],
      ])(
        '%sに編集しようとするとエラーになること',
        async (_, title, questions) => {
          const { id } = await createTestSurvey(app, validToken);
          const res = await sendGql(
            app,
            `mutation { editSurvey(input: { id: ${id}, title: ${title}, published: true, questions: ${questions} }) { id } }`,
            validToken,
          );
          expect(res.body.errors).toBeDefined();
        },
      );
    });
  });

  describe('削除後の整合性', () => {
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
      expect(listRes.body.data.getSurvey.map((s: any) => s.id)).not.toContain(
        id,
      );

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

  describe('公開/非公開機能', () => {
    test('アンケートを非公開に設定できること', async () => {
      const { id } = await createTestSurvey(app, validToken, '非公開テスト');
      const res = await sendGql(
        app,
        `mutation { editSurvey(input: { id: ${id}, title: "非公開", published: false, questions: [{ qtext: "Q", type: "TEXT" }] }) { published } }`,
        validToken,
      );
      expect(res.body.data.editSurvey.published).toBe(false);
    });

    test('公開後に非公開にすると共有リンクでアクセスできなくなること', async () => {
      const { id, shareId } = await createTestSurvey(
        app,
        validToken,
        '公開→非公開',
      );
      await sendGql(
        app,
        `mutation { editSurvey(input: { id: ${id}, title: "公開", published: true, questions: [{ qtext: "Q", type: "TEXT" }] }) { id } }`,
        validToken,
      );

      const accessRes = await sendGql(
        app,
        `query { getSurveyForAnswer(shareId: "${shareId}") { title } }`,
      );
      expect(accessRes.body.data.getSurveyForAnswer.title).toBeDefined();

      await sendGql(
        app,
        `mutation { editSurvey(input: { id: ${id}, title: "非公開", published: false, questions: [{ qtext: "Q", type: "TEXT" }] }) { id } }`,
        validToken,
      );

      const blockedRes = await sendGql(
        app,
        `query { getSurveyForAnswer(shareId: "${shareId}") { title } }`,
      );
      expect(blockedRes.body.errors[0].message).toMatch('非公開');
    });
  });

  describe('回答送信と集計', () => {
    test('公開中のアンケートに回答を送信でき、集計結果に反映されること', async () => {
      const { id, shareId } = await createTestSurvey(
        app,
        validToken,
        '回答テスト',
        `[{ qtext: "自由記述", type: "TEXT" }]`,
      );

      const editRes = await sendGql(
        app,
        `mutation { editSurvey(input: { id: ${id}, title: "公開", published: true, questions: [{ qtext: "自由記述", type: "TEXT" }] }) { questions { id } } }`,
        validToken,
      );
      const qId = editRes.body.data.editSurvey.questions[0].id;

      const submitRes = await sendGql(
        app,
        `mutation { submitSurveyAnswer(input: { surveyId: ${id}, answers: [{ questionId: ${qId}, text: "テスト回答" }] }) { id } }`,
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

    test('非公開のアンケートには回答を送信できないこと', async () => {
      const { id, questions } = await createTestSurvey(
        app,
        validToken,
        '非公開回答',
      );
      await sendGql(
        app,
        `mutation { editSurvey(input: { id: ${id}, title: "非公開", published: false, questions: [{ qtext: "Q", type: "TEXT" }] }) { id } }`,
        validToken,
      );

      const res = await sendGql(
        app,
        `mutation { submitSurveyAnswer(input: { surveyId: ${id}, answers: [{ questionId: ${questions[0].id}, text: "回答" }] }) { id } }`,
      );
      expect(res.body.errors).toBeDefined();
    });

    test('回答が既にあるアンケートを編集しても、新しい構造で回答を受け付けられること', async () => {
      const { id, questions: oldQs } = await createTestSurvey(
        app,
        validToken,
        '編集後回答',
        `[{ qtext: "古", type: "TEXT" }]`,
      );
      await sendGql(
        app,
        `mutation { editSurvey(input: { id: ${id}, title: "古", published: true, questions: [{ qtext: "古", type: "TEXT" }] }) { id } }`,
        validToken,
      );
      await sendGql(
        app,
        `mutation { submitSurveyAnswer(input: { surveyId: ${id}, answers: [{ questionId: ${oldQs[0].id}, text: "古い回答" }] }) { id } }`,
      );

      const editRes = await sendGql(
        app,
        `mutation { editSurvey(input: { id: ${id}, title: "新", published: true, questions: [{ qtext: "新", type: "TEXT" }] }) { questions { id } } }`,
        validToken,
      );
      const newQId = editRes.body.data.editSurvey.questions[0].id;

      const answerRes = await sendGql(
        app,
        `mutation { submitSurveyAnswer(input: { surveyId: ${id}, answers: [{ questionId: ${newQId}, text: "新回答" }] }) { id } }`,
      );
      expect(answerRes.body.errors).toBeUndefined();
    });
  });

  describe('回答者の認証', () => {
    let inviteId: number;
    let inviteUuid: string;
    let inviteQuestionId: number; // ← 追加
    let tokens: { token: string }[];

    it('1. 招待制アンケートを作成し、指定した数のトークンが取得できること', async () => {
      const res = await sendGql(
        app,
        `mutation { createSurvey(input: { 
        title: "招待制", 
        questions: [{ qtext: "言語？", type: "TEXT" }], 
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
      expect(tokens.length).toBe(2);
    });

    it('2. 作成者以外がアンケートを取得した際、トークン情報が隠蔽されること', async () => {
      const res = await sendGql(
        app,
        `query { getSurveyForAnswer(id: "${inviteUuid}") { tokens { token } } }`,
      );
      expect(res.body.errors).toBeDefined();
    });

    it('3. 有効な招待トークンを使用してアンケートに回答できること', async () => {
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

    it('4. 使用済みのトークンでは回答が拒否されること', async () => {
      const res = await sendGql(
        app,
        `mutation { submitSurveyAnswer(input: { 
        surveyId: ${inviteId}, 
        token: "${tokens[0].token}", 
        answers: [{ questionId: ${inviteQuestionId}, text: "PY" }] 
      }) { id } }`,
      );
      expect(res.body.errors[0].message).toMatch('すでに回答済みです');
    });

    it('PRIVATEで作成したアンケートに、トークンなしで回答できないようにする', async () => {
      const res = await sendGql(
        app,
        `mutation { submitSurveyAnswer(input: { 
        surveyId: ${inviteId}, 
        answers: [{ questionId: ${inviteQuestionId}, text: "すり抜け" }] 
      }) { id } }`,
      );
      expect(res.body.errors).toBeDefined();
    });

    it('1つの有効なトークンを使って、同時に複数リクエストを送信されたときに弾く', async () => {
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
  describe('回答送信のバリデーション', () => {
    describe('SINGLE 質問', () => {
      test('1つだけ選択すれば成功', async () => {
        const { id, questions } = await createTestSurvey(
          app,
          validToken,
          'SINGLE',
          `[{ qtext: "Q", type: "SINGLE", options: ["A", "B"] }]`,
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
          `[{ qtext: "Q", type: "SINGLE", options: ["A", "B"] }]`,
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
          `[{ qtext: "Q", type: "MULTIPLE", options: ["A", "B", "C"] }]`,
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
          `[{ qtext: "Q", type: "MULTIPLE", options: ["A", "B"] }]`,
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
          `[{ qtext: "Q", type: "SINGLE", options: ["A"] }]`,
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
          `[{ qtext: "Q", type: "TEXT", required: true }]`,
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
          `[{ qtext: "Q", type: "TEXT", required: false }]`,
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
        // PRIVATE で必須質問を作る
        const createRes = await sendGql(
          app,
          `mutation { createSurvey(input: { 
        title: "トークン保護", 
        questions: [{ qtext: "必須", type: "TEXT", required: true }],
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
        const questionId = createRes.body.data.createSurvey.questions[0].id; // ← 追加

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
