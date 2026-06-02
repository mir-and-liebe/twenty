import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddTeamMessageBookmarks1799100800000 implements MigrationInterface {
  name = 'AddTeamMessageBookmarks1799100800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "core"."teamMessageBookmark" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "workspaceId" uuid NOT NULL, "messageId" uuid NOT NULL, "userWorkspaceId" uuid NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_TEAM_MESSAGE_BOOKMARK_ID" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_TEAM_MESSAGE_BOOKMARK_WORKSPACE_ID" ON "core"."teamMessageBookmark" ("workspaceId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_TEAM_MESSAGE_BOOKMARK_MESSAGE_ID" ON "core"."teamMessageBookmark" ("messageId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_TEAM_MESSAGE_BOOKMARK_USER_WORKSPACE_ID" ON "core"."teamMessageBookmark" ("userWorkspaceId")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_TEAM_MESSAGE_BOOKMARK_MESSAGE_USER" ON "core"."teamMessageBookmark" ("messageId", "userWorkspaceId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessageBookmark" ADD CONSTRAINT "FK_TEAM_MESSAGE_BOOKMARK_WORKSPACE_ID" FOREIGN KEY ("workspaceId") REFERENCES "core"."workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessageBookmark" ADD CONSTRAINT "FK_TEAM_MESSAGE_BOOKMARK_MESSAGE_ID" FOREIGN KEY ("messageId") REFERENCES "core"."teamMessage"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessageBookmark" ADD CONSTRAINT "FK_TEAM_MESSAGE_BOOKMARK_USER_WORKSPACE_ID" FOREIGN KEY ("userWorkspaceId") REFERENCES "core"."userWorkspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessageBookmark" DROP CONSTRAINT "FK_TEAM_MESSAGE_BOOKMARK_USER_WORKSPACE_ID"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessageBookmark" DROP CONSTRAINT "FK_TEAM_MESSAGE_BOOKMARK_MESSAGE_ID"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessageBookmark" DROP CONSTRAINT "FK_TEAM_MESSAGE_BOOKMARK_WORKSPACE_ID"`,
    );
    await queryRunner.query(
      `DROP INDEX "core"."IDX_TEAM_MESSAGE_BOOKMARK_MESSAGE_USER"`,
    );
    await queryRunner.query(
      `DROP INDEX "core"."IDX_TEAM_MESSAGE_BOOKMARK_USER_WORKSPACE_ID"`,
    );
    await queryRunner.query(
      `DROP INDEX "core"."IDX_TEAM_MESSAGE_BOOKMARK_MESSAGE_ID"`,
    );
    await queryRunner.query(
      `DROP INDEX "core"."IDX_TEAM_MESSAGE_BOOKMARK_WORKSPACE_ID"`,
    );
    await queryRunner.query(`DROP TABLE "core"."teamMessageBookmark"`);
  }
}
