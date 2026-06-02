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

export enum TeamNotificationPreference {
  ALL = 'all',
  MENTIONS = 'mentions',
  MUTED = 'muted',
}

@Entity({ name: 'teamPresence', schema: 'core' })
@Index(
  'IDX_TEAM_PRESENCE_WORKSPACE_USER_UNIQUE',
  ['workspaceId', 'userWorkspaceId'],
  {
    unique: true,
  },
)
export class TeamPresenceEntity {
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
  userWorkspaceId: string;

  @ManyToOne(() => UserWorkspaceEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userWorkspaceId' })
  userWorkspace: Relation<UserWorkspaceEntity>;

  @Column({ nullable: false, type: 'timestamptz' })
  lastSeenAt: Date;

  @Column({ length: 80, nullable: true, type: 'varchar' })
  statusText: string | null;

  @Column({ length: 32, nullable: true, type: 'varchar' })
  statusEmoji: string | null;

  @Column({
    default: TeamNotificationPreference.ALL,
    enum: TeamNotificationPreference,
    nullable: false,
    type: 'enum',
  })
  notificationPreference: TeamNotificationPreference;

  @Column({ length: 5, nullable: true, type: 'varchar' })
  notificationQuietHoursStart: string | null;

  @Column({ length: 5, nullable: true, type: 'varchar' })
  notificationQuietHoursEnd: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
