// test/survey.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { sendGql } from './utils/gql-client';

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

    app = moduleFixture.createNestApplication({
      logger: false,
    });
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    await sendGql(
      app,
      `
        mutation {
          signUp(username: "testuser", password: "password123") {
            id
          }
        }
      `,
    );

    const loginResponse = await sendGql(
      app,
      `
        mutation {
          login(username: "testuser", password: "password123") {
            access_token
          }
        }
      `,
    );

    validToken = loginResponse.body.data.login.access_token;

    await sendGql(
      app,
      `
        mutation {
          signUp(username: "testuserB", password: "password321") {
            id
          }
        }
      `,
    );

    const loginB = await sendGql(
      app,
      `
        mutation {
          login(username: "testuserB", password: "password321") {
            access_token
          }
        }
      `,
    );

    if (loginB.body.errors) {
      console.error(
        '🚨 loginB エラー:',
        JSON.stringify(loginB.body.errors, null, 2),
      );
    } else {
      validTokenB = loginB.body.data.login.access_token;
    }

    const createSurveyResponse = await sendGql(
      app,
      `
        mutation {
          createSurvey(input:{title: "ユーザーBの秘密のアンケート",questions:[{qtext:"秘密の質問",type:"TEXT"}]}) {
            id
            shareId
          }
        }
      `,
      validTokenB,
    );

    if (createSurveyResponse.body.errors) {
      console.error(
        '🚨 createSurvey エラー:',
        JSON.stringify(createSurveyResponse.body.errors, null, 2),
      );
    }
    otherUserSurveyshareId =
      createSurveyResponse.body.data.createSurvey.shareId;
    otherUserSurveyId = createSurveyResponse.body.data.createSurvey.id;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('セキュリティチェック', () => {
    test('ログインなしのアンケート作成を弾く', async () => {
      const response = await sendGql(
        app,
        `
          query {
            getSurvey {
              id
              title
            }
          }
        `,
      );
      expect(response.status).toBe(200);
      expect(response.body.errors[0].message).toBe('Unauthorized');
    });

    test('他人のアンケートを削除(または更新)しようとした場合、エラーで弾かれること', async () => {
      const response = await sendGql(
        app,
        `
          query {
            getSurveyResults(shareId: "${otherUserSurveyshareId}") {
              title
              totalSubmissions
            }
          }
        `,
        validToken,
      );

      expect(response.body.errors).toBeDefined();
      expect(response.body.data).toBeNull();
      const errorMessage = response.body.errors[0].message;
      expect(errorMessage).toMatch(
        '他人のアンケートを操作する権限がありません',
      );
    });

    test('GraphQLのネストが深すぎる異常なクエリは、DoS攻撃対策として弾かれること', async () => {
      const response = await sendGql(
        app,
        `
          query {
            getSurvey {
              questions {
                survey {
                  questions {
                    survey {
                      questions {
                        id
                      }
                    }
                  }
                }
              }
            }
          }
        `,
        validToken,
      );

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain(
        'exceeds maximum operation depth',
      );
    });
  });

  test('ログイン成功時、アクセストークン(Body)とリフレッシュトークン(Cookie)が正しく発行されること', async () => {
    const response = await sendGql(
      app,
      `
        mutation {
          login(username: "testuserB", password: "password321") {
            access_token
          }
        }
      `,
    );

    expect(response.body.errors).toBeUndefined();

    const bodyToken = response.body.data.login.access_token;
    expect(bodyToken).toBeDefined();
    expect(typeof bodyToken).toBe('string');

    const rawCookies = response.headers['set-cookie'];
    expect(rawCookies).toBeDefined();

    const cookies = Array.isArray(rawCookies) ? rawCookies : [rawCookies];
    const refreshTokenCookie = cookies.find((cookie: string) =>
      cookie.startsWith('refresh_token='),
    );

    expect(refreshTokenCookie).toBeDefined();
    expect(refreshTokenCookie).toContain('HttpOnly');
  });

  test('アンケート作成時、タイトル(title)が空文字の場合はバリデーションエラーになること', async () => {
    const response = await sendGql(
      app,
      `
        mutation {
          createSurvey(input:{
            title: "", questions: [{ qtext: "テスト", type: "TEXT" }]
          }) {
            id
          }
        }
      `,
      validToken,
    );

    expect(response.body.errors).toBeDefined();
    expect(response.body.data).toBeNull();

    const errorStr = JSON.stringify(response.body.errors[0]);
    expect(errorStr).toContain('Bad Request');
    expect(errorStr).toContain('タイトルは必須です');
  });

  describe('削除機能 (deleteSurvey)', () => {
    test('自分のアンケートを正常に削除できること', async () => {
      const createResponse = await sendGql(
        app,
        `
          mutation {
            createSurvey(input: { title: "削除用アンケート", questions: [{ qtext: "テスト", type: "TEXT" }]}) {
              id
            }
          }
        `,
        validToken,
      );
      const surveyId = createResponse.body.data.createSurvey.id;

      const deleteResponse = await sendGql(
        app,
        `
          mutation {
            deleteSurvey(id: ${surveyId})
          }
        `,
        validToken,
      );

      expect(deleteResponse.body.errors).toBeUndefined();
      expect(deleteResponse.body.data.deleteSurvey).toBe(true);
    });

    test('他人のアンケートを削除しようとした場合、エラーで弾かれること', async () => {
      const response = await sendGql(
        app,
        `
          mutation {
            deleteSurvey(id: ${otherUserSurveyId})
          }
        `,
        validToken,
      );

      expect(response.body.errors).toBeDefined();
      const errorMessage = response.body.errors[0].message;
      expect(errorMessage).toMatch(
        '他人のアンケートを操作する権限がありません',
      );
    });
  });

  describe('編集機能 (editSurvey)', () => {
    test('自分のアンケートを正常に編集できること', async () => {
      const createResponse = await sendGql(
        app,
        `
          mutation {
            createSurvey(input: { title: "編集用アンケート", questions: [{ qtext: "テスト", type: "TEXT" }]}) {
              id
            }
          }
        `,
        validToken,
      );
      const surveyId = createResponse.body.data.createSurvey.id;

      const editResponse = await sendGql(
        app,
        `
          mutation {
            editSurvey(input:{ id: ${surveyId}, title:"編集後アンケート", questions: [{ qtext: "テスト2", type: "TEXT" }], published:true}){
              id
              title
            }
          }
        `,
        validToken,
      );

      expect(editResponse.body.errors).toBeUndefined();
      expect(editResponse.body.data.editSurvey.id).toBe(surveyId);
      expect(editResponse.body.data.editSurvey.title).toBe('編集後アンケート');
    });

    test('他人のアンケートを編集しようとした場合、エラーで弾かれること', async () => {
      const response = await sendGql(
        app,
        `
          mutation {
            editSurvey(input:{ id: ${otherUserSurveyId}, title:"編集後アンケート", questions: [{ qtext: "テスト2", type: "TEXT" }], published:true}){
              id
              title
            }
          }
        `,
        validToken,
      );

      expect(response.body.errors).toBeDefined();
      const errorMessage = response.body.errors[0].message;
      expect(errorMessage).toMatch(
        '他人のアンケートを操作する権限がありません',
      );
    });

    test('質問を増やして編集すると、増えた状態で保存されること', async () => {
      const createResponse = await sendGql(
        app,
        `
          mutation {
            createSurvey(input: {
              title: "質問追加テスト",
              questions: [{ qtext: "質問1", type: "TEXT" }]
            }) {
              id
            }
          }
        `,
        validToken,
      );
      const surveyId = createResponse.body.data.createSurvey.id;

      const editResponse = await sendGql(
        app,
        `
          mutation {
            editSurvey(input: {
              id: ${surveyId},
              title: "質問追加テスト",
              questions: [
                { qtext: "質問1改", type: "TEXT" },
                { qtext: "質問2新規", type: "TEXT" },
                { qtext: "質問3新規", type: "TEXT" }
              ], published: true
            }) {
              id
              questions { qtext }
            }
          }
        `,
        validToken,
      );

      expect(editResponse.body.errors).toBeUndefined();
      const questions = editResponse.body.data.editSurvey.questions;
      expect(questions).toHaveLength(3);
      expect(questions[0].qtext).toBe('質問1改');
      expect(questions[1].qtext).toBe('質問2新規');
      expect(questions[2].qtext).toBe('質問3新規');
    });

    test('質問を減らして編集すると、古い質問が削除されること', async () => {
      const createResponse = await sendGql(
        app,
        `
          mutation {
            createSurvey(input: {
              title: "質問削除テスト",
              questions: [
                { qtext: "残す質問", type: "TEXT" },
                { qtext: "消える質問A", type: "TEXT" },
                { qtext: "消える質問B", type: "TEXT" }
              ]
            }) {
              id
            }
          }
        `,
        validToken,
      );
      const surveyId = createResponse.body.data.createSurvey.id;

      const editResponse = await sendGql(
        app,
        `
          mutation {
            editSurvey(input: {
              id: ${surveyId},
              title: "質問削除テスト",
              questions: [
                { qtext: "残す質問（編集済み）", type: "TEXT" }
              ], published: true
            }) {
              id
              questions { qtext }
            }
          }
        `,
        validToken,
      );

      expect(editResponse.body.errors).toBeUndefined();
      const questions = editResponse.body.data.editSurvey.questions;
      expect(questions).toHaveLength(1);
      expect(questions[0].qtext).toBe('残す質問（編集済み）');
    });

    test('質問タイプをTEXTからRADIOに変更し、選択肢が保存されること', async () => {
      const createResponse = await sendGql(
        app,
        `
          mutation {
            createSurvey(input: {
              title: "タイプ変更テスト",
              questions: [{ qtext: "好きな食べ物は？", type: "TEXT" }]
            }) {
              id
            }
          }
        `,
        validToken,
      );
      const surveyId = createResponse.body.data.createSurvey.id;

      const editResponse = await sendGql(
        app,
        `
          mutation {
            editSurvey(input: {
              id: ${surveyId},
              title: "タイプ変更テスト",
              questions: [{
                qtext: "好きな食べ物は？",
                type: "SINGLE",
                options: ["寿司", "ラーメン", "カレー"]
              }], published: true
            }) {
              id
              questions {
                qtext
                type
                options { text }
              }
            }
          }
        `,
        validToken,
      );

      expect(editResponse.body.errors).toBeUndefined();
      const q = editResponse.body.data.editSurvey.questions[0];
      expect(q.type).toBe('SINGLE');
      expect(q.options).toHaveLength(3);
      expect(q.options.map((o: any) => o.text)).toEqual([
        '寿司',
        'ラーメン',
        'カレー',
      ]);
    });

    test('タイトルだけを変更し、質問はそのまま維持されること', async () => {
      const createResponse = await sendGql(
        app,
        `
          mutation {
            createSurvey(input: {
              title: "元のタイトル",
              questions: [{ qtext: "変わらない質問", type: "TEXT" }]
            }) {
              id
              questions { qtext }
            }
          }
        `,
        validToken,
      );
      const surveyId = createResponse.body.data.createSurvey.id;

      const editResponse = await sendGql(
        app,
        `
          mutation {
            editSurvey(input: {
              id: ${surveyId},
              title: "新しいタイトル",
              questions: [{ qtext: "変わらない質問", type: "TEXT" }],
              published: true
            }) {
              id
              title
              questions { qtext }
            }
          }
        `,
        validToken,
      );

      expect(editResponse.body.errors).toBeUndefined();
      expect(editResponse.body.data.editSurvey.title).toBe('新しいタイトル');
      expect(editResponse.body.data.editSurvey.questions[0].qtext).toBe(
        '変わらない質問',
      );
    });

    test('タイトルを空文字に編集しようとするとエラーになること', async () => {
      const createResponse = await sendGql(
        app,
        `
          mutation {
            createSurvey(input: {
              title: "バリデーションテスト",
              questions: [{ qtext: "質問", type: "TEXT" }]
            }) {
              id
            }
          }
        `,
        validToken,
      );
      const surveyId = createResponse.body.data.createSurvey.id;

      const editResponse = await sendGql(
        app,
        `
          mutation {
            editSurvey(input: {
              id: ${surveyId},
              title: "",
              questions: [{ qtext: "質問", type: "TEXT" }],
              published: true
            }) {
              id
            }
          }
        `,
        validToken,
      );

      expect(editResponse.body.errors).toBeDefined();
    });

    test('質問テキストが空の質問を含めて編集するとエラーになること', async () => {
      const createResponse = await sendGql(
        app,
        `
          mutation {
            createSurvey(input: {
              title: "空質問テスト",
              questions: [{ qtext: "質問", type: "TEXT" }]
            }) {
              id
            }
          }
        `,
        validToken,
      );
      const surveyId = createResponse.body.data.createSurvey.id;

      const editResponse = await sendGql(
        app,
        `
          mutation {
            editSurvey(input: {
              id: ${surveyId},
              title: "空質問テスト",
              questions: [
                { qtext: "正常な質問", type: "TEXT" },
                { qtext: "", type: "TEXT" }
              ], published: true
            }) {
              id
            }
          }
        `,
        validToken,
      );

      expect(editResponse.body.errors).toBeDefined();
    });

    test('選択式(RADIO)なのに選択肢が空の場合エラーになること', async () => {
      const createResponse = await sendGql(
        app,
        `
          mutation {
            createSurvey(input: {
              title: "選択肢なしテスト",
              questions: [{ qtext: "質問", type: "TEXT" }]
            }) {
              id
            }
          }
        `,
        validToken,
      );
      const surveyId = createResponse.body.data.createSurvey.id;

      const editResponse = await sendGql(
        app,
        `
          mutation {
            editSurvey(input: {
              id: ${surveyId},
              title: "選択肢なしテスト",
              questions: [{ qtext: "好きな色は？", type: "RADIO", options: [] }],
              published: true
            }) {
              id
            }
          }
        `,
        validToken,
      );

      expect(editResponse.body.errors).toBeDefined();
    });
  });

  describe('削除後の整合性', () => {
    test('削除したアンケートが一覧から消えていること', async () => {
      const createResponse = await sendGql(
        app,
        `
          mutation {
            createSurvey(input: {
              title: "削除整合性テスト",
              questions: [{ qtext: "質問", type: "TEXT" }]
            }) {
              id
            }
          }
        `,
        validToken,
      );
      const surveyId = createResponse.body.data.createSurvey.id;

      await sendGql(
        app,
        `
          mutation {
            deleteSurvey(id: ${surveyId})
          }
        `,
        validToken,
      );

      const listResponse = await sendGql(
        app,
        `
          query {
            getSurvey { id title }
          }
        `,
        validToken,
      );

      const ids = listResponse.body.data.getSurvey.map((s: any) => s.id);
      expect(ids).not.toContain(surveyId);
    });

    test('削除したアンケートの共有リンクにアクセスできないこと', async () => {
      const createResponse = await sendGql(
        app,
        `
          mutation {
            createSurvey(input: {
              title: "削除リンクテスト",
              questions: [{ qtext: "質問", type: "TEXT" }]
            }) {
              id
              shareId
            }
          }
        `,
        validToken,
      );
      const surveyId = createResponse.body.data.createSurvey.id;
      const shareId = createResponse.body.data.createSurvey.shareId;

      await sendGql(
        app,
        `
          mutation {
            deleteSurvey(id: ${surveyId})
          }
        `,
        validToken,
      );

      const answerResponse = await sendGql(
        app,
        `
          query {
            getSurveyForAnswer(shareId: "${shareId}") {
              title
            }
          }
        `,
      );

      const hasError = answerResponse.body.errors !== undefined;
      const isNull = answerResponse.body.data?.getSurveyForAnswer === null;
      expect(hasError || isNull).toBe(true);
    });
  });

  describe('公開/非公開機能', () => {
    test('アンケートを非公開に設定できること', async () => {
      const createResponse = await sendGql(
        app,
        `
          mutation {
            createSurvey(input: {
              title: "公開テスト",
              questions: [{ qtext: "質問", type: "TEXT" }]
            }) {
              id
              published
            }
          }
        `,
        validToken,
      );
      const surveyId = createResponse.body.data.createSurvey.id;

      const editResponse = await sendGql(
        app,
        `
          mutation {
            editSurvey(input: {
              id: ${surveyId},
              title: "非公開テスト",
              questions: [{ qtext: "質問", type: "TEXT" }],
              published: false
            }) {
              id
              published
            }
          }
        `,
        validToken,
      );

      expect(editResponse.body.errors).toBeUndefined();
      expect(editResponse.body.data.editSurvey.published).toBe(false);
    });

    test('公開後に非公開にすると共有リンクでアクセスできなくなること', async () => {
      const createResponse = await sendGql(
        app,
        `
          mutation {
            createSurvey(input: {
              title: "公開→非公開テスト",
              questions: [{ qtext: "質問", type: "TEXT" }]
            }) {
              id
              shareId
            }
          }
        `,
        validToken,
      );
      const surveyId = createResponse.body.data.createSurvey.id;
      const shareId = createResponse.body.data.createSurvey.shareId;

      await sendGql(
        app,
        `
          mutation {
            editSurvey(input: {
              id: ${surveyId},
              title: "公開→非公開テスト",
              questions: [{ qtext: "質問", type: "TEXT" }],
              published: true
            }) {
              id
            }
          }
        `,
        validToken,
      );

      const accessResponse = await sendGql(
        app,
        `
          query {
            getSurveyForAnswer(shareId: "${shareId}") {
              title
            }
          }
        `,
      );
      expect(accessResponse.body.data.getSurveyForAnswer.title).toBe(
        '公開→非公開テスト',
      );

      await sendGql(
        app,
        `
          mutation {
            editSurvey(input: {
              id: ${surveyId},
              title: "公開→非公開テスト",
              questions: [{ qtext: "質問", type: "TEXT" }],
              published: false
            }) {
              id
            }
          }
        `,
        validToken,
      );

      const blockedResponse = await sendGql(
        app,
        `
          query {
            getSurveyForAnswer(shareId: "${shareId}") {
              title
            }
          }
        `,
      );
      expect(blockedResponse.body.errors).toBeDefined();
      expect(blockedResponse.body.errors[0].message).toMatch('非公開');
    });

    test('他人のアンケートの公開設定を変更できないこと', async () => {
      const response = await sendGql(
        app,
        `
          mutation {
            editSurvey(input: {
              id: ${otherUserSurveyId},
              title: "不正な公開変更",
              questions: [{ qtext: "質問", type: "TEXT" }],
              published: true
            }) {
              id
            }
          }
        `,
        validToken,
      );

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toMatch(
        '他人のアンケートを操作する権限がありません',
      );
    });
  });

  describe('回答送信 (submitSurveyAnswer)', () => {
    let publicSurveyId: number;
    let publicShareId: string;
    let questionIds: number[];
    let optionIds: number[];

    beforeAll(async () => {
      const createResponse = await sendGql(
        app,
        `
          mutation {
            createSurvey(input: {
              title: "回答テスト用アンケート",
              questions: [
                { qtext: "自由記述の質問", type: "TEXT" },
                { qtext: "選択式の質問", type: "SINGLE", options: ["選択肢A", "選択肢B", "選択肢C"] }
              ]
            }) {
              id
              shareId
              questions { id type options{ id }}
            }
          }
        `,
        validToken,
      );

      publicSurveyId = createResponse.body.data.createSurvey.id;
      publicShareId = createResponse.body.data.createSurvey.shareId;
      questionIds = createResponse.body.data.createSurvey.questions.map(
        (q: any) => q.id,
      );
      optionIds =
        createResponse.body.data.createSurvey.questions[1].options.map(
          (o: any) => o.id,
        );
    });

    test('公開中のアンケートに回答を送信できること', async () => {
      const response = await sendGql(
        app,
        `
          mutation {
            submitSurveyAnswer(input: {
              surveyId: ${publicSurveyId},
              answers: [
                { questionId: ${questionIds[0]}, text: "テスト回答です" },
                { questionId: ${questionIds[1]}, selectionIds: ${optionIds[0]} }
              ]
            }) {
              id
              submitted_at
            }
          }
        `,
      );

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.submitSurveyAnswer.id).toBeDefined();
      expect(response.body.data.submitSurveyAnswer.submitted_at).toBeDefined();
    });

    test('非公開のアンケートには回答を送信できないこと', async () => {
      const editResponse = await sendGql(
        app,
        `
          mutation {
            editSurvey(input: {
              id: ${publicSurveyId},
              title: "非公開回答テスト",
              questions: [{ qtext: "質問", type: "TEXT" }],
              published: false
            }) {
              id
              questions { id }
            }
          }
        `,
        validToken,
      );
      const surveyId = editResponse.body.data.editSurvey.id;
      const qId = editResponse.body.data.editSurvey.questions[0].id;

      const response = await sendGql(
        app,
        `
          mutation {
            submitSurveyAnswer(input: {
              surveyId: ${surveyId},
              answers: [
                { questionId: ${qId}, text: "回答" }
              ]
            }) {
              id
            }
          }
        `,
      );

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('集計結果 (getSurveyResults)', () => {
    test('自分のアンケートの集計結果を取得できること', async () => {
      const createResponse = await sendGql(
        app,
        `
          mutation {
            createSurvey(input: {
              title: "集計テスト",
              questions: [{ qtext: "感想", type: "TEXT" }]
            }) {
              id
              shareId
              questions { id }
            }
          }
        `,
        validToken,
      );
      const surveyId = createResponse.body.data.createSurvey.id;
      const shareId = createResponse.body.data.createSurvey.shareId;
      const qId = createResponse.body.data.createSurvey.questions[0].id;

      await sendGql(
        app,
        `
          mutation {
            editSurvey(input: {
              id: ${surveyId},
              title: "集計テスト",
              questions: [{ qtext: "感想", type: "TEXT" }],
              published: true
            }) {
              id
            }
          }
        `,
        validToken,
      );

      await sendGql(
        app,
        `
          mutation {
            submitSurveyAnswer(input: {
              surveyId: ${surveyId},
              answers: [{ questionId: ${qId}, text: "とても良かった" }]
            }) {
              id
            }
          }
        `,
      );

      const resultResponse = await sendGql(
        app,
        `
          query {
            getSurveyResults(shareId: "${shareId}") {
              title
              totalSubmissions
            }
          }
        `,
        validToken,
      );

      expect(resultResponse.body.errors).toBeUndefined();
      expect(resultResponse.body.data.getSurveyResults.title).toBe(
        '集計テスト',
      );
      expect(
        resultResponse.body.data.getSurveyResults.totalSubmissions,
      ).toBeGreaterThanOrEqual(1);
    });

    test('他人のアンケートの集計結果は取得できないこと', async () => {
      const response = await sendGql(
        app,
        `
          query {
            getSurveyResults(shareId: "${otherUserSurveyshareId}") {
              title
              totalSubmissions
            }
          }
        `,
        validToken,
      );

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toMatch(
        '他人のアンケートを操作する権限がありません',
      );
    });
  });

  describe('編集と回答の整合性', () => {
    test('回答が既にあるアンケートを編集しても、新しい構造で回答を受け付けられること', async () => {
      const createResponse = await sendGql(
        app,
        `
          mutation {
            createSurvey(input: {
              title: "編集後回答テスト",
              questions: [{ qtext: "古い質問", type: "TEXT" }]
            }) {
              id
              shareId
              questions { id }
            }
          }
        `,
        validToken,
      );
      const surveyId = createResponse.body.data.createSurvey.id;
      const oldQId = createResponse.body.data.createSurvey.questions[0].id;

      await sendGql(
        app,
        `
          mutation {
            editSurvey(input: {
              id: ${surveyId},
              title: "編集後回答テスト",
              questions: [{ qtext: "古い質問", type: "TEXT" }],
              published: true
            }) { id }
          }
        `,
        validToken,
      );

      await sendGql(
        app,
        `
          mutation {
            submitSurveyAnswer(input: {
              surveyId: ${surveyId},
              answers: [{ questionId: ${oldQId}, text: "古い回答" }]
            }) { id }
          }
        `,
      );

      const editResponse = await sendGql(
        app,
        `
          mutation {
            editSurvey(input: {
              id: ${surveyId},
              title: "編集後回答テスト",
              questions: [
                { qtext: "新しい質問A", type: "TEXT" },
                { qtext: "新しい質問B", type: "TEXT" }
              ],
              published: true
            }) {
              id
              questions { id qtext }
            }
          }
        `,
        validToken,
      );

      const newQuestionIds = editResponse.body.data.editSurvey.questions.map(
        (q: any) => q.id,
      );

      const answerResponse = await sendGql(
        app,
        `
          mutation {
            submitSurveyAnswer(input: {
              surveyId: ${surveyId},
              answers: [
                { questionId: ${newQuestionIds[0]}, text: "新しい回答A" },
                { questionId: ${newQuestionIds[1]}, text: "新しい回答B" }
              ]
            }) {
              id
              submitted_at
            }
          }
        `,
      );

      expect(answerResponse.body.errors).toBeUndefined();
      expect(answerResponse.body.data.submitSurveyAnswer.id).toBeDefined();
    });
  });

  describe('回答者の認証', () => {
    let inviteSurveyId: number;
    let inviteSurveyuuid: string;
    let generatedTokens: { token: string }[];

    it('1. 招待制アンケートを作成し、指定した数のトークンが取得できること', async () => {
      const createRes = await sendGql(
        app,
        `
          mutation {
            createSurvey(input: {
              title: "招待者限定アンケート",
              questions: [{ qtext: "好きな言語は？", type: "TEXT" }],
              auth: "PRIVATE",
              tokens: 2
            }) {
              id
              tokens {
                token
              }
            }
          }
        `,
        validToken,
      );
      const data = createRes.body.data.createSurvey;
      expect(data.id).toBeDefined();
      expect(data.tokens).toBeDefined();
      expect(data.tokens.length).toBe(2);

      inviteSurveyId = data.id;
      inviteSurveyuuid = data.shareId;
      generatedTokens = data.tokens;
    });

    it('2. 作成者以外がアンケートを取得した際、トークン情報が隠蔽されること', async () => {
      const fetchRes = await sendGql(
        app,
        `
          query {
            getSurveyForAnswer(id: "${inviteSurveyuuid}") {
              title
              tokens {
                token
              }
            }
          }
        `,
      );

      expect(fetchRes.body.errors).toBeDefined();
    });

    it('3. 有効な招待トークンを使用してアンケートに回答できること', async () => {
      const validInviteToken = generatedTokens[0].token;

      const submitRes = await sendGql(
        app,
        `
          mutation {
            submitSurveyAnswer(input: {
              surveyId: ${inviteSurveyId},
              token: "${validInviteToken}",
              answers: [{ questionId: 1, text: "TypeScript" }]
            }) {
              id
            }
          }
        `,
      );

      expect(submitRes.body.errors).toBeUndefined();
      expect(submitRes.body.data.submitSurveyAnswer.id).toBeDefined();
    });

    it('4. 使用済みのトークンでは回答が拒否されること', async () => {
      const usedToken = generatedTokens[0].token;

      const submitRes = await sendGql(
        app,
        `
          mutation {
            submitSurveyAnswer(input: {
              surveyId: ${inviteSurveyId},
              token: "${usedToken}",
              answers: [{ questionId: 1, text: "Python" }]
            }) {
              id
            }
          }
        `,
      );

      expect(submitRes.body.errors).toBeDefined();
      expect(submitRes.body.errors[0].message).toMatch('すでに回答済みです');
    });

    it('PRIVATEで作成したアンケートに、トークンなしで回答できてしまう', async () => {
      const submitRes = await sendGql(
        app,
        `
          mutation {
            submitSurveyAnswer(input: {
              surveyId: ${inviteSurveyId},
              answers: [{ questionId: 1, text: "認証すり抜け成功！" }]
            }) {
              id
            }
          }
        `,
      );
      expect(submitRes.body.errors).toBeDefined();
    });

    it('【脆弱性2】1つの有効なトークンを使って、同時に複数リクエストを送信すると多重回答できてしまう', async () => {
      const raceToken = generatedTokens[1].token;

      // このテストだけは並列リクエストが必要なので request() を直接使用
      const requests = Array(3)
        .fill(null)
        .map(() =>
          request(app.getHttpServer())
            .post('/graphql')
            .send({
              query: `
                mutation {
                  submitSurveyAnswer(input: {
                    surveyId: ${inviteSurveyId},
                    token: "${raceToken}",
                    answers: [{ questionId: 1, text: "多重回答アタック！" }]
                  }) {
                    id
                  }
                }
              `,
            }),
        );

      const responses = await Promise.all(requests);
      const successCount = responses.filter((res) => !res.body.errors).length;
      expect(successCount).toBe(1);
    });
  });
});
