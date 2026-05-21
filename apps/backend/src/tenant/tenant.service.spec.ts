import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { TenantService } from './tenant.service';
import { Tenant } from './tenant.model';

describe('TenantService', () => {
  let service: TenantService;
  let tenantRepo: jest.Mocked<Repository<Tenant>>;

  beforeEach(async () => {
    const mockTenantRepo = {
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((data) => data),
      save: jest.fn().mockImplementation((data) =>
        Promise.resolve({
          id: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        }),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantService,
        { provide: getRepositoryToken(Tenant), useValue: mockTenantRepo },
      ],
    }).compile();

    service = module.get(TenantService);
    tenantRepo = module.get(getRepositoryToken(Tenant));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ═════════════════════════════════════════
  // createTenant
  // ═════════════════════════════════════════
  describe('createTenant', () => {
    it('正常入力でテナントが作成される', async () => {
      tenantRepo.findOne.mockResolvedValue(null); // slug 衝突なし

      const result = await service.createTenant({
        slug: 'alice',
        name: 'Alice Workspace',
      });

      expect(result).toMatchObject({
        slug: 'alice',
        name: 'Alice Workspace',
      });
      expect(tenantRepo.save).toHaveBeenCalledTimes(1);
    });

    it('保存時に slug と name がそのまま保存される', async () => {
      tenantRepo.findOne.mockResolvedValue(null);

      await service.createTenant({
        slug: 'alice',
        name: 'Alice Workspace',
      });

      expect(tenantRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: 'alice',
          name: 'Alice Workspace',
        }),
      );
    });

    it('同じ slug が既に存在する場合 ConflictException', async () => {
      // 既存テナントが見つかる
      tenantRepo.findOne.mockResolvedValue({ id: 99, slug: 'alice' } as Tenant);

      await expect(
        service.createTenant({ slug: 'alice', name: 'Alice' }),
      ).rejects.toThrow(ConflictException);

      // 保存は呼ばれない
      expect(tenantRepo.save).not.toHaveBeenCalled();
    });

    it.each([['www'], ['api'], ['admin'], ['app']])(
      '予約 slug "%s" は ConflictException',
      async (reservedSlug) => {
        // 予約語チェックはDB問い合わせ前に実行されるべき
        tenantRepo.findOne.mockResolvedValue(null);

        await expect(
          service.createTenant({ slug: reservedSlug, name: 'Test' }),
        ).rejects.toThrow(ConflictException);

        // 予約語ならDBに問い合わせる前にエラーを返す設計でもOK
        // (findOne が呼ばれてもいいが、save は絶対呼ばれない)
        expect(tenantRepo.save).not.toHaveBeenCalled();
      },
    );
  });

  // ═════════════════════════════════════════
  // findBySlug
  // ═════════════════════════════════════════
  describe('findBySlug', () => {
    it('存在する slug でテナントが取得できる', async () => {
      const stored = { id: 1, slug: 'alice', name: 'Alice' } as Tenant;
      tenantRepo.findOne.mockResolvedValue(stored);

      const result = await service.findBySlug('alice');

      expect(result).toEqual(stored);
      expect(tenantRepo.findOne).toHaveBeenCalledWith({
        where: { slug: 'alice' },
      });
    });

    it('存在しない slug は null を返す', async () => {
      tenantRepo.findOne.mockResolvedValue(null);

      const result = await service.findBySlug('nonexistent');

      expect(result).toBeNull();
    });
  });

  // ═════════════════════════════════════════
  // findById
  // ═════════════════════════════════════════
  describe('findById', () => {
    it('存在するIDでテナントが取得できる', async () => {
      const stored = { id: 1, slug: 'alice', name: 'Alice' } as Tenant;
      tenantRepo.findOne.mockResolvedValue(stored);

      const result = await service.findById(1);

      expect(result).toEqual(stored);
      expect(tenantRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('存在しないIDは null を返す', async () => {
      tenantRepo.findOne.mockResolvedValue(null);

      const result = await service.findById(999);

      expect(result).toBeNull();
    });
  });
});
