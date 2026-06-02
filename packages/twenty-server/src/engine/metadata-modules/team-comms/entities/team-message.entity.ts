import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';

import { UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';
import type { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { TeamChannelEntity } from 'src/engine/metadata-modules/team-comms/entities/team-channel.entity';
import { TeamDirectMessageThreadEntity } from 'src/engine/metadata-modules/team-comms/entities/team-direct-message-thread.entity';

@Entity({ name: 'teamMessage', schema: 'core' })
@Index('IDX_TEAM_MESSAGE_CHANNEL_CREATED_AT', ['channelId', 'createdAt'])
export class TeamMessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, type: 'uuid' })
  @Index()
  workspaceId: string;

  @ManyToOne('WorkspaceEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspaceId' })
  workspace: Relation<WorkspaceEntity>;

  @Column({ nullable: true, type: 'uuid' })
  @Index()
  channelId: string | null;

  @ManyToOne(() => TeamChannelEntity, (channel) => channel.messages, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'channelId' })
  channel: Relation<TeamChannelEntity> | null;

  @Column({ nullable: true, type: 'uuid' })
  @Index()
  directMessageThreadId: string | null;

  @ManyToOne(() => TeamDirectMessageThreadEntity, (thread) => thread.messages, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'directMessageThreadId' })
  directMessageThread: Relation<TeamDirectMessageThreadEntity> | null;

  @Column({ nullable: false, type: 'uuid' })
  @Index()
  authorUserWorkspaceId: string;

  @ManyToOne(() => UserWorkspaceEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'authorUserWorkspaceId' })
  authorUserWorkspace: Relation<UserWorkspaceEntity>;

  @Column({ type: 'text' })
  body: string;

  @Column({ nullable: true, type: 'uuid' })
  @Index()
  parentMessageId: string | null;

  @ManyToOne(() => TeamMessageEntity, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parentMessageId' })
  parentMessage: Relation<TeamMessageEntity> | null;

  @Column({ nullable: true, type: 'timestamptz' })
  pinnedAt: Date | null;

  @Column({ nullable: true, type: 'uuid' })
  @Index()
  pinnedByUserWorkspaceId: string | null;

  @ManyToOne(() => UserWorkspaceEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'pinnedByUserWorkspaceId' })
  pinnedByUserWorkspace: Relation<UserWorkspaceEntity> | null;

  @Column({ nullable: true, type: 'timestamptz' })
  deletedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
