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
import cookieParser = require('cookie-parser');
import * as fs from 'fs';
import * as path from 'path';

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
        return {
          type: 'mysql',
          host: configService.get<string>('DB_HOST'),
          port: configService.get<number>('DB_PORT'),
          username: configService.get<string>('DB_USERNAME'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_DATABASE'),
          autoLoadEntities: true,
          synchronize: process.env.NODE_ENV === 'test',
          migrationsRun: true,
          migrations: [join(__dirname, 'migrations/*{.ts,.js}')],
          namingStrategy: new SnakeNamingStrategy(),
          logging: false,
        };
      },
      inject: [ConfigService],
    }),

    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      context: ({ req, res }) => ({ req, res }),
      validationRules: [depthLimit(5)],
      subscriptions: {
        'graphql-ws': true,
      },
    }),
    SurveyModule,
    AuthModule,
  ],
})
export class AppModule implements NestModule {
  // ★ 追加: middleware を設定
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(cookieParser()).forRoutes('*');
  }
}
