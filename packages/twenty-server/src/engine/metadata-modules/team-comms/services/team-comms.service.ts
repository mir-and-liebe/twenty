import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { isNonEmptyString } from '@sniptt/guards';
import {
  type FindOptionsWhere,
  ILike,
  In,
  IsNull,
  LessThan,
  MoreThan,
  Not,
  Repository,
} from 'typeorm';
import { FileFolder } from 'twenty-shared/types';
import { v4 } from 'uuid';

import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { FileStorageService } from 'src/engine/core-modules/file-storage/file-storage.service';
import { FileWithSignedUrlDTO } from 'src/engine/core-modules/file/dtos/file-with-sign-url.dto';
import { FileUrlService } from 'src/engine/core-modules/file/file-url/file-url.service';
import { extractFileInfoOrThrow } from 'src/engine/core-modules/file/utils/extract-file-info-or-throw.utils';
import { UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';
import { TeamChannelMemberDTO } from 'src/engine/metadata-modules/team-comms/dtos/team-channel-member.dto';
import { TeamChannelDTO } from 'src/engine/metadata-modules/team-comms/dtos/team-channel.dto';
import { TeamDirectMessageDTO } from 'src/engine/metadata-modules/team-comms/dtos/team-direct-message.dto';
import { TeamDirectMessageNotificationSettingDTO } from 'src/engine/metadata-modules/team-comms/dtos/team-direct-message-notification-setting.dto';
import { TeamFileDTO } from 'src/engine/metadata-modules/team-comms/dtos/team-file.dto';
import {
  TeamInboxItemDTO,
  TeamInboxItemType,
} from 'src/engine/metadata-modules/team-comms/dtos/team-inbox-item.dto';
import { TeamMentionDTO } from 'src/engine/metadata-modules/team-comms/dtos/team-mention.dto';
import { TeamMemberDTO } from 'src/engine/metadata-modules/team-comms/dtos/team-member.dto';
import { TeamMessageAttachmentDTO } from 'src/engine/metadata-modules/team-comms/dtos/team-message-attachment.dto';
import { TeamMessageAttachmentInput } from 'src/engine/metadata-modules/team-comms/dtos/team-message-attachment.input';
import { TeamMessageDTO } from 'src/engine/metadata-modules/team-comms/dtos/team-message.dto';
import {
  TeamMessageEventDTO,
  TeamMessageEventType,
} from 'src/engine/metadata-modules/team-comms/dtos/team-message-event.dto';
import { TeamMessageReactionDTO } from 'src/engine/metadata-modules/team-comms/dtos/team-message-reaction.dto';
import { TeamMessageReminderDTO } from 'src/engine/metadata-modules/team-comms/dtos/team-message-reminder.dto';
import { TeamMessageSearchResultDTO } from 'src/engine/metadata-modules/team-comms/dtos/team-message-search-result.dto';
import { TeamPresenceDTO } from 'src/engine/metadata-modules/team-comms/dtos/team-presence.dto';
import { TeamTypingIndicatorDTO } from 'src/engine/metadata-modules/team-comms/dtos/team-typing-indicator.dto';
import {
  TeamChannelEntity,
  TeamChannelVisibility,
} from 'src/engine/metadata-modules/team-comms/entities/team-channel.entity';
import {
  TeamChannelMemberEntity,
  TeamChannelNotificationLevel,
  TeamChannelMemberRole,
} from 'src/engine/metadata-modules/team-comms/entities/team-channel-member.entity';
import { TeamDirectMessageParticipantEntity } from 'src/engine/metadata-modules/team-comms/entities/team-direct-message-participant.entity';
import { TeamDirectMessageThreadEntity } from 'src/engine/metadata-modules/team-comms/entities/team-direct-message-thread.entity';
import { TeamMessageAttachmentEntity } from 'src/engine/metadata-modules/team-comms/entities/team-message-attachment.entity';
import { TeamMessageBookmarkEntity } from 'src/engine/metadata-modules/team-comms/entities/team-message-bookmark.entity';
import { TeamMessageEntity } from 'src/engine/metadata-modules/team-comms/entities/team-message.entity';
import { TeamMessageMentionEntity } from 'src/engine/metadata-modules/team-comms/entities/team-message-mention.entity';
import { TeamMessageReactionEntity } from 'src/engine/metadata-modules/team-comms/entities/team-message-reaction.entity';
import { TeamMessageReminderEntity } from 'src/engine/metadata-modules/team-comms/entities/team-message-reminder.entity';
import { TeamMessageThreadReadEntity } from 'src/engine/metadata-modules/team-comms/entities/team-message-thread-read.entity';
import {
  TeamNotificationPreference,
  TeamPresenceEntity,
} from 'src/engine/metadata-modules/team-comms/entities/team-presence.entity';
import { SubscriptionChannel } from 'src/engine/subscriptions/enums/subscription-channel.enum';
import { SubscriptionService } from 'src/engine/subscriptions/subscription.service';
import { InjectWorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/inject-workspace-scoped-repository.decorator';
import { WorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/workspace-scoped-repository';
import { TEAM_MESSAGE_ATTACHMENT_MAX_SIZE_BYTES } from 'src/engine/metadata-modules/team-comms/constants/team-message-attachment.constants';

const DEFAULT_TEAM_CHANNELS = [
  {
    name: 'general',
    slug: 'general',
    description: 'Company-wide updates and daily coordination.',
  },
  {
    name: 'sales',
    slug: 'sales',
    description: 'Pipeline, opportunities, and customer follow-up.',
  },
  {
    name: 'ops',
    slug: 'ops',
    description: 'Internal operations and delivery handoffs.',
  },
] as const;

const DEFAULT_TEAM_CHANNEL_SLUGS = DEFAULT_TEAM_CHANNELS.map(
  (channel) => channel.slug,
);

const TEAM_CHANNEL_NAME_MAX_LENGTH = 80;
const TEAM_MESSAGE_SEARCH_MIN_LENGTH = 2;
const TEAM_MESSAGE_SEARCH_LIMIT = 25;
const TEAM_MENTION_LIMIT = 25;
const TEAM_MEMBER_SEARCH_MIN_LENGTH = 2;
const TEAM_MEMBER_SEARCH_LIMIT = 20;
const TEAM_MESSAGE_BODY_MAX_LENGTH = 40_000;
const TEAM_REACTION_MAX_LENGTH = 32;
const TEAM_PRESENCE_ONLINE_WINDOW_MS = 60_000;
const TEAM_MESSAGE_ATTACHMENT_LIMIT = 5;
const TEAM_MESSAGE_ATTACHMENT_NAME_MAX_LENGTH = 180;
const TEAM_MESSAGE_ATTACHMENT_URL_MAX_LENGTH = 500_000;
const TEAM_FILES_LIMIT = 50;
const TEAM_TYPING_INDICATOR_TTL_MS = 6_000;
const TEAM_PRESENCE_STATUS_TEXT_MAX_LENGTH = 80;
const TEAM_PRESENCE_STATUS_EMOJI_MAX_LENGTH = 32;
const TEAM_NOTIFICATION_QUIET_HOURS_TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const TEAM_MESSAGE_INLINE_CODE_PATTERN = /`([^`\n]+)`/g;
const TEAM_MESSAGE_MENTION_PATTERN = /@([a-zA-Z0-9._-]+)/g;
const TEAM_MESSAGE_URL_PATTERN = /https?:\/\/[^\s]+/g;

const isDefined = <TValue>(value: TValue | null | undefined): value is TValue =>
  value !== null && value !== undefined;

@Injectable()
export class TeamCommsService {
  private readonly typingIndicatorsByKey = new Map<
    string,
    TeamTypingIndicatorDTO
  >();

  constructor(
    @InjectWorkspaceScopedRepository(TeamChannelEntity)
    private readonly channelRepository: WorkspaceScopedRepository<TeamChannelEntity>,
    @InjectWorkspaceScopedRepository(TeamChannelMemberEntity)
    private readonly channelMemberRepository: WorkspaceScopedRepository<TeamChannelMemberEntity>,
    @InjectWorkspaceScopedRepository(TeamDirectMessageParticipantEntity)
    private readonly directMessageParticipantRepository: WorkspaceScopedRepository<TeamDirectMessageParticipantEntity>,
    @InjectWorkspaceScopedRepository(TeamDirectMessageThreadEntity)
    private readonly directMessageThreadRepository: WorkspaceScopedRepository<TeamDirectMessageThreadEntity>,
    @InjectWorkspaceScopedRepository(TeamMessageAttachmentEntity)
    private readonly messageAttachmentRepository: WorkspaceScopedRepository<TeamMessageAttachmentEntity>,
    @InjectWorkspaceScopedRepository(TeamMessageBookmarkEntity)
    private readonly messageBookmarkRepository: WorkspaceScopedRepository<TeamMessageBookmarkEntity>,
    @InjectWorkspaceScopedRepository(TeamMessageEntity)
    private readonly messageRepository: WorkspaceScopedRepository<TeamMessageEntity>,
    @InjectWorkspaceScopedRepository(TeamMessageMentionEntity)
    private readonly messageMentionRepository: WorkspaceScopedRepository<TeamMessageMentionEntity>,
    @InjectWorkspaceScopedRepository(TeamMessageReactionEntity)
    private readonly messageReactionRepository: WorkspaceScopedRepository<TeamMessageReactionEntity>,
    @InjectWorkspaceScopedRepository(TeamMessageReminderEntity)
    private readonly messageReminderRepository: WorkspaceScopedRepository<TeamMessageReminderEntity>,
    @InjectWorkspaceScopedRepository(TeamMessageThreadReadEntity)
    private readonly messageThreadReadRepository: WorkspaceScopedRepository<TeamMessageThreadReadEntity>,
    @InjectWorkspaceScopedRepository(TeamPresenceEntity)
    private readonly presenceRepository: WorkspaceScopedRepository<TeamPresenceEntity>,
    @InjectRepository(UserWorkspaceEntity)
    private readonly userWorkspaceRepository: Repository<UserWorkspaceEntity>,
    private readonly subscriptionService: SubscriptionService,
    private readonly fileStorageService: FileStorageService,
    private readonly applicationService: ApplicationService,
    private readonly fileUrlService: FileUrlService,
  ) {}

  async subscribeToMessageEvents({ workspaceId }: { workspaceId: string }) {
    return this.subscriptionService.subscribe({
      channel: SubscriptionChannel.TEAM_COMMS_MESSAGES_CHANNEL,
      workspaceId,
    });
  }

  async assertCanSubscribeToMessageEvents({
    channelId,
    directMessageThreadId,
    userWorkspaceId,
    workspaceId,
  }: {
    channelId?: string | null;
    directMessageThreadId?: string | null;
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<void> {
    if (isDefined(channelId) === isDefined(directMessageThreadId)) {
      throw new BadRequestException(
        'Exactly one Team Comms conversation is required.',
      );
    }

    if (isDefined(channelId)) {
      await this.assertCanReadChannel({
        channelId,
        userWorkspaceId,
        workspaceId,
      });

      return;
    }

    if (isDefined(directMessageThreadId)) {
      await this.assertDirectMessageParticipant({
        directMessageThreadId,
        userWorkspaceId,
        workspaceId,
      });
    }
  }

  async getChannels({
    workspaceId,
    userWorkspaceId,
  }: {
    workspaceId: string;
    userWorkspaceId: string;
  }): Promise<TeamChannelDTO[]> {
    await this.ensureDefaultChannels({ workspaceId, userWorkspaceId });

    const memberships = await this.channelMemberRepository.find(workspaceId, {
      where: { userWorkspaceId },
    });
    const membershipByChannelId = new Map(
      memberships.map((membership) => [membership.channelId, membership]),
    );
    const memberChannelIds = memberships.map(
      (membership) => membership.channelId,
    );
    const channels = await this.channelRepository.find(workspaceId, {
      order: { createdAt: 'ASC' },
      where:
        memberChannelIds.length > 0
          ? [
              {
                deletedAt: IsNull(),
                visibility: TeamChannelVisibility.PUBLIC,
              },
              {
                deletedAt: IsNull(),
                id: In(memberChannelIds),
                visibility: TeamChannelVisibility.PRIVATE,
              },
            ]
          : {
              deletedAt: IsNull(),
              visibility: TeamChannelVisibility.PUBLIC,
            },
    });

    return Promise.all(
      channels.map(async (channel) => {
        const membership = membershipByChannelId.get(channel.id);

        return this.toChannelDTO({
          channel,
          membership,
          unreadCount: await this.getUnreadChannelMessageCount({
            channelId: channel.id,
            membership,
            userWorkspaceId,
            workspaceId,
          }),
        });
      }),
    );
  }

  async getMessages({
    before,
    channelId,
    userWorkspaceId,
    workspaceId,
  }: {
    before?: string | null;
    channelId: string;
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<TeamMessageDTO[]> {
    const { channel, membership } = await this.assertCanReadChannel({
      channelId,
      userWorkspaceId,
      workspaceId,
    });
    const canModerateConversation =
      membership?.role === TeamChannelMemberRole.OWNER;

    const messageWhere: FindOptionsWhere<TeamMessageEntity> = {
      channelId,
      deletedAt: IsNull(),
      parentMessageId: IsNull(),
    };
    const beforeDate = this.parseMessageCursorDate(before);

    if (beforeDate !== null) {
      messageWhere.createdAt = LessThan(beforeDate);
    }

    const latestMessages = await this.messageRepository.find(workspaceId, {
      order: { createdAt: 'DESC' },
      relations: { authorUserWorkspace: { user: true } },
      take: 100,
      where: messageWhere,
    });
    const messages = latestMessages.reverse();
    const messageIds = messages.map((message) => message.id);
    const reactionsByMessageId = await this.getReactionSummariesByMessageId({
      messageIds,
      userWorkspaceId,
      workspaceId,
    });
    const attachmentsByMessageId = await this.getAttachmentsByMessageId({
      messageIds,
      workspaceId,
    });
    const savedMessageIds = await this.getSavedMessageIds({
      messageIds,
      userWorkspaceId,
      workspaceId,
    });
    const replyCountByParentMessageId =
      await this.getReplyCountByParentMessageId({
        parentMessageIds: messageIds,
        workspaceId,
      });

    return messages.map((message) =>
      this.toMessageDTO({
        message,
        attachments: attachmentsByMessageId.get(message.id) ?? [],
        reactions: reactionsByMessageId.get(message.id) ?? [],
        replyCount: replyCountByParentMessageId.get(message.id) ?? 0,
        canModerateConversation,
        conversationName: channel.name,
        isSaved: savedMessageIds.has(message.id),
        userWorkspaceId,
      }),
    );
  }

  async getDirectMessages({
    workspaceId,
    userWorkspaceId,
  }: {
    workspaceId: string;
    userWorkspaceId: string;
  }): Promise<TeamDirectMessageDTO[]> {
    const currentUserDirectMessageParticipants =
      await this.directMessageParticipantRepository.find(workspaceId, {
        where: { userWorkspaceId },
      });
    const currentUserDirectMessageThreadIds =
      currentUserDirectMessageParticipants.map(
        (participant) => participant.directMessageThreadId,
      );
    const existingDirectMessageParticipants =
      currentUserDirectMessageThreadIds.length > 0
        ? await this.directMessageParticipantRepository.find(workspaceId, {
            relations: { userWorkspace: { user: true } },
            where: {
              directMessageThreadId: In(currentUserDirectMessageThreadIds),
              userWorkspaceId: Not(userWorkspaceId),
            },
          })
        : [];
    const visibleDirectMessageParticipants =
      existingDirectMessageParticipants.filter((participant) =>
        isDefined(participant.userWorkspace),
      );
    const existingDirectMessages = await Promise.all(
      visibleDirectMessageParticipants.map(async (participant) => {
        return this.getOrCreateDirectMessageDTO({
          participantUserWorkspace: participant.userWorkspace,
          participantUserWorkspaceId: participant.userWorkspaceId,
          userWorkspaceId,
          workspaceId,
        });
      }),
    );
    const directMessagesById = new Map<string, TeamDirectMessageDTO>();

    for (const directMessage of existingDirectMessages) {
      directMessagesById.set(directMessage.id, directMessage);
    }

    return Array.from(directMessagesById.values()).sort(
      (firstDirectMessage, secondDirectMessage) =>
        secondDirectMessage.updatedAt.getTime() -
        firstDirectMessage.updatedAt.getTime(),
    );
  }

  async searchMembers({
    query,
    userWorkspaceId,
    workspaceId,
  }: {
    query: string;
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<TeamMemberDTO[]> {
    const normalizedQuery = query.trim();

    if (normalizedQuery.length < TEAM_MEMBER_SEARCH_MIN_LENGTH) {
      return [];
    }

    const [firstNameQuery, ...remainingNameQueries] =
      normalizedQuery.split(/\s+/);
    const lastNameQuery = remainingNameQueries.join(' ');
    const fullNameWhere =
      isNonEmptyString(firstNameQuery) && isNonEmptyString(lastNameQuery)
        ? [
            {
              deletedAt: IsNull(),
              id: Not(userWorkspaceId),
              user: {
                firstName: ILike(`%${firstNameQuery}%`),
                lastName: ILike(`%${lastNameQuery}%`),
              },
              workspaceId,
            },
            {
              deletedAt: IsNull(),
              id: Not(userWorkspaceId),
              user: {
                firstName: ILike(`%${lastNameQuery}%`),
                lastName: ILike(`%${firstNameQuery}%`),
              },
              workspaceId,
            },
          ]
        : [];

    const userWorkspaces = await this.userWorkspaceRepository.find({
      order: { createdAt: 'ASC' },
      relations: { user: true },
      take: TEAM_MEMBER_SEARCH_LIMIT,
      where: [
        {
          deletedAt: IsNull(),
          id: Not(userWorkspaceId),
          user: { firstName: ILike(`%${normalizedQuery}%`) },
          workspaceId,
        },
        {
          deletedAt: IsNull(),
          id: Not(userWorkspaceId),
          user: { lastName: ILike(`%${normalizedQuery}%`) },
          workspaceId,
        },
        {
          deletedAt: IsNull(),
          id: Not(userWorkspaceId),
          user: { email: ILike(`%${normalizedQuery}%`) },
          workspaceId,
        },
        ...fullNameWhere,
      ],
    });

    return userWorkspaces.map((userWorkspace) => ({
      email: userWorkspace.user.email,
      name: this.getAuthorName(userWorkspace),
      userWorkspaceId: userWorkspace.id,
    }));
  }

  async createDirectMessage({
    participantUserWorkspaceId,
    userWorkspaceId,
    workspaceId,
  }: {
    participantUserWorkspaceId: string;
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<TeamDirectMessageDTO> {
    if (participantUserWorkspaceId === userWorkspaceId) {
      throw new BadRequestException(
        'Cannot start a direct message with yourself.',
      );
    }

    const participantUserWorkspace = await this.userWorkspaceRepository.findOne(
      {
        relations: { user: true },
        where: {
          deletedAt: IsNull(),
          id: participantUserWorkspaceId,
          workspaceId,
        },
      },
    );

    if (!isDefined(participantUserWorkspace)) {
      throw new NotFoundException('Team member not found.');
    }

    return this.getOrCreateDirectMessageDTO({
      participantUserWorkspace,
      participantUserWorkspaceId,
      userWorkspaceId,
      workspaceId,
    });
  }

  async updateDirectMessageNotificationLevel({
    directMessageThreadId,
    notificationLevel,
    userWorkspaceId,
    workspaceId,
  }: {
    directMessageThreadId: string;
    notificationLevel: TeamChannelNotificationLevel;
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<TeamDirectMessageNotificationSettingDTO> {
    const participant =
      await this.directMessageParticipantRepository.findOneOrFail(workspaceId, {
        where: {
          directMessageThreadId,
          userWorkspaceId,
        },
      });

    const updatedParticipant =
      await this.directMessageParticipantRepository.save(workspaceId, {
        ...participant,
        notificationLevel,
      });

    return {
      directMessageThreadId: updatedParticipant.directMessageThreadId,
      notificationLevel: updatedParticipant.notificationLevel,
      userWorkspaceId: updatedParticipant.userWorkspaceId,
    };
  }

  async getInboxItems({
    userWorkspaceId,
    workspaceId,
  }: {
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<TeamInboxItemDTO[]> {
    const [channels, directMessages, mentions, channelMemberships, presence] =
      await Promise.all([
        this.getChannels({ userWorkspaceId, workspaceId }),
        this.getDirectMessages({ userWorkspaceId, workspaceId }),
        this.getMentions({ userWorkspaceId, workspaceId }),
        this.channelMemberRepository.find(workspaceId, {
          where: { userWorkspaceId },
        }),
        this.presenceRepository.findOne(workspaceId, {
          where: { userWorkspaceId },
        }),
      ]);
    const notificationPreference =
      presence?.notificationPreference ?? TeamNotificationPreference.ALL;
    const mentionItems = mentions
      .filter((mention) => !isDefined(mention.readAt))
      .map((mention) => ({
        channelId: mention.channelId,
        directMessageThreadId: mention.directMessageThreadId,
        id: `mention:${mention.id}`,
        mentionId: mention.id,
        messageId: mention.messageId,
        parentMessageId: mention.parentMessageId,
        subtitle: mention.body,
        title: `Mention in ${mention.conversationName}`,
        type: TeamInboxItemType.MENTION,
        unreadCount: 1,
        updatedAt: mention.createdAt,
      }));
    const directMessageItems = directMessages
      .filter((directMessage) => directMessage.unreadCount > 0)
      .filter(
        (directMessage) =>
          directMessage.notificationLevel === TeamChannelNotificationLevel.ALL,
      )
      .map((directMessage) => ({
        channelId: null,
        directMessageThreadId: directMessage.id,
        id: `direct:${directMessage.id}`,
        mentionId: null,
        messageId: null,
        parentMessageId: null,
        subtitle: directMessage.lastMessageBody,
        title: directMessage.participantName,
        type: TeamInboxItemType.DIRECT_MESSAGE,
        unreadCount: directMessage.unreadCount,
        updatedAt: directMessage.updatedAt,
      }));

    if (notificationPreference === TeamNotificationPreference.MUTED) {
      return [];
    }

    const threadItems = await this.getThreadInboxItems({
      channelMemberships,
      channels,
      directMessages,
      userWorkspaceId,
      workspaceId,
    });

    if (notificationPreference === TeamNotificationPreference.MENTIONS) {
      return this.sortInboxItems([
        ...mentionItems,
        ...threadItems,
        ...directMessageItems,
      ]);
    }

    const channelItems = channels
      .filter((channel) => {
        const membership = channelMemberships.find(
          (channelMembership) => channelMembership.channelId === channel.id,
        );

        return (
          channel.unreadCount > 0 &&
          membership?.notificationLevel === TeamChannelNotificationLevel.ALL
        );
      })
      .map((channel) => ({
        channelId: channel.id,
        directMessageThreadId: null,
        id: `channel:${channel.id}`,
        mentionId: null,
        messageId: null,
        parentMessageId: null,
        subtitle: `${channel.unreadCount} unread`,
        title: `# ${channel.name}`,
        type: TeamInboxItemType.CHANNEL,
        unreadCount: channel.unreadCount,
        updatedAt: channel.updatedAt,
      }));
    return this.sortInboxItems([
      ...mentionItems,
      ...threadItems,
      ...channelItems,
      ...directMessageItems,
    ]);
  }

  private sortInboxItems(inboxItems: TeamInboxItemDTO[]): TeamInboxItemDTO[] {
    return inboxItems
      .sort((firstItem, secondItem) => {
        return secondItem.updatedAt.getTime() - firstItem.updatedAt.getTime();
      })
      .slice(0, 20);
  }

  private async getThreadInboxItems({
    channelMemberships,
    channels,
    directMessages,
    userWorkspaceId,
    workspaceId,
  }: {
    channelMemberships: TeamChannelMemberEntity[];
    channels: TeamChannelDTO[];
    directMessages: TeamDirectMessageDTO[];
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<TeamInboxItemDTO[]> {
    const participatedParentMessageIds =
      await this.getParticipatedParentMessageIds({
        userWorkspaceId,
        workspaceId,
      });

    if (participatedParentMessageIds.length === 0) {
      return [];
    }

    const [replies, threadReads] = await Promise.all([
      this.messageRepository.find(workspaceId, {
        order: { createdAt: 'DESC' },
        where: {
          authorUserWorkspaceId: Not(userWorkspaceId),
          deletedAt: IsNull(),
          parentMessageId: In(participatedParentMessageIds),
        },
      }),
      this.messageThreadReadRepository.find(workspaceId, {
        where: {
          parentMessageId: In(participatedParentMessageIds),
          userWorkspaceId,
        },
      }),
    ]);
    const directMessageThreadIds = [
      ...new Set(
        replies.map((reply) => reply.directMessageThreadId).filter(isDefined),
      ),
    ];
    const directMessageParticipants =
      directMessageThreadIds.length > 0
        ? await this.directMessageParticipantRepository.find(workspaceId, {
            where: {
              directMessageThreadId: In(directMessageThreadIds),
              userWorkspaceId,
            },
          })
        : [];
    const channelById = new Map(
      channels.map((channel) => [channel.id, channel]),
    );
    const directMessageById = new Map(
      directMessages.map((directMessage) => [directMessage.id, directMessage]),
    );
    const membershipByChannelId = new Map(
      channelMemberships.map((membership) => [
        membership.channelId,
        membership,
      ]),
    );
    const directMessageParticipantByThreadId = new Map(
      directMessageParticipants.map((participant) => [
        participant.directMessageThreadId,
        participant,
      ]),
    );
    const threadReadAtByParentMessageId = new Map(
      threadReads.map((threadRead) => [
        threadRead.parentMessageId,
        threadRead.lastReadAt,
      ]),
    );
    const threadItemsByParentMessageId = new Map<string, TeamInboxItemDTO>();

    for (const reply of replies) {
      if (!isDefined(reply.parentMessageId)) {
        continue;
      }

      const threadReadAt = threadReadAtByParentMessageId.get(
        reply.parentMessageId,
      );

      if (isDefined(threadReadAt) && reply.createdAt <= threadReadAt) {
        continue;
      }

      if (isDefined(reply.channelId)) {
        const channel = channelById.get(reply.channelId);
        const membership = membershipByChannelId.get(reply.channelId);

        if (
          !isDefined(channel) ||
          !isDefined(membership) ||
          membership.notificationLevel !== TeamChannelNotificationLevel.ALL
        ) {
          continue;
        }

        const unreadBaseline = membership.lastReadAt ?? membership.createdAt;

        if (isDefined(unreadBaseline) && reply.createdAt <= unreadBaseline) {
          continue;
        }

        this.upsertThreadInboxItem({
          conversationTitle: `Thread in # ${channel.name}`,
          reply,
          threadItemsByParentMessageId,
        });
        continue;
      }

      if (isDefined(reply.directMessageThreadId)) {
        const directMessage = directMessageById.get(
          reply.directMessageThreadId,
        );
        const participant = directMessageParticipantByThreadId.get(
          reply.directMessageThreadId,
        );

        if (
          !isDefined(directMessage) ||
          !isDefined(participant) ||
          participant.notificationLevel !== TeamChannelNotificationLevel.ALL
        ) {
          continue;
        }

        const unreadBaseline = participant.lastReadAt ?? participant.createdAt;

        if (isDefined(unreadBaseline) && reply.createdAt <= unreadBaseline) {
          continue;
        }

        this.upsertThreadInboxItem({
          conversationTitle: `Thread with ${directMessage.participantName}`,
          reply,
          threadItemsByParentMessageId,
        });
        continue;
      }
    }

    return Array.from(threadItemsByParentMessageId.values());
  }

  private upsertThreadInboxItem({
    conversationTitle,
    reply,
    threadItemsByParentMessageId,
  }: {
    conversationTitle: string;
    reply: TeamMessageEntity;
    threadItemsByParentMessageId: Map<string, TeamInboxItemDTO>;
  }): void {
    if (!isDefined(reply.parentMessageId)) {
      return;
    }

    const existingItem = threadItemsByParentMessageId.get(
      reply.parentMessageId,
    );

    if (isDefined(existingItem)) {
      existingItem.unreadCount += 1;

      return;
    }

    threadItemsByParentMessageId.set(reply.parentMessageId, {
      channelId: reply.channelId ?? null,
      directMessageThreadId: reply.directMessageThreadId ?? null,
      id: `thread:${reply.parentMessageId}`,
      mentionId: null,
      messageId: reply.id,
      parentMessageId: reply.parentMessageId,
      subtitle: this.getMessagePreviewBody(reply.body),
      title: conversationTitle,
      type: TeamInboxItemType.THREAD,
      unreadCount: 1,
      updatedAt: reply.createdAt,
    });
  }

  private async getParticipatedParentMessageIds({
    userWorkspaceId,
    workspaceId,
  }: {
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<string[]> {
    const [authoredMessages, threadReads] = await Promise.all([
      this.messageRepository.find(workspaceId, {
        where: {
          authorUserWorkspaceId: userWorkspaceId,
          deletedAt: IsNull(),
        },
      }),
      this.messageThreadReadRepository.find(workspaceId, {
        where: {
          userWorkspaceId,
        },
      }),
    ]);

    return [
      ...new Set(
        [
          ...authoredMessages.map(
            (message) => message.parentMessageId ?? message.id,
          ),
          ...threadReads.map((threadRead) => threadRead.parentMessageId),
        ].filter(isDefined),
      ),
    ];
  }

  async getChannelMembers({
    channelId,
    userWorkspaceId,
    workspaceId,
  }: {
    channelId: string;
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<TeamChannelMemberDTO[]> {
    await this.assertCanReadChannel({
      channelId,
      userWorkspaceId,
      workspaceId,
    });

    const members = await this.channelMemberRepository.find(workspaceId, {
      order: { createdAt: 'ASC' },
      relations: { userWorkspace: { user: true } },
      where: { channelId },
    });

    return members.map((member) =>
      this.toChannelMemberDTO({
        currentUserWorkspaceId: userWorkspaceId,
        member,
      }),
    );
  }

  async inviteChannelMember({
    channelId,
    invitedUserWorkspaceId,
    userWorkspaceId,
    workspaceId,
  }: {
    channelId: string;
    invitedUserWorkspaceId: string;
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<TeamChannelMemberDTO> {
    await this.assertChannelOwner({
      channelId,
      userWorkspaceId,
      workspaceId,
    });

    const invitedUserWorkspace =
      await this.userWorkspaceRepository.findOneOrFail({
        relations: { user: true },
        where: {
          deletedAt: IsNull(),
          id: invitedUserWorkspaceId,
          workspaceId,
        },
      });
    const membership = await this.ensureChannelMembership({
      channelId,
      role: TeamChannelMemberRole.MEMBER,
      userWorkspaceId: invitedUserWorkspace.id,
      workspaceId,
    });

    return this.toChannelMemberDTO({
      currentUserWorkspaceId: userWorkspaceId,
      member: {
        ...membership,
        userWorkspace: invitedUserWorkspace,
      },
    });
  }

  async removeChannelMember({
    channelId,
    removedUserWorkspaceId,
    userWorkspaceId,
    workspaceId,
  }: {
    channelId: string;
    removedUserWorkspaceId: string;
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<boolean> {
    await this.assertChannelOwner({
      channelId,
      userWorkspaceId,
      workspaceId,
    });

    if (removedUserWorkspaceId === userWorkspaceId) {
      throw new BadRequestException('Owners cannot remove themselves.');
    }

    const membership = await this.channelMemberRepository.findOne(workspaceId, {
      where: {
        channelId,
        userWorkspaceId: removedUserWorkspaceId,
      },
    });

    if (!isDefined(membership)) {
      return true;
    }

    if (membership.role === TeamChannelMemberRole.OWNER) {
      throw new BadRequestException('Owners cannot remove other owners.');
    }

    await this.channelMemberRepository.delete(workspaceId, {
      id: membership.id,
    });

    return true;
  }

  async updateChannelMemberRole({
    channelId,
    role,
    targetUserWorkspaceId,
    userWorkspaceId,
    workspaceId,
  }: {
    channelId: string;
    role: TeamChannelMemberRole;
    targetUserWorkspaceId: string;
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<TeamChannelMemberDTO> {
    await this.assertChannelOwner({
      channelId,
      userWorkspaceId,
      workspaceId,
    });

    const membership = await this.channelMemberRepository.findOneOrFail(
      workspaceId,
      {
        relations: { userWorkspace: { user: true } },
        where: {
          channelId,
          userWorkspaceId: targetUserWorkspaceId,
        },
      },
    );

    if (
      membership.role === TeamChannelMemberRole.OWNER &&
      role !== TeamChannelMemberRole.OWNER
    ) {
      const ownerCount = await this.channelMemberRepository.count(workspaceId, {
        where: {
          channelId,
          role: TeamChannelMemberRole.OWNER,
        },
      });

      if (ownerCount <= 1) {
        throw new BadRequestException('Channels must keep at least one owner.');
      }
    }

    await this.channelMemberRepository.update(
      workspaceId,
      { id: membership.id },
      { role },
    );

    return this.toChannelMemberDTO({
      currentUserWorkspaceId: userWorkspaceId,
      member: {
        ...membership,
        role,
      },
    });
  }

  async leaveChannel({
    channelId,
    userWorkspaceId,
    workspaceId,
  }: {
    channelId: string;
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<boolean> {
    const membership = await this.assertChannelMembership({
      channelId,
      userWorkspaceId,
      workspaceId,
    });

    if (membership.role === TeamChannelMemberRole.OWNER) {
      const ownerCount = await this.channelMemberRepository.count(workspaceId, {
        where: {
          channelId,
          role: TeamChannelMemberRole.OWNER,
        },
      });

      if (ownerCount <= 1) {
        throw new BadRequestException(
          'Add another owner before leaving this channel.',
        );
      }
    }

    await this.channelMemberRepository.delete(workspaceId, {
      id: membership.id,
    });

    return true;
  }

  async updateChannelNotificationLevel({
    channelId,
    notificationLevel,
    userWorkspaceId,
    workspaceId,
  }: {
    channelId: string;
    notificationLevel: TeamChannelNotificationLevel;
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<TeamChannelMemberDTO> {
    const membership = await this.assertChannelMembership({
      channelId,
      userWorkspaceId,
      workspaceId,
    });

    await this.channelMemberRepository.update(
      workspaceId,
      { id: membership.id },
      { notificationLevel },
    );

    const updatedMembership = await this.channelMemberRepository.findOneOrFail(
      workspaceId,
      {
        relations: { userWorkspace: { user: true } },
        where: { id: membership.id },
      },
    );

    return this.toChannelMemberDTO({
      currentUserWorkspaceId: userWorkspaceId,
      member: updatedMembership,
    });
  }

  async getPresence({
    userWorkspaceId,
    workspaceId,
  }: {
    workspaceId: string;
    userWorkspaceId: string;
  }): Promise<TeamPresenceDTO[]> {
    const userWorkspaces = await this.userWorkspaceRepository.find({
      order: { createdAt: 'ASC' },
      relations: { user: true },
      take: 50,
      where: {
        deletedAt: IsNull(),
        workspaceId,
      },
    });
    const hasCurrentUserWorkspace = userWorkspaces.some(
      (userWorkspace) => userWorkspace.id === userWorkspaceId,
    );
    const visibleUserWorkspaces = hasCurrentUserWorkspace
      ? userWorkspaces
      : [
          await this.userWorkspaceRepository.findOneOrFail({
            relations: { user: true },
            where: {
              deletedAt: IsNull(),
              id: userWorkspaceId,
              workspaceId,
            },
          }),
          ...userWorkspaces,
        ];
    const presenceRows = await this.presenceRepository.find(workspaceId, {
      where: {
        userWorkspaceId: In(
          visibleUserWorkspaces.map((userWorkspace) => userWorkspace.id),
        ),
      },
    });
    const presenceByUserWorkspaceId = new Map(
      presenceRows.map((presence) => [presence.userWorkspaceId, presence]),
    );
    const onlineSince = Date.now() - TEAM_PRESENCE_ONLINE_WINDOW_MS;

    return visibleUserWorkspaces.map((userWorkspace) => {
      const presence = presenceByUserWorkspaceId.get(userWorkspace.id);
      const lastSeenAt = presence?.lastSeenAt ?? userWorkspace.updatedAt;

      return {
        email: userWorkspace.user.email,
        isCurrentUser: userWorkspace.id === userWorkspaceId,
        isOnline: lastSeenAt.getTime() >= onlineSince,
        lastSeenAt,
        name: this.getAuthorName(userWorkspace),
        notificationPreference:
          presence?.notificationPreference ?? TeamNotificationPreference.ALL,
        notificationQuietHoursEnd: presence?.notificationQuietHoursEnd ?? null,
        notificationQuietHoursStart:
          presence?.notificationQuietHoursStart ?? null,
        statusEmoji: presence?.statusEmoji ?? null,
        statusText: presence?.statusText ?? null,
        userWorkspaceId: userWorkspace.id,
      };
    });
  }

  async heartbeatPresence({
    userWorkspaceId,
    workspaceId,
  }: {
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<TeamPresenceDTO> {
    const now = new Date();

    await this.presenceRepository.upsert(
      workspaceId,
      {
        lastSeenAt: now,
        userWorkspaceId,
      },
      ['workspaceId', 'userWorkspaceId'],
    );
    const presence = await this.presenceRepository.findOne(workspaceId, {
      where: {
        userWorkspaceId,
      },
    });

    const userWorkspace = await this.userWorkspaceRepository.findOneOrFail({
      relations: { user: true },
      where: {
        deletedAt: IsNull(),
        id: userWorkspaceId,
        workspaceId,
      },
    });
    return {
      email: userWorkspace.user.email,
      isCurrentUser: true,
      isOnline: true,
      lastSeenAt: now,
      name: this.getAuthorName(userWorkspace),
      notificationPreference:
        presence?.notificationPreference ?? TeamNotificationPreference.ALL,
      notificationQuietHoursEnd: presence?.notificationQuietHoursEnd ?? null,
      notificationQuietHoursStart:
        presence?.notificationQuietHoursStart ?? null,
      statusEmoji: presence?.statusEmoji ?? null,
      statusText: presence?.statusText ?? null,
      userWorkspaceId,
    };
  }

  async updatePresenceStatus({
    statusEmoji,
    statusText,
    userWorkspaceId,
    workspaceId,
  }: {
    statusEmoji?: string | null;
    statusText?: string | null;
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<TeamPresenceDTO> {
    const normalizedStatusText = statusText?.trim() ?? '';
    const normalizedStatusEmoji = statusEmoji?.trim() ?? '';

    if (normalizedStatusText.length > TEAM_PRESENCE_STATUS_TEXT_MAX_LENGTH) {
      throw new BadRequestException('Status text is too long.');
    }

    if (normalizedStatusEmoji.length > TEAM_PRESENCE_STATUS_EMOJI_MAX_LENGTH) {
      throw new BadRequestException('Status emoji is too long.');
    }

    const now = new Date();

    await this.presenceRepository.upsert(
      workspaceId,
      {
        lastSeenAt: now,
        statusEmoji: isNonEmptyString(normalizedStatusEmoji)
          ? normalizedStatusEmoji
          : null,
        statusText: isNonEmptyString(normalizedStatusText)
          ? normalizedStatusText
          : null,
        userWorkspaceId,
      },
      ['workspaceId', 'userWorkspaceId'],
    );

    const userWorkspace = await this.userWorkspaceRepository.findOneOrFail({
      relations: { user: true },
      where: {
        deletedAt: IsNull(),
        id: userWorkspaceId,
        workspaceId,
      },
    });
    const presence = await this.presenceRepository.findOne(workspaceId, {
      where: {
        userWorkspaceId,
      },
    });

    return {
      email: userWorkspace.user.email,
      isCurrentUser: true,
      isOnline: true,
      lastSeenAt: now,
      name: this.getAuthorName(userWorkspace),
      notificationPreference:
        presence?.notificationPreference ?? TeamNotificationPreference.ALL,
      notificationQuietHoursEnd: presence?.notificationQuietHoursEnd ?? null,
      notificationQuietHoursStart:
        presence?.notificationQuietHoursStart ?? null,
      statusEmoji: isNonEmptyString(normalizedStatusEmoji)
        ? normalizedStatusEmoji
        : null,
      statusText: isNonEmptyString(normalizedStatusText)
        ? normalizedStatusText
        : null,
      userWorkspaceId,
    };
  }

  async updateNotificationPreference({
    notificationPreference,
    userWorkspaceId,
    workspaceId,
  }: {
    notificationPreference: TeamNotificationPreference;
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<TeamPresenceDTO> {
    if (
      !Object.values(TeamNotificationPreference).includes(
        notificationPreference,
      )
    ) {
      throw new BadRequestException('Invalid notification preference.');
    }

    const now = new Date();

    await this.presenceRepository.upsert(
      workspaceId,
      {
        lastSeenAt: now,
        notificationPreference,
        userWorkspaceId,
      },
      ['workspaceId', 'userWorkspaceId'],
    );

    const userWorkspace = await this.userWorkspaceRepository.findOneOrFail({
      relations: { user: true },
      where: {
        deletedAt: IsNull(),
        id: userWorkspaceId,
        workspaceId,
      },
    });

    const presence = await this.presenceRepository.findOne(workspaceId, {
      where: {
        userWorkspaceId,
      },
    });

    return {
      email: userWorkspace.user.email,
      isCurrentUser: true,
      isOnline: true,
      lastSeenAt: now,
      name: this.getAuthorName(userWorkspace),
      notificationPreference:
        presence?.notificationPreference ?? notificationPreference,
      notificationQuietHoursEnd: presence?.notificationQuietHoursEnd ?? null,
      notificationQuietHoursStart:
        presence?.notificationQuietHoursStart ?? null,
      statusEmoji: presence?.statusEmoji ?? null,
      statusText: presence?.statusText ?? null,
      userWorkspaceId,
    };
  }

  async updateNotificationQuietHours({
    notificationQuietHoursEnd,
    notificationQuietHoursStart,
    userWorkspaceId,
    workspaceId,
  }: {
    notificationQuietHoursEnd?: string | null;
    notificationQuietHoursStart?: string | null;
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<TeamPresenceDTO> {
    const normalizedQuietHoursStart = this.normalizeNotificationQuietHoursTime(
      notificationQuietHoursStart,
    );
    const normalizedQuietHoursEnd = this.normalizeNotificationQuietHoursTime(
      notificationQuietHoursEnd,
    );

    if (
      (isDefined(normalizedQuietHoursStart) &&
        !isDefined(normalizedQuietHoursEnd)) ||
      (!isDefined(normalizedQuietHoursStart) &&
        isDefined(normalizedQuietHoursEnd))
    ) {
      throw new BadRequestException(
        'Quiet hours require both a start and end time.',
      );
    }

    const now = new Date();

    await this.presenceRepository.upsert(
      workspaceId,
      {
        lastSeenAt: now,
        notificationQuietHoursEnd: normalizedQuietHoursEnd,
        notificationQuietHoursStart: normalizedQuietHoursStart,
        userWorkspaceId,
      },
      ['workspaceId', 'userWorkspaceId'],
    );

    const userWorkspace = await this.userWorkspaceRepository.findOneOrFail({
      relations: { user: true },
      where: {
        deletedAt: IsNull(),
        id: userWorkspaceId,
        workspaceId,
      },
    });

    const presence = await this.presenceRepository.findOne(workspaceId, {
      where: {
        userWorkspaceId,
      },
    });

    return {
      email: userWorkspace.user.email,
      isCurrentUser: true,
      isOnline: true,
      lastSeenAt: now,
      name: this.getAuthorName(userWorkspace),
      notificationPreference:
        presence?.notificationPreference ?? TeamNotificationPreference.ALL,
      notificationQuietHoursEnd:
        presence?.notificationQuietHoursEnd ?? normalizedQuietHoursEnd,
      notificationQuietHoursStart:
        presence?.notificationQuietHoursStart ?? normalizedQuietHoursStart,
      statusEmoji: presence?.statusEmoji ?? null,
      statusText: presence?.statusText ?? null,
      userWorkspaceId,
    };
  }

  async getTypingIndicators({
    channelId,
    directMessageThreadId,
    parentMessageId,
    userWorkspaceId,
    workspaceId,
  }: {
    channelId?: string | null;
    directMessageThreadId?: string | null;
    parentMessageId?: string | null;
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<TeamTypingIndicatorDTO[]> {
    await this.assertCanAccessConversation({
      channelId,
      directMessageThreadId,
      userWorkspaceId,
      workspaceId,
    });
    await this.assertValidTypingParent({
      channelId,
      directMessageThreadId,
      parentMessageId,
      userWorkspaceId,
      workspaceId,
    });

    const conversationKey = this.toTypingConversationKey({
      channelId,
      directMessageThreadId,
      parentMessageId,
      workspaceId,
    });

    this.pruneExpiredTypingIndicators();

    return [...this.typingIndicatorsByKey.values()].filter(
      (indicator) =>
        this.toTypingConversationKey({
          channelId: indicator.channelId,
          directMessageThreadId: indicator.directMessageThreadId,
          parentMessageId: indicator.parentMessageId,
          workspaceId,
        }) === conversationKey && indicator.userWorkspaceId !== userWorkspaceId,
    );
  }

  async heartbeatTyping({
    channelId,
    directMessageThreadId,
    parentMessageId,
    userWorkspaceId,
    workspaceId,
  }: {
    channelId?: string | null;
    directMessageThreadId?: string | null;
    parentMessageId?: string | null;
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<TeamTypingIndicatorDTO> {
    await this.assertCanAccessConversation({
      channelId,
      directMessageThreadId,
      userWorkspaceId,
      workspaceId,
    });
    await this.assertValidTypingParent({
      channelId,
      directMessageThreadId,
      parentMessageId,
      userWorkspaceId,
      workspaceId,
    });

    const userWorkspace = await this.userWorkspaceRepository.findOneOrFail({
      relations: { user: true },
      where: {
        deletedAt: IsNull(),
        id: userWorkspaceId,
        workspaceId,
      },
    });
    const indicator = {
      channelId: channelId ?? null,
      directMessageThreadId: directMessageThreadId ?? null,
      expiresAt: new Date(Date.now() + TEAM_TYPING_INDICATOR_TTL_MS),
      name: this.getAuthorName(userWorkspace),
      parentMessageId: parentMessageId ?? null,
      userWorkspaceId,
    };

    this.typingIndicatorsByKey.set(
      this.toTypingIndicatorKey({
        channelId,
        directMessageThreadId,
        parentMessageId,
        userWorkspaceId,
        workspaceId,
      }),
      indicator,
    );

    return indicator;
  }

  async getDirectMessageMessages({
    before,
    directMessageThreadId,
    userWorkspaceId,
    workspaceId,
  }: {
    before?: string | null;
    directMessageThreadId: string;
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<TeamMessageDTO[]> {
    await this.assertDirectMessageParticipant({
      directMessageThreadId,
      userWorkspaceId,
      workspaceId,
    });

    const messageWhere: FindOptionsWhere<TeamMessageEntity> = {
      deletedAt: IsNull(),
      directMessageThreadId,
      parentMessageId: IsNull(),
    };
    const beforeDate = this.parseMessageCursorDate(before);

    if (beforeDate !== null) {
      messageWhere.createdAt = LessThan(beforeDate);
    }

    const latestMessages = await this.messageRepository.find(workspaceId, {
      order: { createdAt: 'DESC' },
      relations: { authorUserWorkspace: { user: true } },
      take: 100,
      where: messageWhere,
    });
    const messages = latestMessages.reverse();
    const messageIds = messages.map((message) => message.id);
    const reactionsByMessageId = await this.getReactionSummariesByMessageId({
      messageIds,
      userWorkspaceId,
      workspaceId,
    });
    const attachmentsByMessageId = await this.getAttachmentsByMessageId({
      messageIds,
      workspaceId,
    });
    const savedMessageIds = await this.getSavedMessageIds({
      messageIds,
      userWorkspaceId,
      workspaceId,
    });
    const directMessageConversationNameByThreadId =
      messageIds.length > 0
        ? await this.getDirectMessageConversationNames({
            directMessageThreadIds: [directMessageThreadId],
            userWorkspaceId,
            workspaceId,
          })
        : new Map<string, string>();
    const replyCountByParentMessageId =
      await this.getReplyCountByParentMessageId({
        parentMessageIds: messageIds,
        workspaceId,
      });

    return messages.map((message) =>
      this.toMessageDTO({
        message,
        attachments: attachmentsByMessageId.get(message.id) ?? [],
        reactions: reactionsByMessageId.get(message.id) ?? [],
        replyCount: replyCountByParentMessageId.get(message.id) ?? 0,
        conversationName:
          directMessageConversationNameByThreadId.get(directMessageThreadId) ??
          'Direct message',
        isSaved: savedMessageIds.has(message.id),
        userWorkspaceId,
      }),
    );
  }

  async getMessageThread({
    before,
    parentMessageId,
    userWorkspaceId,
    workspaceId,
  }: {
    before?: string | null;
    parentMessageId: string;
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<TeamMessageDTO[]> {
    const parentMessage = await this.getReadableMessageOrThrow({
      messageId: parentMessageId,
      userWorkspaceId,
      workspaceId,
    });
    const canModerateConversation = isDefined(parentMessage.channelId)
      ? await this.isChannelOwner({
          channelId: parentMessage.channelId,
          userWorkspaceId,
          workspaceId,
        })
      : false;
    const replyWhere: FindOptionsWhere<TeamMessageEntity> = {
      deletedAt: IsNull(),
      parentMessageId,
    };
    const beforeDate = this.parseMessageCursorDate(before);

    if (beforeDate !== null) {
      replyWhere.createdAt = LessThan(beforeDate);
    }

    const latestReplies = await this.messageRepository.find(workspaceId, {
      order: { createdAt: 'DESC' },
      relations: { authorUserWorkspace: { user: true } },
      take: 100,
      where: replyWhere,
    });
    const replies = latestReplies.reverse();
    const messages = [parentMessage, ...replies];
    const messageIds = messages.map((message) => message.id);
    const reactionsByMessageId = await this.getReactionSummariesByMessageId({
      messageIds,
      userWorkspaceId,
      workspaceId,
    });
    const attachmentsByMessageId = await this.getAttachmentsByMessageId({
      messageIds,
      workspaceId,
    });
    const savedMessageIds = await this.getSavedMessageIds({
      messageIds,
      userWorkspaceId,
      workspaceId,
    });
    const conversationName = await this.getMessageConversationName({
      message: parentMessage,
      userWorkspaceId,
      workspaceId,
    });
    const replyCountByParentMessageId =
      await this.getReplyCountByParentMessageId({
        parentMessageIds: messageIds,
        workspaceId,
      });

    return messages.map((message) =>
      this.toMessageDTO({
        message,
        attachments: attachmentsByMessageId.get(message.id) ?? [],
        reactions: reactionsByMessageId.get(message.id) ?? [],
        replyCount: replyCountByParentMessageId.get(message.id) ?? 0,
        canModerateConversation,
        conversationName,
        isSaved: savedMessageIds.has(message.id),
        userWorkspaceId,
      }),
    );
  }

  async searchMessages({
    query,
    userWorkspaceId,
    workspaceId,
  }: {
    query: string;
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<TeamMessageSearchResultDTO[]> {
    const normalizedQuery = query.trim();

    if (normalizedQuery.length < TEAM_MESSAGE_SEARCH_MIN_LENGTH) {
      return [];
    }

    const [channels, directMessageParticipants] = await Promise.all([
      this.getChannels({ userWorkspaceId, workspaceId }),
      this.directMessageParticipantRepository.find(workspaceId, {
        where: { userWorkspaceId },
      }),
    ]);
    const channelIds = channels.map((channel) => channel.id);
    const channelNameById = new Map(
      channels.map((channel) => [channel.id, channel.name]),
    );
    const directMessageThreadIds = directMessageParticipants.map(
      (participant) => participant.directMessageThreadId,
    );

    if (channelIds.length === 0 && directMessageThreadIds.length === 0) {
      return [];
    }

    const messageWhere = [
      ...(channelIds.length > 0
        ? [
            {
              body: ILike(`%${normalizedQuery}%`),
              channelId: In(channelIds),
              deletedAt: IsNull(),
            },
          ]
        : []),
      ...(directMessageThreadIds.length > 0
        ? [
            {
              body: ILike(`%${normalizedQuery}%`),
              deletedAt: IsNull(),
              directMessageThreadId: In(directMessageThreadIds),
            },
          ]
        : []),
    ];
    const messages = await this.messageRepository.find(workspaceId, {
      order: { createdAt: 'DESC' },
      relations: { authorUserWorkspace: { user: true } },
      take: TEAM_MESSAGE_SEARCH_LIMIT,
      where: messageWhere,
    });
    const attachmentMatches = await this.messageAttachmentRepository.find(
      workspaceId,
      {
        order: { createdAt: 'DESC' },
        relations: { message: { authorUserWorkspace: { user: true } } },
        take: TEAM_MESSAGE_SEARCH_LIMIT,
        where: [
          ...(channelIds.length > 0
            ? [
                {
                  message: {
                    channelId: In(channelIds),
                    deletedAt: IsNull(),
                  },
                  name: ILike(`%${normalizedQuery}%`),
                },
              ]
            : []),
          ...(directMessageThreadIds.length > 0
            ? [
                {
                  message: {
                    deletedAt: IsNull(),
                    directMessageThreadId: In(directMessageThreadIds),
                  },
                  name: ILike(`%${normalizedQuery}%`),
                },
              ]
            : []),
        ],
      },
    );
    const visibleAttachmentMatches = attachmentMatches.filter((attachment) => {
      const message = attachment.message;

      if (!isDefined(message) || message.deletedAt !== null) {
        return false;
      }

      return (
        (isDefined(message.channelId) &&
          channelIds.includes(message.channelId)) ||
        (isDefined(message.directMessageThreadId) &&
          directMessageThreadIds.includes(message.directMessageThreadId))
      );
    });
    const foundDirectMessageThreadIds = [
      ...new Set(
        [
          ...messages.map((message) => message.directMessageThreadId),
          ...visibleAttachmentMatches.map(
            (attachment) => attachment.message.directMessageThreadId,
          ),
        ].filter(isDefined),
      ),
    ];
    const directMessageConversationNameByThreadId =
      await this.getDirectMessageConversationNames({
        directMessageThreadIds: foundDirectMessageThreadIds,
        userWorkspaceId,
        workspaceId,
      });

    const messageResults = messages.map((message) => ({
      authorName: this.getAuthorName(message.authorUserWorkspace),
      body: message.body,
      channelId: message.channelId,
      conversationName: this.getSearchResultConversationName({
        channelNameById,
        directMessageConversationNameByThreadId,
        message,
      }),
      conversationType: isDefined(message.channelId) ? 'channel' : 'direct',
      createdAt: message.createdAt,
      directMessageThreadId: message.directMessageThreadId,
      id: message.id,
      parentMessageId: message.parentMessageId,
      matchType: 'message',
      attachmentName: null,
      attachmentUrl: null,
    }));
    const attachmentResults = visibleAttachmentMatches.map((attachment) => {
      const message = attachment.message;

      return {
        authorName: this.getAuthorName(message.authorUserWorkspace),
        body: message.body,
        channelId: message.channelId,
        conversationName: this.getSearchResultConversationName({
          channelNameById,
          directMessageConversationNameByThreadId,
          message,
        }),
        conversationType: isDefined(message.channelId) ? 'channel' : 'direct',
        createdAt: attachment.createdAt,
        directMessageThreadId: message.directMessageThreadId,
        id: message.id,
        parentMessageId: message.parentMessageId,
        matchType: 'attachment',
        attachmentName: attachment.name,
        attachmentUrl: attachment.url,
      };
    });

    return [...messageResults, ...attachmentResults]
      .sort((firstResult, secondResult) => {
        return (
          secondResult.createdAt.getTime() - firstResult.createdAt.getTime()
        );
      })
      .slice(0, TEAM_MESSAGE_SEARCH_LIMIT);
  }

  async getFiles({
    userWorkspaceId,
    workspaceId,
  }: {
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<TeamFileDTO[]> {
    const [channels, directMessageParticipants] = await Promise.all([
      this.getChannels({ userWorkspaceId, workspaceId }),
      this.directMessageParticipantRepository.find(workspaceId, {
        where: { userWorkspaceId },
      }),
    ]);
    const channelIds = channels.map((channel) => channel.id);
    const channelNameById = new Map(
      channels.map((channel) => [channel.id, channel.name]),
    );
    const directMessageThreadIds = directMessageParticipants.map(
      (participant) => participant.directMessageThreadId,
    );

    if (channelIds.length === 0 && directMessageThreadIds.length === 0) {
      return [];
    }

    const attachments = await this.messageAttachmentRepository.find(
      workspaceId,
      {
        order: { createdAt: 'DESC' },
        relations: { message: { authorUserWorkspace: { user: true } } },
        take: TEAM_FILES_LIMIT,
        where: [
          ...(channelIds.length > 0
            ? [
                {
                  message: {
                    channelId: In(channelIds),
                    deletedAt: IsNull(),
                  },
                },
              ]
            : []),
          ...(directMessageThreadIds.length > 0
            ? [
                {
                  message: {
                    deletedAt: IsNull(),
                    directMessageThreadId: In(directMessageThreadIds),
                  },
                },
              ]
            : []),
        ],
      },
    );
    const visibleAttachments = attachments.filter((attachment) => {
      const message = attachment.message;

      if (!isDefined(message) || message.deletedAt !== null) {
        return false;
      }

      return (
        (isDefined(message.channelId) &&
          channelIds.includes(message.channelId)) ||
        (isDefined(message.directMessageThreadId) &&
          directMessageThreadIds.includes(message.directMessageThreadId))
      );
    });
    const foundDirectMessageThreadIds = [
      ...new Set(
        visibleAttachments
          .map((attachment) => attachment.message.directMessageThreadId)
          .filter(isDefined),
      ),
    ];
    const directMessageConversationNameByThreadId =
      await this.getDirectMessageConversationNames({
        directMessageThreadIds: foundDirectMessageThreadIds,
        userWorkspaceId,
        workspaceId,
      });

    return visibleAttachments.map((attachment) => {
      const message = attachment.message;

      return {
        authorName: this.getAuthorName(message.authorUserWorkspace),
        channelId: message.channelId,
        conversationName: this.getSearchResultConversationName({
          channelNameById,
          directMessageConversationNameByThreadId,
          message,
        }),
        conversationType: isDefined(message.channelId) ? 'channel' : 'direct',
        createdAt: attachment.createdAt,
        directMessageThreadId: message.directMessageThreadId,
        id: attachment.id,
        messageId: message.id,
        parentMessageId: message.parentMessageId,
        mimeType: attachment.mimeType,
        name: attachment.name,
        size: attachment.size,
        url: attachment.url,
      };
    });
  }

  async getMentions({
    userWorkspaceId,
    workspaceId,
  }: {
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<TeamMentionDTO[]> {
    const [channels, directMessageParticipants] = await Promise.all([
      this.getChannels({ userWorkspaceId, workspaceId }),
      this.directMessageParticipantRepository.find(workspaceId, {
        where: { userWorkspaceId },
      }),
    ]);
    const channelIds = channels.map((channel) => channel.id);
    const directMessageThreadIds = directMessageParticipants.map(
      (participant) => participant.directMessageThreadId,
    );

    if (channelIds.length === 0 && directMessageThreadIds.length === 0) {
      return [];
    }

    const mentions = await this.messageMentionRepository.find(workspaceId, {
      order: { createdAt: 'DESC' },
      relations: {
        message: {
          authorUserWorkspace: { user: true },
          channel: true,
        },
      },
      take: TEAM_MENTION_LIMIT,
      where: [
        ...(channelIds.length > 0
          ? [
              {
                mentionedUserWorkspaceId: userWorkspaceId,
                message: {
                  channelId: In(channelIds),
                  deletedAt: IsNull(),
                },
              },
            ]
          : []),
        ...(directMessageThreadIds.length > 0
          ? [
              {
                mentionedUserWorkspaceId: userWorkspaceId,
                message: {
                  deletedAt: IsNull(),
                  directMessageThreadId: In(directMessageThreadIds),
                },
              },
            ]
          : []),
      ],
    });
    const visibleMentions: TeamMessageMentionEntity[] = [];

    for (const mention of mentions) {
      if (mention.message.deletedAt !== null) {
        continue;
      }

      try {
        await this.assertCanReadMessageConversation({
          message: mention.message,
          userWorkspaceId,
          workspaceId,
        });
        visibleMentions.push(mention);
      } catch {
        continue;
      }
    }
    const visibleDirectMessageThreadIds = [
      ...new Set(
        visibleMentions
          .map((mention) => mention.message.directMessageThreadId)
          .filter(isDefined),
      ),
    ];
    const directMessageConversationNameByThreadId =
      await this.getDirectMessageConversationNames({
        directMessageThreadIds: visibleDirectMessageThreadIds,
        userWorkspaceId,
        workspaceId,
      });

    return visibleMentions.map((mention) => {
      const message = mention.message;

      return {
        authorName: this.getAuthorName(message.authorUserWorkspace),
        body: message.body,
        channelId: message.channelId,
        conversationName: isDefined(message.channelId)
          ? (message.channel?.name ?? 'Unknown channel')
          : (directMessageConversationNameByThreadId.get(
              message.directMessageThreadId ?? '',
            ) ?? 'Direct message'),
        conversationType: isDefined(message.channelId) ? 'channel' : 'direct',
        createdAt: message.createdAt,
        directMessageThreadId: message.directMessageThreadId,
        id: mention.id,
        messageId: message.id,
        parentMessageId: message.parentMessageId,
        readAt: mention.readAt,
      };
    });
  }

  async sendMessage({
    attachments,
    body,
    channelId,
    parentMessageId,
    userWorkspaceId,
    workspaceId,
  }: {
    attachments?: TeamMessageAttachmentInput[] | null;
    body: string;
    channelId: string;
    parentMessageId?: string | null;
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<TeamMessageDTO> {
    const normalizedAttachments = this.normalizeAttachments(attachments);
    const normalizedBody = body.trim();

    this.assertMessageContent({
      attachments: normalizedAttachments,
      body: normalizedBody,
    });

    await this.assertChannelMembership({
      channelId,
      userWorkspaceId,
      workspaceId,
    });
    await this.assertValidChannelReplyParent({
      channelId,
      parentMessageId: parentMessageId ?? null,
      userWorkspaceId,
      workspaceId,
    });

    const savedMessage = await this.messageRepository.save(workspaceId, {
      authorUserWorkspaceId: userWorkspaceId,
      body: normalizedBody,
      channelId,
      directMessageThreadId: null,
      parentMessageId: parentMessageId ?? null,
    });

    const messageWithAuthor = await this.messageRepository.findOneOrFail(
      workspaceId,
      {
        relations: { authorUserWorkspace: { user: true } },
        where: { id: savedMessage.id },
      },
    );

    await this.createMentionsForMessage({
      candidateRecipients: await this.getChannelMentionCandidates({
        channelId,
        workspaceId,
      }),
      message: savedMessage,
      userWorkspaceId,
      workspaceId,
    });
    const savedAttachments = await this.saveMessageAttachments({
      attachments: normalizedAttachments,
      messageId: savedMessage.id,
      workspaceId,
    });

    const messageDTO = this.toMessageDTO({
      attachments: savedAttachments,
      conversationName: await this.getMessageConversationName({
        message: messageWithAuthor,
        userWorkspaceId,
        workspaceId,
      }),
      message: messageWithAuthor,
      reactions: [],
      replyCount: 0,
      userWorkspaceId,
    });

    await this.publishMessageEvent({
      event: this.toMessageEventDTO({
        isNewMessage: true,
        message: messageWithAuthor,
        type: TeamMessageEventType.UPSERTED,
      }),
      workspaceId,
    });

    return messageDTO;
  }

  async sendDirectMessage({
    attachments,
    body,
    directMessageThreadId,
    parentMessageId,
    userWorkspaceId,
    workspaceId,
  }: {
    attachments?: TeamMessageAttachmentInput[] | null;
    body: string;
    directMessageThreadId: string;
    parentMessageId?: string | null;
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<TeamMessageDTO> {
    const normalizedAttachments = this.normalizeAttachments(attachments);
    const normalizedBody = body.trim();

    this.assertMessageContent({
      attachments: normalizedAttachments,
      body: normalizedBody,
    });

    await this.assertDirectMessageParticipant({
      directMessageThreadId,
      userWorkspaceId,
      workspaceId,
    });
    await this.assertValidDirectMessageReplyParent({
      directMessageThreadId,
      parentMessageId: parentMessageId ?? null,
      userWorkspaceId,
      workspaceId,
    });

    const savedMessage = await this.messageRepository.save(workspaceId, {
      authorUserWorkspaceId: userWorkspaceId,
      body: normalizedBody,
      channelId: null,
      directMessageThreadId,
      parentMessageId: parentMessageId ?? null,
    });

    const messageWithAuthor = await this.messageRepository.findOneOrFail(
      workspaceId,
      {
        relations: { authorUserWorkspace: { user: true } },
        where: { id: savedMessage.id },
      },
    );

    await this.createMentionsForMessage({
      candidateRecipients: await this.getDirectMessageMentionCandidates({
        directMessageThreadId,
        workspaceId,
      }),
      message: savedMessage,
      userWorkspaceId,
      workspaceId,
    });
    const savedAttachments = await this.saveMessageAttachments({
      attachments: normalizedAttachments,
      messageId: savedMessage.id,
      workspaceId,
    });

    const messageDTO = this.toMessageDTO({
      attachments: savedAttachments,
      conversationName: await this.getMessageConversationName({
        message: messageWithAuthor,
        userWorkspaceId,
        workspaceId,
      }),
      message: messageWithAuthor,
      reactions: [],
      replyCount: 0,
      userWorkspaceId,
    });

    await this.publishMessageEvent({
      event: this.toMessageEventDTO({
        isNewMessage: true,
        message: messageWithAuthor,
        type: TeamMessageEventType.UPSERTED,
      }),
      workspaceId,
    });

    return messageDTO;
  }

  async toggleMessageReaction({
    emoji,
    messageId,
    userWorkspaceId,
    workspaceId,
  }: {
    emoji: string;
    messageId: string;
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<TeamMessageDTO> {
    const normalizedEmoji = emoji.trim();

    if (
      !isNonEmptyString(normalizedEmoji) ||
      normalizedEmoji.length > TEAM_REACTION_MAX_LENGTH
    ) {
      throw new BadRequestException('Reaction is invalid.');
    }

    const message = await this.getAccessibleMessageOrThrow({
      messageId,
      userWorkspaceId,
      workspaceId,
    });
    const canModerateConversation = isDefined(message.channelId)
      ? await this.isChannelOwner({
          channelId: message.channelId,
          userWorkspaceId,
          workspaceId,
        })
      : false;
    const existingReaction = await this.messageReactionRepository.findOne(
      workspaceId,
      {
        where: {
          emoji: normalizedEmoji,
          messageId,
          userWorkspaceId,
        },
      },
    );

    if (isDefined(existingReaction)) {
      await this.messageReactionRepository.delete(workspaceId, {
        id: existingReaction.id,
      });
    } else {
      await this.messageReactionRepository.save(workspaceId, {
        emoji: normalizedEmoji,
        messageId,
        userWorkspaceId,
      });
    }

    const reactionsByMessageId = await this.getReactionSummariesByMessageId({
      messageIds: [messageId],
      userWorkspaceId,
      workspaceId,
    });

    const messageDTO = this.toMessageDTO({
      attachments:
        (
          await this.getAttachmentsByMessageId({
            messageIds: [message.id],
            workspaceId,
          })
        ).get(message.id) ?? [],
      message,
      reactions: reactionsByMessageId.get(message.id) ?? [],
      replyCount: await this.getReplyCount({
        parentMessageId: message.id,
        workspaceId,
      }),
      canModerateConversation,
      userWorkspaceId,
    });

    await this.publishMessageEvent({
      event: this.toMessageEventDTO({
        message,
        type: TeamMessageEventType.UPSERTED,
      }),
      workspaceId,
    });

    return messageDTO;
  }

  async toggleMessagePin({
    messageId,
    userWorkspaceId,
    workspaceId,
  }: {
    messageId: string;
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<TeamMessageDTO> {
    const message = await this.getAccessibleMessageOrThrow({
      messageId,
      userWorkspaceId,
      workspaceId,
    });
    const canModerateConversation = isDefined(message.channelId)
      ? await this.isChannelOwner({
          channelId: message.channelId,
          userWorkspaceId,
          workspaceId,
        })
      : false;
    const shouldUnpin = isDefined(message.pinnedAt);

    await this.messageRepository.update(
      workspaceId,
      { id: messageId },
      {
        pinnedAt: shouldUnpin ? null : new Date(),
        pinnedByUserWorkspaceId: shouldUnpin ? null : userWorkspaceId,
      },
    );

    const updatedMessage = await this.messageRepository.findOneOrFail(
      workspaceId,
      {
        relations: { authorUserWorkspace: { user: true } },
        where: { id: messageId },
      },
    );

    const [attachmentsByMessageId, reactionsByMessageId] = await Promise.all([
      this.getAttachmentsByMessageId({
        messageIds: [messageId],
        workspaceId,
      }),
      this.getReactionSummariesByMessageId({
        messageIds: [messageId],
        userWorkspaceId,
        workspaceId,
      }),
    ]);

    const messageDTO = this.toMessageDTO({
      attachments: attachmentsByMessageId.get(messageId) ?? [],
      canModerateConversation,
      message: updatedMessage,
      reactions: reactionsByMessageId.get(messageId) ?? [],
      replyCount: await this.getReplyCount({
        parentMessageId: messageId,
        workspaceId,
      }),
      userWorkspaceId,
    });

    await this.publishMessageEvent({
      event: this.toMessageEventDTO({
        message: updatedMessage,
        type: TeamMessageEventType.UPSERTED,
      }),
      workspaceId,
    });

    return messageDTO;
  }

  async toggleMessageBookmark({
    messageId,
    userWorkspaceId,
    workspaceId,
  }: {
    messageId: string;
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<TeamMessageDTO> {
    const message = await this.getAccessibleMessageOrThrow({
      messageId,
      userWorkspaceId,
      workspaceId,
    });
    const canModerateConversation = isDefined(message.channelId)
      ? await this.isChannelOwner({
          channelId: message.channelId,
          userWorkspaceId,
          workspaceId,
        })
      : false;
    const existingBookmark = await this.messageBookmarkRepository.findOne(
      workspaceId,
      {
        where: {
          messageId,
          userWorkspaceId,
        },
      },
    );
    const isSaved = !isDefined(existingBookmark);

    if (isDefined(existingBookmark)) {
      await this.messageBookmarkRepository.delete(workspaceId, {
        id: existingBookmark.id,
      });
    } else {
      await this.messageBookmarkRepository.save(workspaceId, {
        messageId,
        userWorkspaceId,
      });
    }

    const [attachmentsByMessageId, reactionsByMessageId] = await Promise.all([
      this.getAttachmentsByMessageId({
        messageIds: [messageId],
        workspaceId,
      }),
      this.getReactionSummariesByMessageId({
        messageIds: [messageId],
        userWorkspaceId,
        workspaceId,
      }),
    ]);

    const messageDTO = this.toMessageDTO({
      attachments: attachmentsByMessageId.get(messageId) ?? [],
      canModerateConversation,
      isSaved,
      message,
      reactions: reactionsByMessageId.get(messageId) ?? [],
      replyCount: await this.getReplyCount({
        parentMessageId: messageId,
        workspaceId,
      }),
      userWorkspaceId,
    });

    await this.publishMessageEvent({
      event: this.toMessageEventDTO({
        message,
        type: TeamMessageEventType.UPSERTED,
      }),
      workspaceId,
    });

    return messageDTO;
  }

  async getSavedMessages({
    userWorkspaceId,
    workspaceId,
  }: {
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<TeamMessageDTO[]> {
    const bookmarks = await this.messageBookmarkRepository.find(workspaceId, {
      order: { createdAt: 'DESC' },
      relations: { message: { authorUserWorkspace: { user: true } } },
      take: 50,
      where: { userWorkspaceId },
    });
    const accessibleMessages: TeamMessageEntity[] = [];

    for (const bookmark of bookmarks) {
      if (
        !isDefined(bookmark.message) ||
        isDefined(bookmark.message.deletedAt)
      ) {
        continue;
      }

      try {
        await this.getAccessibleMessageOrThrow({
          messageId: bookmark.messageId,
          userWorkspaceId,
          workspaceId,
        });
        accessibleMessages.push(bookmark.message);
      } catch {
        continue;
      }
    }

    const messageIds = accessibleMessages.map((message) => message.id);
    const channelIds = [
      ...new Set(accessibleMessages.map((message) => message.channelId)),
    ].filter(isDefined);
    const directMessageThreadIds = [
      ...new Set(
        accessibleMessages.map((message) => message.directMessageThreadId),
      ),
    ].filter(isDefined);
    const [
      attachmentsByMessageId,
      reactionsByMessageId,
      channels,
      directMessageConversationNameByThreadId,
    ] = await Promise.all([
      this.getAttachmentsByMessageId({
        messageIds,
        workspaceId,
      }),
      this.getReactionSummariesByMessageId({
        messageIds,
        userWorkspaceId,
        workspaceId,
      }),
      channelIds.length > 0
        ? this.channelRepository.find(workspaceId, {
            where: { id: In(channelIds) },
          })
        : [],
      this.getDirectMessageConversationNames({
        directMessageThreadIds,
        userWorkspaceId,
        workspaceId,
      }),
    ]);
    const channelNameById = new Map(
      channels.map((channel) => [channel.id, channel.name]),
    );
    const replyCountByParentMessageId =
      await this.getReplyCountByParentMessageId({
        parentMessageIds: messageIds,
        workspaceId,
      });

    return Promise.all(
      accessibleMessages.map(async (message) =>
        this.toMessageDTO({
          attachments: attachmentsByMessageId.get(message.id) ?? [],
          canModerateConversation: isDefined(message.channelId)
            ? await this.isChannelOwner({
                channelId: message.channelId,
                userWorkspaceId,
                workspaceId,
              })
            : false,
          conversationName: this.getSearchResultConversationName({
            channelNameById,
            directMessageConversationNameByThreadId,
            message,
          }),
          isSaved: true,
          message,
          reactions: reactionsByMessageId.get(message.id) ?? [],
          replyCount: replyCountByParentMessageId.get(message.id) ?? 0,
          userWorkspaceId,
        }),
      ),
    );
  }

  async getPinnedMessages({
    channelId,
    directMessageThreadId,
    userWorkspaceId,
    workspaceId,
  }: {
    channelId?: string | null;
    directMessageThreadId?: string | null;
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<TeamMessageDTO[]> {
    if (isDefined(channelId) && isDefined(directMessageThreadId)) {
      throw new BadRequestException(
        'Exactly one Team Comms conversation is required.',
      );
    }

    const isScopedPinnedMessageQuery =
      isDefined(channelId) || isDefined(directMessageThreadId);

    if (isScopedPinnedMessageQuery) {
      await this.assertCanAccessConversation({
        channelId,
        directMessageThreadId,
        userWorkspaceId,
        workspaceId,
      });
    }

    const pinnedMessageWhere: FindOptionsWhere<TeamMessageEntity>[] = [];

    if (isDefined(channelId)) {
      pinnedMessageWhere.push({
        channelId,
        deletedAt: IsNull(),
        pinnedAt: Not(IsNull()),
      });
    } else if (isDefined(directMessageThreadId)) {
      pinnedMessageWhere.push({
        deletedAt: IsNull(),
        directMessageThreadId,
        pinnedAt: Not(IsNull()),
      });
    } else {
      const [channelMemberships, directMessageParticipants] = await Promise.all(
        [
          this.channelMemberRepository.find(workspaceId, {
            where: { userWorkspaceId },
          }),
          this.directMessageParticipantRepository.find(workspaceId, {
            where: { userWorkspaceId },
          }),
        ],
      );
      const memberChannelIds = channelMemberships.map(
        (membership) => membership.channelId,
      );
      const directMessageThreadIds = directMessageParticipants.map(
        (participant) => participant.directMessageThreadId,
      );

      if (memberChannelIds.length > 0) {
        pinnedMessageWhere.push({
          channelId: In(memberChannelIds),
          deletedAt: IsNull(),
          pinnedAt: Not(IsNull()),
        });
      }

      if (directMessageThreadIds.length > 0) {
        pinnedMessageWhere.push({
          deletedAt: IsNull(),
          directMessageThreadId: In(directMessageThreadIds),
          pinnedAt: Not(IsNull()),
        });
      }
    }

    if (pinnedMessageWhere.length === 0) {
      return [];
    }

    const messages = await this.messageRepository.find(workspaceId, {
      order: { pinnedAt: 'DESC' },
      relations: { authorUserWorkspace: { user: true } },
      take: 50,
      where:
        pinnedMessageWhere.length === 1
          ? (pinnedMessageWhere[0] ?? {})
          : pinnedMessageWhere,
    });
    const messageIds = messages.map((message) => message.id);
    const [attachmentsByMessageId, reactionsByMessageId, savedMessageIds] =
      await Promise.all([
        this.getAttachmentsByMessageId({
          messageIds,
          workspaceId,
        }),
        this.getReactionSummariesByMessageId({
          messageIds,
          userWorkspaceId,
          workspaceId,
        }),
        this.getSavedMessageIds({
          messageIds,
          userWorkspaceId,
          workspaceId,
        }),
      ]);
    const replyCountByParentMessageId =
      await this.getReplyCountByParentMessageId({
        parentMessageIds: messageIds,
        workspaceId,
      });
    return Promise.all(
      messages.map(async (message) =>
        this.toMessageDTO({
          attachments: attachmentsByMessageId.get(message.id) ?? [],
          canModerateConversation: isDefined(message.channelId)
            ? await this.isChannelOwner({
                channelId: message.channelId,
                userWorkspaceId,
                workspaceId,
              })
            : false,
          conversationName: await this.getMessageConversationName({
            message,
            userWorkspaceId,
            workspaceId,
          }),
          isSaved: savedMessageIds.has(message.id),
          message,
          reactions: reactionsByMessageId.get(message.id) ?? [],
          replyCount: replyCountByParentMessageId.get(message.id) ?? 0,
          userWorkspaceId,
        }),
      ),
    );
  }

  async getMessageReminders({
    userWorkspaceId,
    workspaceId,
  }: {
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<TeamMessageReminderDTO[]> {
    const reminders = await this.messageReminderRepository.find(workspaceId, {
      order: { remindAt: 'ASC' },
      relations: { message: { authorUserWorkspace: { user: true } } },
      take: 50,
      where: { userWorkspaceId },
    });
    const accessibleReminders: TeamMessageReminderEntity[] = [];

    for (const reminder of reminders) {
      if (
        !isDefined(reminder.message) ||
        isDefined(reminder.message.deletedAt)
      ) {
        continue;
      }

      try {
        await this.getAccessibleMessageOrThrow({
          messageId: reminder.messageId,
          userWorkspaceId,
          workspaceId,
        });
        accessibleReminders.push(reminder);
      } catch {
        continue;
      }
    }

    return this.toMessageReminderDTOs({
      reminders: accessibleReminders,
      userWorkspaceId,
      workspaceId,
    });
  }

  async setMessageReminder({
    messageId,
    remindAt,
    userWorkspaceId,
    workspaceId,
  }: {
    messageId: string;
    remindAt: Date;
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<TeamMessageReminderDTO> {
    if (Number.isNaN(remindAt.getTime())) {
      throw new BadRequestException('Reminder time is invalid.');
    }

    if (remindAt.getTime() <= Date.now()) {
      throw new BadRequestException('Reminder time must be in the future.');
    }

    const message = await this.getAccessibleMessageOrThrow({
      messageId,
      userWorkspaceId,
      workspaceId,
    });

    await this.messageReminderRepository.upsert(
      workspaceId,
      {
        messageId,
        remindAt,
        userWorkspaceId,
      },
      ['messageId', 'userWorkspaceId'],
    );

    const reminder = await this.messageReminderRepository.findOneOrFail(
      workspaceId,
      {
        relations: { message: { authorUserWorkspace: { user: true } } },
        where: { messageId, userWorkspaceId },
      },
    );

    const reminderDTO = (
      await this.toMessageReminderDTOs({
        reminders: [{ ...reminder, message }],
        userWorkspaceId,
        workspaceId,
      })
    )[0];

    await this.publishMessageEvent({
      event: this.toMessageEventDTO({
        message,
        type: TeamMessageEventType.UPSERTED,
      }),
      workspaceId,
    });

    return reminderDTO;
  }

  async dismissMessageReminder({
    messageId,
    userWorkspaceId,
    workspaceId,
  }: {
    messageId: string;
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<boolean> {
    const message = await this.getAccessibleMessageOrThrow({
      messageId,
      userWorkspaceId,
      workspaceId,
    });

    await this.messageReminderRepository.delete(workspaceId, {
      messageId,
      userWorkspaceId,
    });

    await this.publishMessageEvent({
      event: this.toMessageEventDTO({
        message,
        type: TeamMessageEventType.UPSERTED,
      }),
      workspaceId,
    });

    return true;
  }

  async uploadMessageAttachment({
    channelId,
    directMessageThreadId,
    file,
    filename,
    userWorkspaceId,
    workspaceId,
  }: {
    channelId?: string | null;
    directMessageThreadId?: string | null;
    file: Buffer;
    filename: string;
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<FileWithSignedUrlDTO> {
    if (isDefined(channelId) === isDefined(directMessageThreadId)) {
      throw new BadRequestException(
        'Exactly one Team Comms conversation is required.',
      );
    }

    if (file.byteLength > TEAM_MESSAGE_ATTACHMENT_MAX_SIZE_BYTES) {
      throw new BadRequestException('Attachment is too large.');
    }

    if (isDefined(channelId)) {
      await this.assertChannelMembership({
        channelId,
        userWorkspaceId,
        workspaceId,
      });
    } else if (isDefined(directMessageThreadId)) {
      await this.assertDirectMessageParticipant({
        directMessageThreadId,
        userWorkspaceId,
        workspaceId,
      });
    }

    const { ext } = await extractFileInfoOrThrow({
      file,
      filename,
    });
    const fileId = v4();
    const resourcePath = `${fileId}${isNonEmptyString(ext) ? `.${ext}` : ''}`;
    const { workspaceCustomFlatApplication } =
      await this.applicationService.findWorkspaceTwentyStandardAndCustomApplicationOrThrow(
        {
          workspaceId,
        },
      );
    const savedFile = await this.fileStorageService.writeFile({
      sourceFile: file,
      resourcePath,
      fileFolder: FileFolder.TeamComms,
      applicationUniversalIdentifier:
        workspaceCustomFlatApplication.universalIdentifier,
      workspaceId,
      fileId,
      settings: {
        isTemporaryFile: false,
        toDelete: false,
      },
    });

    return {
      ...savedFile,
      url: await this.fileUrlService.signFileByIdUrl({
        fileFolder: FileFolder.TeamComms,
        fileId,
        workspaceId,
      }),
    };
  }

  async updateMessage({
    body,
    messageId,
    userWorkspaceId,
    workspaceId,
  }: {
    body: string;
    messageId: string;
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<TeamMessageDTO> {
    const normalizedBody = body.trim();

    if (!isNonEmptyString(normalizedBody)) {
      throw new BadRequestException('Message body is invalid.');
    }

    const message = await this.getAccessibleMessageOrThrow({
      messageId,
      userWorkspaceId,
      workspaceId,
    });

    if (message.authorUserWorkspaceId !== userWorkspaceId) {
      throw new ForbiddenException('Only the author can edit this message.');
    }

    await this.messageRepository.update(
      workspaceId,
      { id: messageId },
      { body: normalizedBody },
    );

    const updatedMessage = await this.messageRepository.findOneOrFail(
      workspaceId,
      {
        relations: { authorUserWorkspace: { user: true } },
        where: { id: messageId },
      },
    );

    await this.syncMentionsForMessage({
      candidateRecipients: await this.getMentionCandidatesForMessage({
        message: updatedMessage,
        workspaceId,
      }),
      message: updatedMessage,
      userWorkspaceId,
      workspaceId,
    });

    const [attachmentsByMessageId, reactionsByMessageId] = await Promise.all([
      this.getAttachmentsByMessageId({
        messageIds: [messageId],
        workspaceId,
      }),
      this.getReactionSummariesByMessageId({
        messageIds: [messageId],
        userWorkspaceId,
        workspaceId,
      }),
    ]);

    const messageDTO = this.toMessageDTO({
      attachments: attachmentsByMessageId.get(messageId) ?? [],
      message: updatedMessage,
      reactions: reactionsByMessageId.get(messageId) ?? [],
      replyCount: await this.getReplyCount({
        parentMessageId: messageId,
        workspaceId,
      }),
      userWorkspaceId,
    });

    await this.publishMessageEvent({
      event: this.toMessageEventDTO({
        message: updatedMessage,
        type: TeamMessageEventType.UPSERTED,
      }),
      workspaceId,
    });

    return messageDTO;
  }

  async deleteMessage({
    messageId,
    userWorkspaceId,
    workspaceId,
  }: {
    messageId: string;
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<boolean> {
    const message = await this.getAccessibleMessageOrThrow({
      messageId,
      userWorkspaceId,
      workspaceId,
    });
    const isAuthor = message.authorUserWorkspaceId === userWorkspaceId;
    const isChannelOwner = isDefined(message.channelId)
      ? isDefined(
          await this.channelMemberRepository.findOne(workspaceId, {
            where: {
              channelId: message.channelId,
              role: TeamChannelMemberRole.OWNER,
              userWorkspaceId,
            },
          }),
        )
      : false;

    if (!isAuthor && !isChannelOwner) {
      throw new ForbiddenException('You cannot delete this message.');
    }

    const replyMessages = !isDefined(message.parentMessageId)
      ? await this.messageRepository.find(workspaceId, {
          select: { id: true },
          where: {
            deletedAt: IsNull(),
            parentMessageId: messageId,
          },
        })
      : [];
    const messageIds = [
      messageId,
      ...replyMessages.map((replyMessage) => replyMessage.id),
    ];
    const deletedRootThreadMessageIds = !isDefined(message.parentMessageId)
      ? [messageId]
      : [];

    await this.messageRepository.update(
      workspaceId,
      { id: In(messageIds) },
      { deletedAt: new Date() },
    );

    await Promise.all([
      this.messageAttachmentRepository.delete(workspaceId, {
        messageId: In(messageIds),
      }),
      this.messageBookmarkRepository.delete(workspaceId, {
        messageId: In(messageIds),
      }),
      this.messageMentionRepository.delete(workspaceId, {
        messageId: In(messageIds),
      }),
      this.messageReactionRepository.delete(workspaceId, {
        messageId: In(messageIds),
      }),
      this.messageReminderRepository.delete(workspaceId, {
        messageId: In(messageIds),
      }),
      deletedRootThreadMessageIds.length > 0
        ? this.messageThreadReadRepository.delete(workspaceId, {
            parentMessageId: In(deletedRootThreadMessageIds),
          })
        : Promise.resolve(),
    ]);

    await this.publishMessageEvent({
      event: this.toMessageEventDTO({
        message,
        type: TeamMessageEventType.DELETED,
      }),
      workspaceId,
    });

    return true;
  }

  async markChannelRead({
    channelId,
    userWorkspaceId,
    workspaceId,
  }: {
    channelId: string;
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<boolean> {
    const { membership } = await this.assertCanReadChannel({
      channelId,
      userWorkspaceId,
      workspaceId,
    });
    const readAt = new Date();

    if (!isDefined(membership)) {
      return true;
    }

    await this.channelMemberRepository.update(
      workspaceId,
      { channelId, userWorkspaceId },
      { lastReadAt: readAt },
    );
    await this.markConversationMentionsRead({
      channelId,
      readAt,
      userWorkspaceId,
      workspaceId,
    });

    return true;
  }

  async createChannel({
    description,
    name,
    userWorkspaceId,
    visibility,
    workspaceId,
  }: {
    description?: string | null;
    name: string;
    userWorkspaceId: string;
    visibility: TeamChannelVisibility;
    workspaceId: string;
  }): Promise<TeamChannelDTO> {
    const normalizedName = name.trim();

    if (
      !isNonEmptyString(normalizedName) ||
      normalizedName.length > TEAM_CHANNEL_NAME_MAX_LENGTH
    ) {
      throw new BadRequestException('Channel name is invalid.');
    }

    const slug = this.toChannelSlug(normalizedName);

    if (!isNonEmptyString(slug)) {
      throw new BadRequestException(
        'Channel name must include letters or numbers.',
      );
    }

    const existingChannel = await this.channelRepository.findOne(workspaceId, {
      where: { deletedAt: IsNull(), slug },
    });

    if (isDefined(existingChannel)) {
      throw new BadRequestException('A channel with this name already exists.');
    }

    const normalizedDescription = description?.trim() ?? '';

    const channel = await this.channelRepository.save(workspaceId, {
      createdByUserWorkspaceId: userWorkspaceId,
      description: isNonEmptyString(normalizedDescription)
        ? normalizedDescription
        : null,
      name: normalizedName,
      slug,
      visibility,
    });

    await this.ensureChannelMembership({
      channelId: channel.id,
      role: TeamChannelMemberRole.OWNER,
      userWorkspaceId,
      workspaceId,
    });

    return this.toChannelDTO({
      channel,
      membership: await this.assertChannelMembership({
        channelId: channel.id,
        userWorkspaceId,
        workspaceId,
      }),
      unreadCount: 0,
    });
  }

  async updateChannel({
    channelId,
    description,
    name,
    userWorkspaceId,
    visibility,
    workspaceId,
  }: {
    channelId: string;
    description?: string | null;
    name: string;
    userWorkspaceId: string;
    visibility?: TeamChannelVisibility | null;
    workspaceId: string;
  }): Promise<TeamChannelDTO> {
    await this.assertChannelOwner({
      channelId,
      userWorkspaceId,
      workspaceId,
    });

    const channel = await this.getChannelOrThrow({ channelId, workspaceId });
    const normalizedName = name.trim();

    if (
      !isNonEmptyString(normalizedName) ||
      normalizedName.length > TEAM_CHANNEL_NAME_MAX_LENGTH
    ) {
      throw new BadRequestException('Channel name is invalid.');
    }

    const slug = this.toChannelSlug(normalizedName);

    if (!isNonEmptyString(slug)) {
      throw new BadRequestException(
        'Channel name must include letters or numbers.',
      );
    }

    const existingChannel = await this.channelRepository.findOne(workspaceId, {
      where: { deletedAt: IsNull(), id: Not(channelId), slug },
    });

    if (isDefined(existingChannel)) {
      throw new BadRequestException('A channel with this name already exists.');
    }

    const normalizedDescription = description?.trim() ?? '';

    await this.channelRepository.update(
      workspaceId,
      { id: channelId },
      {
        description: isNonEmptyString(normalizedDescription)
          ? normalizedDescription
          : null,
        name: normalizedName,
        slug,
        visibility: visibility ?? channel.visibility,
      },
    );

    const updatedChannel = await this.getChannelOrThrow({
      channelId,
      workspaceId,
    });
    const membership = await this.assertChannelMembership({
      channelId,
      userWorkspaceId,
      workspaceId,
    });

    return this.toChannelDTO({
      channel: updatedChannel,
      membership,
      unreadCount: await this.getUnreadChannelMessageCount({
        channelId,
        membership,
        userWorkspaceId,
        workspaceId,
      }),
    });
  }

  async archiveChannel({
    channelId,
    userWorkspaceId,
    workspaceId,
  }: {
    channelId: string;
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<boolean> {
    await this.assertChannelOwner({
      channelId,
      userWorkspaceId,
      workspaceId,
    });

    await this.channelRepository.update(
      workspaceId,
      { id: channelId },
      { deletedAt: new Date() },
    );

    return true;
  }

  async joinChannel({
    channelId,
    userWorkspaceId,
    workspaceId,
  }: {
    channelId: string;
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<TeamChannelDTO> {
    const channel = await this.getChannelOrThrow({ channelId, workspaceId });

    if (channel.visibility === TeamChannelVisibility.PRIVATE) {
      throw new ForbiddenException('Private channels are invite-only.');
    }

    const membership = await this.ensureChannelMembership({
      channelId,
      role: TeamChannelMemberRole.MEMBER,
      userWorkspaceId,
      workspaceId,
    });

    return this.toChannelDTO({
      channel,
      membership,
      unreadCount: await this.getUnreadChannelMessageCount({
        channelId,
        membership,
        userWorkspaceId,
        workspaceId,
      }),
    });
  }

  async markDirectMessageRead({
    directMessageThreadId,
    userWorkspaceId,
    workspaceId,
  }: {
    directMessageThreadId: string;
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<boolean> {
    const readAt = new Date();

    await this.assertDirectMessageParticipant({
      directMessageThreadId,
      userWorkspaceId,
      workspaceId,
    });

    await this.directMessageParticipantRepository.update(
      workspaceId,
      { directMessageThreadId, userWorkspaceId },
      { lastReadAt: readAt },
    );
    await this.markConversationMentionsRead({
      directMessageThreadId,
      readAt,
      userWorkspaceId,
      workspaceId,
    });

    return true;
  }

  async markMessageThreadRead({
    parentMessageId,
    userWorkspaceId,
    workspaceId,
  }: {
    parentMessageId: string;
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<boolean> {
    const message = await this.getAccessibleMessageOrThrow({
      messageId: parentMessageId,
      userWorkspaceId,
      workspaceId,
    });
    const threadParentMessageId = message.parentMessageId ?? message.id;

    const readAt = new Date();

    await this.messageThreadReadRepository.upsert(
      workspaceId,
      {
        lastReadAt: readAt,
        parentMessageId: threadParentMessageId,
        userWorkspaceId,
      },
      ['parentMessageId', 'userWorkspaceId'],
    );
    await this.markThreadMentionsRead({
      parentMessageId: threadParentMessageId,
      readAt,
      userWorkspaceId,
      workspaceId,
    });

    return true;
  }

  async markInboxRead({
    userWorkspaceId,
    workspaceId,
  }: {
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<boolean> {
    const now = new Date();
    const participatedParentMessageIds =
      await this.getParticipatedParentMessageIds({
        userWorkspaceId,
        workspaceId,
      });

    await Promise.all([
      this.channelMemberRepository.update(
        workspaceId,
        { userWorkspaceId },
        { lastReadAt: now },
      ),
      this.directMessageParticipantRepository.update(
        workspaceId,
        { userWorkspaceId },
        { lastReadAt: now },
      ),
      this.messageMentionRepository.update(
        workspaceId,
        { mentionedUserWorkspaceId: userWorkspaceId, readAt: IsNull() },
        { readAt: now },
      ),
      participatedParentMessageIds.length > 0
        ? this.messageThreadReadRepository.upsert(
            workspaceId,
            participatedParentMessageIds.map((parentMessageId) => ({
              lastReadAt: now,
              parentMessageId,
              userWorkspaceId,
            })),
            ['parentMessageId', 'userWorkspaceId'],
          )
        : Promise.resolve(),
    ]);

    return true;
  }

  async markMessageUnread({
    messageId,
    userWorkspaceId,
    workspaceId,
  }: {
    messageId: string;
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<boolean> {
    const message = await this.getAccessibleMessageOrThrow({
      messageId,
      userWorkspaceId,
      workspaceId,
    });
    const lastReadAt = new Date(message.createdAt.getTime() - 1);

    if (isDefined(message.parentMessageId)) {
      await Promise.all([
        this.messageThreadReadRepository.upsert(
          workspaceId,
          {
            lastReadAt,
            parentMessageId: message.parentMessageId,
            userWorkspaceId,
          },
          ['parentMessageId', 'userWorkspaceId'],
        ),
        this.messageMentionRepository.update(
          workspaceId,
          { mentionedUserWorkspaceId: userWorkspaceId, messageId },
          { readAt: null },
        ),
      ]);

      return true;
    }

    if (isDefined(message.channelId)) {
      await Promise.all([
        this.channelMemberRepository.update(
          workspaceId,
          { channelId: message.channelId, userWorkspaceId },
          { lastReadAt },
        ),
        this.messageMentionRepository.update(
          workspaceId,
          { mentionedUserWorkspaceId: userWorkspaceId, messageId },
          { readAt: null },
        ),
      ]);

      return true;
    }

    if (isDefined(message.directMessageThreadId)) {
      await Promise.all([
        this.directMessageParticipantRepository.update(
          workspaceId,
          {
            directMessageThreadId: message.directMessageThreadId,
            userWorkspaceId,
          },
          { lastReadAt },
        ),
        this.messageMentionRepository.update(
          workspaceId,
          { mentionedUserWorkspaceId: userWorkspaceId, messageId },
          { readAt: null },
        ),
      ]);

      return true;
    }

    throw new BadRequestException('Message has no conversation.');
  }

  async markMentionRead({
    mentionId,
    userWorkspaceId,
    workspaceId,
  }: {
    mentionId: string;
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<boolean> {
    const mention = await this.messageMentionRepository.findOneOrFail(
      workspaceId,
      {
        where: {
          id: mentionId,
          mentionedUserWorkspaceId: userWorkspaceId,
        },
      },
    );

    if (!isDefined(mention.readAt)) {
      await this.messageMentionRepository.update(
        workspaceId,
        { id: mentionId, mentionedUserWorkspaceId: userWorkspaceId },
        { readAt: new Date() },
      );
    }

    return true;
  }

  private async markConversationMentionsRead({
    channelId,
    directMessageThreadId,
    readAt,
    userWorkspaceId,
    workspaceId,
  }: {
    channelId?: string;
    directMessageThreadId?: string;
    readAt: Date;
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<void> {
    const unreadMentions = await this.messageMentionRepository.find(
      workspaceId,
      {
        relations: { message: true },
        where: {
          mentionedUserWorkspaceId: userWorkspaceId,
          readAt: IsNull(),
        },
      },
    );
    const mentionIds = unreadMentions
      .filter((mention) => {
        if (isDefined(mention.message.parentMessageId)) {
          return false;
        }

        if (isDefined(channelId)) {
          return mention.message.channelId === channelId;
        }

        return mention.message.directMessageThreadId === directMessageThreadId;
      })
      .map((mention) => mention.id);

    if (mentionIds.length === 0) {
      return;
    }

    await this.messageMentionRepository.update(
      workspaceId,
      { id: In(mentionIds) },
      { readAt },
    );
  }

  private async markThreadMentionsRead({
    parentMessageId,
    readAt,
    userWorkspaceId,
    workspaceId,
  }: {
    parentMessageId: string;
    readAt: Date;
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<void> {
    const unreadMentions = await this.messageMentionRepository.find(
      workspaceId,
      {
        relations: { message: true },
        where: {
          mentionedUserWorkspaceId: userWorkspaceId,
          readAt: IsNull(),
        },
      },
    );
    const mentionIds = unreadMentions
      .filter((mention) => mention.message.parentMessageId === parentMessageId)
      .map((mention) => mention.id);

    if (mentionIds.length === 0) {
      return;
    }

    await this.messageMentionRepository.update(
      workspaceId,
      { id: In(mentionIds) },
      { readAt },
    );
  }

  private async ensureDefaultChannels({
    workspaceId,
    userWorkspaceId,
  }: {
    workspaceId: string;
    userWorkspaceId: string;
  }) {
    const existingChannelCount = await this.channelRepository.count(
      workspaceId,
      {
        where: { deletedAt: IsNull() },
      },
    );

    if (existingChannelCount > 0) {
      await this.ensureDefaultChannelMemberships({
        userWorkspaceId,
        workspaceId,
      });

      return;
    }

    for (const defaultChannel of DEFAULT_TEAM_CHANNELS) {
      const channel = await this.channelRepository.save(workspaceId, {
        ...defaultChannel,
        createdByUserWorkspaceId: userWorkspaceId,
        visibility: TeamChannelVisibility.PUBLIC,
      });

      await this.ensureChannelMembership({
        channelId: channel.id,
        role: TeamChannelMemberRole.OWNER,
        userWorkspaceId,
        workspaceId,
      });
    }
  }

  private async ensureDefaultChannelMemberships({
    userWorkspaceId,
    workspaceId,
  }: {
    userWorkspaceId: string;
    workspaceId: string;
  }) {
    const defaultChannels = (
      await this.channelRepository.find(workspaceId, {
        where: {
          deletedAt: IsNull(),
          slug: In(DEFAULT_TEAM_CHANNEL_SLUGS),
          visibility: TeamChannelVisibility.PUBLIC,
        },
      })
    ).filter((channel) =>
      DEFAULT_TEAM_CHANNEL_SLUGS.includes(
        channel.slug as (typeof DEFAULT_TEAM_CHANNEL_SLUGS)[number],
      ),
    );
    const defaultChannelIds = defaultChannels.map((channel) => channel.id);

    if (defaultChannelIds.length === 0) {
      return;
    }

    const memberships = await this.channelMemberRepository.find(workspaceId, {
      where: {
        channelId: In(defaultChannelIds),
        userWorkspaceId,
      },
    });
    const membershipChannelIds = new Set(
      memberships.map((membership) => membership.channelId),
    );

    await Promise.all(
      defaultChannels
        .filter((channel) => !membershipChannelIds.has(channel.id))
        .map((channel) =>
          this.ensureChannelMembership({
            channelId: channel.id,
            role: TeamChannelMemberRole.MEMBER,
            userWorkspaceId,
            workspaceId,
          }),
        ),
    );
  }

  private async ensureChannelMembership({
    channelId,
    role,
    userWorkspaceId,
    workspaceId,
  }: {
    channelId: string;
    role: TeamChannelMemberRole;
    userWorkspaceId: string;
    workspaceId: string;
  }) {
    const existingMembership = await this.channelMemberRepository.findOne(
      workspaceId,
      {
        where: { channelId, userWorkspaceId },
      },
    );

    if (isDefined(existingMembership)) {
      return existingMembership;
    }

    return this.channelMemberRepository.save(workspaceId, {
      channelId,
      role,
      userWorkspaceId,
    });
  }

  private async assertCanReadChannel({
    channelId,
    userWorkspaceId,
    workspaceId,
  }: {
    channelId: string;
    userWorkspaceId: string;
    workspaceId: string;
  }) {
    const channel = await this.getChannelOrThrow({ channelId, workspaceId });
    const membership = await this.channelMemberRepository.findOne(workspaceId, {
      where: { channelId, userWorkspaceId },
    });

    if (
      channel.visibility === TeamChannelVisibility.PRIVATE &&
      !isDefined(membership)
    ) {
      throw new ForbiddenException('You are not a member of this channel.');
    }

    return { channel, membership };
  }

  private async assertCanAccessConversation({
    channelId,
    directMessageThreadId,
    userWorkspaceId,
    workspaceId,
  }: {
    channelId?: string | null;
    directMessageThreadId?: string | null;
    userWorkspaceId: string;
    workspaceId: string;
  }) {
    if (isDefined(channelId) === isDefined(directMessageThreadId)) {
      throw new BadRequestException(
        'Exactly one Team Comms conversation is required.',
      );
    }

    if (isDefined(channelId)) {
      await this.assertCanReadChannel({
        channelId,
        userWorkspaceId,
        workspaceId,
      });

      return;
    }

    if (isDefined(directMessageThreadId)) {
      await this.assertDirectMessageParticipant({
        directMessageThreadId,
        userWorkspaceId,
        workspaceId,
      });
    }
  }

  private async assertValidTypingParent({
    channelId,
    directMessageThreadId,
    parentMessageId,
    userWorkspaceId,
    workspaceId,
  }: {
    channelId?: string | null;
    directMessageThreadId?: string | null;
    parentMessageId?: string | null;
    userWorkspaceId: string;
    workspaceId: string;
  }) {
    if (!isDefined(parentMessageId)) {
      return;
    }

    if (isDefined(channelId)) {
      await this.assertValidChannelReplyParent({
        channelId,
        parentMessageId,
        userWorkspaceId,
        workspaceId,
      });

      return;
    }

    if (isDefined(directMessageThreadId)) {
      await this.assertValidDirectMessageReplyParent({
        directMessageThreadId,
        parentMessageId,
        userWorkspaceId,
        workspaceId,
      });
    }
  }

  private async assertCanReadMessageConversation({
    message,
    userWorkspaceId,
    workspaceId,
  }: {
    message: TeamMessageEntity;
    userWorkspaceId: string;
    workspaceId: string;
  }) {
    if (isDefined(message.channelId)) {
      await this.assertCanReadChannel({
        channelId: message.channelId,
        userWorkspaceId,
        workspaceId,
      });

      return;
    }

    if (isDefined(message.directMessageThreadId)) {
      await this.assertDirectMessageParticipant({
        directMessageThreadId: message.directMessageThreadId,
        userWorkspaceId,
        workspaceId,
      });

      return;
    }

    throw new BadRequestException('Message has no conversation.');
  }

  private async assertChannelMembership({
    channelId,
    userWorkspaceId,
    workspaceId,
  }: {
    channelId: string;
    userWorkspaceId: string;
    workspaceId: string;
  }) {
    await this.getChannelOrThrow({ channelId, workspaceId });

    const membership = await this.channelMemberRepository.findOne(workspaceId, {
      where: { channelId, userWorkspaceId },
    });

    if (!isDefined(membership)) {
      throw new ForbiddenException('Join the channel before posting.');
    }

    return membership;
  }

  private async assertChannelOwner({
    channelId,
    userWorkspaceId,
    workspaceId,
  }: {
    channelId: string;
    userWorkspaceId: string;
    workspaceId: string;
  }) {
    const membership = await this.assertChannelMembership({
      channelId,
      userWorkspaceId,
      workspaceId,
    });

    if (membership.role !== TeamChannelMemberRole.OWNER) {
      throw new ForbiddenException('Only channel owners can manage members.');
    }

    return membership;
  }

  private async isChannelOwner({
    channelId,
    userWorkspaceId,
    workspaceId,
  }: {
    channelId: string;
    userWorkspaceId: string;
    workspaceId: string;
  }) {
    const membership = await this.channelMemberRepository.findOne(workspaceId, {
      where: {
        channelId,
        role: TeamChannelMemberRole.OWNER,
        userWorkspaceId,
      },
    });

    return isDefined(membership);
  }

  private async getChannelOrThrow({
    channelId,
    workspaceId,
  }: {
    channelId: string;
    workspaceId: string;
  }) {
    const channel = await this.channelRepository.findOne(workspaceId, {
      where: { deletedAt: IsNull(), id: channelId },
    });

    if (!isDefined(channel)) {
      throw new NotFoundException('Channel was not found.');
    }

    return channel;
  }

  private async getUnreadChannelMessageCount({
    channelId,
    membership,
    userWorkspaceId,
    workspaceId,
  }: {
    channelId: string;
    membership?: TeamChannelMemberEntity | null;
    userWorkspaceId: string;
    workspaceId: string;
  }) {
    if (!isDefined(membership)) {
      return 0;
    }

    const unreadBaseline = membership.lastReadAt ?? membership.createdAt;

    return isDefined(unreadBaseline)
      ? this.messageRepository.count(workspaceId, {
          where: {
            authorUserWorkspaceId: Not(userWorkspaceId),
            channelId,
            createdAt: MoreThan(unreadBaseline),
            deletedAt: IsNull(),
            parentMessageId: IsNull(),
          },
        })
      : this.messageRepository.count(workspaceId, {
          where: {
            authorUserWorkspaceId: Not(userWorkspaceId),
            channelId,
            deletedAt: IsNull(),
            parentMessageId: IsNull(),
          },
        });
  }

  private toChannelDTO({
    channel,
    membership,
    unreadCount,
  }: {
    channel: TeamChannelEntity;
    membership?: TeamChannelMemberEntity | null;
    unreadCount: number;
  }): TeamChannelDTO {
    return {
      createdAt: channel.createdAt,
      description: channel.description,
      id: channel.id,
      isMember: isDefined(membership),
      name: channel.name,
      notificationLevel: membership?.notificationLevel ?? null,
      slug: channel.slug,
      unreadCount,
      updatedAt: channel.updatedAt,
      visibility: channel.visibility,
    };
  }

  private toChannelMemberDTO({
    currentUserWorkspaceId,
    member,
  }: {
    currentUserWorkspaceId: string;
    member: TeamChannelMemberEntity;
  }): TeamChannelMemberDTO {
    return {
      channelId: member.channelId,
      createdAt: member.createdAt,
      email: member.userWorkspace.user.email,
      id: member.id,
      isCurrentUser: member.userWorkspaceId === currentUserWorkspaceId,
      name: this.getAuthorName(member.userWorkspace),
      notificationLevel: member.notificationLevel,
      role: member.role,
      userWorkspaceId: member.userWorkspaceId,
    };
  }

  private toChannelSlug(name: string) {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private toTypingConversationKey({
    channelId,
    directMessageThreadId,
    parentMessageId,
    workspaceId,
  }: {
    channelId?: string | null;
    directMessageThreadId?: string | null;
    parentMessageId?: string | null;
    workspaceId: string;
  }) {
    const conversationKey = isDefined(channelId)
      ? `${workspaceId}:channel:${channelId}`
      : `${workspaceId}:direct:${directMessageThreadId}`;

    return isDefined(parentMessageId)
      ? `${conversationKey}:thread:${parentMessageId}`
      : `${conversationKey}:main`;
  }

  private toTypingIndicatorKey({
    channelId,
    directMessageThreadId,
    parentMessageId,
    userWorkspaceId,
    workspaceId,
  }: {
    channelId?: string | null;
    directMessageThreadId?: string | null;
    parentMessageId?: string | null;
    userWorkspaceId: string;
    workspaceId: string;
  }) {
    return `${this.toTypingConversationKey({
      channelId,
      directMessageThreadId,
      parentMessageId,
      workspaceId,
    })}:user:${userWorkspaceId}`;
  }

  private pruneExpiredTypingIndicators(now = new Date()) {
    for (const [key, indicator] of this.typingIndicatorsByKey.entries()) {
      if (indicator.expiresAt <= now) {
        this.typingIndicatorsByKey.delete(key);
      }
    }
  }

  private async getChannelMentionCandidates({
    channelId,
    workspaceId,
  }: {
    channelId: string;
    workspaceId: string;
  }) {
    const channel = await this.getChannelOrThrow({ channelId, workspaceId });

    if (channel.visibility === TeamChannelVisibility.PUBLIC) {
      return this.userWorkspaceRepository.find({
        relations: { user: true },
        where: {
          deletedAt: IsNull(),
          workspaceId,
        },
      });
    }

    const channelMembers = await this.channelMemberRepository.find(
      workspaceId,
      {
        relations: { userWorkspace: { user: true } },
        where: { channelId },
      },
    );

    return channelMembers.map((member) => member.userWorkspace);
  }

  private async getDirectMessageMentionCandidates({
    directMessageThreadId,
    workspaceId,
  }: {
    directMessageThreadId: string;
    workspaceId: string;
  }) {
    const directMessageParticipants =
      await this.directMessageParticipantRepository.find(workspaceId, {
        relations: { userWorkspace: { user: true } },
        where: { directMessageThreadId },
      });

    return directMessageParticipants.map(
      (participant) => participant.userWorkspace,
    );
  }

  private async createMentionsForMessage({
    candidateRecipients,
    message,
    userWorkspaceId,
    workspaceId,
  }: {
    candidateRecipients: UserWorkspaceEntity[];
    message: TeamMessageEntity;
    userWorkspaceId: string;
    workspaceId: string;
  }) {
    const mentionedUserWorkspaceIds = await this.getMentionedUserWorkspaceIds({
      allowBroadcastMentions: isDefined(message.channelId),
      body: message.body,
      candidateRecipients,
      userWorkspaceId,
      workspaceId,
    });

    for (const mentionedUserWorkspaceId of mentionedUserWorkspaceIds) {
      await this.messageMentionRepository.save(workspaceId, {
        mentionedUserWorkspaceId,
        messageId: message.id,
        readAt: null,
      });
    }
  }

  private async syncMentionsForMessage({
    candidateRecipients,
    message,
    userWorkspaceId,
    workspaceId,
  }: {
    candidateRecipients: UserWorkspaceEntity[];
    message: TeamMessageEntity;
    userWorkspaceId: string;
    workspaceId: string;
  }) {
    const nextMentionedUserWorkspaceIds = new Set(
      await this.getMentionedUserWorkspaceIds({
        allowBroadcastMentions: isDefined(message.channelId),
        body: message.body,
        candidateRecipients,
        userWorkspaceId,
        workspaceId,
      }),
    );
    const existingMentions = await this.messageMentionRepository.find(
      workspaceId,
      {
        where: { messageId: message.id },
      },
    );
    const existingMentionedUserWorkspaceIds = new Set(
      existingMentions.map((mention) => mention.mentionedUserWorkspaceId),
    );
    const staleMentionIds = existingMentions
      .filter(
        (mention) =>
          !nextMentionedUserWorkspaceIds.has(mention.mentionedUserWorkspaceId),
      )
      .map((mention) => mention.id);

    if (staleMentionIds.length > 0) {
      await this.messageMentionRepository.delete(workspaceId, {
        id: In(staleMentionIds),
      });
    }

    for (const mentionedUserWorkspaceId of nextMentionedUserWorkspaceIds) {
      if (existingMentionedUserWorkspaceIds.has(mentionedUserWorkspaceId)) {
        continue;
      }

      await this.messageMentionRepository.save(workspaceId, {
        mentionedUserWorkspaceId,
        messageId: message.id,
        readAt: null,
      });
    }
  }

  private async getMentionCandidatesForMessage({
    message,
    workspaceId,
  }: {
    message: TeamMessageEntity;
    workspaceId: string;
  }) {
    if (isDefined(message.channelId)) {
      return this.getChannelMentionCandidates({
        channelId: message.channelId,
        workspaceId,
      });
    }

    if (isDefined(message.directMessageThreadId)) {
      return this.getDirectMessageMentionCandidates({
        directMessageThreadId: message.directMessageThreadId,
        workspaceId,
      });
    }

    return [];
  }

  private async getMentionedUserWorkspaceIds({
    allowBroadcastMentions,
    body,
    candidateRecipients,
    userWorkspaceId,
    workspaceId,
  }: {
    allowBroadcastMentions: boolean;
    body: string;
    candidateRecipients: UserWorkspaceEntity[];
    userWorkspaceId: string;
    workspaceId: string;
  }) {
    const mentionAliases = this.getMentionAliases(body);

    if (mentionAliases.size === 0) {
      return [];
    }

    if (
      allowBroadcastMentions &&
      (mentionAliases.has('channel') || mentionAliases.has('everyone'))
    ) {
      return candidateRecipients
        .filter((recipient) => recipient.id !== userWorkspaceId)
        .map((recipient) => recipient.id);
    }

    if (allowBroadcastMentions && mentionAliases.has('here')) {
      const onlineUserWorkspaceIds = await this.getOnlineUserWorkspaceIds({
        candidateRecipients,
        userWorkspaceId,
        workspaceId,
      });

      return candidateRecipients
        .filter((recipient) => recipient.id !== userWorkspaceId)
        .filter((recipient) => onlineUserWorkspaceIds.has(recipient.id))
        .map((recipient) => recipient.id);
    }

    return [
      ...new Set(
        candidateRecipients
          .filter((recipient) => recipient.id !== userWorkspaceId)
          .filter((recipient) =>
            this.getUserWorkspaceMentionAliases(recipient).some((alias) =>
              mentionAliases.has(alias),
            ),
          )
          .map((recipient) => recipient.id),
      ),
    ];
  }

  private async getOnlineUserWorkspaceIds({
    candidateRecipients,
    userWorkspaceId,
    workspaceId,
  }: {
    candidateRecipients: UserWorkspaceEntity[];
    userWorkspaceId: string;
    workspaceId: string;
  }) {
    const candidateRecipientIds = candidateRecipients
      .filter((recipient) => recipient.id !== userWorkspaceId)
      .map((recipient) => recipient.id);

    if (candidateRecipientIds.length === 0) {
      return new Set<string>();
    }

    const onlineSince = new Date(Date.now() - TEAM_PRESENCE_ONLINE_WINDOW_MS);
    const presenceRows = await this.presenceRepository.find(workspaceId, {
      where: {
        lastSeenAt: MoreThan(onlineSince),
        userWorkspaceId: In(candidateRecipientIds),
      },
    });

    return new Set(
      presenceRows
        .filter((presence) => presence.lastSeenAt >= onlineSince)
        .map((presence) => presence.userWorkspaceId),
    );
  }

  private getMentionAliases(body: string) {
    const mentionAliases = new Set<string>();

    for (const text of this.getMentionableTextBlocks(body)) {
      const ignoredRanges = [
        ...this.getRegexMatchRanges(text, TEAM_MESSAGE_INLINE_CODE_PATTERN),
        ...this.getRegexMatchRanges(text, TEAM_MESSAGE_URL_PATTERN),
      ];

      for (const match of text.matchAll(TEAM_MESSAGE_MENTION_PATTERN)) {
        const rawMention = match[0];
        const alias = match[1];
        const index = match.index;

        if (!isDefined(index)) {
          continue;
        }

        const previousCharacter = index > 0 ? text[index - 1] : '';

        if (
          /[a-zA-Z0-9._-]/.test(previousCharacter) ||
          ignoredRanges.some(
            (range) => index >= range.start && index < range.end,
          )
        ) {
          continue;
        }

        if (rawMention.length > 1) {
          mentionAliases.add(this.normalizeMentionAlias(alias));
        }
      }
    }

    return mentionAliases;
  }

  private getMentionableTextBlocks(body: string) {
    const mentionableLines: string[] = [];
    let isInsideCodeBlock = false;

    for (const line of body.split('\n')) {
      if (line.trim().startsWith('```')) {
        isInsideCodeBlock = !isInsideCodeBlock;

        continue;
      }

      if (!isInsideCodeBlock) {
        mentionableLines.push(line);
      }
    }

    return [mentionableLines.join('\n')];
  }

  private getRegexMatchRanges(text: string, pattern: RegExp) {
    return [...text.matchAll(pattern)].flatMap((match) =>
      isDefined(match.index)
        ? [{ end: match.index + match[0].length, start: match.index }]
        : [],
    );
  }

  private parseMessageCursorDate(before?: string | null) {
    if (!isNonEmptyString(before)) {
      return null;
    }

    const beforeDate = new Date(before);

    if (Number.isNaN(beforeDate.getTime())) {
      throw new BadRequestException('Invalid message cursor');
    }

    return beforeDate;
  }

  private getUserWorkspaceMentionAliases(userWorkspace: UserWorkspaceEntity) {
    const user = userWorkspace.user;
    const emailLocalPart = user.email.split('@')[0] ?? '';
    const names = [
      user.firstName,
      user.lastName,
      `${user.firstName}${user.lastName}`,
      `${user.firstName}.${user.lastName}`,
      emailLocalPart,
    ];

    return names
      .map((name) => this.normalizeMentionAlias(name))
      .filter(isNonEmptyString);
  }

  private normalizeMentionAlias(value: string) {
    return value.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  private async getDirectMessageConversationNames({
    directMessageThreadIds,
    userWorkspaceId,
    workspaceId,
  }: {
    directMessageThreadIds: string[];
    userWorkspaceId: string;
    workspaceId: string;
  }) {
    if (directMessageThreadIds.length === 0) {
      return new Map<string, string>();
    }

    const participants = await this.directMessageParticipantRepository.find(
      workspaceId,
      {
        relations: { userWorkspace: { user: true } },
        where: {
          directMessageThreadId: In(directMessageThreadIds),
          userWorkspaceId: Not(userWorkspaceId),
        },
      },
    );

    return new Map(
      participants
        .filter((participant) => isDefined(participant.userWorkspace))
        .map((participant) => [
          participant.directMessageThreadId,
          this.getAuthorName(participant.userWorkspace),
        ]),
    );
  }

  private getSearchResultConversationName({
    channelNameById,
    directMessageConversationNameByThreadId,
    message,
  }: {
    channelNameById: Map<string, string>;
    directMessageConversationNameByThreadId: Map<string, string>;
    message: TeamMessageEntity;
  }) {
    return isDefined(message.channelId)
      ? (channelNameById.get(message.channelId) ?? 'Unknown channel')
      : (directMessageConversationNameByThreadId.get(
          message.directMessageThreadId ?? '',
        ) ?? 'Direct message');
  }

  private async getMessageConversationName({
    message,
    userWorkspaceId,
    workspaceId,
  }: {
    message: TeamMessageEntity;
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<string | null> {
    if (isDefined(message.channelId)) {
      const channel = await this.getChannelOrThrow({
        channelId: message.channelId,
        workspaceId,
      });

      return channel.name;
    }

    if (isDefined(message.directMessageThreadId)) {
      const directMessageConversationNameByThreadId =
        await this.getDirectMessageConversationNames({
          directMessageThreadIds: [message.directMessageThreadId],
          userWorkspaceId,
          workspaceId,
        });

      return (
        directMessageConversationNameByThreadId.get(
          message.directMessageThreadId,
        ) ?? 'Direct message'
      );
    }

    return null;
  }

  private async toMessageReminderDTOs({
    reminders,
    userWorkspaceId,
    workspaceId,
  }: {
    reminders: TeamMessageReminderEntity[];
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<TeamMessageReminderDTO[]> {
    const channelIds = [
      ...new Set(reminders.map((reminder) => reminder.message.channelId)),
    ].filter(isDefined);
    const directMessageThreadIds = [
      ...new Set(
        reminders.map((reminder) => reminder.message.directMessageThreadId),
      ),
    ].filter(isDefined);
    const [channels, directMessageConversationNameByThreadId] =
      await Promise.all([
        channelIds.length > 0
          ? this.channelRepository.find(workspaceId, {
              where: { id: In(channelIds) },
            })
          : [],
        this.getDirectMessageConversationNames({
          directMessageThreadIds,
          userWorkspaceId,
          workspaceId,
        }),
      ]);
    const channelNameById = new Map(
      channels.map((channel) => [channel.id, channel.name]),
    );

    return reminders.map((reminder) => {
      const message = reminder.message;

      return {
        authorName: this.getAuthorName(message.authorUserWorkspace),
        body: message.body,
        channelId: message.channelId,
        conversationName: this.getSearchResultConversationName({
          channelNameById,
          directMessageConversationNameByThreadId,
          message,
        }),
        conversationType: isDefined(message.channelId) ? 'channel' : 'direct',
        createdAt: reminder.createdAt,
        directMessageThreadId: message.directMessageThreadId,
        id: reminder.id,
        messageId: reminder.messageId,
        parentMessageId: message.parentMessageId,
        remindAt: reminder.remindAt,
      };
    });
  }

  private async ensureDirectMessageThread({
    participantUserWorkspaceId,
    userWorkspaceId,
    workspaceId,
  }: {
    participantUserWorkspaceId: string;
    userWorkspaceId: string;
    workspaceId: string;
  }) {
    const participantKey = [participantUserWorkspaceId, userWorkspaceId]
      .sort()
      .join(':');
    const existingThread = await this.directMessageThreadRepository.findOne(
      workspaceId,
      { where: { participantKey } },
    );

    if (isDefined(existingThread)) {
      await this.ensureDirectMessageParticipant({
        directMessageThreadId: existingThread.id,
        userWorkspaceId,
        workspaceId,
      });
      await this.ensureDirectMessageParticipant({
        directMessageThreadId: existingThread.id,
        userWorkspaceId: participantUserWorkspaceId,
        workspaceId,
      });

      return existingThread;
    }

    const thread = await this.directMessageThreadRepository.save(workspaceId, {
      participantKey,
    });

    await this.ensureDirectMessageParticipant({
      directMessageThreadId: thread.id,
      userWorkspaceId,
      workspaceId,
    });
    await this.ensureDirectMessageParticipant({
      directMessageThreadId: thread.id,
      userWorkspaceId: participantUserWorkspaceId,
      workspaceId,
    });

    return thread;
  }

  private async getOrCreateDirectMessageDTO({
    participantUserWorkspace,
    participantUserWorkspaceId,
    userWorkspaceId,
    workspaceId,
  }: {
    participantUserWorkspace: UserWorkspaceEntity;
    participantUserWorkspaceId: string;
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<TeamDirectMessageDTO> {
    const thread = await this.ensureDirectMessageThread({
      participantUserWorkspaceId,
      userWorkspaceId,
      workspaceId,
    });
    const membership =
      await this.directMessageParticipantRepository.findOneOrFail(workspaceId, {
        where: {
          directMessageThreadId: thread.id,
          userWorkspaceId,
        },
      });
    const lastMessage = await this.messageRepository.findOne(workspaceId, {
      order: { createdAt: 'DESC' },
      where: {
        deletedAt: IsNull(),
        directMessageThreadId: thread.id,
        parentMessageId: IsNull(),
      },
    });
    const unreadBaseline = membership.lastReadAt ?? membership.createdAt;
    const unreadCount = isDefined(unreadBaseline)
      ? await this.messageRepository.count(workspaceId, {
          where: {
            authorUserWorkspaceId: Not(userWorkspaceId),
            createdAt: MoreThan(unreadBaseline),
            deletedAt: IsNull(),
            directMessageThreadId: thread.id,
            parentMessageId: IsNull(),
          },
        })
      : await this.messageRepository.count(workspaceId, {
          where: {
            authorUserWorkspaceId: Not(userWorkspaceId),
            deletedAt: IsNull(),
            directMessageThreadId: thread.id,
            parentMessageId: IsNull(),
          },
        });

    return {
      id: thread.id,
      lastMessageBody: isDefined(lastMessage)
        ? this.getMessagePreviewBody(lastMessage.body)
        : null,
      participantEmail: participantUserWorkspace.user.email,
      participantName: this.getAuthorName(participantUserWorkspace),
      participantUserWorkspaceId,
      notificationLevel: membership.notificationLevel,
      unreadCount,
      updatedAt: lastMessage?.createdAt ?? thread.updatedAt,
    };
  }

  private async ensureDirectMessageParticipant({
    directMessageThreadId,
    userWorkspaceId,
    workspaceId,
  }: {
    directMessageThreadId: string;
    userWorkspaceId: string;
    workspaceId: string;
  }) {
    const existingParticipant =
      await this.directMessageParticipantRepository.findOne(workspaceId, {
        where: { directMessageThreadId, userWorkspaceId },
      });

    if (isDefined(existingParticipant)) {
      return existingParticipant;
    }

    return this.directMessageParticipantRepository.save(workspaceId, {
      directMessageThreadId,
      userWorkspaceId,
    });
  }

  private async assertDirectMessageParticipant({
    directMessageThreadId,
    userWorkspaceId,
    workspaceId,
  }: {
    directMessageThreadId: string;
    userWorkspaceId: string;
    workspaceId: string;
  }) {
    return this.directMessageParticipantRepository.findOneOrFail(workspaceId, {
      where: { directMessageThreadId, userWorkspaceId },
    });
  }

  private async assertValidChannelReplyParent({
    channelId,
    parentMessageId,
    workspaceId,
  }: {
    channelId: string;
    parentMessageId: string | null;
    userWorkspaceId: string;
    workspaceId: string;
  }) {
    if (!isDefined(parentMessageId)) {
      return;
    }

    const parentMessage = await this.messageRepository.findOne(workspaceId, {
      where: {
        channelId,
        deletedAt: IsNull(),
        directMessageThreadId: IsNull(),
        id: parentMessageId,
        parentMessageId: IsNull(),
      },
    });

    if (!isDefined(parentMessage)) {
      throw new BadRequestException(
        'Replies must belong to the selected channel thread.',
      );
    }
  }

  private async assertValidDirectMessageReplyParent({
    directMessageThreadId,
    parentMessageId,
    workspaceId,
  }: {
    directMessageThreadId: string;
    parentMessageId: string | null;
    userWorkspaceId: string;
    workspaceId: string;
  }) {
    if (!isDefined(parentMessageId)) {
      return;
    }

    const parentMessage = await this.messageRepository.findOne(workspaceId, {
      where: {
        channelId: IsNull(),
        deletedAt: IsNull(),
        directMessageThreadId,
        id: parentMessageId,
        parentMessageId: IsNull(),
      },
    });

    if (!isDefined(parentMessage)) {
      throw new BadRequestException(
        'Replies must belong to the selected direct message thread.',
      );
    }
  }

  private async getAccessibleMessageOrThrow({
    messageId,
    userWorkspaceId,
    workspaceId,
  }: {
    messageId: string;
    userWorkspaceId: string;
    workspaceId: string;
  }) {
    const message = await this.messageRepository.findOne(workspaceId, {
      relations: { authorUserWorkspace: { user: true } },
      where: { deletedAt: IsNull(), id: messageId },
    });

    if (!isDefined(message)) {
      throw new NotFoundException('Message was not found.');
    }

    if (isDefined(message.channelId)) {
      await this.assertChannelMembership({
        channelId: message.channelId,
        userWorkspaceId,
        workspaceId,
      });

      return message;
    }

    if (isDefined(message.directMessageThreadId)) {
      await this.assertDirectMessageParticipant({
        directMessageThreadId: message.directMessageThreadId,
        userWorkspaceId,
        workspaceId,
      });

      return message;
    }

    throw new BadRequestException('Message has no conversation.');
  }

  private async getReadableMessageOrThrow({
    messageId,
    userWorkspaceId,
    workspaceId,
  }: {
    messageId: string;
    userWorkspaceId: string;
    workspaceId: string;
  }) {
    const message = await this.messageRepository.findOne(workspaceId, {
      relations: { authorUserWorkspace: { user: true } },
      where: { deletedAt: IsNull(), id: messageId },
    });

    if (!isDefined(message)) {
      throw new NotFoundException('Message was not found.');
    }

    await this.assertCanReadMessageConversation({
      message,
      userWorkspaceId,
      workspaceId,
    });

    return message;
  }

  private async getReplyCount({
    parentMessageId,
    workspaceId,
  }: {
    parentMessageId: string;
    workspaceId: string;
  }) {
    return this.messageRepository.count(workspaceId, {
      where: { deletedAt: IsNull(), parentMessageId },
    });
  }

  private async getReplyCountByParentMessageId({
    parentMessageIds,
    workspaceId,
  }: {
    parentMessageIds: string[];
    workspaceId: string;
  }) {
    if (parentMessageIds.length === 0) {
      return new Map<string, number>();
    }

    const rows = await this.messageRepository
      .createQueryBuilder('message')
      .select('message.parentMessageId', 'parentMessageId')
      .addSelect('COUNT(message.id)', 'replyCount')
      .where('message.workspaceId = :workspaceId', { workspaceId })
      .andWhere('message.parentMessageId IN (:...parentMessageIds)', {
        parentMessageIds,
      })
      .andWhere('message.deletedAt IS NULL')
      .groupBy('message.parentMessageId')
      .getRawMany<{ parentMessageId: string; replyCount: string }>();

    return new Map(
      rows.map((row) => [row.parentMessageId, Number(row.replyCount)]),
    );
  }

  private async getReactionSummariesByMessageId({
    messageIds,
    userWorkspaceId,
    workspaceId,
  }: {
    messageIds: string[];
    userWorkspaceId: string;
    workspaceId: string;
  }) {
    if (messageIds.length === 0) {
      return new Map<string, TeamMessageReactionDTO[]>();
    }

    const reactions = await this.messageReactionRepository.find(workspaceId, {
      order: { createdAt: 'ASC' },
      where: { messageId: In(messageIds) },
    });
    const summaryByMessageId = new Map<string, TeamMessageReactionDTO[]>();
    const summaryByMessageIdAndEmoji = new Map<
      string,
      TeamMessageReactionDTO
    >();

    for (const reaction of reactions) {
      const key = `${reaction.messageId}:${reaction.emoji}`;
      const existingSummary = summaryByMessageIdAndEmoji.get(key);

      if (isDefined(existingSummary)) {
        existingSummary.count += 1;
        existingSummary.hasReacted =
          existingSummary.hasReacted ||
          reaction.userWorkspaceId === userWorkspaceId;

        continue;
      }

      const summary = {
        count: 1,
        emoji: reaction.emoji,
        hasReacted: reaction.userWorkspaceId === userWorkspaceId,
      };

      summaryByMessageIdAndEmoji.set(key, summary);
      summaryByMessageId.set(reaction.messageId, [
        ...(summaryByMessageId.get(reaction.messageId) ?? []),
        summary,
      ]);
    }

    return summaryByMessageId;
  }

  private async getSavedMessageIds({
    messageIds,
    userWorkspaceId,
    workspaceId,
  }: {
    messageIds: string[];
    userWorkspaceId: string;
    workspaceId: string;
  }): Promise<Set<string>> {
    if (messageIds.length === 0) {
      return new Set();
    }

    const bookmarks = await this.messageBookmarkRepository.find(workspaceId, {
      where: {
        messageId: In(messageIds),
        userWorkspaceId,
      },
    });

    return new Set(bookmarks.map((bookmark) => bookmark.messageId));
  }

  private normalizeAttachments(
    attachments?: TeamMessageAttachmentInput[] | null,
  ): TeamMessageAttachmentInput[] {
    if (!isDefined(attachments) || attachments.length === 0) {
      return [];
    }

    if (attachments.length > TEAM_MESSAGE_ATTACHMENT_LIMIT) {
      throw new BadRequestException('Too many attachments.');
    }

    return attachments.map((attachment) => {
      const name = attachment.name.trim();
      const url = attachment.url.trim();
      const mimeType = attachment.mimeType?.trim() ?? null;

      if (
        !isNonEmptyString(name) ||
        name.length > TEAM_MESSAGE_ATTACHMENT_NAME_MAX_LENGTH
      ) {
        throw new BadRequestException('Attachment name is invalid.');
      }

      if (
        !isNonEmptyString(url) ||
        url.length > TEAM_MESSAGE_ATTACHMENT_URL_MAX_LENGTH ||
        !this.isSafeAttachmentUrl(url)
      ) {
        throw new BadRequestException('Attachment URL is invalid.');
      }

      if (
        isDefined(attachment.size) &&
        (!Number.isSafeInteger(attachment.size) || attachment.size < 0)
      ) {
        throw new BadRequestException('Attachment size is invalid.');
      }

      return {
        mimeType: isNonEmptyString(mimeType) ? mimeType : null,
        name,
        size: attachment.size ?? null,
        url,
      };
    });
  }

  private isSafeAttachmentUrl(url: string) {
    try {
      const parsedUrl = new URL(url);

      return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private assertMessageContent({
    attachments,
    body,
  }: {
    attachments: TeamMessageAttachmentInput[];
    body: string;
  }) {
    if (!isNonEmptyString(body) && attachments.length === 0) {
      throw new BadRequestException('Message body or attachment is required.');
    }

    if (body.length > TEAM_MESSAGE_BODY_MAX_LENGTH) {
      throw new BadRequestException('Message body is too long.');
    }
  }

  private async saveMessageAttachments({
    attachments,
    messageId,
    workspaceId,
  }: {
    attachments: TeamMessageAttachmentInput[];
    messageId: string;
    workspaceId: string;
  }): Promise<TeamMessageAttachmentDTO[]> {
    if (attachments.length === 0) {
      return [];
    }

    const savedAttachments = await this.messageAttachmentRepository.saveMany(
      workspaceId,
      attachments.map((attachment) => ({
        messageId,
        mimeType: attachment.mimeType,
        name: attachment.name,
        size: attachment.size,
        url: attachment.url,
      })),
    );

    return savedAttachments.map((attachment) =>
      this.toMessageAttachmentDTO(attachment),
    );
  }

  private async getAttachmentsByMessageId({
    messageIds,
    workspaceId,
  }: {
    messageIds: string[];
    workspaceId: string;
  }) {
    if (messageIds.length === 0) {
      return new Map<string, TeamMessageAttachmentDTO[]>();
    }

    const attachments = await this.messageAttachmentRepository.find(
      workspaceId,
      {
        order: { createdAt: 'ASC' },
        where: { messageId: In(messageIds) },
      },
    );
    const attachmentsByMessageId = new Map<
      string,
      TeamMessageAttachmentDTO[]
    >();

    for (const attachment of attachments) {
      attachmentsByMessageId.set(attachment.messageId, [
        ...(attachmentsByMessageId.get(attachment.messageId) ?? []),
        this.toMessageAttachmentDTO(attachment),
      ]);
    }

    return attachmentsByMessageId;
  }

  private toMessageAttachmentDTO(
    attachment: TeamMessageAttachmentEntity,
  ): TeamMessageAttachmentDTO {
    return {
      createdAt: attachment.createdAt,
      id: attachment.id,
      mimeType: attachment.mimeType,
      name: attachment.name,
      size: attachment.size,
      url: attachment.url,
    };
  }

  private normalizeNotificationQuietHoursTime(
    time: string | null | undefined,
  ): string | null {
    const normalizedTime = time?.trim() ?? '';

    if (!isNonEmptyString(normalizedTime)) {
      return null;
    }

    if (!TEAM_NOTIFICATION_QUIET_HOURS_TIME_REGEX.test(normalizedTime)) {
      throw new BadRequestException(
        'Quiet hours time must use the HH:mm format.',
      );
    }

    return normalizedTime;
  }

  private async publishMessageEvent({
    event,
    workspaceId,
  }: {
    event: TeamMessageEventDTO;
    workspaceId: string;
  }): Promise<void> {
    await this.subscriptionService.publish({
      channel: SubscriptionChannel.TEAM_COMMS_MESSAGES_CHANNEL,
      payload: { onTeamMessageEvent: event },
      workspaceId,
    });
  }

  private toMessageEventDTO({
    isNewMessage = false,
    message,
    type,
  }: {
    isNewMessage?: boolean;
    message: TeamMessageEntity;
    type: TeamMessageEventType;
  }): TeamMessageEventDTO {
    return {
      authorName: this.getAuthorName(message.authorUserWorkspace),
      authorUserWorkspaceId: message.authorUserWorkspaceId,
      body: message.body,
      channelId: message.channelId,
      directMessageThreadId: message.directMessageThreadId,
      isNewMessage,
      messageId: message.id,
      parentMessageId: message.parentMessageId,
      type,
    };
  }

  private getMessagePreviewBody(body: string): string {
    const trimmedBody = body.trim();

    return isNonEmptyString(trimmedBody) ? trimmedBody : 'Attachment message';
  }

  private toMessageDTO({
    attachments,
    canModerateConversation = false,
    conversationName = null,
    isSaved = false,
    message,
    reactions,
    replyCount,
    userWorkspaceId,
  }: {
    attachments: TeamMessageAttachmentDTO[];
    canModerateConversation?: boolean;
    conversationName?: string | null;
    isSaved?: boolean;
    message: TeamMessageEntity;
    reactions: TeamMessageReactionDTO[];
    replyCount: number;
    userWorkspaceId: string;
  }): TeamMessageDTO {
    const isAuthor = message.authorUserWorkspaceId === userWorkspaceId;

    return {
      attachments,
      authorName: this.getAuthorName(message.authorUserWorkspace),
      authorUserWorkspaceId: message.authorUserWorkspaceId,
      body: message.body,
      canDelete: isAuthor || canModerateConversation,
      canEdit: isAuthor,
      channelId: message.channelId,
      conversationName,
      createdAt: message.createdAt,
      directMessageThreadId: message.directMessageThreadId,
      id: message.id,
      isPinned: isDefined(message.pinnedAt),
      isSaved,
      parentMessageId: message.parentMessageId,
      pinnedAt: message.pinnedAt,
      pinnedByUserWorkspaceId: message.pinnedByUserWorkspaceId,
      reactions,
      replyCount,
      updatedAt: message.updatedAt,
    };
  }

  private getAuthorName(userWorkspace: UserWorkspaceEntity): string {
    const user = userWorkspace.user;
    const fullName = [user.firstName, user.lastName]
      .filter((name) => name.length > 0)
      .join(' ');

    return fullName.length > 0 ? fullName : user.email;
  }
}
