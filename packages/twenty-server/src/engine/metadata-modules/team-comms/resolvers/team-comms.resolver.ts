import { BadRequestException, UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Subscription } from '@nestjs/graphql';

import GraphQLUpload from 'graphql-upload/GraphQLUpload.mjs';

import type { FileUpload } from 'graphql-upload/processRequest.mjs';

import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';
import { FileWithSignedUrlDTO } from 'src/engine/core-modules/file/dtos/file-with-sign-url.dto';
import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthUserWorkspaceId } from 'src/engine/decorators/auth/auth-user-workspace-id.decorator';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { TEAM_MESSAGE_ATTACHMENT_MAX_SIZE_BYTES } from 'src/engine/metadata-modules/team-comms/constants/team-message-attachment.constants';
import { TeamChannelMemberDTO } from 'src/engine/metadata-modules/team-comms/dtos/team-channel-member.dto';
import { TeamChannelDTO } from 'src/engine/metadata-modules/team-comms/dtos/team-channel.dto';
import { TeamDirectMessageDTO } from 'src/engine/metadata-modules/team-comms/dtos/team-direct-message.dto';
import { TeamDirectMessageNotificationSettingDTO } from 'src/engine/metadata-modules/team-comms/dtos/team-direct-message-notification-setting.dto';
import { TeamFileDTO } from 'src/engine/metadata-modules/team-comms/dtos/team-file.dto';
import { TeamInboxItemDTO } from 'src/engine/metadata-modules/team-comms/dtos/team-inbox-item.dto';
import { TeamMentionDTO } from 'src/engine/metadata-modules/team-comms/dtos/team-mention.dto';
import { TeamMemberDTO } from 'src/engine/metadata-modules/team-comms/dtos/team-member.dto';
import { TeamMessageAttachmentInput } from 'src/engine/metadata-modules/team-comms/dtos/team-message-attachment.input';
import { TeamMessageDTO } from 'src/engine/metadata-modules/team-comms/dtos/team-message.dto';
import { TeamMessageEventDTO } from 'src/engine/metadata-modules/team-comms/dtos/team-message-event.dto';
import { TeamMessageSearchResultDTO } from 'src/engine/metadata-modules/team-comms/dtos/team-message-search-result.dto';
import { TeamMessageReminderDTO } from 'src/engine/metadata-modules/team-comms/dtos/team-message-reminder.dto';
import { TeamPresenceDTO } from 'src/engine/metadata-modules/team-comms/dtos/team-presence.dto';
import { TeamTypingIndicatorDTO } from 'src/engine/metadata-modules/team-comms/dtos/team-typing-indicator.dto';
import { TeamChannelVisibility } from 'src/engine/metadata-modules/team-comms/entities/team-channel.entity';
import {
  TeamChannelNotificationLevel,
  TeamChannelMemberRole,
} from 'src/engine/metadata-modules/team-comms/entities/team-channel-member.entity';
import { TeamNotificationPreference } from 'src/engine/metadata-modules/team-comms/entities/team-presence.entity';
import { TeamCommsService } from 'src/engine/metadata-modules/team-comms/services/team-comms.service';
import { streamToBuffer } from 'src/utils/stream-to-buffer';

@UseGuards(WorkspaceAuthGuard, NoPermissionGuard)
@MetadataResolver(() => TeamChannelDTO)
export class TeamCommsResolver {
  constructor(private readonly teamCommsService: TeamCommsService) {}

  @Subscription(() => TeamMessageEventDTO, {
    filter: (
      payload: { onTeamMessageEvent: TeamMessageEventDTO },
      variables: {
        channelId?: string | null;
        directMessageThreadId?: string | null;
      },
    ) => {
      const event = payload.onTeamMessageEvent;

      if (variables.channelId) {
        return event.channelId === variables.channelId;
      }

      if (variables.directMessageThreadId) {
        return event.directMessageThreadId === variables.directMessageThreadId;
      }

      return false;
    },
  })
  async onTeamMessageEvent(
    @Args('channelId', { nullable: true, type: () => UUIDScalarType })
    channelId: string | null,
    @Args('directMessageThreadId', {
      nullable: true,
      type: () => UUIDScalarType,
    })
    directMessageThreadId: string | null,
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ) {
    await this.teamCommsService.assertCanSubscribeToMessageEvents({
      channelId,
      directMessageThreadId,
      userWorkspaceId,
      workspaceId,
    });

    return this.teamCommsService.subscribeToMessageEvents({ workspaceId });
  }

