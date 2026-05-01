// apps/backend/test/utils/db-cleaner.ts
import { DataSource } from 'typeorm';
import { INestApplication } from '@nestjs/common';

export async function cleanDatabase(app: INestApplication) {
  const dataSource = app.get(DataSource);
  const entities = dataSource.entityMetadatas;

  await dataSource.query('SET FOREIGN_KEY_CHECKS = 0;');
  for (const entity of entities) {
    // migrationsテーブルは消さない
    if (entity.tableName === 'migrations') continue;
    await dataSource.query(`TRUNCATE TABLE \`${entity.tableName}\`;`);
  }
  await dataSource.query('SET FOREIGN_KEY_CHECKS = 1;');
}
