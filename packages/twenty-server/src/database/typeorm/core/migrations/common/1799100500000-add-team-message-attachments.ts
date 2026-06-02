import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddTeamMessageAttachments1799100500000 implements MigrationInterface {
  name = 'AddTeamMessageAttachments1799100500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "core"."teamMessageAttachment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "workspaceId" uuid NOT NULL, "messageId" uuid NOT NULL, "name" character varying(180) NOT NULL, "url" text NOT NULL, "mimeType" character varying(120), "size" integer, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_TEAM_MESSAGE_ATTACHMENT_ID" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_TEAM_MESSAGE_ATTACHMENT_WORKSPACE_ID" ON "core"."teamMessageAttachment" ("workspaceId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_TEAM_MESSAGE_ATTACHMENT_MESSAGE_ID" ON "core"."teamMessageAttachment" ("messageId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_TEAM_MESSAGE_ATTACHMENT_MESSAGE_CREATED_AT" ON "core"."teamMessageAttachment" ("messageId", "createdAt")`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessageAttachment" ADD CONSTRAINT "FK_TEAM_MESSAGE_ATTACHMENT_WORKSPACE_ID" FOREIGN KEY ("workspaceId") REFERENCES "core"."workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessageAttachment" ADD CONSTRAINT "FK_TEAM_MESSAGE_ATTACHMENT_MESSAGE_ID" FOREIGN KEY ("messageId") REFERENCES "core"."teamMessage"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessageAttachment" DROP CONSTRAINT "FK_TEAM_MESSAGE_ATTACHMENT_MESSAGE_ID"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessageAttachment" DROP CONSTRAINT "FK_TEAM_MESSAGE_ATTACHMENT_WORKSPACE_ID"`,
    );
    await queryRunner.query(
      `DROP INDEX "core"."IDX_TEAM_MESSAGE_ATTACHMENT_MESSAGE_CREATED_AT"`,
    );
    await queryRunner.query(
      `DROP INDEX "core"."IDX_TEAM_MESSAGE_ATTACHMENT_MESSAGE_ID"`,
    );
    await queryRunner.query(
      `DROP INDEX "core"."IDX_TEAM_MESSAGE_ATTACHMENT_WORKSPACE_ID"`,
    );
    await queryRunner.query(`DROP TABLE "core"."teamMessageAttachment"`);
  }
}
