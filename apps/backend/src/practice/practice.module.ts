// apps/backend/src/practice/practice.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PracticeResolver } from './practice.resolver';
import { PracticeService } from './practice.service';
import { Practice } from './practice.model';
import { Comment } from './comment.model'; // 👈 追加
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { PracticeUser } from './user.model';
import { PracticeAuthService } from './practice-auth.service';
import { PracticeAuthResolver } from './practice-auth.resolver';
import { PracticeJwtStrategy } from './practice-jwt.strategy';

@Module({
  // 👇 配列の中に Comment を追加
  imports: [
    TypeOrmModule.forFeature([Practice, Comment]),
    // 1. UserエンティティをTypeORMに認識させる
    TypeOrmModule.forFeature([PracticeUser]),

    // 2. Passport（認証基盤）の基本設定
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // 3. JWT（チケット発行）の重要設定
    JwtModule.register({
      secret: 'MY_SECRET_KEY_12345', // 💡 本来は環境変数（.env）に隠すべき「秘密の合言葉」
      signOptions: { expiresIn: '1h' }, // 💡 チケットの有効期限（例：1時間）
    }),], 
  providers: [PracticeResolver, PracticeService,PracticeAuthService,
    PracticeAuthResolver,PracticeJwtStrategy,],
})
export class PracticeModule {}