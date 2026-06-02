import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddTeamMessageThreadReads1799101400000 implements MigrationInterface {
  name = 'AddTeamMessageThreadReads1799101400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "core"."teamMessageThreadRead" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "workspaceId" uuid NOT NULL, "parentMessageId" uuid NOT NULL, "userWorkspaceId" uuid NOT NULL, "lastReadAt" TIMESTAMP WITH TIME ZONE NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_TEAM_MESSAGE_THREAD_READ_ID" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_TEAM_MESSAGE_THREAD_READ_WORKSPACE_ID" ON "core"."teamMessageThreadRead" ("workspaceId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_TEAM_MESSAGE_THREAD_READ_PARENT_MESSAGE_ID" ON "core"."teamMessageThreadRead" ("parentMessageId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_TEAM_MESSAGE_THREAD_READ_USER_WORKSPACE_ID" ON "core"."teamMessageThreadRead" ("userWorkspaceId")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_TEAM_MESSAGE_THREAD_READ_PARENT_USER" ON "core"."teamMessageThreadRead" ("parentMessageId", "userWorkspaceId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessageThreadRead" ADD CONSTRAINT "FK_TEAM_MESSAGE_THREAD_READ_WORKSPACE_ID" FOREIGN KEY ("workspaceId") REFERENCES "core"."workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessageThreadRead" ADD CONSTRAINT "FK_TEAM_MESSAGE_THREAD_READ_PARENT_MESSAGE_ID" FOREIGN KEY ("parentMessageId") REFERENCES "core"."teamMessage"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessageThreadRead" ADD CONSTRAINT "FK_TEAM_MESSAGE_THREAD_READ_USER_WORKSPACE_ID" FOREIGN KEY ("userWorkspaceId") REFERENCES "core"."userWorkspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessageThreadRead" DROP CONSTRAINT "FK_TEAM_MESSAGE_THREAD_READ_USER_WORKSPACE_ID"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessageThreadRead" DROP CONSTRAINT "FK_TEAM_MESSAGE_THREAD_READ_PARENT_MESSAGE_ID"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessageThreadRead" DROP CONSTRAINT "FK_TEAM_MESSAGE_THREAD_READ_WORKSPACE_ID"`,
    );
    await queryRunner.query(
      `DROP INDEX "core"."IDX_TEAM_MESSAGE_THREAD_READ_PARENT_USER"`,
    );
    await queryRunner.query(
      `DROP INDEX "core"."IDX_TEAM_MESSAGE_THREAD_READ_USER_WORKSPACE_ID"`,
    );
    await queryRunner.query(
      `DROP INDEX "core"."IDX_TEAM_MESSAGE_THREAD_READ_PARENT_MESSAGE_ID"`,
    );
    await queryRunner.query(
      `DROP INDEX "core"."IDX_TEAM_MESSAGE_THREAD_READ_WORKSPACE_ID"`,
    );
    await queryRunner.query(`DROP TABLE "core"."teamMessageThreadRead"`);
  }
}
