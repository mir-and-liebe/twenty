import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddTeamDirectMessageNotificationLevel1799101300000 implements MigrationInterface {
  name = 'AddTeamDirectMessageNotificationLevel1799101300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "core"."teamDirectMessageParticipant_notificationLevel_enum" AS ENUM('all', 'mentions', 'muted')`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamDirectMessageParticipant" ADD "notificationLevel" "core"."teamDirectMessageParticipant_notificationLevel_enum" NOT NULL DEFAULT 'all'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "core"."teamDirectMessageParticipant" DROP COLUMN "notificationLevel"`,
    );
    await queryRunner.query(
      `DROP TYPE "core"."teamDirectMessageParticipant_notificationLevel_enum"`,
    );
  }
}
