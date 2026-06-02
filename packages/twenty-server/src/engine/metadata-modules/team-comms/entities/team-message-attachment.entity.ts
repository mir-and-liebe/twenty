import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';

import type { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { TeamMessageEntity } from 'src/engine/metadata-modules/team-comms/entities/team-message.entity';

@Entity({ name: 'teamMessageAttachment', schema: 'core' })
@Index('IDX_TEAM_MESSAGE_ATTACHMENT_MESSAGE_CREATED_AT', [
  'messageId',
  'createdAt',
])
export class TeamMessageAttachmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, type: 'uuid' })
  @Index()
  workspaceId: string;

  @ManyToOne('WorkspaceEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspaceId' })
  workspace: Relation<WorkspaceEntity>;

  @Column({ nullable: false, type: 'uuid' })
  @Index()
  messageId: string;

  @ManyToOne(() => TeamMessageEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'messageId' })
  message: Relation<TeamMessageEntity>;

  @Column({ length: 180, nullable: false, type: 'varchar' })
  name: string;

  @Column({ nullable: false, type: 'text' })
  url: string;

  @Column({ length: 120, nullable: true, type: 'varchar' })
  mimeType: string | null;

  @Column({ nullable: true, type: 'integer' })
  size: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
