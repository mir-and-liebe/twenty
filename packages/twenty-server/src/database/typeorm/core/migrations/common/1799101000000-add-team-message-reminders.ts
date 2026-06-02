import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddTeamMessageReminders1799101000000 implements MigrationInterface {
  name = 'AddTeamMessageReminders1799101000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "core"."teamMessageReminder" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "workspaceId" uuid NOT NULL, "messageId" uuid NOT NULL, "userWorkspaceId" uuid NOT NULL, "remindAt" TIMESTAMP WITH TIME ZONE NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_TEAM_MESSAGE_REMINDER_ID" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_TEAM_MESSAGE_REMINDER_WORKSPACE_ID" ON "core"."teamMessageReminder" ("workspaceId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_TEAM_MESSAGE_REMINDER_MESSAGE_ID" ON "core"."teamMessageReminder" ("messageId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_TEAM_MESSAGE_REMINDER_USER_WORKSPACE_ID" ON "core"."teamMessageReminder" ("userWorkspaceId")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_TEAM_MESSAGE_REMINDER_MESSAGE_USER" ON "core"."teamMessageReminder" ("messageId", "userWorkspaceId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessageReminder" ADD CONSTRAINT "FK_TEAM_MESSAGE_REMINDER_WORKSPACE_ID" FOREIGN KEY ("workspaceId") REFERENCES "core"."workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessageReminder" ADD CONSTRAINT "FK_TEAM_MESSAGE_REMINDER_MESSAGE_ID" FOREIGN KEY ("messageId") REFERENCES "core"."teamMessage"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessageReminder" ADD CONSTRAINT "FK_TEAM_MESSAGE_REMINDER_USER_WORKSPACE_ID" FOREIGN KEY ("userWorkspaceId") REFERENCES "core"."userWorkspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessageReminder" DROP CONSTRAINT "FK_TEAM_MESSAGE_REMINDER_USER_WORKSPACE_ID"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessageReminder" DROP CONSTRAINT "FK_TEAM_MESSAGE_REMINDER_MESSAGE_ID"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessageReminder" DROP CONSTRAINT "FK_TEAM_MESSAGE_REMINDER_WORKSPACE_ID"`,
    );
    await queryRunner.query(
      `DROP INDEX "core"."IDX_TEAM_MESSAGE_REMINDER_MESSAGE_USER"`,
    );
    await queryRunner.query(
      `DROP INDEX "core"."IDX_TEAM_MESSAGE_REMINDER_USER_WORKSPACE_ID"`,
    );
    await queryRunner.query(
      `DROP INDEX "core"."IDX_TEAM_MESSAGE_REMINDER_MESSAGE_ID"`,
    );
    await queryRunner.query(
      `DROP INDEX "core"."IDX_TEAM_MESSAGE_REMINDER_WORKSPACE_ID"`,
    );
    await queryRunner.query(`DROP TABLE "core"."teamMessageReminder"`);
  }
}
