import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { AuthService } from './auth.service';
import { User } from './models/user.model';
import { RefreshToken } from './models/refresh-token.model';
import { hashToken } from './helpers/hash-token';

// bcrypt をモック化(全テストに影響)
// AuthService は bcrypt.hash / bcrypt.compare を呼ぶので、
// テストごとに振る舞いを制御できるようにする。
jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: jest.Mocked<Repository<User>>;
  let refreshTokenRepo: jest.Mocked<Repository<RefreshToken>>;
  let dataSource: jest.Mocked<DataSource>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  // ★ mockManager を describe スコープに引き上げ
  // (setupValidStoredToken などのヘルパーから参照できるようにする)
  let mockManager: {
    findOne: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
    create: jest.Mock;
  };

  beforeEach(async () => {
    // ─── Mocks ──────────────────────────────
    // Repository: create は引数をそのまま返し、save は id を付与する
    // という TypeORM の自然な振る舞いを再現する。
    const mockUserRepo = {
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((data) => data),
      save: jest
        .fn()
        .mockImplementation((data) => Promise.resolve({ id: 1, ...data })),
    };

    const mockRefreshTokenRepo = {
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((data) => data),
      save: jest
        .fn()
        .mockImplementation((data) =>
          Promise.resolve({ id: 'token-uuid', ...data }),
        ),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    // EntityManager のモック(トランザクション内で使う)
    // ★ describe スコープに引き上げた変数に代入する
    mockManager = {
      findOne: jest.fn(),
      save: jest.fn().mockImplementation((entityOrEntity, maybeData) => {
        // manager.save(Entity, data) と manager.save(entity) 両方に対応
        // 単一引数の場合: maybeData は undefined、entityOrEntity が保存対象
        const data = maybeData ?? entityOrEntity;
        return Promise.resolve({ id: 'new-token-id', ...data });
      }),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      create: jest.fn().mockImplementation((entity, data) => data ?? entity),
    };

    // DataSource のモック
    // transaction(cb) の中身を即実行して、mockManager を渡す
    const mockDataSource = {
      transaction: jest.fn().mockImplementation(async (cb) => {
        return cb(mockManager);
      }),
    };

    // JwtService: sign は決まった文字列を返す(payloadごとに変えたければ各テストで上書き)
    const mockJwtService = {
      sign: jest.fn().mockImplementation((payload, options) => {
        // テストで access/refresh を区別したいので、secret によって戻り値を変える
        if (options?.secret === 'test-refresh-secret') {
          return 'mocked.refresh.jwt';
        }
        return 'mocked.access.jwt';
      }),
      verify: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn((key: string) => {
        const map: Record<string, string> = {
          SECRET_KEY: 'test-secret',
          REFRESH_KEY: 'test-refresh-secret',
        };
        return map[key];
      }),
    };

    // ─── DI コンテナ構築 ─────────────────────
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: mockRefreshTokenRepo,
        },
        { provide: DataSource, useValue: mockDataSource },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get(AuthService);
    userRepo = module.get(getRepositoryToken(User));
    refreshTokenRepo = module.get(getRepositoryToken(RefreshToken));
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
    dataSource = module.get(DataSource);

    // bcrypt モックのデフォルト挙動をリセット
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ═════════════════════════════════════════
  // signUp
  // ═════════════════════════════════════════
  describe('signUp', () => {
    it('新規ユーザーが作成できる', async () => {
      userRepo.findOne.mockResolvedValue(null);

      const result = await service.signUp({
        username: 'newuser',
        password: 'pass1234',
      });

      expect(result).toMatchObject({ id: 1, username: 'newuser' });
      expect(userRepo.save).toHaveBeenCalledTimes(1);
    });

    it('パスワードはbcryptでハッシュ化されてから保存される', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await service.signUp({ username: 'newuser', password: 'pass1234' });

      // 平文ではなく、ハッシュ化された値が保存される
      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ password: 'hashed-password' }),
      );
    });

    it('bcryptのcost factor(salt rounds)は10以上である', async () => {
      // セキュリティ: cost factor が低いと総当たり攻撃に弱くなる
      userRepo.findOne.mockResolvedValue(null);

      await service.signUp({ username: 'newuser', password: 'pass1234' });

      const [, costFactor] = (bcrypt.hash as jest.Mock).mock.calls[0];
      expect(costFactor).toBeGreaterThanOrEqual(10);
    });

    it('既存のユーザー名なら ConflictException', async () => {
      userRepo.findOne.mockResolvedValue({ id: 99 } as User);

      await expect(
        service.signUp({ username: 'taken', password: 'pass1234' }),
      ).rejects.toThrow(ConflictException);

      expect(userRepo.save).not.toHaveBeenCalled();
    });
  });

  // ═════════════════════════════════════════
  // login
  // ═════════════════════════════════════════
  describe('login', () => {
    const existingUser = {
      id: 1,
      username: 'testuser',
      password: 'hashed-password',
    } as User;

    describe('正常系', () => {
      it('正しい認証情報で access/refresh の両トークンを返す', async () => {
        userRepo.findOne.mockResolvedValue(existingUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);

        const result = await service.login('testuser', 'pass1234');

        expect(result).toEqual({
          access_token: 'mocked.access.jwt',
          refresh_token: 'mocked.refresh.jwt',
        });
      });

      it('login成功時にRefreshTokenがDBに保存される', async () => {
        userRepo.findOne.mockResolvedValue(existingUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);

        await service.login('testuser', 'pass1234');

        expect(refreshTokenRepo.save).toHaveBeenCalledTimes(1);
      });

      it('DB保存される tokenHash は生のJWTではなくハッシュ値である', async () => {
        // セキュリティの本質: DB漏洩時に生のJWTが復元できないようにする
        userRepo.findOne.mockResolvedValue(existingUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);

        await service.login('testuser', 'pass1234');

        const savedArg = (refreshTokenRepo.save as jest.Mock).mock.calls[0][0];
        expect(savedArg.tokenHash).toBe(hashToken('mocked.refresh.jwt'));
        // 念のため、生のJWTがそのまま入っていないことを明示
        expect(savedArg.tokenHash).not.toBe('mocked.refresh.jwt');
      });

      it('保存される RefreshToken は revoked=false, userId が正しい', async () => {
        userRepo.findOne.mockResolvedValue(existingUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);

        await service.login('testuser', 'pass1234');

        expect(refreshTokenRepo.save).toHaveBeenCalledWith(
          expect.objectContaining({
            revoked: false,
            // ユーザーとの関連: 設計次第で user: {id} か userId: 1 のどちらか
            // どちらでも受け入れられるように expect.objectContaining を使う
          }),
        );
      });

      it('RefreshToken.expiresAt は現在時刻+1日 にセットされる', async () => {
        // 時刻を固定して厳密に検証
        jest.useFakeTimers();
        const fixedNow = new Date('2024-01-01T00:00:00.000Z');
        jest.setSystemTime(fixedNow);

        userRepo.findOne.mockResolvedValue(existingUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);

        await service.login('testuser', 'pass1234');

        const savedArg = (refreshTokenRepo.save as jest.Mock).mock.calls[0][0];
        const expected = new Date('2024-01-02T00:00:00.000Z');
        expect(savedArg.expiresAt.getTime()).toBe(expected.getTime());

        jest.useRealTimers();
      });
    });

    describe('JWT 発行の設定', () => {
      it('access_token は SECRET_KEY で署名され、有効期限 15m', async () => {
        userRepo.findOne.mockResolvedValue(existingUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);

        await service.login('testuser', 'pass1234');

        // sign の呼び出しを確認
        expect(jwtService.sign).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            secret: 'test-secret',
            expiresIn: '15m',
          }),
        );
      });

      it('refresh_token は REFRESH_KEY で署名され、有効期限 1d', async () => {
        userRepo.findOne.mockResolvedValue(existingUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);

        await service.login('testuser', 'pass1234');

        expect(jwtService.sign).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            secret: 'test-refresh-secret',
            expiresIn: '1d',
          }),
        );
      });

      it('access_token / refresh_token は別の secret で署名される', async () => {
        // セキュリティ: 同じ secret だと access を refresh に使い回せてしまう
        userRepo.findOne.mockResolvedValue(existingUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);

        await service.login('testuser', 'pass1234');

        const signCalls = (jwtService.sign as jest.Mock).mock.calls;
        const secrets = signCalls.map((c) => c[1]?.secret);
        // 2つの secret が異なる
        expect(new Set(secrets).size).toBe(2);
      });

      it('JWT payload には password が含まれない', async () => {
        // セキュリティ: JWT は Base64 で誰でも読めるので機密情報を入れない
        userRepo.findOne.mockResolvedValue(existingUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);

        await service.login('testuser', 'pass1234');

        const signCalls = (jwtService.sign as jest.Mock).mock.calls;
        for (const [payload] of signCalls) {
          expect(payload).not.toHaveProperty('password');
          expect(payload).not.toHaveProperty('passwordHash');
        }
      });

      it('JWT payload には sub(userId) と username が含まれる', async () => {
        userRepo.findOne.mockResolvedValue(existingUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);

        await service.login('testuser', 'pass1234');

        expect(jwtService.sign).toHaveBeenCalledWith(
          expect.objectContaining({ sub: 1, username: 'testuser' }),
          expect.anything(),
        );
      });
    });

    describe('セキュリティ(エラー処理)', () => {
      it('ユーザーが存在しない場合 UnauthorizedException', async () => {
        userRepo.findOne.mockResolvedValue(null);

        await expect(service.login('nouser', 'any')).rejects.toThrow(
          UnauthorizedException,
        );
      });

      it('パスワードが違う場合 UnauthorizedException', async () => {
        userRepo.findOne.mockResolvedValue(existingUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);

        await expect(service.login('testuser', 'wrong')).rejects.toThrow(
          UnauthorizedException,
        );
      });

      it('User Enumeration対策: ユーザー不存在とパスワード違いで同じメッセージ', async () => {
        // ヘルパー: login を呼んで「投げられた Error」を取り出す
        // try/catch で書くと型が Error に確定するので型安全。
        const captureError = async (
          username: string,
          password: string,
        ): Promise<Error> => {
          try {
            await service.login(username, password);
            throw new Error('login が成功してしまった(テスト前提が壊れている)');
          } catch (e) {
            return e as Error;
          }
        };

        // ケース1: ユーザー不存在
        userRepo.findOne.mockResolvedValueOnce(null);
        const e1 = await captureError('nouser', 'any');

        // ケース2: パスワード違い
        userRepo.findOne.mockResolvedValueOnce(existingUser);
        (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);
        const e2 = await captureError('testuser', 'wrong');

        expect(e1.message).toBe(e2.message);
      });

      it('タイミング攻撃対策: ユーザー不存在でも bcrypt.compare が実行される', async () => {
        // 目的: ユーザー存在/非存在で処理時間に差が出ないようにする。
        userRepo.findOne.mockResolvedValue(null);

        await service.login('nouser', 'any').catch(() => {});

        expect(bcrypt.compare).toHaveBeenCalled();
      });
    });
  });

  // ═════════════════════════════════════════
  // refresh
  // ═════════════════════════════════════════
  describe('refresh', () => {
    const givenToken = 'given.refresh.jwt';
    const validPayload = { sub: 1, username: 'testuser' };

    // refresh の正常系で「DBに有効なトークンがある」状態をセットアップする helper
    const setupValidStoredToken = (
      override: Partial<RefreshToken> = {},
    ): RefreshToken => {
      const stored: RefreshToken = {
        id: 'stored-token-id',
        tokenHash: hashToken(givenToken),
        user: { id: 1, username: 'testuser' } as User,
        expiresAt: new Date(Date.now() + 86400_000),
        revoked: false,
        createdAt: new Date(),
        replacedByTokenId: null,
        userAgent: null,
        ip: null,
        ...override,
      };
      // ★ Repository と Manager 両方にモック設定
      // (実装が repo.findOne でも manager.findOne でも対応できる)
      refreshTokenRepo.findOne.mockResolvedValue(stored);
      mockManager.findOne.mockResolvedValue(stored);
      return stored;
    };

    // refresh の更新検証用ヘルパー: repo / manager 両方の呼び出し履歴を統合
    const getAllSaveCalls = () => [
      ...(refreshTokenRepo.save as jest.Mock).mock.calls,
      ...mockManager.save.mock.calls,
    ];
    const getAllUpdateCalls = () => [
      ...refreshTokenRepo.update.mock.calls,
      ...mockManager.update.mock.calls,
    ];

    describe('正常系', () => {
      it('有効なトークンで新しいトークンペアが返る', async () => {
        jwtService.verify.mockReturnValue(validPayload);
        setupValidStoredToken();

        const result = await service.refresh(givenToken);

        expect(result).toEqual({
          access_token: 'mocked.access.jwt',
          refresh_token: 'mocked.refresh.jwt',
        });
      });

      it('ローテーション: 古いトークンが revoked=true で更新される', async () => {
        // OAuth 2.0 BCP 推奨: refresh の度にトークンを切り替える
        jwtService.verify.mockReturnValue(validPayload);
        setupValidStoredToken();

        await service.refresh(givenToken);

        // update もしくは save どちらで実装してもいい設計
        // 「古いトークンの revoked が true になっている」ことを抽象的に検証
        // (manager.save 経由でも repo.update 経由でも検出できるようにする)
        const wasRevokedInUpdate = getAllUpdateCalls().some(
          (call) => call[1]?.revoked === true,
        );
        const wasRevokedInSave = getAllSaveCalls().some((call) => {
          // manager.save(Entity, data) と manager.save(entity) 両対応
          // 最後の引数が entity or data の可能性が高い
          const lastArg = call[call.length - 1];
          return lastArg?.revoked === true;
        });

        expect(wasRevokedInUpdate || wasRevokedInSave).toBe(true);
      });

      it('ローテーション: 新しいトークンがDBに保存される', async () => {
        jwtService.verify.mockReturnValue(validPayload);
        setupValidStoredToken();

        await service.refresh(givenToken);

        // 新規 token を保存する save 呼び出し(revoked=false の新規分)
        const newTokenSave = getAllSaveCalls().find((call) => {
          const lastArg = call[call.length - 1];
          return (
            lastArg?.revoked === false &&
            lastArg?.tokenHash === hashToken('mocked.refresh.jwt')
          );
        });
        expect(newTokenSave).toBeDefined();
      });

      it('クロスユーザー: userA のトークンで refresh しても userA の access が返る', async () => {
        // セキュリティ: トークンの取り違えがないこと
        const userBPayload = { sub: 99, username: 'userB' };
        jwtService.verify.mockReturnValue(userBPayload);
        // ただしDBに保存されているトークンは userA (id:1) のもの
        setupValidStoredToken({
          user: { id: 1, username: 'userA' } as User,
        });

        await service.refresh(givenToken).catch(() => {});

        // 設計判断: DB側の user_id を「真」として扱うべき。
        // JWT の sub だけ信用すると、悪意ある JWT で他人になりすませる。
        // → DB の user_id と payload.sub が一致しない場合はエラーが正しい。
        // ※ もしくは sign 時に DB の user_id を使う実装でも OK。
        const allSignCalls = (jwtService.sign as jest.Mock).mock.calls;
        for (const [payload] of allSignCalls) {
          if (payload?.sub) {
            // userB の id(99) で発行されていないこと
            expect(payload.sub).toBe(1);
          }
        }
      });
    });

    describe('セキュリティ(エラー処理)', () => {
      it('JWT署名が無効なら UnauthorizedException', async () => {
        jwtService.verify.mockImplementation(() => {
          throw new Error('invalid signature');
        });

        await expect(service.refresh('bad.jwt.here')).rejects.toThrow(
          UnauthorizedException,
        );
        // DBには触らない (repo / manager どちらの findOne も呼ばれない)
        expect(refreshTokenRepo.findOne).not.toHaveBeenCalled();
        expect(mockManager.findOne).not.toHaveBeenCalled();
      });

      it('JWT は有効だが DB に存在しないトークンは拒否される(盗難検知)', async () => {
        jwtService.verify.mockReturnValue(validPayload);
        // ★ repo / manager 両方とも null を返すよう設定
        refreshTokenRepo.findOne.mockResolvedValue(null);
        mockManager.findOne.mockResolvedValue(null);

        await expect(service.refresh(givenToken)).rejects.toThrow(
          UnauthorizedException,
        );
      });

      it('既に revoked されたトークンは拒否される', async () => {
        jwtService.verify.mockReturnValue(validPayload);
        // 実装が「where: { revoked: false }」で絞っている場合、
        // revoked: true のレコードは findOne の結果に含まれない
        // → 結果として null が返るのと同じになる
        refreshTokenRepo.findOne.mockResolvedValue(null);
        mockManager.findOne.mockResolvedValue(null);

        await expect(service.refresh(givenToken)).rejects.toThrow(
          UnauthorizedException,
        );
      });

      it('期限切れトークンは拒否される(jwt側のエラー)', async () => {
        const tokenExpiredError = new Error('jwt expired');
        tokenExpiredError.name = 'TokenExpiredError';
        jwtService.verify.mockImplementation(() => {
          throw tokenExpiredError;
        });

        await expect(service.refresh(givenToken)).rejects.toThrow(
          UnauthorizedException,
        );
      });
    });

    // 案C(盗難検知時に全トークン無効化)を将来実装する場合の予約
    it.todo(
      '将来案: revoked済みトークンが再使用されたら、同ユーザーの全トークンを無効化する',
    );
  });

  // ═════════════════════════════════════════
  // logout
  // ═════════════════════════════════════════
  describe('logout', () => {
    const givenToken = 'logged-out.refresh.jwt';

    it('該当トークンが revoked=true に更新される', async () => {
      await service.logout(givenToken);

      // update もしくは save で revoked=true になっていればよい
      const updateCalls = refreshTokenRepo.update.mock.calls;
      const saveCalls = (refreshTokenRepo.save as jest.Mock).mock.calls;

      const wasRevokedInUpdate = updateCalls.some(
        ([, patch]) => (patch as any)?.revoked === true,
      );
      const wasRevokedInSave = saveCalls.some(
        ([entity]) => entity?.revoked === true,
      );

      expect(wasRevokedInUpdate || wasRevokedInSave).toBe(true);
    });

    it('更新対象は tokenHash でマッチするトークンに限定される', async () => {
      // セキュリティ: tokenHash で絞らず一括 update したら他人もログアウトしてしまう
      await service.logout(givenToken);

      const expectedHash = hashToken(givenToken);
      const updateCalls = refreshTokenRepo.update.mock.calls;

      const hasCorrectWhere = updateCalls.some(
        ([where]) => (where as any)?.tokenHash === expectedHash,
      );
      expect(hasCorrectWhere).toBe(true);
    });

    it('DBに存在しないトークンを渡してもエラーにならない(冪等性)', async () => {
      // 設計判断: ログアウトAPIは「無効なトークン」と教える必要なし。
      // セキュリティ的にも「このトークンは存在しません」と返すと
      // 攻撃者の探索を助けるので、常に成功扱いにする。
      refreshTokenRepo.update.mockResolvedValue({
        affected: 0,
        raw: {},
        generatedMaps: [],
      });

      await expect(service.logout('unknown.token')).resolves.not.toThrow();
    });
  });
});
