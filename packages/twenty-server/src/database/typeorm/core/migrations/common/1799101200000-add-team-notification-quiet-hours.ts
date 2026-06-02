import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddTeamNotificationQuietHours1799101200000 implements MigrationInterface {
  name = 'AddTeamNotificationQuietHours1799101200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "core"."teamPresence"
      ADD COLUMN "notificationQuietHoursStart" character varying(5),
      ADD COLUMN "notificationQuietHoursEnd" character varying(5)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "core"."teamPresence"
      DROP COLUMN "notificationQuietHoursEnd",
      DROP COLUMN "notificationQuietHoursStart"
    `);
  }
}
