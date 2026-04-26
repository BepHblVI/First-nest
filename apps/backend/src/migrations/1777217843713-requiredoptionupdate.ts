import { MigrationInterface, QueryRunner } from "typeorm";

export class Requiredoptionupdate1777217843713 implements MigrationInterface {
    name = 'Requiredoptionupdate1777217843713'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`question\` ADD \`required\` tinyint NOT NULL DEFAULT 0`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`question\` DROP COLUMN \`required\``);
    }

}
