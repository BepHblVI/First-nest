// apps/backend/src/practice/practice.resolver.ts
import {
  Resolver,
  Query,
  Mutation,
  Args,
  Int,
  ResolveField, // ← 追加
  Parent, // ← 追加
} from '@nestjs/graphql';

import { UseGuards, UseInterceptors } from '@nestjs/common';
import { SurveyAuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/helpers/current-user.decorator';
import { User } from '../auth/models/user.model';
import { TenantService } from './tenant.service';
import { Tenant } from './models/tenant.model';

@Resolver(() => Tenant)
export class TenantResolver {
  constructor(private readonly tenantService: TenantService) {}
}
