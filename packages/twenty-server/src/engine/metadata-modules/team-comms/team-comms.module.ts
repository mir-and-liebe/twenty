import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ApplicationModule } from 'src/engine/core-modules/application/application.module';
import { FileUrlModule } from 'src/engine/core-modules/file/file-url/file-url.module';
import { UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';
import { TeamChannelEntity } from 'src/engine/metadata-modules/team-comms/entities/team-channel.entity';
import { TeamChannelMemberEntity } from 'src/engine/metadata-modules/team-comms/entities/team-channel-member.entity';
import { TeamDirectMessageParticipantEntity } from 'src/engine/metadata-modules/team-comms/entities/team-direct-message-participant.entity';
import { TeamDirectMessageThreadEntity } from 'src/engine/metadata-modules/team-comms/entities/team-direct-message-thread.entity';
import { TeamMessageAttachmentEntity } from 'src/engine/metadata-modules/team-comms/entities/team-message-attachment.entity';
import { TeamMessageBookmarkEntity } from 'src/engine/metadata-modules/team-comms/entities/team-message-bookmark.entity';
import { TeamMessageEntity } from 'src/engine/metadata-modules/team-comms/entities/team-message.entity';
import { TeamMessageMentionEntity } from 'src/engine/metadata-modules/team-comms/entities/team-message-mention.entity';
import { TeamMessageReactionEntity } from 'src/engine/metadata-modules/team-comms/entities/team-message-reaction.entity';
import { TeamMessageReminderEntity } from 'src/engine/metadata-modules/team-comms/entities/team-message-reminder.entity';
import { TeamMessageThreadReadEntity } from 'src/engine/metadata-modules/team-comms/entities/team-message-thread-read.entity';
import { TeamPresenceEntity } from 'src/engine/metadata-modules/team-comms/entities/team-presence.entity';
import { TeamCommsResolver } from 'src/engine/metadata-modules/team-comms/resolvers/team-comms.resolver';
import { TeamCommsService } from 'src/engine/metadata-modules/team-comms/services/team-comms.service';
import { provideWorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/provide-workspace-scoped-repository';

@Module({
  imports: [
    ApplicationModule,
    FileUrlModule,
    TypeOrmModule.forFeature([
      TeamChannelEntity,
      TeamChannelMemberEntity,
      TeamDirectMessageParticipantEntity,
      TeamDirectMessageThreadEntity,
      TeamMessageAttachmentEntity,
      TeamMessageBookmarkEntity,
      TeamMessageEntity,
      TeamMessageMentionEntity,
      TeamMessageReactionEntity,
      TeamMessageReminderEntity,
      TeamMessageThreadReadEntity,
      TeamPresenceEntity,
      UserWorkspaceEntity,
    ]),
  ],
  providers: [
    TeamCommsResolver,
    TeamCommsService,
    provideWorkspaceScopedRepository(TeamChannelEntity),
    provideWorkspaceScopedRepository(TeamChannelMemberEntity),
    provideWorkspaceScopedRepository(TeamDirectMessageParticipantEntity),
    provideWorkspaceScopedRepository(TeamDirectMessageThreadEntity),
    provideWorkspaceScopedRepository(TeamMessageAttachmentEntity),
    provideWorkspaceScopedRepository(TeamMessageBookmarkEntity),
    provideWorkspaceScopedRepository(TeamMessageEntity),
    provideWorkspaceScopedRepository(TeamMessageMentionEntity),
    provideWorkspaceScopedRepository(TeamMessageReactionEntity),
    provideWorkspaceScopedRepository(TeamMessageReminderEntity),
    provideWorkspaceScopedRepository(TeamMessageThreadReadEntity),
    provideWorkspaceScopedRepository(TeamPresenceEntity),
  ],
  exports: [TeamCommsService],
})
export class TeamCommsModule {}
