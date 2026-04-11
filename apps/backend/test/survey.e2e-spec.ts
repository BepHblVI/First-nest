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
});
