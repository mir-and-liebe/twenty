import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddTeamMessageReactions1799100300000 implements MigrationInterface {
  name = 'AddTeamMessageReactions1799100300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "core"."teamMessageReaction" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "workspaceId" uuid NOT NULL, "messageId" uuid NOT NULL, "userWorkspaceId" uuid NOT NULL, "emoji" character varying(32) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_TEAM_MESSAGE_REACTION_ID" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_TEAM_MESSAGE_REACTION_WORKSPACE_ID" ON "core"."teamMessageReaction" ("workspaceId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_TEAM_MESSAGE_REACTION_MESSAGE_ID" ON "core"."teamMessageReaction" ("messageId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_TEAM_MESSAGE_REACTION_USER_WORKSPACE_ID" ON "core"."teamMessageReaction" ("userWorkspaceId")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_TEAM_MESSAGE_REACTION_MESSAGE_USER_EMOJI" ON "core"."teamMessageReaction" ("messageId", "userWorkspaceId", "emoji")`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessageReaction" ADD CONSTRAINT "FK_TEAM_MESSAGE_REACTION_WORKSPACE_ID" FOREIGN KEY ("workspaceId") REFERENCES "core"."workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessageReaction" ADD CONSTRAINT "FK_TEAM_MESSAGE_REACTION_MESSAGE_ID" FOREIGN KEY ("messageId") REFERENCES "core"."teamMessage"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessageReaction" ADD CONSTRAINT "FK_TEAM_MESSAGE_REACTION_USER_WORKSPACE_ID" FOREIGN KEY ("userWorkspaceId") REFERENCES "core"."userWorkspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessageReaction" DROP CONSTRAINT "FK_TEAM_MESSAGE_REACTION_USER_WORKSPACE_ID"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessageReaction" DROP CONSTRAINT "FK_TEAM_MESSAGE_REACTION_MESSAGE_ID"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessageReaction" DROP CONSTRAINT "FK_TEAM_MESSAGE_REACTION_WORKSPACE_ID"`,
    );
    await queryRunner.query(
      `DROP INDEX "core"."IDX_TEAM_MESSAGE_REACTION_MESSAGE_USER_EMOJI"`,
    );
    await queryRunner.query(
      `DROP INDEX "core"."IDX_TEAM_MESSAGE_REACTION_USER_WORKSPACE_ID"`,
    );
    await queryRunner.query(
      `DROP INDEX "core"."IDX_TEAM_MESSAGE_REACTION_MESSAGE_ID"`,
    );
    await queryRunner.query(
      `DROP INDEX "core"."IDX_TEAM_MESSAGE_REACTION_WORKSPACE_ID"`,
    );
    await queryRunner.query(`DROP TABLE "core"."teamMessageReaction"`);
  }
}
