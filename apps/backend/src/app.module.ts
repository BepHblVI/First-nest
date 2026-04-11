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

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env.local', // 読み込むファイルを指定
      isGlobal: true,            // アプリ全体でどこからでも使えるようにする
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',      // MySQLが動いているサーバー（WSL内ならlocalhost）
      port: 3306,             // MySQLのデフォルトポート
      username: 'root',       // ご自身のMySQLのユーザー名に変更してください
      password: 'password',   // ご自身のMySQLのパスワードに変更してください
      database: 'practice_db',// 使用するデータベース名（あらかじめMySQLに作っておく必要があります）
      autoLoadEntities: true, // モジュールで登録したエンティティを自動で読み込む
      synchronize: true,      // 【重要】エンティティの変更を自動でDBのテーブルに反映する（※開発環境のみ）
      logging: true,          // 【便利】裏で発行されたSQLをターミナルに表示する
    }),

    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'), // スキーマを自動生成
      context: ({ req, res }) => ({ req, res }),
      validationRules: [depthLimit(5)],
    }),
    SurveyModule,AuthModule,
  ],
})
export class AppModule {}