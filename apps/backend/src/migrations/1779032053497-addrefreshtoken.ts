import { MigrationInterface, QueryRunner } from 'typeorm';

export class Addrefreshtoken1779032053497 implements MigrationInterface {
  name = 'Addrefreshtoken1779032053497';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`refresh_token\` (\`id\` varchar(36) NOT NULL, \`token_hash\` varchar(64) NOT NULL, \`expires_at\` timestamp NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`revoked\` tinyint NOT NULL DEFAULT 0, \`replaced_by_token_id\` varchar(36) NULL, \`user_agent\` varchar(255) NULL, \`ip\` varchar(45) NULL, \`user_id\` int NOT NULL, UNIQUE INDEX \`IDX_f0812282fad2e352cdaf83ef0a\` (\`token_hash\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`refresh_token\` ADD CONSTRAINT \`FK_6bbe63d2fe75e7f0ba1710351d4\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`refresh_token\` DROP FOREIGN KEY \`FK_6bbe63d2fe75e7f0ba1710351d4\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_f0812282fad2e352cdaf83ef0a\` ON \`refresh_token\``,
    );
    await queryRunner.query(`DROP TABLE \`refresh_token\``);
  }
}
