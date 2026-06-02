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

import type { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { TeamDirectMessageParticipantEntity } from 'src/engine/metadata-modules/team-comms/entities/team-direct-message-participant.entity';
import { TeamMessageEntity } from 'src/engine/metadata-modules/team-comms/entities/team-message.entity';

@Entity({ name: 'teamDirectMessageThread', schema: 'core' })
@Index(
  'IDX_TEAM_DM_THREAD_WORKSPACE_PARTICIPANT_KEY',
  ['workspaceId', 'participantKey'],
  {
    unique: true,
  },
)
export class TeamDirectMessageThreadEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, type: 'uuid' })
  @Index()
  workspaceId: string;

  @ManyToOne('WorkspaceEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspaceId' })
  workspace: Relation<WorkspaceEntity>;

  @Column({ type: 'varchar' })
  participantKey: string;

  @OneToMany(
    () => TeamDirectMessageParticipantEntity,
    (participant) => participant.thread,
  )
  participants: Relation<TeamDirectMessageParticipantEntity[]>;

  @OneToMany(() => TeamMessageEntity, (message) => message.directMessageThread)
  messages: Relation<TeamMessageEntity[]>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
