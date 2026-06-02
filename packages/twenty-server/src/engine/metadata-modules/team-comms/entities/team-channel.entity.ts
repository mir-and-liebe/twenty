import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';

import { UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';
import type { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { TeamChannelMemberEntity } from 'src/engine/metadata-modules/team-comms/entities/team-channel-member.entity';
import { TeamMessageEntity } from 'src/engine/metadata-modules/team-comms/entities/team-message.entity';

export enum TeamChannelVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

@Entity({ name: 'teamChannel', schema: 'core' })
@Index('IDX_TEAM_CHANNEL_WORKSPACE_SLUG_DELETED_AT', [
  'workspaceId',
  'slug',
  'deletedAt',
])
export class TeamChannelEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, type: 'uuid' })
  @Index()
  workspaceId: string;

  @ManyToOne('WorkspaceEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspaceId' })
  workspace: Relation<WorkspaceEntity>;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar' })
  slug: string;

  @Column({ nullable: true, type: 'text' })
  description: string | null;

  @Column({
    default: TeamChannelVisibility.PUBLIC,
    enum: TeamChannelVisibility,
    type: 'enum',
  })
  visibility: TeamChannelVisibility;

  @Column({ nullable: true, type: 'uuid' })
  @Index()
  createdByUserWorkspaceId: string | null;

  @ManyToOne(() => UserWorkspaceEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'createdByUserWorkspaceId' })
  createdByUserWorkspace: Relation<UserWorkspaceEntity> | null;

  @OneToMany(() => TeamChannelMemberEntity, (member) => member.channel)
  members: Relation<TeamChannelMemberEntity[]>;

  @OneToMany(() => TeamMessageEntity, (message) => message.channel)
  messages: Relation<TeamMessageEntity[]>;

  @Column({ nullable: true, type: 'timestamptz' })
  deletedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
