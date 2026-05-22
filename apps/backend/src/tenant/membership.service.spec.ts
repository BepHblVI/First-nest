import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { MembershipService } from './membership.service';
import { Membership } from './models/membership.model';
import { Role } from './constants/enums';

describe('MembershipService', () => {
  let service: MembershipService;
  let membershipRepo: jest.Mocked<Repository<Membership>>;

  beforeEach(async () => {
    const mockMembershipRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembershipService,
        {
          provide: getRepositoryToken(Membership),
          useValue: mockMembershipRepo,
        },
      ],
    }).compile();

    service = module.get(MembershipService);
    membershipRepo = module.get(getRepositoryToken(Membership));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ═════════════════════════════════════════
  // findByUserAndTenant
  // ═════════════════════════════════════════
  describe('findByUserAndTenant', () => {
    it('該当する Membership があれば返す', async () => {
      const stored = { id: 1, role: Role.OWNER } as Membership;
      membershipRepo.findOne.mockResolvedValue(stored);

      const result = await service.findByUserAndTenant(1, 1);

      expect(result).toEqual(stored);
      // user と tenant の両方で絞り込んでいることを確認
      expect(membershipRepo.findOne).toHaveBeenCalledWith({
        where: { user: { id: 1 }, tenant: { id: 1 } },
      });
    });

    it('該当する Membership がなければ null を返す', async () => {
      membershipRepo.findOne.mockResolvedValue(null);

      const result = await service.findByUserAndTenant(1, 999);

      expect(result).toBeNull();
    });
  });

  // ═════════════════════════════════════════
  // listByUser
  // ═════════════════════════════════════════
  describe('listByUser', () => {
    it('ユーザーの所属する Membership 一覧を返す(tenant 同梱)', async () => {
      const list = [
        { id: 1, role: Role.OWNER, tenant: { id: 1, slug: 'alice' } },
        { id: 2, role: Role.EDITOR, tenant: { id: 2, slug: 'company' } },
      ] as Membership[];
      membershipRepo.find.mockResolvedValue(list);

      const result = await service.listByUser(1);

      expect(result).toEqual(list);
      // tenant をリレーション込みでロードしていることを確認
      expect(membershipRepo.find).toHaveBeenCalledWith({
        where: { user: { id: 1 } },
        relations: { tenant: true },
      });
    });

    it('所属がなければ空配列を返す', async () => {
      membershipRepo.find.mockResolvedValue([]);

      const result = await service.listByUser(999);

      expect(result).toEqual([]);
    });
  });

  // ═════════════════════════════════════════
  // listByTenant
  // ═════════════════════════════════════════
  describe('listByTenant', () => {
    it('テナントのメンバー一覧を返す(user 同梱)', async () => {
      const list = [
        { id: 1, role: Role.OWNER, user: { id: 1, username: 'alice' } },
        { id: 2, role: Role.EDITOR, user: { id: 2, username: 'bob' } },
      ] as Membership[];
      membershipRepo.find.mockResolvedValue(list);

      const result = await service.listByTenant(1);

      expect(result).toEqual(list);
      expect(membershipRepo.find).toHaveBeenCalledWith({
        where: { tenant: { id: 1 } },
        relations: { user: true },
      });
    });
  });
});
