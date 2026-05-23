import { MigrationInterface, QueryRunner } from 'typeorm';

export class Addmembership1779468187732 implements MigrationInterface {
  name = 'Addmembership1779468187732';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`membership\` (\`id\` int NOT NULL AUTO_INCREMENT, \`role\` enum ('OWNER', 'ADMIN', 'EDITOR', 'VIEWER') NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`user_id\` int NOT NULL, \`tenant_id\` int NOT NULL, UNIQUE INDEX \`IDX_f3da6dbeb0a5f3e83450045d59\` (\`user_id\`, \`tenant_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD \`display_name\` varchar(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`membership\` ADD CONSTRAINT \`FK_e9c72e8d29784031c96f5c6af8d\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`membership\` ADD CONSTRAINT \`FK_ccc7d9df9ca83f3a0cbc4686086\` FOREIGN KEY (\`tenant_id\`) REFERENCES \`tenant\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`membership\` DROP FOREIGN KEY \`FK_ccc7d9df9ca83f3a0cbc4686086\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`membership\` DROP FOREIGN KEY \`FK_e9c72e8d29784031c96f5c6af8d\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` DROP COLUMN \`display_name\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_f3da6dbeb0a5f3e83450045d59\` ON \`membership\``,
    );
    await queryRunner.query(`DROP TABLE \`membership\``);
  }
}
