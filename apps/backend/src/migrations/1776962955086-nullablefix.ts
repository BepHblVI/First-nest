import { MigrationInterface, QueryRunner } from "typeorm";

export class Nullablefix1776962955086 implements MigrationInterface {
    name = 'Nullablefix1776962955086'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`submission\` DROP FOREIGN KEY \`FK_445eeaad33ae6464ac85f6ea46b\``);
        await queryRunner.query(`ALTER TABLE \`submission\` CHANGE \`surveyId\` \`surveyId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`question_option\` DROP FOREIGN KEY \`FK_ba19747af180520381a117f5986\``);
        await queryRunner.query(`ALTER TABLE \`question_option\` CHANGE \`questionId\` \`questionId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`answer\` DROP FOREIGN KEY \`FK_a4013f10cd6924793fbd5f0d637\``);
        await queryRunner.query(`ALTER TABLE \`answer\` DROP FOREIGN KEY \`FK_1398cb4bf7f1ccc37fa0dd538ff\``);
        await queryRunner.query(`ALTER TABLE \`answer\` CHANGE \`questionId\` \`questionId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`answer\` CHANGE \`submissionId\` \`submissionId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`question\` DROP FOREIGN KEY \`FK_a1188e0f702ab268e0982049e5c\``);
        await queryRunner.query(`ALTER TABLE \`question\` CHANGE \`surveyId\` \`surveyId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`survey_token\` DROP FOREIGN KEY \`FK_beeccb051103b4b15ee1ca81547\``);
        await queryRunner.query(`ALTER TABLE \`survey_token\` CHANGE \`surveyId\` \`surveyId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`survey\` DROP FOREIGN KEY \`FK_a2e6e9ab8f1ff04cbf31da646e7\``);
        await queryRunner.query(`ALTER TABLE \`survey\` CHANGE \`ownerId\` \`ownerId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`submission\` ADD CONSTRAINT \`FK_445eeaad33ae6464ac85f6ea46b\` FOREIGN KEY (\`surveyId\`) REFERENCES \`survey\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`question_option\` ADD CONSTRAINT \`FK_ba19747af180520381a117f5986\` FOREIGN KEY (\`questionId\`) REFERENCES \`question\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`answer\` ADD CONSTRAINT \`FK_a4013f10cd6924793fbd5f0d637\` FOREIGN KEY (\`questionId\`) REFERENCES \`question\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`answer\` ADD CONSTRAINT \`FK_1398cb4bf7f1ccc37fa0dd538ff\` FOREIGN KEY (\`submissionId\`) REFERENCES \`submission\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`question\` ADD CONSTRAINT \`FK_a1188e0f702ab268e0982049e5c\` FOREIGN KEY (\`surveyId\`) REFERENCES \`survey\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`survey_token\` ADD CONSTRAINT \`FK_beeccb051103b4b15ee1ca81547\` FOREIGN KEY (\`surveyId\`) REFERENCES \`survey\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`survey\` ADD CONSTRAINT \`FK_a2e6e9ab8f1ff04cbf31da646e7\` FOREIGN KEY (\`ownerId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`survey\` DROP FOREIGN KEY \`FK_a2e6e9ab8f1ff04cbf31da646e7\``);
        await queryRunner.query(`ALTER TABLE \`survey_token\` DROP FOREIGN KEY \`FK_beeccb051103b4b15ee1ca81547\``);
        await queryRunner.query(`ALTER TABLE \`question\` DROP FOREIGN KEY \`FK_a1188e0f702ab268e0982049e5c\``);
        await queryRunner.query(`ALTER TABLE \`answer\` DROP FOREIGN KEY \`FK_1398cb4bf7f1ccc37fa0dd538ff\``);
        await queryRunner.query(`ALTER TABLE \`answer\` DROP FOREIGN KEY \`FK_a4013f10cd6924793fbd5f0d637\``);
        await queryRunner.query(`ALTER TABLE \`question_option\` DROP FOREIGN KEY \`FK_ba19747af180520381a117f5986\``);
        await queryRunner.query(`ALTER TABLE \`submission\` DROP FOREIGN KEY \`FK_445eeaad33ae6464ac85f6ea46b\``);
        await queryRunner.query(`ALTER TABLE \`survey\` CHANGE \`ownerId\` \`ownerId\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`survey\` ADD CONSTRAINT \`FK_a2e6e9ab8f1ff04cbf31da646e7\` FOREIGN KEY (\`ownerId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`survey_token\` CHANGE \`surveyId\` \`surveyId\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`survey_token\` ADD CONSTRAINT \`FK_beeccb051103b4b15ee1ca81547\` FOREIGN KEY (\`surveyId\`) REFERENCES \`survey\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`question\` CHANGE \`surveyId\` \`surveyId\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`question\` ADD CONSTRAINT \`FK_a1188e0f702ab268e0982049e5c\` FOREIGN KEY (\`surveyId\`) REFERENCES \`survey\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`answer\` CHANGE \`submissionId\` \`submissionId\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`answer\` CHANGE \`questionId\` \`questionId\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`answer\` ADD CONSTRAINT \`FK_1398cb4bf7f1ccc37fa0dd538ff\` FOREIGN KEY (\`submissionId\`) REFERENCES \`submission\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`answer\` ADD CONSTRAINT \`FK_a4013f10cd6924793fbd5f0d637\` FOREIGN KEY (\`questionId\`) REFERENCES \`question\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`question_option\` CHANGE \`questionId\` \`questionId\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`question_option\` ADD CONSTRAINT \`FK_ba19747af180520381a117f5986\` FOREIGN KEY (\`questionId\`) REFERENCES \`question\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`submission\` CHANGE \`surveyId\` \`surveyId\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`submission\` ADD CONSTRAINT \`FK_445eeaad33ae6464ac85f6ea46b\` FOREIGN KEY (\`surveyId\`) REFERENCES \`survey\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
