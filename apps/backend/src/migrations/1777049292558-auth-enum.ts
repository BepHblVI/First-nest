import { MigrationInterface, QueryRunner } from "typeorm";

export class AuthEnum1777049292558 implements MigrationInterface {
    name = 'AuthEnum1777049292558'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`survey\` DROP COLUMN \`auth\``);
        await queryRunner.query(`ALTER TABLE \`survey\` ADD \`auth\` enum ('PUBLIC', 'PRIVATE') NOT NULL DEFAULT 'PUBLIC'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`survey\` DROP COLUMN \`auth\``);
        await queryRunner.query(`ALTER TABLE \`survey\` ADD \`auth\` varchar(255) NOT NULL DEFAULT 'PUBLIC'`);
    }

}
