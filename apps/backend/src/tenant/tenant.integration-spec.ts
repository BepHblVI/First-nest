import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { TenantService } from './tenant.service';
import { Tenant } from './models/tenant.model';
import { AppModule } from '../app.module';
import { cleanDatabase } from '../../test/utils/db-cleaner';
import { MembershipService } from './membership.service';
import { Membership } from './models/membership.model';
import { Role } from './constants/enums';
import { User } from '../auth/models/user.model';

describe('TenantService', () => {
  let tenantService: TenantService;
  let tenantRepo: Repository<Tenant>;
  let membershipService: MembershipService;
  let membershipRepo: Repository<Membership>;
  let userRepo: Repository<User>;
  let moduleFixture: TestingModule;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    tenantService = moduleFixture.get(TenantService);
    tenantRepo = moduleFixture.get(getRepositoryToken(Tenant));
    membershipService = moduleFixture.get(MembershipService);
    membershipRepo = moduleFixture.get(getRepositoryToken(Membership));
    userRepo = moduleFixture.get(getRepositoryToken(User));
  });

  // ★ テストが終わったらDB接続をクローズする（これがないとテストが終了しない）
  afterAll(async () => {
    if (moduleFixture) await moduleFixture.close();
  });

  beforeEach(async () => {
    // MySQLのデータを全削除してクリーンにする
    await cleanDatabase(moduleFixture as any);
  });

  // ═════════════════════════════════════════
  // createTenant
  // ═════════════════════════════════════════
  describe('createTenant', () => {
    it('正常入力でテナントが作成される', async () => {
      const result = await tenantService.createTenant({
        slug: 'alice',
        name: 'Alice Workspace',
      });

      expect(result).toMatchObject({
        slug: 'alice',
        name: 'Alice Workspace',
      });
      expect(result.id).toBeDefined(); // 本物のIDが採番されていること

      // 2. 本当にDBに保存されたかを直接確認する
      const savedTenant = await tenantRepo.findOne({
        where: { slug: 'alice' },
      });
      expect(savedTenant).not.toBeNull();
      expect(savedTenant?.name).toBe('Alice Workspace');
    });

    it('同じ slug が既に存在する場合 ConflictException', async () => {
      await tenantService.createTenant({
        slug: 'alice',
        name: 'Alice Workspace',
      });

      await expect(
        tenantService.createTenant({ slug: 'alice', name: 'Alice' }),
      ).rejects.toThrow(ConflictException);
    });

    it.each([['www'], ['api'], ['admin'], ['app']])(
      '予約 slug "%s" は ConflictException',
      async (reservedSlug) => {
        await expect(
          tenantService.createTenant({ slug: reservedSlug, name: 'Test' }),
        ).rejects.toThrow(ConflictException);
      },
    );
  });

  // ═════════════════════════════════════════
  // findBySlug
  // ═════════════════════════════════════════
  describe('findBySlug', () => {
    it('存在する slug でテナントが取得できる', async () => {
      await tenantService.createTenant({
        slug: 'alice',
        name: 'Alice Workspace',
      });
      const result = await tenantService.findBySlug('alice');

      expect(result).toMatchObject({
        slug: 'alice',
        name: 'Alice Workspace',
      });
    });

    it('存在しない slug は null を返す', async () => {
      await tenantService.createTenant({
        slug: 'alice',
        name: 'Alice Workspace',
      });
      const result = await tenantService.findBySlug('nonexistent');

      expect(result).toBeNull();
    });
    it('大文字・小文字が混ざった slug を指定しても、正しくテナントが取得できる', async () => {
      await tenantService.createTenant({
        slug: 'alice',
        name: 'Alice Workspace',
      });

      // 検索時は大文字混じりの 'Alice' や 'ALICE' でも正しく引っかかるか
      const result = await tenantService.findBySlug('ALICE');

      expect(result).toMatchObject({
        slug: 'alice',
        name: 'Alice Workspace',
      });
    });
  });

  // ═════════════════════════════════════════
  // findById
  // ═════════════════════════════════════════
  describe('findById', () => {
    it('存在するIDでテナントが取得できる', async () => {
      const created = await tenantService.createTenant({
        slug: 'alice',
        name: 'Alice Workspace',
      });

      const result = await tenantService.findById(created.id);
      expect(result).toMatchObject({
        slug: 'alice',
        name: 'Alice Workspace',
      });
    });

    it('存在しないIDは null を返す', async () => {
      await tenantService.createTenant({
        slug: 'alice',
        name: 'Alice Workspace',
      });
      const result = await tenantService.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('MembershipService', () => {
    // ※ 事前に beforeAll で userRepo や tenantRepo も moduleFixture.get() して使えるようにしておきます

    // ═════════════════════════════════════════
    // findByUserAndTenant
    // ═════════════════════════════════════════
    describe('findByUserAndTenant', () => {
      it('該当する Membership があれば返す', async () => {
        // 1. 【下準備】本物のデータをDBに作成する（関連するUserとTenantを先に作る）
        // ※実際の実装に合わせて、本物のリポジトリ等で保存してください
        const user = await userRepo.save({
          username: 'alice',
          password: 'hashed_password',
        });
        const tenant = await tenantRepo.save({
          slug: 'alice',
          name: 'Alice Tenant',
        });

        // 本物のMembershipをDBに作成
        const stored = await membershipRepo.save({
          user: { id: user.id },
          tenant: { id: tenant.id },
          role: Role.OWNER,
        });

        // 2. 【実行】
        const result = await membershipService.findByUserAndTenant(
          user.id,
          tenant.id,
        );

        // 3. 【検証】本物のデータが合致しているか確認（toMatchObjectが安全）
        expect(result).toMatchObject({
          id: stored.id,
          role: Role.OWNER,
        });
      });

      it('該当する Membership がなければ null を返す', async () => {
        // 存在しないID（999など）で検索をかける
        const result = await membershipService.findByUserAndTenant(999, 999);
        expect(result).toBeNull();
      });
    });

    // ═════════════════════════════════════════
    // listByUser
    // ═════════════════════════════════════════
    describe('listByUser', () => {
      it('ユーザーの所属する Membership 一覧を返す(tenant 同梱)', async () => {
        // 1. 【下準備】テスト用ユーザー1件と、2つのテナントを作成
        const user = await userRepo.save({
          username: 'alice',
          password: 'password',
        });
        const tenant1 = await tenantRepo.save({ slug: 't1', name: 'Tenant 1' });
        const tenant2 = await tenantRepo.save({ slug: 't2', name: 'Tenant 2' });

        // ユーザーを2つのテナントに所属させる
        await membershipRepo.save([
          {
            user: { id: user.id },
            tenant: { id: tenant1.id },
            role: Role.OWNER,
          },
          {
            user: { id: user.id },
            tenant: { id: tenant2.id },
            role: Role.EDITOR,
          },
        ]);

        // 2. 【実行】
        const result = await membershipService.listByUser(user.id);

        // 3. 【検証】2件返ってくること、および「relations: { tenant: true }」が効いて
        // tenant の中身（slugなど）まで本物のデータが詰まっていることを確認する
        expect(result).toHaveLength(2);
        expect(result[0]).toMatchObject({ role: Role.OWNER });
        expect(result[0].tenant).toMatchObject({
          slug: 't1',
          name: 'Tenant 1',
        }); // 💡リレーションがロードできている証明！
        expect(result[1].tenant).toMatchObject({
          slug: 't2',
          name: 'Tenant 2',
        });
      });

      it('所属がなければ空配列を返す', async () => {
        const result = await membershipService.listByUser(999);
        expect(result).toEqual([]);
      });
    });

    // ═════════════════════════════════════════
    // listByTenant
    // ═════════════════════════════════════════
    describe('listByTenant', () => {
      it('テナントのメンバー一覧を返す(user 同梱)', async () => {
        // 1. 【下準備】1つのテナントに、2人のユーザーを作成して所属させる
        const tenant = await tenantRepo.save({ slug: 't1', name: 'Tenant 1' });
        const user1 = await userRepo.save({
          username: 'user1',
          password: 'pw',
        });
        const user2 = await userRepo.save({
          username: 'user2',
          password: 'pw',
        });

        await membershipRepo.save([
          {
            user: { id: user1.id },
            tenant: { id: tenant.id },
            role: Role.OWNER,
          },
          {
            user: { id: user2.id },
            tenant: { id: tenant.id },
            role: Role.EDITOR,
          },
        ]);

        // 2. 【実行】
        const result = await membershipService.listByTenant(tenant.id);

        // 3. 【検証】ユーザー情報（username）まで同梱されているかチェック
        expect(result).toHaveLength(2);
        expect(result[0].user).toMatchObject({ username: 'user1' }); // 💡userリレーションのロード証明
        expect(result[1].user).toMatchObject({ username: 'user2' });
      });
    });
  });
});
