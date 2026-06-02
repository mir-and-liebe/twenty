import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddTeamPresence1799100400000 implements MigrationInterface {
  name = 'AddTeamPresence1799100400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "core"."teamPresence" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "workspaceId" uuid NOT NULL, "userWorkspaceId" uuid NOT NULL, "lastSeenAt" TIMESTAMP WITH TIME ZONE NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_TEAM_PRESENCE_ID" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_TEAM_PRESENCE_WORKSPACE_ID" ON "core"."teamPresence" ("workspaceId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_TEAM_PRESENCE_USER_WORKSPACE_ID" ON "core"."teamPresence" ("userWorkspaceId")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_TEAM_PRESENCE_WORKSPACE_USER_UNIQUE" ON "core"."teamPresence" ("workspaceId", "userWorkspaceId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamPresence" ADD CONSTRAINT "FK_TEAM_PRESENCE_WORKSPACE_ID" FOREIGN KEY ("workspaceId") REFERENCES "core"."workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamPresence" ADD CONSTRAINT "FK_TEAM_PRESENCE_USER_WORKSPACE_ID" FOREIGN KEY ("userWorkspaceId") REFERENCES "core"."userWorkspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "core"."teamPresence" DROP CONSTRAINT "FK_TEAM_PRESENCE_USER_WORKSPACE_ID"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamPresence" DROP CONSTRAINT "FK_TEAM_PRESENCE_WORKSPACE_ID"`,
    );
    await queryRunner.query(
      `DROP INDEX "core"."IDX_TEAM_PRESENCE_WORKSPACE_USER_UNIQUE"`,
    );
    await queryRunner.query(
      `DROP INDEX "core"."IDX_TEAM_PRESENCE_USER_WORKSPACE_ID"`,
    );
    await queryRunner.query(
      `DROP INDEX "core"."IDX_TEAM_PRESENCE_WORKSPACE_ID"`,
    );
    await queryRunner.query(`DROP TABLE "core"."teamPresence"`);
  }
}
