// apps/backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import depthLimit from 'graphql-depth-limit';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { ConfigModule } from '@nestjs/config';
import { SurveyModule } from './survey/survey.module';
import { AuthModule } from './auth/auth.module';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: join(__dirname, '../../../.env'),
      isGlobal: true, // アプリ全体でどこからでも使えるようにする
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        autoLoadEntities: true,
        synchronize: false,
        migrationsRun: true, // 🚀 起動時に未実行のマイグレーションを自動実行
        migrations: [join(__dirname, 'migrations/*{.ts,.js}')], // マイグレーションファイルの場所
        logging: false,
      }),
      inject: [ConfigService],
    }),

    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'), // スキーマを自動生成
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
export class AppModule {}
