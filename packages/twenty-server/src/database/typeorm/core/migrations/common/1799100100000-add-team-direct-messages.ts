import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddTeamDirectMessages1799100100000 implements MigrationInterface {
  name = 'AddTeamDirectMessages1799100100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "core"."teamDirectMessageThread" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "workspaceId" uuid NOT NULL, "participantKey" character varying NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_TEAM_DM_THREAD_ID" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "core"."teamDirectMessageParticipant" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "workspaceId" uuid NOT NULL, "directMessageThreadId" uuid NOT NULL, "userWorkspaceId" uuid NOT NULL, "lastReadAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_TEAM_DM_PARTICIPANT_ID" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessage" ALTER COLUMN "channelId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessage" ADD "directMessageThreadId" uuid`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_TEAM_DM_THREAD_WORKSPACE_ID" ON "core"."teamDirectMessageThread" ("workspaceId")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_TEAM_DM_THREAD_WORKSPACE_PARTICIPANT_KEY" ON "core"."teamDirectMessageThread" ("workspaceId", "participantKey")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_TEAM_DM_PARTICIPANT_WORKSPACE_ID" ON "core"."teamDirectMessageParticipant" ("workspaceId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_TEAM_DM_PARTICIPANT_THREAD_ID" ON "core"."teamDirectMessageParticipant" ("directMessageThreadId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_TEAM_DM_PARTICIPANT_USER_WORKSPACE_ID" ON "core"."teamDirectMessageParticipant" ("userWorkspaceId")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_TEAM_DM_PARTICIPANT_THREAD_USER" ON "core"."teamDirectMessageParticipant" ("directMessageThreadId", "userWorkspaceId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_TEAM_MESSAGE_DIRECT_MESSAGE_THREAD_ID" ON "core"."teamMessage" ("directMessageThreadId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_TEAM_MESSAGE_DM_THREAD_CREATED_AT" ON "core"."teamMessage" ("directMessageThreadId", "createdAt")`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamDirectMessageThread" ADD CONSTRAINT "FK_TEAM_DM_THREAD_WORKSPACE_ID" FOREIGN KEY ("workspaceId") REFERENCES "core"."workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamDirectMessageParticipant" ADD CONSTRAINT "FK_TEAM_DM_PARTICIPANT_WORKSPACE_ID" FOREIGN KEY ("workspaceId") REFERENCES "core"."workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamDirectMessageParticipant" ADD CONSTRAINT "FK_TEAM_DM_PARTICIPANT_THREAD_ID" FOREIGN KEY ("directMessageThreadId") REFERENCES "core"."teamDirectMessageThread"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamDirectMessageParticipant" ADD CONSTRAINT "FK_TEAM_DM_PARTICIPANT_USER_WORKSPACE_ID" FOREIGN KEY ("userWorkspaceId") REFERENCES "core"."userWorkspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessage" ADD CONSTRAINT "FK_TEAM_MESSAGE_DIRECT_MESSAGE_THREAD_ID" FOREIGN KEY ("directMessageThreadId") REFERENCES "core"."teamDirectMessageThread"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessage" ADD CONSTRAINT "CHK_TEAM_MESSAGE_EXACTLY_ONE_TARGET" CHECK ((("channelId" IS NOT NULL)::int + ("directMessageThreadId" IS NOT NULL)::int) = 1)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessage" DROP CONSTRAINT "CHK_TEAM_MESSAGE_EXACTLY_ONE_TARGET"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessage" DROP CONSTRAINT "FK_TEAM_MESSAGE_DIRECT_MESSAGE_THREAD_ID"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamDirectMessageParticipant" DROP CONSTRAINT "FK_TEAM_DM_PARTICIPANT_USER_WORKSPACE_ID"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamDirectMessageParticipant" DROP CONSTRAINT "FK_TEAM_DM_PARTICIPANT_THREAD_ID"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamDirectMessageParticipant" DROP CONSTRAINT "FK_TEAM_DM_PARTICIPANT_WORKSPACE_ID"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamDirectMessageThread" DROP CONSTRAINT "FK_TEAM_DM_THREAD_WORKSPACE_ID"`,
    );
    await queryRunner.query(
      `DELETE FROM "core"."teamMessage" WHERE "directMessageThreadId" IS NOT NULL`,
    );
    await queryRunner.query(
      `DROP INDEX "core"."IDX_TEAM_MESSAGE_DM_THREAD_CREATED_AT"`,
    );
    await queryRunner.query(
      `DROP INDEX "core"."IDX_TEAM_MESSAGE_DIRECT_MESSAGE_THREAD_ID"`,
    );
    await queryRunner.query(
      `DROP INDEX "core"."IDX_TEAM_DM_PARTICIPANT_THREAD_USER"`,
    );
    await queryRunner.query(
      `DROP INDEX "core"."IDX_TEAM_DM_PARTICIPANT_USER_WORKSPACE_ID"`,
    );
    await queryRunner.query(
      `DROP INDEX "core"."IDX_TEAM_DM_PARTICIPANT_THREAD_ID"`,
    );
    await queryRunner.query(
      `DROP INDEX "core"."IDX_TEAM_DM_PARTICIPANT_WORKSPACE_ID"`,
    );
    await queryRunner.query(
      `DROP INDEX "core"."IDX_TEAM_DM_THREAD_WORKSPACE_PARTICIPANT_KEY"`,
    );
    await queryRunner.query(
      `DROP INDEX "core"."IDX_TEAM_DM_THREAD_WORKSPACE_ID"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessage" DROP COLUMN "directMessageThreadId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessage" ALTER COLUMN "channelId" SET NOT NULL`,
    );
    await queryRunner.query(`DROP TABLE "core"."teamDirectMessageParticipant"`);
    await queryRunner.query(`DROP TABLE "core"."teamDirectMessageThread"`);
  }
}
