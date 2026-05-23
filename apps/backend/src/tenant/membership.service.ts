import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Membership } from './models/membership.model';

@Injectable()
export class MembershipService {
  constructor(
    @InjectRepository(Membership)
    private membershipRepo: Repository<Membership>,
  ) {}

  async findByUserAndTenant(
    userId: number,
    tenantId: number,
  ): Promise<Membership | null> {
    return this.membershipRepo.findOne({
      where: { user: { id: userId }, tenant: { id: tenantId } },
    });
  }

  async listByUser(userId: number): Promise<Membership[]> {
    return this.membershipRepo.find({
      where: { user: { id: userId } },
      relations: { tenant: true },
    });
  }

  async listByTenant(tenantId: number): Promise<Membership[]> {
    return this.membershipRepo.find({
      where: { tenant: { id: tenantId } },
      relations: { user: true },
    });
  }
}
