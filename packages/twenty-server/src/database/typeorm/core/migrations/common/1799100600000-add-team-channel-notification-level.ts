import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddTeamChannelNotificationLevel1799100600000 implements MigrationInterface {
  name = 'AddTeamChannelNotificationLevel1799100600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "core"."teamChannelMember_notificationLevel_enum" AS ENUM('all', 'mentions', 'muted')`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamChannelMember" ADD "notificationLevel" "core"."teamChannelMember_notificationLevel_enum" NOT NULL DEFAULT 'all'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "core"."teamChannelMember" DROP COLUMN "notificationLevel"`,
    );
    await queryRunner.query(
      `DROP TYPE "core"."teamChannelMember_notificationLevel_enum"`,
    );
  }
}
