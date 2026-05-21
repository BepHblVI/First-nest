import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Tenant } from './tenant.model';
import { CreateTenantInput } from './dto/create-tenant.input';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private tenantRepo: Repository<Tenant>,
  ) {}
  async createTenant(input: CreateTenantInput): Promise<Tenant> {
    throw new Error('Not implemented');
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    throw new Error('Not implemented');
  }

  async findById(id: number): Promise<Tenant | null> {
    throw new Error('Not implemented');
  }
}
