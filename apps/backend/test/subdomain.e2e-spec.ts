import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { signUp, signUpAndLogin } from './utils/auth-client';
import { cleanDatabase } from './utils/db-cleaner';
import { createTestSurvey, rawCreateTestSurvey } from './utils/survey-helpers';
import { GqlThrottlerGuard } from '../src/auth/guards/gql-throttler.guard';
import { expectGqlError } from './utils/gql-client';

describe('サブドメイン機能テスト(e2e)', () => {
  let app: INestApplication;
  let validToken: string;

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
  });

  afterAll(async () => {
    if (app) await app.close();
  });
  describe('正常系', () => {
    test('存在するサブドメインからアクセスできる', async () => {
      await signUp(app, 'alice', 'alice123');
      const res = await createTestSurvey(app, validToken, {
        title: 'Alice',
        subdomain: 'alice',
      });
      expect(res).toBeDefined();
    });
  });
  describe('異常系', () => {
    test('存在しないサブドメインからアクセスできない', async () => {
      await signUp(app, 'alice', 'alice123');
      const res = await rawCreateTestSurvey(app, validToken, {
        title: 'Bob',
        subdomain: 'bob',
      });
      expect(res.statusCode).toBe(404);

      // 2. エラーメッセージの内容を検証
      expect(res.body.message).toBe('テナントが存在しません');
    });
  });
});
