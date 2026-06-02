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
import { TeamChannelNotificationLevel } from 'src/engine/metadata-modules/team-comms/entities/team-channel-member.entity';
import { TeamDirectMessageThreadEntity } from 'src/engine/metadata-modules/team-comms/entities/team-direct-message-thread.entity';

@Entity({ name: 'teamDirectMessageParticipant', schema: 'core' })
@Index(
  'IDX_TEAM_DM_PARTICIPANT_THREAD_USER',
  ['directMessageThreadId', 'userWorkspaceId'],
  { unique: true },
)
export class TeamDirectMessageParticipantEntity {
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
  directMessageThreadId: string;

  @ManyToOne(
    () => TeamDirectMessageThreadEntity,
    (thread) => thread.participants,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'directMessageThreadId' })
  thread: Relation<TeamDirectMessageThreadEntity>;

  @Column({ nullable: false, type: 'uuid' })
  @Index()
  userWorkspaceId: string;

  @ManyToOne(() => UserWorkspaceEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userWorkspaceId' })
  userWorkspace: Relation<UserWorkspaceEntity>;

  @Column({ nullable: true, type: 'timestamptz' })
  lastReadAt: Date | null;

  @Column({
    default: TeamChannelNotificationLevel.ALL,
    enum: TeamChannelNotificationLevel,
    type: 'enum',
  })
  notificationLevel: TeamChannelNotificationLevel;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
