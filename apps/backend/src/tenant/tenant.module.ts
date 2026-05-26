import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './models/tenant.model';
import { Membership } from './models/membership.model';
import { TenantService } from './tenant.service';
import { MembershipService } from './membership.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, Membership])],
  providers: [TenantService, MembershipService],
  exports: [TenantService, MembershipService, TypeOrmModule],
})
export class TenantModule {}
