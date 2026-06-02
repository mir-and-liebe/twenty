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

import { UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';
import type { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { TeamMessageEntity } from 'src/engine/metadata-modules/team-comms/entities/team-message.entity';

@Entity({ name: 'teamMessageMention', schema: 'core' })
@Index(
  'IDX_TEAM_MESSAGE_MENTION_MESSAGE_USER',
  ['messageId', 'mentionedUserWorkspaceId'],
  { unique: true },
)
export class TeamMessageMentionEntity {
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

  @Column({ nullable: false, type: 'uuid' })
  @Index()
  mentionedUserWorkspaceId: string;

  @ManyToOne(() => UserWorkspaceEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'mentionedUserWorkspaceId' })
  mentionedUserWorkspace: Relation<UserWorkspaceEntity>;

  @Column({ nullable: true, type: 'timestamptz' })
  readAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
