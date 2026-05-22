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
    throw new Error('Not implemented');
  }

  async listByUser(userId: number): Promise<Membership[]> {
    throw new Error('Not implemented');
  }

  async listByTenant(tenantId: number): Promise<Membership[]> {
    throw new Error('Not implemented');
  }
}
