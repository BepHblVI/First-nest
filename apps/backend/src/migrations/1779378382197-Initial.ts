import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1779378382197 implements MigrationInterface {
    name = 'Initial1779378382197'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`tenant\` (\`id\` int NOT NULL AUTO_INCREMENT, \`slug\` varchar(63) NOT NULL, \`name\` varchar(100) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_abfd243f7bd832e806d19c5a91\` (\`slug\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_abfd243f7bd832e806d19c5a91\` ON \`tenant\``);
        await queryRunner.query(`DROP TABLE \`tenant\``);
    }

}
