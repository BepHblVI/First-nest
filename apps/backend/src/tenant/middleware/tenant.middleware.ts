// tenant/middleware/tenant.middleware.ts
import { Injectable, NestMiddleware, NotFoundException } from '@nestjs/common';
import { NextFunction } from 'express';
import { TenantService } from '../tenant.service';
import { Request as ExpressRequest } from 'express';

type TenantRequest = ExpressRequest & { tenantId: number };
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private tenantService: TenantService) {}

  async use(req: TenantRequest, res: Response, next: NextFunction) {
    const rawHost = req.headers.host ?? '';
    const host = rawHost.split(':')[0];
    const subdomain = host.split('.')[0];

    // ローカル開発用フォールバック（localhost の場合はヘッダーで代用）
    const slug =
      subdomain === 'localhost'
        ? (req.headers['x-tenant-slug'] as string)
        : subdomain;

    // 💡 ★ 予約語（api, www など）や、スラッグがない場合は
    // テナント特定をスキップして次の処理（共通機能）へ流す
    const reservedSlugs = ['www', 'api', 'admin', 'app', '127'];
    if (!slug || reservedSlugs.includes(slug)) {
      return next(); // tenantId はセットされないが、共通処理なのでOKとする
    }

    const tenant = await this.tenantService.findBySlug(slug);
    if (!tenant) throw new NotFoundException('テナントが存在しません');

    req.tenantId = tenant.id;
    next();
  }
}
