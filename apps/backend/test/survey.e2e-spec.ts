// test/survey.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { ValidationPipe } from '@nestjs/common';

describe('Survey GraphQL API (e2e)', () => {
  let app: INestApplication;
  let validToken: string;
  let otherUserSurveyId: number;
  let otherUserSurveyshareId: string;

  beforeAll(async () => {
    // 1. アプリの立ち上げ
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          mutation {
            signUp(username: "testuser", password: "password123") {
              id
            }
          }
        `,
      });

    // 3. ログインして validToken を取得
    const loginResponse = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          mutation {
            login(username: "testuser", password: "password123") {
              access_token
            }
          }
        `,
      });

    // 取得したトークンを変数にセット！
    validToken = loginResponse.body.data.login.access_token;

    await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          mutation {
            signUp(username: "testuserB", password: "password321") {
              id
            }
          }
        `,
      });
    const loginB = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          mutation {
            login(username: "testuserB", password: "password321") {
              access_token
            }
          }
        `,
      });
    const validTokenB = loginB.body.data.login.access_token;

    const createSurveyResponse = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${validTokenB}`)
      .send({
        query: `
          mutation {
            createSurvey(input:{title: "ユーザーBの秘密のアンケート",questions:[{qtext:"秘密の質問",type:"TEXT"}]}) {
            id
              shareId
            }
          }
        `,
      });
    otherUserSurveyshareId =
      createSurveyResponse.body.data.createSurvey.shareId;
    otherUserSurveyId = createSurveyResponse.body.data.createSurvey.id;
  });

  // 🧹 テストが終わった後の片付け
  afterAll(async () => {
    await app.close();
  });

  describe('セキュリティチェック', () => {
    test('ログインなしのアンケート作成を弾く', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
        query {
          getSurvey {
            id
            title
          }
        }`,
        });
      expect(response.status).toBe(200);
      expect(response.body.errors[0].message).toBe('Unauthorized');
    });

    test('他人のアンケートを削除(または更新)しようとした場合、エラーで弾かれること', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${validToken}`) // ユーザーAとしてアクセス
        .send({
          query: `
          query {
            getSurveyResults(shareId: "${otherUserSurveyshareId}") {
              title
              totalSubmissions
            }
          }
        `,
        });

      // 1. GraphQLエラーが存在することを確認
      expect(response.body.errors).toBeDefined();

      // 2. データが削除(返却)されていないことを確認
      expect(response.body.data).toBeNull();

      // 3. エラーメッセージの検証
      const errorMessage = response.body.errors[0].message;
      expect(errorMessage).toMatch(
        '他人のアンケートを操作する権限がありません',
      );
    });

    test('GraphQLのネストが深すぎる異常なクエリは、DoS攻撃対策として弾かれること', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          query: `
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
        });

      // エラーとして弾かれていることを確認
      expect(response.body.errors).toBeDefined();

      // 制限ライブラリ特有のエラーメッセージが出ているか確認
      // （例: 'exceeds maximum operation depth of 5' などのメッセージ）
      expect(response.body.errors[0].message).toContain(
        'exceeds maximum operation depth',
      );
    });
  });

  test('ログイン成功時、アクセストークン(Body)とリフレッシュトークン(Cookie)が正しく発行されること', async () => {
    // 1. ログインリクエストを送信
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          mutation {
            login(username: "testuserB", password: "password321") {
              access_token
            }
          }
        `,
      });

    // 2. GraphQL自体のエラーが出ていないことを確認
    expect(response.body.errors).toBeUndefined();

    // 3. Bodyにアクセストークンが含まれていることを確認
    const bodyToken = response.body.data.login.access_token;
    expect(bodyToken).toBeDefined();
    expect(typeof bodyToken).toBe('string');

    // 4. 【重要】レスポンスヘッダーからCookieを取り出す
    const rawCookies = response.headers['set-cookie'];

    // Cookieがそもそもセットされているか確認
    expect(rawCookies).toBeDefined();

    const cookies = Array.isArray(rawCookies) ? rawCookies : [rawCookies];

    // 配列になっているCookieの中から、refresh_tokenの設定を探す
    const refreshTokenCookie = cookies.find((cookie: string) =>
      cookie.startsWith('refresh_token='),
    );

    // refresh_tokenがセットされているか確認
    expect(refreshTokenCookie).toBeDefined();

    // 5. 【超重要】セキュリティ属性（HttpOnly）が付与されているか確認
    expect(refreshTokenCookie).toContain('HttpOnly');
  });

  test('アンケート作成時、タイトル(title)が空文字の場合はバリデーションエラーになること', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${validToken}`) // 適切なトークンを設定
      .send({
        query: `
          mutation {
            createSurvey(input:{
              title: "", questions: [{ qtext: "テスト", type: "TEXT" }]
            }) {
              id
            }
          }
        `,
      });

    // 1. エラー配列が存在することを確認
    expect(response.body.errors).toBeDefined();

    // 💡 修正ポイント：GraphQLではエラー時の data は undefined ではなく null になります
    expect(response.body.data).toBeNull();

    // 2. エラーの内容を文字列化して検証
    const errorStr = JSON.stringify(response.body.errors[0]);

    // Bad Request（400エラー）として弾かれているか？
    expect(errorStr).toContain('Bad Request');

    // 💡 修正ポイント：ご自身で設定した「日本語のカスタムメッセージ」が含まれているかを確認！
    expect(errorStr).toContain('タイトルは必須です');
  });

  describe('削除機能 (deleteSurvey)', () => {
    test('自分のアンケートを正常に削除できること', async () => {
      // 1. まずテスト用のアンケートを作成
      const createResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          query: `
            mutation {
              createSurvey(input: { title: "削除用アンケート", questions: [{ qtext: "テスト", type: "TEXT" }]}) {
                id
              }
            }
          `,
        });
      const surveyId = createResponse.body.data.createSurvey.id;

      // 2. 削除を実行
      const deleteResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          query: `
            mutation {
              deleteSurvey(id: ${surveyId})
            }
          `,
        });

      // 3. 検証
      expect(deleteResponse.body.errors).toBeUndefined();
      expect(deleteResponse.body.data.deleteSurvey).toBe(true);
    });

    test('他人のアンケートを削除しようとした場合、エラーで弾かれること', async () => {
      // otherUserSurveyId は beforeAll で作成したユーザーBのアンケートID
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${validToken}`) // ユーザーAとしてアクセス
        .send({
          query: `
            mutation {
              deleteSurvey(id: ${otherUserSurveyId})
            }
          `,
        });

      // 1. GraphQLエラーが存在することを確認
      expect(response.body.errors).toBeDefined();
      //expect(response.body.data).toBeNull();

      // 2. エラーメッセージの検証（認可エラー）
      const errorMessage = response.body.errors[0].message;
      expect(errorMessage).toMatch(
        '他人のアンケートを操作する権限がありません',
      );
    });
  });
  describe('編集機能 (editSurvey)', () => {
    test('自分のアンケートを正常に編集できること', async () => {
      // 1. まずテスト用のアンケートを作成
      const createResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          query: `
            mutation {
              createSurvey(input: { title: "編集用アンケート", questions: [{ qtext: "テスト", type: "TEXT" }]}) {
                id
              }
            }
          `,
        });
      const surveyId = createResponse.body.data.createSurvey.id;

      // 2.実行
      const editResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          query: `
            mutation {
              editSurvey(input:{ id: ${surveyId}, title:"編集後アンケート", questions: [{ qtext: "テスト2", type: "TEXT" }], published:true}){
                id
                title
              }
            }
          `,
        });

      // 3. 検証
      expect(editResponse.body.errors).toBeUndefined();
      expect(editResponse.body.data.editSurvey.id).toBe(surveyId);
      expect(editResponse.body.data.editSurvey.title).toBe('編集後アンケート');
    });

    test('他人のアンケートを編集しようとした場合、エラーで弾かれること', async () => {
      // otherUserSurveyId は beforeAll で作成したユーザーBのアンケートID
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${validToken}`) // ユーザーAとしてアクセス
        .send({
          query: `
            mutation {
              editSurvey(input:{ id: ${otherUserSurveyId}, title:"編集後アンケート", questions: [{ qtext: "テスト2", type: "TEXT" }], published:true}){
                id
                title
              }
            }
          `,
        });
      expect(response.body.errors).toBeDefined();
      // 2. エラーメッセージの検証（認可エラー）
      const errorMessage = response.body.errors[0].message;
      expect(errorMessage).toMatch(
        '他人のアンケートを操作する権限がありません',
      );
    });
    test('質問を増やして編集すると、増えた状態で保存されること', async () => {
      // 1. 質問1つでアンケート作成
      const createResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          query: `
          mutation {
            createSurvey(input: {
              title: "質問追加テスト",
              questions: [{ qtext: "質問1", type: "TEXT" }]
            }) {
              id
            }
          }
        `,
        });
      const surveyId = createResponse.body.data.createSurvey.id;

      // 2. 質問を3つに増やして編集
      const editResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          query: `
          mutation {
            editSurvey(input: {
              id: ${surveyId},
              title: "質問追加テスト",
              questions: [
                { qtext: "質問1改", type: "TEXT" },
                { qtext: "質問2新規", type: "TEXT" },
                { qtext: "質問3新規", type: "TEXT" }
              ],published: true
            }) {
              id
              questions { qtext }
            }
          }
        `,
        });

      // 3. 検証
      expect(editResponse.body.errors).toBeUndefined();
      const questions = editResponse.body.data.editSurvey.questions;
      expect(questions).toHaveLength(3);
      expect(questions[0].qtext).toBe('質問1改');
      expect(questions[1].qtext).toBe('質問2新規');
      expect(questions[2].qtext).toBe('質問3新規');
    });

    test('質問を減らして編集すると、古い質問が削除されること', async () => {
      // 1. 質問3つでアンケート作成
      const createResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          query: `
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
        });
      const surveyId = createResponse.body.data.createSurvey.id;

      // 2. 質問を1つに減らして編集
      const editResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          query: `
          mutation {
            editSurvey(input: {
              id: ${surveyId},
              title: "質問削除テスト",
              questions: [
                { qtext: "残す質問（編集済み）", type: "TEXT" }
              ],published: true
            }) {
              id
              questions { qtext }
            }
          }
        `,
        });

      // 3. 検証：質問が1つだけになっていること
      expect(editResponse.body.errors).toBeUndefined();
      const questions = editResponse.body.data.editSurvey.questions;
      expect(questions).toHaveLength(1);
      expect(questions[0].qtext).toBe('残す質問（編集済み）');
    });

    test('質問タイプをTEXTからRADIOに変更し、選択肢が保存されること', async () => {
      // 1. TEXT質問で作成
      const createResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          query: `
          mutation {
            createSurvey(input: {
              title: "タイプ変更テスト",
              questions: [{ qtext: "好きな食べ物は？", type: "TEXT" }]
            }) {
              id
            }
          }
        `,
        });
      const surveyId = createResponse.body.data.createSurvey.id;

      // 2. RADIO + 選択肢に変更
      const editResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          query: `
          mutation {
            editSurvey(input: {
              id: ${surveyId},
              title: "タイプ変更テスト",
              questions: [{
                qtext: "好きな食べ物は？",
                type: "SINGLE",
                options: ["寿司", "ラーメン", "カレー"]
              }],published: true
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
        });

      // 3. 検証
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
      // 1. 作成
      const createResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          query: `
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
        });
      const surveyId = createResponse.body.data.createSurvey.id;

      // 2. タイトルだけ変更（questionsは同じ内容を渡す）
      const editResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          query: `
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
        });

      // 3. 検証
      expect(editResponse.body.errors).toBeUndefined();
      expect(editResponse.body.data.editSurvey.title).toBe('新しいタイトル');
      expect(editResponse.body.data.editSurvey.questions[0].qtext).toBe(
        '変わらない質問',
      );
    });

    test('タイトルを空文字に編集しようとするとエラーになること', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          query: `
          mutation {
            createSurvey(input: {
              title: "バリデーションテスト",
              questions: [{ qtext: "質問", type: "TEXT" }]
            }) {
              id
            }
          }
        `,
        });
      const surveyId = createResponse.body.data.createSurvey.id;

      const editResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          query: `
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
        });

      expect(editResponse.body.errors).toBeDefined();
    });

    test('質問テキストが空の質問を含めて編集するとエラーになること', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          query: `
          mutation {
            createSurvey(input: {
              title: "空質問テスト",
              questions: [{ qtext: "質問", type: "TEXT" }]
            }) {
              id
            }
          }
        `,
        });
      const surveyId = createResponse.body.data.createSurvey.id;

      const editResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          query: `
          mutation {
            editSurvey(input: {
              id: ${surveyId},
              title: "空質問テスト",
              questions: [
                { qtext: "正常な質問", type: "TEXT" },
                { qtext: "", type: "TEXT" }
              ],published: true
            }) {
              id
            }
          }
        `,
        });

      expect(editResponse.body.errors).toBeDefined();
    });

    test('選択式(RADIO)なのに選択肢が空の場合エラーになること', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          query: `
          mutation {
            createSurvey(input: {
              title: "選択肢なしテスト",
              questions: [{ qtext: "質問", type: "TEXT" }]
            }) {
              id
            }
          }
        `,
        });
      const surveyId = createResponse.body.data.createSurvey.id;

      const editResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          query: `
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
        });

      expect(editResponse.body.errors).toBeDefined();
    });
  });
  // ===================================
  // 削除後の整合性チェック
  // ===================================
  describe('削除後の整合性', () => {
    test('削除したアンケートが一覧から消えていること', async () => {
      // 1. 作成
      const createResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          query: `
            mutation {
              createSurvey(input: {
                title: "削除整合性テスト",
                questions: [{ qtext: "質問", type: "TEXT" }]
              }) {
                id
              }
            }
          `,
        });
      const surveyId = createResponse.body.data.createSurvey.id;

      // 2. 削除
      await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          query: `
            mutation {
              deleteSurvey(id: ${surveyId})
            }
          `,
        });

      // 3. 一覧取得して含まれていないことを確認
      const listResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          query: `
            query {
              getSurvey { id title }
            }
          `,
        });

      const ids = listResponse.body.data.getSurvey.map((s: any) => s.id);
      expect(ids).not.toContain(surveyId);
    });

    test('削除したアンケートの共有リンクにアクセスできないこと', async () => {
      // 1. 作成
      const createResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          query: `
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
        });
      const surveyId = createResponse.body.data.createSurvey.id;
      const shareId = createResponse.body.data.createSurvey.shareId;

      // 2. 削除
      await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          query: `
            mutation {
              deleteSurvey(id: ${surveyId})
            }
          `,
        });

      // 3. 共有リンクでアクセス
      const answerResponse = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              getSurveyForAnswer(shareId: "${shareId}") {
                title
              }
            }
          `,
        });

      // エラーまたはnullが返ること
      const hasError = answerResponse.body.errors !== undefined;
      const isNull = answerResponse.body.data?.getSurveyForAnswer === null;
      expect(hasError || isNull).toBe(true);
    });
  });

  // ===================================
  // 公開/非公開機能
  // ===================================
  describe('公開/非公開機能', () => {
    test('アンケートを非公開に設定できること', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          query: `
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
        });
      const surveyId = createResponse.body.data.createSurvey.id;

      const editResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          query: `
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
        });

      expect(editResponse.body.errors).toBeUndefined();
      expect(editResponse.body.data.editSurvey.published).toBe(false);
    });

    test('公開後に非公開にすると共有リンクでアクセスできなくなること', async () => {
      // 1. 作成して公開
      const createResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          query: `
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
        });
      const surveyId = createResponse.body.data.createSurvey.id;
      const shareId = createResponse.body.data.createSurvey.shareId;

      // 2. 公開にする
      await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          query: `
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
        });

      // 3. 公開中はアクセスできることを確認
      const accessResponse = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              getSurveyForAnswer(shareId: "${shareId}") {
                title
              }
            }
          `,
        });
      expect(accessResponse.body.data.getSurveyForAnswer.title).toBe(
        '公開→非公開テスト',
      );

      // 4. 非公開に戻す
      await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          query: `
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
        });

      // 5. 非公開後はアクセスできないことを確認
      const blockedResponse = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              getSurveyForAnswer(shareId: "${shareId}") {
                title
              }
            }
          `,
        });
      expect(blockedResponse.body.errors).toBeDefined();
      expect(blockedResponse.body.errors[0].message).toMatch('非公開');
    });

    test('他人のアンケートの公開設定を変更できないこと', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          query: `
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
        });

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toMatch(
        '他人のアンケートを操作する権限がありません',
      );
    });
  });

  // ===================================
  // 回答送信機能
  // ===================================
  describe('回答送信 (submitSurveyAnswer)', () => {
    let publicSurveyId: number;
    let publicShareId: string;
    let questionIds: number[];
    let optionIds: number[];

    beforeAll(async () => {
      // 公開済みアンケートを事前に作成
      const createResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          query: `
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
        });

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
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
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
        });

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.submitSurveyAnswer.id).toBeDefined();
      expect(response.body.data.submitSurveyAnswer.submitted_at).toBeDefined();
    });

    test('非公開のアンケートには回答を送信できないこと', async () => {
      // 非公開のアンケートを作成（デフォルト非公開）
      const editResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          query: `
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
        });
      const surveyId = editResponse.body.data.editSurvey.id;
      const qId = editResponse.body.data.editSurvey.questions[0].id;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
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
        });

      expect(response.body.errors).toBeDefined();
    });
  });

  // ===================================
  // 集計結果の取得
  // ===================================
  describe('集計結果 (getSurveyResults)', () => {
    test('自分のアンケートの集計結果を取得できること', async () => {
      // 1. アンケート作成＆公開
      const createResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          query: `
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
        });
      const surveyId = createResponse.body.data.createSurvey.id;
      const shareId = createResponse.body.data.createSurvey.shareId;
      const qId = createResponse.body.data.createSurvey.questions[0].id;

      // 公開
      await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          query: `
            mutation {
              editSurvey(input: {
                id: ${surveyId},
                title: "集計テスト",
                questions: [{ qtext: "感想", type: "TEXT" }],
                publish: true
              }) {
                id
              }
            }
          `,
        });

      // 2. 回答を送信
      await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation {
              submitSurveyAnswer(input: {
                surveyId: ${surveyId},
                answers: [{ questionId: ${qId}, text: "とても良かった" }]
              }) {
                id
              }
            }
          `,
        });

      // 3. 集計結果を取得
      const resultResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          query: `
            query {
              getSurveyResults(shareId: "${shareId}") {
                title
                totalSubmissions
              }
            }
          `,
        });

      expect(resultResponse.body.errors).toBeUndefined();
      expect(resultResponse.body.data.getSurveyResults.title).toBe(
        '集計テスト',
      );
      expect(
        resultResponse.body.data.getSurveyResults.totalSubmissions,
      ).toBeGreaterThanOrEqual(1);
    });

    test('他人のアンケートの集計結果は取得できないこと', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          query: `
            query {
              getSurveyResults(shareId: "${otherUserSurveyshareId}") {
                title
                totalSubmissions
              }
            }
          `,
        });

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toMatch(
        '他人のアンケートを操作する権限がありません',
      );
    });
  });

  // ===================================
  // 編集と回答の整合性
  // ===================================
  describe('編集と回答の整合性', () => {
    test('回答が既にあるアンケートを編集しても、新しい構造で回答を受け付けられること', async () => {
      // 1. 作成＆公開
      const createResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          query: `
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
        });
      const surveyId = createResponse.body.data.createSurvey.id;
      const oldQId = createResponse.body.data.createSurvey.questions[0].id;

      // 公開
      await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          query: `
            mutation {
              editSurvey(input: {
                id: ${surveyId},
                title: "編集後回答テスト",
                questions: [{ qtext: "古い質問", type: "TEXT" }],
                published: true
              }) { id }
            }
          `,
        });

      // 2. 古い構造で回答
      await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation {
              submitSurveyAnswer(input: {
                surveyId: ${surveyId},
                answers: [{ questionId: ${oldQId}, text: "古い回答" }]
              }) { id }
            }
          `,
        });

      // 3. 質問を編集（新しい質問に差し替え）
      const editResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          query: `
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
        });

      const newQuestionIds = editResponse.body.data.editSurvey.questions.map(
        (q: any) => q.id,
      );

      // 4. 新しい構造で回答できることを確認
      const answerResponse = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
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
        });

      expect(answerResponse.body.errors).toBeUndefined();
      expect(answerResponse.body.data.submitSurveyAnswer.id).toBeDefined();
    });
  });
});
