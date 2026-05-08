import { MigrationInterface, QueryRunner } from "typeorm";

export class Sh1778234568385 implements MigrationInterface {
    name = 'Sh1778234568385'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`submission\` DROP FOREIGN KEY \`FK_445eeaad33ae6464ac85f6ea46b\``);
        await queryRunner.query(`ALTER TABLE \`answer\` DROP FOREIGN KEY \`FK_1398cb4bf7f1ccc37fa0dd538ff\``);
        await queryRunner.query(`ALTER TABLE \`survey\` DROP FOREIGN KEY \`FK_a2e6e9ab8f1ff04cbf31da646e7\``);
        await queryRunner.query(`CREATE TABLE \`answer_selected_options\` (\`answer_id\` int NOT NULL, \`option_id\` int NOT NULL, INDEX \`IDX_8f1148495346cc95a5d41b0f29\` (\`answer_id\`), INDEX \`IDX_f2539507675a756c9fb82b1b7d\` (\`option_id\`), PRIMARY KEY (\`answer_id\`, \`option_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`survey_token\` DROP COLUMN \`expiredAt\``);
        await queryRunner.query(`ALTER TABLE \`question_option\` ADD \`order\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`answer\` ADD \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`question\` ADD \`order\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`submission\` DROP COLUMN \`submittedAt\``);
        await queryRunner.query(`ALTER TABLE \`submission\` ADD \`submittedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`submission\` DROP COLUMN \`respondentId\``);
        await queryRunner.query(`ALTER TABLE \`submission\` ADD \`respondentId\` varchar(100) NULL`);
        await queryRunner.query(`ALTER TABLE \`question_option\` DROP COLUMN \`text\``);
        await queryRunner.query(`ALTER TABLE \`question_option\` ADD \`text\` varchar(200) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`answer\` DROP COLUMN \`text\``);
        await queryRunner.query(`ALTER TABLE \`answer\` ADD \`text\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`answer\` CHANGE \`submissionId\` \`submissionId\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`question\` DROP COLUMN \`qtext\``);
        await queryRunner.query(`ALTER TABLE \`question\` ADD \`qtext\` varchar(500) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`survey_token\` DROP COLUMN \`createdAt\``);
        await queryRunner.query(`ALTER TABLE \`survey_token\` ADD \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`survey\` DROP COLUMN \`title\``);
        await queryRunner.query(`ALTER TABLE \`survey\` ADD \`title\` varchar(200) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`survey\` DROP COLUMN \`createdAt\``);
        await queryRunner.query(`ALTER TABLE \`survey\` ADD \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`survey\` DROP COLUMN \`updatedAt\``);
        await queryRunner.query(`ALTER TABLE \`survey\` ADD \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`CREATE INDEX \`IDX_445eeaad33ae6464ac85f6ea46\` ON \`submission\` (\`surveyId\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_582d54297f4ff9a31ab6f1687d\` ON \`question_option\` (\`questionId\`, \`order\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_a4013f10cd6924793fbd5f0d63\` ON \`answer\` (\`questionId\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_1398cb4bf7f1ccc37fa0dd538f\` ON \`answer\` (\`submissionId\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_732897cb2040002751d3dedabc\` ON \`question\` (\`surveyId\`, \`order\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_aab02160c310f95a4680c7033b\` ON \`survey_token\` (\`isUsed\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_beeccb051103b4b15ee1ca8154\` ON \`survey_token\` (\`surveyId\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_a2e6e9ab8f1ff04cbf31da646e\` ON \`survey\` (\`ownerId\`)`);
        await queryRunner.query(`ALTER TABLE \`submission\` ADD CONSTRAINT \`FK_445eeaad33ae6464ac85f6ea46b\` FOREIGN KEY (\`surveyId\`) REFERENCES \`survey\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`answer\` ADD CONSTRAINT \`FK_1398cb4bf7f1ccc37fa0dd538ff\` FOREIGN KEY (\`submissionId\`) REFERENCES \`submission\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`survey\` ADD CONSTRAINT \`FK_a2e6e9ab8f1ff04cbf31da646e7\` FOREIGN KEY (\`ownerId\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`answer_selected_options\` ADD CONSTRAINT \`FK_8f1148495346cc95a5d41b0f293\` FOREIGN KEY (\`answer_id\`) REFERENCES \`answer\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`answer_selected_options\` ADD CONSTRAINT \`FK_f2539507675a756c9fb82b1b7d6\` FOREIGN KEY (\`option_id\`) REFERENCES \`question_option\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`answer_selected_options\` DROP FOREIGN KEY \`FK_f2539507675a756c9fb82b1b7d6\``);
        await queryRunner.query(`ALTER TABLE \`answer_selected_options\` DROP FOREIGN KEY \`FK_8f1148495346cc95a5d41b0f293\``);
        await queryRunner.query(`ALTER TABLE \`survey\` DROP FOREIGN KEY \`FK_a2e6e9ab8f1ff04cbf31da646e7\``);
        await queryRunner.query(`ALTER TABLE \`answer\` DROP FOREIGN KEY \`FK_1398cb4bf7f1ccc37fa0dd538ff\``);
        await queryRunner.query(`ALTER TABLE \`submission\` DROP FOREIGN KEY \`FK_445eeaad33ae6464ac85f6ea46b\``);
        await queryRunner.query(`DROP INDEX \`IDX_a2e6e9ab8f1ff04cbf31da646e\` ON \`survey\``);
        await queryRunner.query(`DROP INDEX \`IDX_beeccb051103b4b15ee1ca8154\` ON \`survey_token\``);
        await queryRunner.query(`DROP INDEX \`IDX_aab02160c310f95a4680c7033b\` ON \`survey_token\``);
        await queryRunner.query(`DROP INDEX \`IDX_732897cb2040002751d3dedabc\` ON \`question\``);
        await queryRunner.query(`DROP INDEX \`IDX_1398cb4bf7f1ccc37fa0dd538f\` ON \`answer\``);
        await queryRunner.query(`DROP INDEX \`IDX_a4013f10cd6924793fbd5f0d63\` ON \`answer\``);
        await queryRunner.query(`DROP INDEX \`IDX_582d54297f4ff9a31ab6f1687d\` ON \`question_option\``);
        await queryRunner.query(`DROP INDEX \`IDX_445eeaad33ae6464ac85f6ea46\` ON \`submission\``);
        await queryRunner.query(`ALTER TABLE \`survey\` DROP COLUMN \`updatedAt\``);
        await queryRunner.query(`ALTER TABLE \`survey\` ADD \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`survey\` DROP COLUMN \`createdAt\``);
        await queryRunner.query(`ALTER TABLE \`survey\` ADD \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`survey\` DROP COLUMN \`title\``);
        await queryRunner.query(`ALTER TABLE \`survey\` ADD \`title\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`survey_token\` DROP COLUMN \`createdAt\``);
        await queryRunner.query(`ALTER TABLE \`survey_token\` ADD \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`question\` DROP COLUMN \`qtext\``);
        await queryRunner.query(`ALTER TABLE \`question\` ADD \`qtext\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`answer\` CHANGE \`submissionId\` \`submissionId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`answer\` DROP COLUMN \`text\``);
        await queryRunner.query(`ALTER TABLE \`answer\` ADD \`text\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`question_option\` DROP COLUMN \`text\``);
        await queryRunner.query(`ALTER TABLE \`question_option\` ADD \`text\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`submission\` DROP COLUMN \`respondentId\``);
        await queryRunner.query(`ALTER TABLE \`submission\` ADD \`respondentId\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`submission\` DROP COLUMN \`submittedAt\``);
        await queryRunner.query(`ALTER TABLE \`submission\` ADD \`submittedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`question\` DROP COLUMN \`order\``);
        await queryRunner.query(`ALTER TABLE \`answer\` DROP COLUMN \`createdAt\``);
        await queryRunner.query(`ALTER TABLE \`question_option\` DROP COLUMN \`order\``);
        await queryRunner.query(`ALTER TABLE \`survey_token\` ADD \`expiredAt\` datetime NULL`);
        await queryRunner.query(`DROP INDEX \`IDX_f2539507675a756c9fb82b1b7d\` ON \`answer_selected_options\``);
        await queryRunner.query(`DROP INDEX \`IDX_8f1148495346cc95a5d41b0f29\` ON \`answer_selected_options\``);
        await queryRunner.query(`DROP TABLE \`answer_selected_options\``);
        await queryRunner.query(`ALTER TABLE \`survey\` ADD CONSTRAINT \`FK_a2e6e9ab8f1ff04cbf31da646e7\` FOREIGN KEY (\`ownerId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`answer\` ADD CONSTRAINT \`FK_1398cb4bf7f1ccc37fa0dd538ff\` FOREIGN KEY (\`submissionId\`) REFERENCES \`submission\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`submission\` ADD CONSTRAINT \`FK_445eeaad33ae6464ac85f6ea46b\` FOREIGN KEY (\`surveyId\`) REFERENCES \`survey\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
