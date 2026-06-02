import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddTeamPresenceStatus1799100900000 implements MigrationInterface {
  name = 'AddTeamPresenceStatus1799100900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "core"."teamPresence" ADD "statusText" character varying(80)`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamPresence" ADD "statusEmoji" character varying(32)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "core"."teamPresence" DROP COLUMN "statusEmoji"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamPresence" DROP COLUMN "statusText"`,
    );
  }
}
