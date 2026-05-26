// apps/backend/src/app.module.ts
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import depthLimit from 'graphql-depth-limit';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { ConfigModule } from '@nestjs/config';
import { SurveyModule } from './survey/survey.module';
import { AuthModule } from './auth/auth.module';
import { ConfigService } from '@nestjs/config';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import cookieParser = require('cookie-parser');
import { ThrottlerModule } from '@nestjs/throttler';
import * as fs from 'fs';
import * as path from 'path';
import { TenantModule } from './tenant/tenant.module';
import { TenantMiddleware } from './tenant/middleware/tenant.middleware';
import { RequestMethod } from '@nestjs/common';

function findWorkspaceRoot(start: string = __dirname): string {
  let dir = start;
  while (dir !== path.dirname(dir)) {
    // turbo.json or package-lock.json などのマーカーで判定
    if (fs.existsSync(path.join(dir, 'turbo.json'))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error('workspace root not found');
}

const ROOT = findWorkspaceRoot();

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath:
        process.env.NODE_ENV === 'test'
          ? path.join(ROOT, '.env.test')
          : path.join(ROOT, '.env'),
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const isTest = process.env.NODE_ENV === 'test';
        return {
          type: 'mysql',
          host: configService.get<string>('DB_HOST'),
          port: configService.get<number>('DB_PORT'),
          username: configService.get<string>('DB_USERNAME'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_DATABASE'),
          autoLoadEntities: true,
          synchronize: isTest, // テスト時: Entityから自動生成
          migrationsRun: !isTest, // テスト時: マイグレーション不要
          migrations: [join(__dirname, 'migrations/*{.ts,.js}')],
          namingStrategy: new SnakeNamingStrategy(),
          logging: false,
        };
      },
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1_000, // 1秒間に
        limit: 10, // 10リクエスト
      },
      {
        name: 'medium',
        ttl: 60_000, // 1分間に
        limit: 100, // 100リクエスト
      },
      { name: 'default', ttl: 60_000, limit: 60 },
    ]),

    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      context: ({ req, res }: { req: Request; res: Response }) => ({
        req,
        res,
      }),
      validationRules: [depthLimit(5)],
      subscriptions: {
        'graphql-ws': true,
      },
    }),
    SurveyModule,
    AuthModule,
    TenantModule,
  ],
})
export class AppModule implements NestModule {
  // ★ 追加: middleware を設定
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(cookieParser()).forRoutes('*');
    consumer
      .apply(TenantMiddleware)
      .exclude({ path: 'health', method: RequestMethod.GET })
      .forRoutes('*');
  }
}
