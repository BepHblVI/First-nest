// apps/backend/src/practice/practice.module.ts
import { Module } from '@nestjs/common';
import { PracticeResolver } from './practice.resolver';
import { PracticeService } from './practice.service'; // 👈 追加

@Module({
  // providers に Resolver と Service の両方を入れます
  providers: [PracticeResolver, PracticeService],
})
export class PracticeModule {}