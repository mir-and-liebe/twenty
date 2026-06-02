import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddTeamMessagePinning1799100700000 implements MigrationInterface {
  name = 'AddTeamMessagePinning1799100700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessage" ADD "pinnedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessage" ADD "pinnedByUserWorkspaceId" uuid`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_TEAM_MESSAGE_PINNED_BY_USER_WORKSPACE_ID" ON "core"."teamMessage" ("pinnedByUserWorkspaceId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessage" ADD CONSTRAINT "FK_TEAM_MESSAGE_PINNED_BY_USER_WORKSPACE_ID" FOREIGN KEY ("pinnedByUserWorkspaceId") REFERENCES "core"."userWorkspace"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessage" DROP CONSTRAINT "FK_TEAM_MESSAGE_PINNED_BY_USER_WORKSPACE_ID"`,
    );
    await queryRunner.query(
      `DROP INDEX "core"."IDX_TEAM_MESSAGE_PINNED_BY_USER_WORKSPACE_ID"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessage" DROP COLUMN "pinnedByUserWorkspaceId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."teamMessage" DROP COLUMN "pinnedAt"`,
    );
  }
}
