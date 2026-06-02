import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddTeamNotificationPreference1799101100000 implements MigrationInterface {
  name = 'AddTeamNotificationPreference1799101100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "core"."teamPresence_notificationPreference_enum" AS ENUM('all', 'mentions', 'muted')`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamPresence" ADD "notificationPreference" "core"."teamPresence_notificationPreference_enum" NOT NULL DEFAULT 'all'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "core"."teamPresence" DROP COLUMN "notificationPreference"`,
    );
    await queryRunner.query(
      `DROP TYPE "core"."teamPresence_notificationPreference_enum"`,
    );
  }
}
