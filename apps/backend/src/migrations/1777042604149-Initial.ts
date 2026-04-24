import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1777042604149 implements MigrationInterface {
    name = 'Initial1777042604149'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`submission\` (\`id\` int NOT NULL AUTO_INCREMENT, \`submittedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`respondentId\` varchar(255) NULL, \`surveyId\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`question_option\` (\`id\` int NOT NULL AUTO_INCREMENT, \`text\` varchar(255) NOT NULL, \`order\` int NOT NULL DEFAULT '0', \`questionId\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`answer\` (\`id\` int NOT NULL AUTO_INCREMENT, \`text\` varchar(255) NULL, \`questionId\` int NOT NULL, \`submissionId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`question\` (\`id\` int NOT NULL AUTO_INCREMENT, \`type\` varchar(255) NOT NULL DEFAULT 'TEXT', \`qtext\` varchar(255) NOT NULL, \`surveyId\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`survey_token\` (\`token\` varchar(36) NOT NULL, \`isUsed\` tinyint NOT NULL DEFAULT 0, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`expiredAt\` datetime NULL, \`surveyId\` int NOT NULL, PRIMARY KEY (\`token\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`survey\` (\`id\` int NOT NULL AUTO_INCREMENT, \`shareId\` varchar(36) NOT NULL, \`title\` varchar(255) NOT NULL, \`published\` tinyint NOT NULL DEFAULT 0, \`auth\` varchar(255) NOT NULL DEFAULT 'PUBLIC', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`ownerId\` int NOT NULL, UNIQUE INDEX \`IDX_76268d52f6deafc75cb9987c21\` (\`shareId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`user\` (\`id\` int NOT NULL AUTO_INCREMENT, \`username\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, UNIQUE INDEX \`IDX_78a916df40e02a9deb1c4b75ed\` (\`username\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`answer_selected_options_question_option\` (\`answerId\` int NOT NULL, \`questionOptionId\` int NOT NULL, INDEX \`IDX_7c36f35a3fcb6c5fe610023447\` (\`answerId\`), INDEX \`IDX_a28062e701efff0f2680f6eafd\` (\`questionOptionId\`), PRIMARY KEY (\`answerId\`, \`questionOptionId\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`submission\` ADD CONSTRAINT \`FK_445eeaad33ae6464ac85f6ea46b\` FOREIGN KEY (\`surveyId\`) REFERENCES \`survey\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`question_option\` ADD CONSTRAINT \`FK_ba19747af180520381a117f5986\` FOREIGN KEY (\`questionId\`) REFERENCES \`question\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`answer\` ADD CONSTRAINT \`FK_a4013f10cd6924793fbd5f0d637\` FOREIGN KEY (\`questionId\`) REFERENCES \`question\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`answer\` ADD CONSTRAINT \`FK_1398cb4bf7f1ccc37fa0dd538ff\` FOREIGN KEY (\`submissionId\`) REFERENCES \`submission\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`question\` ADD CONSTRAINT \`FK_a1188e0f702ab268e0982049e5c\` FOREIGN KEY (\`surveyId\`) REFERENCES \`survey\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`survey_token\` ADD CONSTRAINT \`FK_beeccb051103b4b15ee1ca81547\` FOREIGN KEY (\`surveyId\`) REFERENCES \`survey\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`survey\` ADD CONSTRAINT \`FK_a2e6e9ab8f1ff04cbf31da646e7\` FOREIGN KEY (\`ownerId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`answer_selected_options_question_option\` ADD CONSTRAINT \`FK_7c36f35a3fcb6c5fe6100234479\` FOREIGN KEY (\`answerId\`) REFERENCES \`answer\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`answer_selected_options_question_option\` ADD CONSTRAINT \`FK_a28062e701efff0f2680f6eafd1\` FOREIGN KEY (\`questionOptionId\`) REFERENCES \`question_option\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`answer_selected_options_question_option\` DROP FOREIGN KEY \`FK_a28062e701efff0f2680f6eafd1\``);
        await queryRunner.query(`ALTER TABLE \`answer_selected_options_question_option\` DROP FOREIGN KEY \`FK_7c36f35a3fcb6c5fe6100234479\``);
        await queryRunner.query(`ALTER TABLE \`survey\` DROP FOREIGN KEY \`FK_a2e6e9ab8f1ff04cbf31da646e7\``);
        await queryRunner.query(`ALTER TABLE \`survey_token\` DROP FOREIGN KEY \`FK_beeccb051103b4b15ee1ca81547\``);
        await queryRunner.query(`ALTER TABLE \`question\` DROP FOREIGN KEY \`FK_a1188e0f702ab268e0982049e5c\``);
        await queryRunner.query(`ALTER TABLE \`answer\` DROP FOREIGN KEY \`FK_1398cb4bf7f1ccc37fa0dd538ff\``);
        await queryRunner.query(`ALTER TABLE \`answer\` DROP FOREIGN KEY \`FK_a4013f10cd6924793fbd5f0d637\``);
        await queryRunner.query(`ALTER TABLE \`question_option\` DROP FOREIGN KEY \`FK_ba19747af180520381a117f5986\``);
        await queryRunner.query(`ALTER TABLE \`submission\` DROP FOREIGN KEY \`FK_445eeaad33ae6464ac85f6ea46b\``);
        await queryRunner.query(`DROP INDEX \`IDX_a28062e701efff0f2680f6eafd\` ON \`answer_selected_options_question_option\``);
        await queryRunner.query(`DROP INDEX \`IDX_7c36f35a3fcb6c5fe610023447\` ON \`answer_selected_options_question_option\``);
        await queryRunner.query(`DROP TABLE \`answer_selected_options_question_option\``);
        await queryRunner.query(`DROP INDEX \`IDX_78a916df40e02a9deb1c4b75ed\` ON \`user\``);
        await queryRunner.query(`DROP TABLE \`user\``);
        await queryRunner.query(`DROP INDEX \`IDX_76268d52f6deafc75cb9987c21\` ON \`survey\``);
        await queryRunner.query(`DROP TABLE \`survey\``);
        await queryRunner.query(`DROP TABLE \`survey_token\``);
        await queryRunner.query(`DROP TABLE \`question\``);
        await queryRunner.query(`DROP TABLE \`answer\``);
        await queryRunner.query(`DROP TABLE \`question_option\``);
        await queryRunner.query(`DROP TABLE \`submission\``);
    }

}
