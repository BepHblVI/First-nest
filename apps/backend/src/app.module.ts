// apps/backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { PracticeModule } from './practice/practice.module'; // 👈 追加

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'), // スキーマを自動生成
    }),
    PracticeModule, // 👈 ここに追加！
  ],
})
export class AppModule {}