// 既存のサインアップ処理を直接呼ぶか、HTTP 経由で叩く簡易版
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/auth.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const auth = app.get(AuthService);

  try {
    await auth.signUp('e2e_user', 'e2e_pass');
    console.log('✅ e2e_user 作成');
  } catch (e) {
    console.log('ℹ️  e2e_user は既に存在します');
  }

  await app.close();
}

main();
