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
import { TeamChannelEntity } from 'src/engine/metadata-modules/team-comms/entities/team-channel.entity';

export enum TeamChannelMemberRole {
  OWNER = 'owner',
  MEMBER = 'member',
}

export enum TeamChannelNotificationLevel {
  ALL = 'all',
  MENTIONS = 'mentions',
  MUTED = 'muted',
}

@Entity({ name: 'teamChannelMember', schema: 'core' })
@Index(
  'IDX_TEAM_CHANNEL_MEMBER_CHANNEL_USER',
  ['channelId', 'userWorkspaceId'],
  {
    unique: true,
  },
)
export class TeamChannelMemberEntity {
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
  channelId: string;

  @ManyToOne(() => TeamChannelEntity, (channel) => channel.members, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'channelId' })
  channel: Relation<TeamChannelEntity>;

  @Column({ nullable: false, type: 'uuid' })
  @Index()
  userWorkspaceId: string;

  @ManyToOne(() => UserWorkspaceEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userWorkspaceId' })
  userWorkspace: Relation<UserWorkspaceEntity>;

  @Column({
    default: TeamChannelMemberRole.MEMBER,
    enum: TeamChannelMemberRole,
    type: 'enum',
  })
  role: TeamChannelMemberRole;

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
