import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddTeamMessageMentions1799100200000 implements MigrationInterface {
  name = 'AddTeamMessageMentions1799100200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "core"."teamMessageMention" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "workspaceId" uuid NOT NULL, "messageId" uuid NOT NULL, "mentionedUserWorkspaceId" uuid NOT NULL, "readAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_TEAM_MESSAGE_MENTION_ID" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_TEAM_MESSAGE_MENTION_WORKSPACE_ID" ON "core"."teamMessageMention" ("workspaceId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_TEAM_MESSAGE_MENTION_MESSAGE_ID" ON "core"."teamMessageMention" ("messageId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_TEAM_MESSAGE_MENTION_USER_WORKSPACE_ID" ON "core"."teamMessageMention" ("mentionedUserWorkspaceId")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_TEAM_MESSAGE_MENTION_MESSAGE_USER" ON "core"."teamMessageMention" ("messageId", "mentionedUserWorkspaceId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_TEAM_MESSAGE_MENTION_USER_CREATED_AT" ON "core"."teamMessageMention" ("mentionedUserWorkspaceId", "createdAt")`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessageMention" ADD CONSTRAINT "FK_TEAM_MESSAGE_MENTION_WORKSPACE_ID" FOREIGN KEY ("workspaceId") REFERENCES "core"."workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessageMention" ADD CONSTRAINT "FK_TEAM_MESSAGE_MENTION_MESSAGE_ID" FOREIGN KEY ("messageId") REFERENCES "core"."teamMessage"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessageMention" ADD CONSTRAINT "FK_TEAM_MESSAGE_MENTION_USER_WORKSPACE_ID" FOREIGN KEY ("mentionedUserWorkspaceId") REFERENCES "core"."userWorkspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessageMention" DROP CONSTRAINT "FK_TEAM_MESSAGE_MENTION_USER_WORKSPACE_ID"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessageMention" DROP CONSTRAINT "FK_TEAM_MESSAGE_MENTION_MESSAGE_ID"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessageMention" DROP CONSTRAINT "FK_TEAM_MESSAGE_MENTION_WORKSPACE_ID"`,
    );
    await queryRunner.query(
      `DROP INDEX "core"."IDX_TEAM_MESSAGE_MENTION_USER_CREATED_AT"`,
    );
    await queryRunner.query(
      `DROP INDEX "core"."IDX_TEAM_MESSAGE_MENTION_MESSAGE_USER"`,
    );
    await queryRunner.query(
      `DROP INDEX "core"."IDX_TEAM_MESSAGE_MENTION_USER_WORKSPACE_ID"`,
    );
    await queryRunner.query(
      `DROP INDEX "core"."IDX_TEAM_MESSAGE_MENTION_MESSAGE_ID"`,
    );
    await queryRunner.query(
      `DROP INDEX "core"."IDX_TEAM_MESSAGE_MENTION_WORKSPACE_ID"`,
    );
    await queryRunner.query(`DROP TABLE "core"."teamMessageMention"`);
  }
}
