import { MigrationInterface, QueryRunner } from "typeorm";

export class Sh1777554810913 implements MigrationInterface {
    name = 'Sh1777554810913'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`question_option\` DROP COLUMN \`order\``);
        await queryRunner.query(`ALTER TABLE \`question\` DROP COLUMN \`type\``);
        await queryRunner.query(`ALTER TABLE \`question\` ADD \`type\` enum ('TEXT', 'SINGLE', 'MULTIPLE') NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`question\` DROP COLUMN \`type\``);
        await queryRunner.query(`ALTER TABLE \`question\` ADD \`type\` varchar(255) NOT NULL DEFAULT 'TEXT'`);
        await queryRunner.query(`ALTER TABLE \`question_option\` ADD \`order\` int NOT NULL DEFAULT '0'`);
    }

}
