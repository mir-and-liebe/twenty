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

@Entity({ name: 'teamMessageReaction', schema: 'core' })
@Index(
  'IDX_TEAM_MESSAGE_REACTION_MESSAGE_USER_EMOJI',
  ['messageId', 'userWorkspaceId', 'emoji'],
  { unique: true },
)
export class TeamMessageReactionEntity {
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
  userWorkspaceId: string;

  @ManyToOne(() => UserWorkspaceEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userWorkspaceId' })
  userWorkspace: Relation<UserWorkspaceEntity>;

  @Column({ length: 32, nullable: false, type: 'varchar' })
  emoji: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
