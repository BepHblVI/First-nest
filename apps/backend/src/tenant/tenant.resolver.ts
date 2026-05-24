// apps/backend/src/practice/practice.resolver.ts
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';

import { UseGuards } from '@nestjs/common';
import { SurveyAuthGuard } from '../auth/guards/auth.guard';
import { TenantService } from './tenant.service';
import { Tenant } from './models/tenant.model';
import { CreateTenantInput } from './dto/create-tenant.input';
import { MembershipService } from './membership.service';
import { Membership } from './models/membership.model';

@Resolver(() => Tenant)
export class TenantResolver {
  constructor(
    private readonly tenantService: TenantService,
    private readonly membershipServise: MembershipService,
  ) {}

  @Query()
  @UseGuards(SurveyAuthGuard)
  async findTenantBySlug(@Args('slug') slug: string): Promise<Tenant | null> {
    return this.tenantService.findBySlug(slug);
  }

  @Query()
  @UseGuards(SurveyAuthGuard)
  async findTenantById(@Args('id') id: number): Promise<Tenant | null> {
    return this.tenantService.findById(id);
  }

  @Query()
  @UseGuards(SurveyAuthGuard)
  async findMemberShipByUserAndTenant(
    @Args('userId') userId: number,
    @Args('tenantId') tenantId: number,
  ): Promise<Membership | null> {
    return this.membershipServise.findByUserAndTenant(userId, tenantId);
  }

  @Query()
  @UseGuards(SurveyAuthGuard)
  async listMemberShipByUser(
    @Args('userId') userId: number,
  ): Promise<Membership[]> {
    return this.membershipServise.listByUser(userId);
  }

  @Query()
  @UseGuards(SurveyAuthGuard)
  async listMemberShipByTenant(
    @Args('tenantId') tenantId: number,
  ): Promise<Membership[]> {
    return this.membershipServise.listByTenant(tenantId);
  }

  @Mutation()
  @UseGuards(SurveyAuthGuard)
  async createTenant(@Args('input') input: CreateTenantInput): Promise<Tenant> {
    return this.tenantService.createTenant(input);
  }
}
