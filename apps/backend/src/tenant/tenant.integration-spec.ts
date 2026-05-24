import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { TenantService } from './tenant.service';
import { Tenant } from './models/tenant.model';
import { AppModule } from '../app.module';
import { cleanDatabase } from '../../test/utils/db-cleaner';

describe('TenantService', () => {
  let service: TenantService;
  let tenantRepo: Repository<Tenant>;
  let moduleFixture: TestingModule;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    service = moduleFixture.get(TenantService);
    tenantRepo = moduleFixture.get(getRepositoryToken(Tenant));
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
      const result = await service.createTenant({
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
      await service.createTenant({
        slug: 'alice',
        name: 'Alice Workspace',
      });

      await expect(
        service.createTenant({ slug: 'alice', name: 'Alice' }),
      ).rejects.toThrow(ConflictException);
    });

    it.each([['www'], ['api'], ['admin'], ['app']])(
      '予約 slug "%s" は ConflictException',
      async (reservedSlug) => {
        await expect(
          service.createTenant({ slug: reservedSlug, name: 'Test' }),
        ).rejects.toThrow(ConflictException);
      },
    );
  });

  // ═════════════════════════════════════════
  // findBySlug
  // ═════════════════════════════════════════
  describe('findBySlug', () => {
    it('存在する slug でテナントが取得できる', async () => {
      await service.createTenant({
        slug: 'alice',
        name: 'Alice Workspace',
      });
      const result = await service.findBySlug('alice');

      expect(result).toMatchObject({
        slug: 'alice',
        name: 'Alice Workspace',
      });
    });

    it('存在しない slug は null を返す', async () => {
      await service.createTenant({
        slug: 'alice',
        name: 'Alice Workspace',
      });
      const result = await service.findBySlug('nonexistent');

      expect(result).toBeNull();
    });
  });

  // ═════════════════════════════════════════
  // findById
  // ═════════════════════════════════════════
  describe('findById', () => {
    it('存在するIDでテナントが取得できる', async () => {
      const created = await service.createTenant({
        slug: 'alice',
        name: 'Alice Workspace',
      });

      const result = await service.findById(created.id);
      expect(result).toMatchObject({
        slug: 'alice',
        name: 'Alice Workspace',
      });
    });

    it('存在しないIDは null を返す', async () => {
      await service.createTenant({
        slug: 'alice',
        name: 'Alice Workspace',
      });
      const result = await service.findById(999);

      expect(result).toBeNull();
    });
  });
});
