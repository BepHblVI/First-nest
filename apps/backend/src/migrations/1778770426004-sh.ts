import { MigrationInterface, QueryRunner } from 'typeorm';

export class Sh1778770426004 implements MigrationInterface {
  name = 'Sh1778770426004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`submission\` DROP FOREIGN KEY \`FK_445eeaad33ae6464ac85f6ea46b\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`question_option\` DROP FOREIGN KEY \`FK_ba19747af180520381a117f5986\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`answer\` DROP FOREIGN KEY \`FK_1398cb4bf7f1ccc37fa0dd538ff\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`answer\` DROP FOREIGN KEY \`FK_a4013f10cd6924793fbd5f0d637\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`question\` DROP FOREIGN KEY \`FK_a1188e0f702ab268e0982049e5c\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`survey_token\` DROP FOREIGN KEY \`FK_beeccb051103b4b15ee1ca81547\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`survey\` DROP FOREIGN KEY \`FK_a2e6e9ab8f1ff04cbf31da646e7\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_445eeaad33ae6464ac85f6ea46\` ON \`submission\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_582d54297f4ff9a31ab6f1687d\` ON \`question_option\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_1398cb4bf7f1ccc37fa0dd538f\` ON \`answer\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_a4013f10cd6924793fbd5f0d63\` ON \`answer\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_732897cb2040002751d3dedabc\` ON \`question\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_aab02160c310f95a4680c7033b\` ON \`survey_token\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_beeccb051103b4b15ee1ca8154\` ON \`survey_token\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_76268d52f6deafc75cb9987c21\` ON \`survey\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_a2e6e9ab8f1ff04cbf31da646e\` ON \`survey\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`question_option\` CHANGE \`questionId\` \`question_id\` int NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`question\` CHANGE \`surveyId\` \`survey_id\` int NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`submission\` DROP COLUMN \`respondentId\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`submission\` DROP COLUMN \`submittedAt\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`submission\` DROP COLUMN \`surveyId\``,
    );
    await queryRunner.query(`ALTER TABLE \`answer\` DROP COLUMN \`createdAt\``);
    await queryRunner.query(
      `ALTER TABLE \`answer\` DROP COLUMN \`questionId\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`answer\` DROP COLUMN \`submissionId\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`survey_token\` DROP COLUMN \`createdAt\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`survey_token\` DROP COLUMN \`isUsed\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`survey_token\` DROP COLUMN \`surveyId\``,
    );
    await queryRunner.query(`ALTER TABLE \`survey\` DROP COLUMN \`createdAt\``);
    await queryRunner.query(`ALTER TABLE \`survey\` DROP COLUMN \`ownerId\``);
    await queryRunner.query(`ALTER TABLE \`survey\` DROP COLUMN \`shareId\``);
    await queryRunner.query(`ALTER TABLE \`survey\` DROP COLUMN \`updatedAt\``);
    await queryRunner.query(
      `ALTER TABLE \`submission\` ADD \`submitted_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`submission\` ADD \`respondent_id\` varchar(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`submission\` ADD \`survey_id\` int NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`answer\` ADD \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`answer\` ADD \`question_id\` int NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`answer\` ADD \`submission_id\` int NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`survey_token\` ADD \`is_used\` tinyint NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE \`survey_token\` ADD \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`survey_token\` ADD \`survey_id\` int NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`survey\` ADD \`share_id\` varchar(36) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`survey\` ADD UNIQUE INDEX \`IDX_5294383ae2244a90612a681883\` (\`share_id\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`survey\` ADD \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`survey\` ADD \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`survey\` ADD \`owner_id\` int NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_a7cb7a8716f01cc5f73ccbc594\` ON \`submission\` (\`survey_id\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_6aaa48b4788f7f99210d3bce92\` ON \`question_option\` (\`question_id\`, \`order\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_c3d19a89541e4f0813f2fe0919\` ON \`answer\` (\`question_id\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_83373a8dab1b67c46bb813e86e\` ON \`answer\` (\`submission_id\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_b38a3cdf1ccc1098f2d8757bd8\` ON \`question\` (\`survey_id\`, \`order\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_fc20e76ece85282732bc26223b\` ON \`survey_token\` (\`is_used\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_367730178794cb6266d0c08500\` ON \`survey_token\` (\`survey_id\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_ec8daff33708a5bc68df09e8fe\` ON \`survey\` (\`owner_id\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`submission\` ADD CONSTRAINT \`FK_a7cb7a8716f01cc5f73ccbc5946\` FOREIGN KEY (\`survey_id\`) REFERENCES \`survey\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`question_option\` ADD CONSTRAINT \`FK_747190c37a39feced5efcbb303f\` FOREIGN KEY (\`question_id\`) REFERENCES \`question\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`answer\` ADD CONSTRAINT \`FK_c3d19a89541e4f0813f2fe09194\` FOREIGN KEY (\`question_id\`) REFERENCES \`question\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`answer\` ADD CONSTRAINT \`FK_83373a8dab1b67c46bb813e86e1\` FOREIGN KEY (\`submission_id\`) REFERENCES \`submission\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`question\` ADD CONSTRAINT \`FK_a74e5e8dfbf68d7d1cd39c8c9fc\` FOREIGN KEY (\`survey_id\`) REFERENCES \`survey\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`survey_token\` ADD CONSTRAINT \`FK_367730178794cb6266d0c08500d\` FOREIGN KEY (\`survey_id\`) REFERENCES \`survey\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`survey\` ADD CONSTRAINT \`FK_ec8daff33708a5bc68df09e8fe5\` FOREIGN KEY (\`owner_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`survey\` DROP FOREIGN KEY \`FK_ec8daff33708a5bc68df09e8fe5\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`survey_token\` DROP FOREIGN KEY \`FK_367730178794cb6266d0c08500d\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`question\` DROP FOREIGN KEY \`FK_a74e5e8dfbf68d7d1cd39c8c9fc\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`answer\` DROP FOREIGN KEY \`FK_83373a8dab1b67c46bb813e86e1\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`answer\` DROP FOREIGN KEY \`FK_c3d19a89541e4f0813f2fe09194\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`question_option\` DROP FOREIGN KEY \`FK_747190c37a39feced5efcbb303f\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`submission\` DROP FOREIGN KEY \`FK_a7cb7a8716f01cc5f73ccbc5946\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_ec8daff33708a5bc68df09e8fe\` ON \`survey\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_367730178794cb6266d0c08500\` ON \`survey_token\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_fc20e76ece85282732bc26223b\` ON \`survey_token\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_b38a3cdf1ccc1098f2d8757bd8\` ON \`question\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_83373a8dab1b67c46bb813e86e\` ON \`answer\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_c3d19a89541e4f0813f2fe0919\` ON \`answer\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_6aaa48b4788f7f99210d3bce92\` ON \`question_option\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_a7cb7a8716f01cc5f73ccbc594\` ON \`submission\``,
    );
    await queryRunner.query(`ALTER TABLE \`survey\` DROP COLUMN \`owner_id\``);
    await queryRunner.query(
      `ALTER TABLE \`survey\` DROP COLUMN \`updated_at\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`survey\` DROP COLUMN \`created_at\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`survey\` DROP INDEX \`IDX_5294383ae2244a90612a681883\``,
    );
    await queryRunner.query(`ALTER TABLE \`survey\` DROP COLUMN \`share_id\``);
    await queryRunner.query(
      `ALTER TABLE \`survey_token\` DROP COLUMN \`survey_id\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`survey_token\` DROP COLUMN \`created_at\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`survey_token\` DROP COLUMN \`is_used\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`answer\` DROP COLUMN \`submission_id\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`answer\` DROP COLUMN \`question_id\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`answer\` DROP COLUMN \`created_at\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`submission\` DROP COLUMN \`survey_id\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`submission\` DROP COLUMN \`respondent_id\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`submission\` DROP COLUMN \`submitted_at\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`survey\` ADD \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`survey\` ADD \`shareId\` varchar(36) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`survey\` ADD \`ownerId\` int NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`survey\` ADD \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`survey_token\` ADD \`surveyId\` int NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`survey_token\` ADD \`isUsed\` tinyint NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`survey_token\` ADD \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`answer\` ADD \`submissionId\` int NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`answer\` ADD \`questionId\` int NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`answer\` ADD \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`submission\` ADD \`surveyId\` int NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`submission\` ADD \`submittedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`submission\` ADD \`respondentId\` varchar(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`question\` CHANGE \`survey_id\` \`surveyId\` int NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`question_option\` CHANGE \`question_id\` \`questionId\` int NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_a2e6e9ab8f1ff04cbf31da646e\` ON \`survey\` (\`ownerId\`)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`IDX_76268d52f6deafc75cb9987c21\` ON \`survey\` (\`shareId\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_beeccb051103b4b15ee1ca8154\` ON \`survey_token\` (\`surveyId\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_aab02160c310f95a4680c7033b\` ON \`survey_token\` (\`isUsed\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_732897cb2040002751d3dedabc\` ON \`question\` (\`surveyId\`, \`order\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_a4013f10cd6924793fbd5f0d63\` ON \`answer\` (\`questionId\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_1398cb4bf7f1ccc37fa0dd538f\` ON \`answer\` (\`submissionId\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_582d54297f4ff9a31ab6f1687d\` ON \`question_option\` (\`questionId\`, \`order\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_445eeaad33ae6464ac85f6ea46\` ON \`submission\` (\`surveyId\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`survey\` ADD CONSTRAINT \`FK_a2e6e9ab8f1ff04cbf31da646e7\` FOREIGN KEY (\`ownerId\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`survey_token\` ADD CONSTRAINT \`FK_beeccb051103b4b15ee1ca81547\` FOREIGN KEY (\`surveyId\`) REFERENCES \`survey\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`question\` ADD CONSTRAINT \`FK_a1188e0f702ab268e0982049e5c\` FOREIGN KEY (\`surveyId\`) REFERENCES \`survey\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`answer\` ADD CONSTRAINT \`FK_a4013f10cd6924793fbd5f0d637\` FOREIGN KEY (\`questionId\`) REFERENCES \`question\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`answer\` ADD CONSTRAINT \`FK_1398cb4bf7f1ccc37fa0dd538ff\` FOREIGN KEY (\`submissionId\`) REFERENCES \`submission\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`question_option\` ADD CONSTRAINT \`FK_ba19747af180520381a117f5986\` FOREIGN KEY (\`questionId\`) REFERENCES \`question\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`submission\` ADD CONSTRAINT \`FK_445eeaad33ae6464ac85f6ea46b\` FOREIGN KEY (\`surveyId\`) REFERENCES \`survey\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
