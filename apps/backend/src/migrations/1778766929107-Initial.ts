import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial1778766929107 implements MigrationInterface {
  name = 'Initial1778766929107';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`submission\` (\`id\` int NOT NULL AUTO_INCREMENT, \`submittedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`respondentId\` varchar(100) NULL, \`surveyId\` int NOT NULL, INDEX \`IDX_445eeaad33ae6464ac85f6ea46\` (\`surveyId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`question_option\` (\`id\` int NOT NULL AUTO_INCREMENT, \`text\` varchar(200) NOT NULL, \`order\` int NOT NULL, \`questionId\` int NOT NULL, INDEX \`IDX_582d54297f4ff9a31ab6f1687d\` (\`questionId\`, \`order\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`answer\` (\`id\` int NOT NULL AUTO_INCREMENT, \`text\` text NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`questionId\` int NOT NULL, \`submissionId\` int NOT NULL, INDEX \`IDX_a4013f10cd6924793fbd5f0d63\` (\`questionId\`), INDEX \`IDX_1398cb4bf7f1ccc37fa0dd538f\` (\`submissionId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`question\` (\`id\` int NOT NULL AUTO_INCREMENT, \`order\` int NOT NULL, \`qtext\` varchar(500) NOT NULL, \`type\` enum ('TEXT', 'SINGLE', 'MULTIPLE') NOT NULL, \`required\` tinyint NOT NULL DEFAULT 0, \`surveyId\` int NOT NULL, INDEX \`IDX_732897cb2040002751d3dedabc\` (\`surveyId\`, \`order\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`survey_token\` (\`token\` varchar(36) NOT NULL, \`isUsed\` tinyint NOT NULL DEFAULT 0, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`surveyId\` int NOT NULL, INDEX \`IDX_aab02160c310f95a4680c7033b\` (\`isUsed\`), INDEX \`IDX_beeccb051103b4b15ee1ca8154\` (\`surveyId\`), PRIMARY KEY (\`token\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`survey\` (\`id\` int NOT NULL AUTO_INCREMENT, \`shareId\` varchar(36) NOT NULL, \`title\` varchar(200) NOT NULL, \`published\` tinyint NOT NULL DEFAULT 0, \`auth\` enum ('PUBLIC', 'PRIVATE') NOT NULL DEFAULT 'PUBLIC', \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`ownerId\` int NOT NULL, INDEX \`IDX_a2e6e9ab8f1ff04cbf31da646e\` (\`ownerId\`), UNIQUE INDEX \`IDX_76268d52f6deafc75cb9987c21\` (\`shareId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`user\` (\`id\` int NOT NULL AUTO_INCREMENT, \`username\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, UNIQUE INDEX \`IDX_78a916df40e02a9deb1c4b75ed\` (\`username\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`answer_options\` (\`answer_id\` int NOT NULL, \`option_id\` int NOT NULL, INDEX \`IDX_c9e3904ebdcfc37c86dfcd3f9a\` (\`answer_id\`), INDEX \`IDX_a471e2b4413da05fecea7b9e82\` (\`option_id\`), PRIMARY KEY (\`answer_id\`, \`option_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`submission\` ADD CONSTRAINT \`FK_445eeaad33ae6464ac85f6ea46b\` FOREIGN KEY (\`surveyId\`) REFERENCES \`survey\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`question_option\` ADD CONSTRAINT \`FK_ba19747af180520381a117f5986\` FOREIGN KEY (\`questionId\`) REFERENCES \`question\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`answer\` ADD CONSTRAINT \`FK_a4013f10cd6924793fbd5f0d637\` FOREIGN KEY (\`questionId\`) REFERENCES \`question\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`answer\` ADD CONSTRAINT \`FK_1398cb4bf7f1ccc37fa0dd538ff\` FOREIGN KEY (\`submissionId\`) REFERENCES \`submission\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`question\` ADD CONSTRAINT \`FK_a1188e0f702ab268e0982049e5c\` FOREIGN KEY (\`surveyId\`) REFERENCES \`survey\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`survey_token\` ADD CONSTRAINT \`FK_beeccb051103b4b15ee1ca81547\` FOREIGN KEY (\`surveyId\`) REFERENCES \`survey\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`survey\` ADD CONSTRAINT \`FK_a2e6e9ab8f1ff04cbf31da646e7\` FOREIGN KEY (\`ownerId\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`answer_options\` ADD CONSTRAINT \`FK_c9e3904ebdcfc37c86dfcd3f9a3\` FOREIGN KEY (\`answer_id\`) REFERENCES \`answer\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`answer_options\` ADD CONSTRAINT \`FK_a471e2b4413da05fecea7b9e828\` FOREIGN KEY (\`option_id\`) REFERENCES \`question_option\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`answer_options\` DROP FOREIGN KEY \`FK_a471e2b4413da05fecea7b9e828\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`answer_options\` DROP FOREIGN KEY \`FK_c9e3904ebdcfc37c86dfcd3f9a3\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`survey\` DROP FOREIGN KEY \`FK_a2e6e9ab8f1ff04cbf31da646e7\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`survey_token\` DROP FOREIGN KEY \`FK_beeccb051103b4b15ee1ca81547\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`question\` DROP FOREIGN KEY \`FK_a1188e0f702ab268e0982049e5c\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`answer\` DROP FOREIGN KEY \`FK_1398cb4bf7f1ccc37fa0dd538ff\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`answer\` DROP FOREIGN KEY \`FK_a4013f10cd6924793fbd5f0d637\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`question_option\` DROP FOREIGN KEY \`FK_ba19747af180520381a117f5986\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`submission\` DROP FOREIGN KEY \`FK_445eeaad33ae6464ac85f6ea46b\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_a471e2b4413da05fecea7b9e82\` ON \`answer_options\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_c9e3904ebdcfc37c86dfcd3f9a\` ON \`answer_options\``,
    );
    await queryRunner.query(`DROP TABLE \`answer_options\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_78a916df40e02a9deb1c4b75ed\` ON \`user\``,
    );
    await queryRunner.query(`DROP TABLE \`user\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_76268d52f6deafc75cb9987c21\` ON \`survey\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_a2e6e9ab8f1ff04cbf31da646e\` ON \`survey\``,
    );
    await queryRunner.query(`DROP TABLE \`survey\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_beeccb051103b4b15ee1ca8154\` ON \`survey_token\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_aab02160c310f95a4680c7033b\` ON \`survey_token\``,
    );
    await queryRunner.query(`DROP TABLE \`survey_token\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_732897cb2040002751d3dedabc\` ON \`question\``,
    );
    await queryRunner.query(`DROP TABLE \`question\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_1398cb4bf7f1ccc37fa0dd538f\` ON \`answer\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_a4013f10cd6924793fbd5f0d63\` ON \`answer\``,
    );
    await queryRunner.query(`DROP TABLE \`answer\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_582d54297f4ff9a31ab6f1687d\` ON \`question_option\``,
    );
    await queryRunner.query(`DROP TABLE \`question_option\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_445eeaad33ae6464ac85f6ea46\` ON \`submission\``,
    );
    await queryRunner.query(`DROP TABLE \`submission\``);
  }
}
