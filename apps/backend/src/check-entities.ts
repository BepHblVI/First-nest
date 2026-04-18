// apps/backend/src/check-entities.ts
import { AppDataSource } from './data-source';

async function check() {
  console.log('=== 登録エンティティ ===');
  const entities = AppDataSource.options.entities;
  if (Array.isArray(entities)) {
    entities.forEach((entity) => {
      if (typeof entity === 'function') {
        console.log(' ', entity.name);
      } else {
        console.log(' ', entity);
      }
    });
  } else {
    console.log('entities が配列ではありません:', typeof entities);
  }

  try {
    await AppDataSource.initialize();
    console.log('\n✅ DB接続成功');

    console.log('\n=== テーブル情報 ===');
    const metadatas = AppDataSource.entityMetadatas;
    metadatas.forEach((meta) => {
      console.log(`\n📋 ${meta.tableName}`);
      meta.columns.forEach((col) => {
        console.log(`   - ${col.propertyName} (${col.type})`);
      });
    });

    const tables = await AppDataSource.query('SHOW TABLES');
    console.log('\n=== DB内の既存テーブル ===');
    console.log(tables);
  } catch (err: any) {
    console.log('❌ エラー:', err.message);
  } finally {
    await AppDataSource.destroy();
  }
}

check();