  @Query(() => [TeamChannelDTO])
  async teamChannels(
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<TeamChannelDTO[]> {
    return this.teamCommsService.getChannels({
      userWorkspaceId,
      workspaceId,
    });
  }

  @Query(() => [TeamMessageDTO])
  async teamMessages(
    @Args('channelId', { type: () => UUIDScalarType }) channelId: string,
    @Args('before', { nullable: true, type: () => String })
    before: string | null,
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<TeamMessageDTO[]> {
    return this.teamCommsService.getMessages({
      before,
      channelId,
      userWorkspaceId,
      workspaceId,
    });
  }

  @Query(() => [TeamDirectMessageDTO])
  async teamDirectMessages(
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<TeamDirectMessageDTO[]> {
    return this.teamCommsService.getDirectMessages({
      userWorkspaceId,
      workspaceId,
    });
  }

  @Query(() => [TeamMemberDTO])
  async teamMembers(
    @Args('query') query: string,
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<TeamMemberDTO[]> {
    return this.teamCommsService.searchMembers({
      query,
      userWorkspaceId,
      workspaceId,
    });
  }

  @Query(() => [TeamMessageDTO])
  async teamSavedMessages(
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<TeamMessageDTO[]> {
    return this.teamCommsService.getSavedMessages({
      userWorkspaceId,
      workspaceId,
    });
  }

  @Query(() => [TeamMessageDTO])
  async teamPinnedMessages(
    @Args('channelId', { nullable: true, type: () => UUIDScalarType })
    channelId: string | null,
    @Args('directMessageThreadId', {
      nullable: true,
      type: () => UUIDScalarType,
    })
    directMessageThreadId: string | null,
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<TeamMessageDTO[]> {
    return this.teamCommsService.getPinnedMessages({
      channelId,
      directMessageThreadId,
      userWorkspaceId,
      workspaceId,
    });
  }

  @Query(() => [TeamInboxItemDTO])
  async teamInbox(
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<TeamInboxItemDTO[]> {
    return this.teamCommsService.getInboxItems({
      userWorkspaceId,
      workspaceId,
    });
  }

  @Query(() => [TeamFileDTO])
  async teamFiles(
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<TeamFileDTO[]> {
    return this.teamCommsService.getFiles({
      userWorkspaceId,
      workspaceId,
    });
  }

  @Query(() => [TeamMessageReminderDTO])
  async teamMessageReminders(
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<TeamMessageReminderDTO[]> {
    return this.teamCommsService.getMessageReminders({
      userWorkspaceId,
      workspaceId,
    });
  }

  @Query(() => [TeamChannelMemberDTO])
  async teamChannelMembers(
    @Args('channelId', { type: () => UUIDScalarType }) channelId: string,
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<TeamChannelMemberDTO[]> {
    return this.teamCommsService.getChannelMembers({
      channelId,
      userWorkspaceId,
      workspaceId,
    });
  }

  @Query(() => [TeamPresenceDTO])
  async teamPresence(
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<TeamPresenceDTO[]> {
    return this.teamCommsService.getPresence({
      userWorkspaceId,
      workspaceId,
    });
  }

  @Query(() => [TeamTypingIndicatorDTO])
  async teamTypingIndicators(
    @Args('channelId', { nullable: true, type: () => UUIDScalarType })
    channelId: string | null,
    @Args('directMessageThreadId', {
      nullable: true,
      type: () => UUIDScalarType,
    })
    directMessageThreadId: string | null,
    @Args('parentMessageId', { nullable: true, type: () => UUIDScalarType })
    parentMessageId: string | null,
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<TeamTypingIndicatorDTO[]> {
    return this.teamCommsService.getTypingIndicators({
      channelId,
      directMessageThreadId,
      parentMessageId,
      userWorkspaceId,
      workspaceId,
    });
  }

  @Query(() => [TeamMessageSearchResultDTO])
  async teamMessageSearch(
    @Args('query') query: string,
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<TeamMessageSearchResultDTO[]> {
    return this.teamCommsService.searchMessages({
      query,
      userWorkspaceId,
      workspaceId,
    });
  }

  @Query(() => [TeamMentionDTO])
  async teamMentions(
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<TeamMentionDTO[]> {
    return this.teamCommsService.getMentions({
      userWorkspaceId,
      workspaceId,
    });
  }

  @Query(() => [TeamMessageDTO])
  async teamDirectMessageMessages(
    @Args('directMessageThreadId', { type: () => UUIDScalarType })
    directMessageThreadId: string,
    @Args('before', { nullable: true, type: () => String })
    before: string | null,
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<TeamMessageDTO[]> {
    return this.teamCommsService.getDirectMessageMessages({
      before,
      directMessageThreadId,
      userWorkspaceId,
      workspaceId,
    });
  }

  @Query(() => [TeamMessageDTO])
  async teamMessageThread(
    @Args('parentMessageId', { type: () => UUIDScalarType })
    parentMessageId: string,
    @Args('before', { nullable: true, type: () => String })
    before: string | null,
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<TeamMessageDTO[]> {
    return this.teamCommsService.getMessageThread({
      before,
      parentMessageId,
      userWorkspaceId,
      workspaceId,
    });
  }

  @Mutation(() => TeamMessageDTO)
  async sendTeamMessage(
    @Args('channelId', { type: () => UUIDScalarType }) channelId: string,
    @Args('body') body: string,
    @Args('parentMessageId', { nullable: true, type: () => UUIDScalarType })
    parentMessageId: string | null,
    @Args('attachments', {
      nullable: true,
      type: () => [TeamMessageAttachmentInput],
    })
    attachments: TeamMessageAttachmentInput[] | null,
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<TeamMessageDTO> {
    return this.teamCommsService.sendMessage({
      attachments,
      body,
      channelId,
      parentMessageId,
      userWorkspaceId,
      workspaceId,
    });
  }

  @Mutation(() => FileWithSignedUrlDTO)
  async uploadTeamMessageAttachment(
    @Args({ name: 'file', type: () => GraphQLUpload })
    { createReadStream, filename }: FileUpload,
    @Args('channelId', { nullable: true, type: () => UUIDScalarType })
    channelId: string | null,
    @Args('directMessageThreadId', {
      nullable: true,
      type: () => UUIDScalarType,
    })
    directMessageThreadId: string | null,
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<FileWithSignedUrlDTO> {
    const stream = createReadStream();
    const buffer = await streamToBuffer(
      stream,
      TEAM_MESSAGE_ATTACHMENT_MAX_SIZE_BYTES,
    ).catch(() => {
      throw new BadRequestException('Attachment is too large.');
    });

    return this.teamCommsService.uploadMessageAttachment({
      channelId,
      directMessageThreadId,
      file: buffer,
      filename,
      userWorkspaceId,
      workspaceId,
    });
  }

  @Mutation(() => TeamChannelDTO)
  async createTeamChannel(
    @Args('name') name: string,
    @Args('description', { nullable: true, type: () => String })
    description: string | null,
    @Args('visibility', {
      nullable: true,
      type: () => TeamChannelVisibility,
    })
    visibility: TeamChannelVisibility | null,
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<TeamChannelDTO> {
    return this.teamCommsService.createChannel({
      description,
      name,
      userWorkspaceId,
      visibility: visibility ?? TeamChannelVisibility.PUBLIC,
      workspaceId,
    });
  }

  @Mutation(() => TeamDirectMessageDTO)
  async createTeamDirectMessage(
    @Args('participantUserWorkspaceId', { type: () => UUIDScalarType })
    participantUserWorkspaceId: string,
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<TeamDirectMessageDTO> {
    return this.teamCommsService.createDirectMessage({
      participantUserWorkspaceId,
      userWorkspaceId,
      workspaceId,
    });
  }

  @Mutation(() => TeamChannelDTO)
  async updateTeamChannel(
    @Args('channelId', { type: () => UUIDScalarType }) channelId: string,
    @Args('name') name: string,
    @Args('description', { nullable: true, type: () => String })
    description: string | null,
    @Args('visibility', {
      nullable: true,
      type: () => TeamChannelVisibility,
    })
    visibility: TeamChannelVisibility | null,
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<TeamChannelDTO> {
    return this.teamCommsService.updateChannel({
      channelId,
      description,
      name,
      userWorkspaceId,
      visibility,
      workspaceId,
    });
  }

  @Mutation(() => TeamChannelDTO)
  async joinTeamChannel(
    @Args('channelId', { type: () => UUIDScalarType }) channelId: string,
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<TeamChannelDTO> {
    return this.teamCommsService.joinChannel({
      channelId,
      userWorkspaceId,
      workspaceId,
    });
  }

  @Mutation(() => TeamChannelMemberDTO)
  async inviteTeamChannelMember(
    @Args('channelId', { type: () => UUIDScalarType }) channelId: string,
    @Args('userWorkspaceId', { type: () => UUIDScalarType })
    invitedUserWorkspaceId: string,
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<TeamChannelMemberDTO> {
    return this.teamCommsService.inviteChannelMember({
      channelId,
      invitedUserWorkspaceId,
      userWorkspaceId,
      workspaceId,
    });
  }

  @Mutation(() => Boolean)
  async removeTeamChannelMember(
    @Args('channelId', { type: () => UUIDScalarType }) channelId: string,
    @Args('userWorkspaceId', { type: () => UUIDScalarType })
    removedUserWorkspaceId: string,
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<boolean> {
    return this.teamCommsService.removeChannelMember({
      channelId,
      removedUserWorkspaceId,
      userWorkspaceId,
      workspaceId,
    });
  }

  @Mutation(() => TeamChannelMemberDTO)
  async updateTeamChannelMemberRole(
    @Args('channelId', { type: () => UUIDScalarType }) channelId: string,
    @Args('userWorkspaceId', { type: () => UUIDScalarType })
    targetUserWorkspaceId: string,
    @Args('role', { type: () => TeamChannelMemberRole })
    role: TeamChannelMemberRole,
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<TeamChannelMemberDTO> {
    return this.teamCommsService.updateChannelMemberRole({
      channelId,
      role,
      targetUserWorkspaceId,
      userWorkspaceId,
      workspaceId,
    });
  }

  @Mutation(() => Boolean)
  async leaveTeamChannel(
    @Args('channelId', { type: () => UUIDScalarType }) channelId: string,
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<boolean> {
    return this.teamCommsService.leaveChannel({
      channelId,
      userWorkspaceId,
      workspaceId,
    });
  }

  @Mutation(() => Boolean)
  async archiveTeamChannel(
    @Args('channelId', { type: () => UUIDScalarType }) channelId: string,
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<boolean> {
    return this.teamCommsService.archiveChannel({
      channelId,
      userWorkspaceId,
      workspaceId,
    });
  }

  @Mutation(() => TeamChannelMemberDTO)
  async updateTeamChannelNotificationLevel(
    @Args('channelId', { type: () => UUIDScalarType }) channelId: string,
    @Args('notificationLevel', {
      type: () => TeamChannelNotificationLevel,
    })
    notificationLevel: TeamChannelNotificationLevel,
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<TeamChannelMemberDTO> {
    return this.teamCommsService.updateChannelNotificationLevel({
      channelId,
      notificationLevel,
      userWorkspaceId,
      workspaceId,
    });
  }

  @Mutation(() => TeamDirectMessageNotificationSettingDTO)
  async updateTeamDirectMessageNotificationLevel(
    @Args('directMessageThreadId', { type: () => UUIDScalarType })
    directMessageThreadId: string,
    @Args('notificationLevel', {
      type: () => TeamChannelNotificationLevel,
    })
    notificationLevel: TeamChannelNotificationLevel,
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<TeamDirectMessageNotificationSettingDTO> {
    return this.teamCommsService.updateDirectMessageNotificationLevel({
      directMessageThreadId,
      notificationLevel,
      userWorkspaceId,
      workspaceId,
    });
  }

  @Mutation(() => TeamMessageDTO)
  async sendTeamDirectMessage(
    @Args('directMessageThreadId', { type: () => UUIDScalarType })
    directMessageThreadId: string,
    @Args('body') body: string,
    @Args('parentMessageId', { nullable: true, type: () => UUIDScalarType })
    parentMessageId: string | null,
    @Args('attachments', {
      nullable: true,
      type: () => [TeamMessageAttachmentInput],
    })
    attachments: TeamMessageAttachmentInput[] | null,
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<TeamMessageDTO> {
    return this.teamCommsService.sendDirectMessage({
      attachments,
      body,
      directMessageThreadId,
      parentMessageId,
      userWorkspaceId,
      workspaceId,
    });
  }

  @Mutation(() => Boolean)
  async markTeamChannelRead(
    @Args('channelId', { type: () => UUIDScalarType }) channelId: string,
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<boolean> {
    return this.teamCommsService.markChannelRead({
      channelId,
      userWorkspaceId,
      workspaceId,
    });
  }

  @Mutation(() => TeamPresenceDTO)
  async heartbeatTeamPresence(
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<TeamPresenceDTO> {
    return this.teamCommsService.heartbeatPresence({
      userWorkspaceId,
      workspaceId,
    });
  }

  @Mutation(() => TeamPresenceDTO)
  async updateTeamPresenceStatus(
    @Args('statusText', { nullable: true, type: () => String })
    statusText: string | null,
    @Args('statusEmoji', { nullable: true, type: () => String })
    statusEmoji: string | null,
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<TeamPresenceDTO> {
    return this.teamCommsService.updatePresenceStatus({
      statusEmoji,
      statusText,
      userWorkspaceId,
      workspaceId,
    });
  }

  @Mutation(() => TeamPresenceDTO)
  async updateTeamNotificationPreference(
    @Args('notificationPreference', {
      type: () => TeamNotificationPreference,
    })
    notificationPreference: TeamNotificationPreference,
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<TeamPresenceDTO> {
    return this.teamCommsService.updateNotificationPreference({
      notificationPreference,
      userWorkspaceId,
      workspaceId,
    });
  }

  @Mutation(() => TeamPresenceDTO)
  async updateTeamNotificationQuietHours(
    @Args('notificationQuietHoursStart', { nullable: true, type: () => String })
    notificationQuietHoursStart: string | null,
    @Args('notificationQuietHoursEnd', { nullable: true, type: () => String })
    notificationQuietHoursEnd: string | null,
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<TeamPresenceDTO> {
    return this.teamCommsService.updateNotificationQuietHours({
      notificationQuietHoursEnd,
      notificationQuietHoursStart,
      userWorkspaceId,
      workspaceId,
    });
  }

  @Mutation(() => TeamTypingIndicatorDTO)
  async heartbeatTeamTyping(
    @Args('channelId', { nullable: true, type: () => UUIDScalarType })
    channelId: string | null,
    @Args('directMessageThreadId', {
      nullable: true,
      type: () => UUIDScalarType,
    })
    directMessageThreadId: string | null,
    @Args('parentMessageId', { nullable: true, type: () => UUIDScalarType })
    parentMessageId: string | null,
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<TeamTypingIndicatorDTO> {
    return this.teamCommsService.heartbeatTyping({
      channelId,
      directMessageThreadId,
      parentMessageId,
      userWorkspaceId,
      workspaceId,
    });
  }

  @Mutation(() => Boolean)
  async markTeamDirectMessageRead(
    @Args('directMessageThreadId', { type: () => UUIDScalarType })
    directMessageThreadId: string,
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<boolean> {
    return this.teamCommsService.markDirectMessageRead({
      directMessageThreadId,
      userWorkspaceId,
      workspaceId,
    });
  }

  @Mutation(() => Boolean)
  async markTeamMessageThreadRead(
    @Args('parentMessageId', { type: () => UUIDScalarType })
    parentMessageId: string,
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<boolean> {
    return this.teamCommsService.markMessageThreadRead({
      parentMessageId,
      userWorkspaceId,
      workspaceId,
    });
  }

  @Mutation(() => Boolean)
  async markTeamInboxRead(
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<boolean> {
    return this.teamCommsService.markInboxRead({
      userWorkspaceId,
      workspaceId,
    });
  }

  @Mutation(() => Boolean)
  async markTeamMessageUnread(
    @Args('messageId', { type: () => UUIDScalarType }) messageId: string,
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<boolean> {
    return this.teamCommsService.markMessageUnread({
      messageId,
      userWorkspaceId,
      workspaceId,
    });
  }

  @Mutation(() => Boolean)
  async markTeamMentionRead(
    @Args('mentionId', { type: () => UUIDScalarType }) mentionId: string,
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<boolean> {
    return this.teamCommsService.markMentionRead({
      mentionId,
      userWorkspaceId,
      workspaceId,
    });
  }

  @Mutation(() => TeamMessageDTO)
  async toggleTeamMessageReaction(
    @Args('messageId', { type: () => UUIDScalarType }) messageId: string,
    @Args('emoji') emoji: string,
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<TeamMessageDTO> {
    return this.teamCommsService.toggleMessageReaction({
      emoji,
      messageId,
      userWorkspaceId,
      workspaceId,
    });
  }

  @Mutation(() => TeamMessageDTO)
  async toggleTeamMessagePin(
    @Args('messageId', { type: () => UUIDScalarType }) messageId: string,
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<TeamMessageDTO> {
    return this.teamCommsService.toggleMessagePin({
      messageId,
      userWorkspaceId,
      workspaceId,
    });
  }

  @Mutation(() => TeamMessageDTO)
  async toggleTeamMessageBookmark(
    @Args('messageId', { type: () => UUIDScalarType }) messageId: string,
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<TeamMessageDTO> {
    return this.teamCommsService.toggleMessageBookmark({
      messageId,
      userWorkspaceId,
      workspaceId,
    });
  }

  @Mutation(() => TeamMessageReminderDTO)
  async setTeamMessageReminder(
    @Args('messageId', { type: () => UUIDScalarType }) messageId: string,
    @Args('remindAt', { type: () => Date }) remindAt: Date,
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<TeamMessageReminderDTO> {
    return this.teamCommsService.setMessageReminder({
      messageId,
      remindAt,
      userWorkspaceId,
      workspaceId,
    });
  }

  @Mutation(() => Boolean)
  async dismissTeamMessageReminder(
    @Args('messageId', { type: () => UUIDScalarType }) messageId: string,
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<boolean> {
    return this.teamCommsService.dismissMessageReminder({
      messageId,
      userWorkspaceId,
      workspaceId,
    });
  }

  @Mutation(() => TeamMessageDTO)
  async updateTeamMessage(
    @Args('messageId', { type: () => UUIDScalarType }) messageId: string,
    @Args('body') body: string,
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<TeamMessageDTO> {
    return this.teamCommsService.updateMessage({
      body,
      messageId,
      userWorkspaceId,
      workspaceId,
    });
  }

  @Mutation(() => Boolean)
  async deleteTeamMessage(
    @Args('messageId', { type: () => UUIDScalarType }) messageId: string,
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<boolean> {
    return this.teamCommsService.deleteMessage({
      messageId,
      userWorkspaceId,
      workspaceId,
    });
  }
}
