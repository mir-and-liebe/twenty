import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class CreateTeamCommsTables1799100000000 implements MigrationInterface {
  name = 'CreateTeamCommsTables1799100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "core"."teamChannel_visibility_enum" AS ENUM('public', 'private')`,
    );
    await queryRunner.query(
      `CREATE TYPE "core"."teamChannelMember_role_enum" AS ENUM('owner', 'member')`,
    );
    await queryRunner.query(
      `CREATE TABLE "core"."teamChannel" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "workspaceId" uuid NOT NULL, "name" character varying NOT NULL, "slug" character varying NOT NULL, "description" text, "visibility" "core"."teamChannel_visibility_enum" NOT NULL DEFAULT 'public', "createdByUserWorkspaceId" uuid, "deletedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_TEAM_CHANNEL_ID" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "core"."teamChannelMember" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "workspaceId" uuid NOT NULL, "channelId" uuid NOT NULL, "userWorkspaceId" uuid NOT NULL, "role" "core"."teamChannelMember_role_enum" NOT NULL DEFAULT 'member', "lastReadAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_TEAM_CHANNEL_MEMBER_ID" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "core"."teamMessage" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "workspaceId" uuid NOT NULL, "channelId" uuid NOT NULL, "authorUserWorkspaceId" uuid NOT NULL, "body" text NOT NULL, "parentMessageId" uuid, "deletedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_TEAM_MESSAGE_ID" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_TEAM_CHANNEL_WORKSPACE_ID" ON "core"."teamChannel" ("workspaceId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_TEAM_CHANNEL_CREATED_BY_USER_WORKSPACE_ID" ON "core"."teamChannel" ("createdByUserWorkspaceId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_TEAM_CHANNEL_WORKSPACE_SLUG_DELETED_AT" ON "core"."teamChannel" ("workspaceId", "slug", "deletedAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_TEAM_CHANNEL_MEMBER_WORKSPACE_ID" ON "core"."teamChannelMember" ("workspaceId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_TEAM_CHANNEL_MEMBER_CHANNEL_ID" ON "core"."teamChannelMember" ("channelId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_TEAM_CHANNEL_MEMBER_USER_WORKSPACE_ID" ON "core"."teamChannelMember" ("userWorkspaceId")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_TEAM_CHANNEL_MEMBER_CHANNEL_USER" ON "core"."teamChannelMember" ("channelId", "userWorkspaceId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_TEAM_MESSAGE_WORKSPACE_ID" ON "core"."teamMessage" ("workspaceId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_TEAM_MESSAGE_CHANNEL_ID" ON "core"."teamMessage" ("channelId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_TEAM_MESSAGE_AUTHOR_USER_WORKSPACE_ID" ON "core"."teamMessage" ("authorUserWorkspaceId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_TEAM_MESSAGE_PARENT_MESSAGE_ID" ON "core"."teamMessage" ("parentMessageId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_TEAM_MESSAGE_CHANNEL_CREATED_AT" ON "core"."teamMessage" ("channelId", "createdAt")`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamChannel" ADD CONSTRAINT "FK_TEAM_CHANNEL_WORKSPACE_ID" FOREIGN KEY ("workspaceId") REFERENCES "core"."workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamChannel" ADD CONSTRAINT "FK_TEAM_CHANNEL_CREATED_BY_USER_WORKSPACE_ID" FOREIGN KEY ("createdByUserWorkspaceId") REFERENCES "core"."userWorkspace"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamChannelMember" ADD CONSTRAINT "FK_TEAM_CHANNEL_MEMBER_WORKSPACE_ID" FOREIGN KEY ("workspaceId") REFERENCES "core"."workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamChannelMember" ADD CONSTRAINT "FK_TEAM_CHANNEL_MEMBER_CHANNEL_ID" FOREIGN KEY ("channelId") REFERENCES "core"."teamChannel"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamChannelMember" ADD CONSTRAINT "FK_TEAM_CHANNEL_MEMBER_USER_WORKSPACE_ID" FOREIGN KEY ("userWorkspaceId") REFERENCES "core"."userWorkspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessage" ADD CONSTRAINT "FK_TEAM_MESSAGE_WORKSPACE_ID" FOREIGN KEY ("workspaceId") REFERENCES "core"."workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessage" ADD CONSTRAINT "FK_TEAM_MESSAGE_CHANNEL_ID" FOREIGN KEY ("channelId") REFERENCES "core"."teamChannel"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessage" ADD CONSTRAINT "FK_TEAM_MESSAGE_AUTHOR_USER_WORKSPACE_ID" FOREIGN KEY ("authorUserWorkspaceId") REFERENCES "core"."userWorkspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessage" ADD CONSTRAINT "FK_TEAM_MESSAGE_PARENT_MESSAGE_ID" FOREIGN KEY ("parentMessageId") REFERENCES "core"."teamMessage"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessage" DROP CONSTRAINT "FK_TEAM_MESSAGE_PARENT_MESSAGE_ID"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessage" DROP CONSTRAINT "FK_TEAM_MESSAGE_AUTHOR_USER_WORKSPACE_ID"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessage" DROP CONSTRAINT "FK_TEAM_MESSAGE_CHANNEL_ID"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessage" DROP CONSTRAINT "FK_TEAM_MESSAGE_WORKSPACE_ID"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamChannelMember" DROP CONSTRAINT "FK_TEAM_CHANNEL_MEMBER_USER_WORKSPACE_ID"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamChannelMember" DROP CONSTRAINT "FK_TEAM_CHANNEL_MEMBER_CHANNEL_ID"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamChannelMember" DROP CONSTRAINT "FK_TEAM_CHANNEL_MEMBER_WORKSPACE_ID"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamChannel" DROP CONSTRAINT "FK_TEAM_CHANNEL_CREATED_BY_USER_WORKSPACE_ID"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamChannel" DROP CONSTRAINT "FK_TEAM_CHANNEL_WORKSPACE_ID"`,
    );
    await queryRunner.query(`DROP TABLE "core"."teamMessage"`);
    await queryRunner.query(`DROP TABLE "core"."teamChannelMember"`);
    await queryRunner.query(`DROP TABLE "core"."teamChannel"`);
    await queryRunner.query(`DROP TYPE "core"."teamChannelMember_role_enum"`);
    await queryRunner.query(`DROP TYPE "core"."teamChannel_visibility_enum"`);
  }
}
