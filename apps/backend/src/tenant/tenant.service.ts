import { ConflictException, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Tenant } from './models/tenant.model';
import { CreateTenantInput } from './dto/create-tenant.input';
import { RESERVED_SLUGS } from './constants/reserved-slug';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private tenantRepo: Repository<Tenant>,
  ) {}
  async createTenant(input: CreateTenantInput): Promise<Tenant> {
    if (RESERVED_SLUGS.includes(input.slug))
      throw new ConflictException('このスラッグは使用できません');
    const existtenant = await this.tenantRepo.findOne({
      where: { slug: input.slug },
    });
    if (existtenant)
      throw new ConflictException('すでに同じスラッグが存在しています');
    const tenant = this.tenantRepo.create({
      slug: input.slug,
      name: input.name,
    });
    return this.tenantRepo.save(tenant);
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    const tenant = await this.tenantRepo.findOne({
      where: { slug },
    });
    return tenant;
  }

  async findById(id: number): Promise<Tenant | null> {
    const tenant = await this.tenantRepo.findOne({
      where: { id: id },
    });
    return tenant;
  }
}
