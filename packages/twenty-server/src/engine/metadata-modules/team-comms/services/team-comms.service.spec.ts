import { ILike, In, IsNull, LessThan, MoreThan, Not } from 'typeorm';

import { TeamInboxItemType } from 'src/engine/metadata-modules/team-comms/dtos/team-inbox-item.dto';
import { TeamMessageEventType } from 'src/engine/metadata-modules/team-comms/dtos/team-message-event.dto';
import { TeamChannelVisibility } from 'src/engine/metadata-modules/team-comms/entities/team-channel.entity';
import {
  TeamChannelMemberRole,
  TeamChannelNotificationLevel,
} from 'src/engine/metadata-modules/team-comms/entities/team-channel-member.entity';
import { TeamNotificationPreference } from 'src/engine/metadata-modules/team-comms/entities/team-presence.entity';
import { TeamCommsService } from 'src/engine/metadata-modules/team-comms/services/team-comms.service';
import { SubscriptionChannel } from 'src/engine/subscriptions/enums/subscription-channel.enum';

const createTeamCommsService = ({
  channelRepository = {},
  channelMemberRepository = {},
  directMessageParticipantRepository = {},
  directMessageThreadRepository = {},
  messageAttachmentRepository = {},
  messageBookmarkRepository = {},
  messageRepository = {},
  messageMentionRepository = {},
  messageReactionRepository = {},
  messageReminderRepository = {},
  messageThreadReadRepository = {
    delete: jest.fn(),
    find: jest.fn().mockResolvedValue([]),
  },
  presenceRepository = { findOne: jest.fn().mockResolvedValue(null) },
  subscriptionService = {},
  userWorkspaceRepository = {},
  fileStorageService = {},
  applicationService = {},
  fileUrlService = {},
}: {
  channelRepository?: object;
  channelMemberRepository?: object;
  directMessageParticipantRepository?: object;
  directMessageThreadRepository?: object;
  messageAttachmentRepository?: object;
  messageBookmarkRepository?: object;
  messageRepository?: object;
  messageMentionRepository?: object;
  messageReactionRepository?: object;
  messageReminderRepository?: object;
  messageThreadReadRepository?: object;
  presenceRepository?: object;
  subscriptionService?: object;
  userWorkspaceRepository?: object;
  fileStorageService?: object;
  applicationService?: object;
  fileUrlService?: object;
}) =>
  new TeamCommsService(
    channelRepository as never,
    channelMemberRepository as never,
    directMessageParticipantRepository as never,
    directMessageThreadRepository as never,
    messageAttachmentRepository as never,
    messageBookmarkRepository as never,
    messageRepository as never,
    messageMentionRepository as never,
    messageReactionRepository as never,
    messageReminderRepository as never,
    messageThreadReadRepository as never,
    presenceRepository as never,
    userWorkspaceRepository as never,
    subscriptionService as never,
    fileStorageService as never,
    applicationService as never,
    fileUrlService as never,
  );

describe('TeamCommsService', () => {
  describe('getChannels', () => {
    it('does not count unread messages for public channels the user has not joined', async () => {
      const channelCreatedAt = new Date('2026-06-01T12:00:00.000Z');
      const memberChannel = {
        createdAt: channelCreatedAt,
        deletedAt: null,
        description: null,
        id: 'member-channel-id',
        name: 'general',
        slug: 'general',
        updatedAt: channelCreatedAt,
        visibility: TeamChannelVisibility.PUBLIC,
      };
      const browseOnlyChannel = {
        ...memberChannel,
        id: 'browse-only-channel-id',
        name: 'announcements',
        slug: 'announcements',
      };
      const channelRepository = {
        count: jest.fn().mockResolvedValue(1),
        find: jest.fn().mockResolvedValue([memberChannel, browseOnlyChannel]),
      };
      const channelMemberRepository = {
        find: jest.fn().mockResolvedValue([
          {
            channelId: 'member-channel-id',
            lastReadAt: new Date('2026-06-01T11:00:00.000Z'),
            notificationLevel: TeamChannelNotificationLevel.ALL,
            userWorkspaceId: 'current-user-workspace-id',
          },
        ]),
      };
      const messageRepository = {
        count: jest.fn().mockResolvedValue(3),
      };
      const service = createTeamCommsService({
        channelMemberRepository,
        channelRepository,
        messageRepository,
      });

      await expect(
        service.getChannels({
          userWorkspaceId: 'current-user-workspace-id',
          workspaceId: 'workspace-id',
        }),
      ).resolves.toEqual([
        expect.objectContaining({
          id: 'member-channel-id',
          isMember: true,
          notificationLevel: TeamChannelNotificationLevel.ALL,
          unreadCount: 3,
        }),
        expect.objectContaining({
          id: 'browse-only-channel-id',
          isMember: false,
          notificationLevel: null,
          unreadCount: 0,
        }),
      ]);

      expect(messageRepository.count).toHaveBeenCalledTimes(1);
      expect(messageRepository.count).toHaveBeenCalledWith('workspace-id', {
        where: {
          authorUserWorkspaceId: Not('current-user-workspace-id'),
          channelId: 'member-channel-id',
          createdAt: MoreThan(new Date('2026-06-01T11:00:00.000Z')),
          deletedAt: IsNull(),
          parentMessageId: IsNull(),
        },
      });
    });

    it('joins the current user to existing default channels', async () => {
      const channelCreatedAt = new Date('2026-06-01T12:00:00.000Z');
      const defaultChannel = {
        createdAt: channelCreatedAt,
        deletedAt: null,
        description: null,
        id: 'general-channel-id',
        name: 'general',
        slug: 'general',
        updatedAt: channelCreatedAt,
        visibility: TeamChannelVisibility.PUBLIC,
      };
      const membershipCreatedAt = new Date('2026-06-01T12:05:00.000Z');
      const savedMembership = {
        channelId: 'general-channel-id',
        createdAt: membershipCreatedAt,
        lastReadAt: null,
        notificationLevel: TeamChannelNotificationLevel.ALL,
        role: TeamChannelMemberRole.MEMBER,
        userWorkspaceId: 'current-user-workspace-id',
      };
      const channelRepository = {
        count: jest.fn().mockResolvedValue(1),
        find: jest.fn().mockResolvedValue([defaultChannel]),
      };
      const channelMemberRepository = {
        find: jest
          .fn()
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([savedMembership]),
        findOne: jest.fn().mockResolvedValue(null),
        save: jest.fn().mockResolvedValue(savedMembership),
      };
      const messageRepository = {
        count: jest.fn().mockResolvedValue(0),
      };
      const service = createTeamCommsService({
        channelMemberRepository,
        channelRepository,
        messageRepository,
      });

      await expect(
        service.getChannels({
          userWorkspaceId: 'current-user-workspace-id',
          workspaceId: 'workspace-id',
        }),
      ).resolves.toEqual([
        expect.objectContaining({
          id: 'general-channel-id',
          isMember: true,
          unreadCount: 0,
        }),
      ]);
      expect(channelMemberRepository.save).toHaveBeenCalledWith(
        'workspace-id',
        {
          channelId: 'general-channel-id',
          role: TeamChannelMemberRole.MEMBER,
          userWorkspaceId: 'current-user-workspace-id',
        },
      );
    });

    it('uses membership creation time as the unread baseline before a channel is read', async () => {
      const channelCreatedAt = new Date('2026-06-01T10:00:00.000Z');
      const membershipCreatedAt = new Date('2026-06-01T12:00:00.000Z');
      const channel = {
        createdAt: channelCreatedAt,
        deletedAt: null,
        description: null,
        id: 'channel-id',
        name: 'general',
        slug: 'general',
        updatedAt: channelCreatedAt,
        visibility: TeamChannelVisibility.PUBLIC,
      };
      const channelRepository = {
        count: jest.fn().mockResolvedValue(1),
        find: jest.fn().mockResolvedValue([channel]),
      };
      const channelMemberRepository = {
        find: jest.fn().mockResolvedValue([
          {
            channelId: 'channel-id',
            createdAt: membershipCreatedAt,
            lastReadAt: null,
            notificationLevel: TeamChannelNotificationLevel.ALL,
            userWorkspaceId: 'current-user-workspace-id',
          },
        ]),
      };
      const messageRepository = {
        count: jest.fn().mockResolvedValue(2),
      };
      const service = createTeamCommsService({
        channelMemberRepository,
        channelRepository,
        messageRepository,
      });

      await expect(
        service.getChannels({
          userWorkspaceId: 'current-user-workspace-id',
          workspaceId: 'workspace-id',
        }),
      ).resolves.toEqual([
        expect.objectContaining({
          id: 'channel-id',
          unreadCount: 2,
        }),
      ]);
      expect(messageRepository.count).toHaveBeenCalledWith('workspace-id', {
        where: {
          authorUserWorkspaceId: Not('current-user-workspace-id'),
          channelId: 'channel-id',
          createdAt: MoreThan(membershipCreatedAt),
          deletedAt: IsNull(),
          parentMessageId: IsNull(),
        },
      });
    });
  });

  describe('searchMembers', () => {
    it('does not search teammates for short queries', async () => {
      const userWorkspaceRepository = { find: jest.fn() };
      const service = createTeamCommsService({ userWorkspaceRepository });

      await expect(
        service.searchMembers({
          query: 'a',
          userWorkspaceId: 'current-user-workspace-id',
          workspaceId: 'workspace-id',
        }),
      ).resolves.toEqual([]);

      expect(userWorkspaceRepository.find).not.toHaveBeenCalled();
    });

    it('searches workspace teammates by name and email without returning the current user', async () => {
      const userWorkspaceRepository = {
        find: jest.fn().mockResolvedValue([
          {
            id: 'ada-user-workspace-id',
            user: {
              email: 'ada@example.com',
              firstName: 'Ada',
              lastName: 'Lovelace',
            },
          },
        ]),
      };
      const service = createTeamCommsService({ userWorkspaceRepository });

      await expect(
        service.searchMembers({
          query: 'ada',
          userWorkspaceId: 'current-user-workspace-id',
          workspaceId: 'workspace-id',
        }),
      ).resolves.toEqual([
        {
          email: 'ada@example.com',
          name: 'Ada Lovelace',
          userWorkspaceId: 'ada-user-workspace-id',
        },
      ]);

      expect(userWorkspaceRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { createdAt: 'ASC' },
          relations: { user: true },
          take: 20,
          where: expect.arrayContaining([
            {
              deletedAt: IsNull(),
              id: Not('current-user-workspace-id'),
              user: { firstName: ILike('%ada%') },
              workspaceId: 'workspace-id',
            },
            {
              deletedAt: IsNull(),
              id: Not('current-user-workspace-id'),
              user: { lastName: ILike('%ada%') },
              workspaceId: 'workspace-id',
            },
            {
              deletedAt: IsNull(),
              id: Not('current-user-workspace-id'),
              user: { email: ILike('%ada%') },
              workspaceId: 'workspace-id',
            },
          ]),
        }),
      );
    });

    it('searches teammates by full name when inviting or starting direct messages', async () => {
      const userWorkspaceRepository = {
        find: jest.fn().mockResolvedValue([
          {
            id: 'ada-user-workspace-id',
            user: {
              email: 'ada@example.com',
              firstName: 'Ada',
              lastName: 'Lovelace',
            },
          },
        ]),
      };
      const service = createTeamCommsService({ userWorkspaceRepository });

      await expect(
        service.searchMembers({
          query: 'Ada Lovelace',
          userWorkspaceId: 'current-user-workspace-id',
          workspaceId: 'workspace-id',
        }),
      ).resolves.toEqual([
        {
          email: 'ada@example.com',
          name: 'Ada Lovelace',
          userWorkspaceId: 'ada-user-workspace-id',
        },
      ]);

      expect(userWorkspaceRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.arrayContaining([
            {
              deletedAt: IsNull(),
              id: Not('current-user-workspace-id'),
              user: {
                firstName: ILike('%Ada%'),
                lastName: ILike('%Lovelace%'),
              },
              workspaceId: 'workspace-id',
            },
          ]),
        }),
      );
    });
  });

  describe('sendMessage', () => {
    it('rejects whitespace-only channel messages without attachments', async () => {
      const service = createTeamCommsService({});

      await expect(
        service.sendMessage({
          attachments: [],
          body: '   ',
          channelId: 'channel-id',
          userWorkspaceId: 'current-user-workspace-id',
          workspaceId: 'workspace-id',
        }),
      ).rejects.toThrow('Message body or attachment is required.');
    });

    it('rejects channel message attachments with invalid sizes', async () => {
      const service = createTeamCommsService({});

      await expect(
        service.sendMessage({
          attachments: [
            {
              mimeType: 'text/plain',
              name: 'notes.txt',
              size: -1,
              url: 'https://example.com/notes.txt',
            },
          ],
          body: '',
          channelId: 'channel-id',
          userWorkspaceId: 'current-user-workspace-id',
          workspaceId: 'workspace-id',
        }),
      ).rejects.toThrow('Attachment size is invalid.');
    });

    it('rejects channel message attachments with unsafe URLs', async () => {
      const service = createTeamCommsService({});

      await expect(
        service.sendMessage({
          attachments: [
            {
              mimeType: 'text/plain',
              name: 'notes.txt',
              size: 10,
              url: 'javascript:alert(1)',
            },
          ],
          body: '',
          channelId: 'channel-id',
          userWorkspaceId: 'current-user-workspace-id',
          workspaceId: 'workspace-id',
        }),
      ).rejects.toThrow('Attachment URL is invalid.');
    });

    it('rejects channel messages that exceed the body limit', async () => {
      const service = createTeamCommsService({});

      await expect(
        service.sendMessage({
          attachments: [],
          body: 'a'.repeat(40_001),
          channelId: 'channel-id',
          userWorkspaceId: 'current-user-workspace-id',
          workspaceId: 'workspace-id',
        }),
      ).rejects.toThrow('Message body is too long.');
    });

    it('publishes channel sends as new message events', async () => {
      const messageCreatedAt = new Date('2026-06-01T12:00:00.000Z');
      const savedMessage = {
        authorUserWorkspaceId: 'current-user-workspace-id',
        body: 'New message',
        channelId: 'channel-id',
        directMessageThreadId: null,
        id: 'message-id',
        parentMessageId: null,
      };
      const messageWithAuthor = {
        ...savedMessage,
        authorUserWorkspace: {
          user: {
            email: 'author@example.com',
            firstName: 'Author',
            lastName: 'User',
          },
        },
        createdAt: messageCreatedAt,
        deletedAt: null,
        pinnedAt: null,
        pinnedByUserWorkspaceId: null,
        updatedAt: messageCreatedAt,
      };
      const channelRepository = {
        findOne: jest.fn().mockResolvedValue({
          id: 'channel-id',
          name: 'customer-success',
          visibility: TeamChannelVisibility.PUBLIC,
        }),
      };
      const channelMemberRepository = {
        findOne: jest.fn().mockResolvedValue({
          channelId: 'channel-id',
          userWorkspaceId: 'current-user-workspace-id',
        }),
      };
      const messageRepository = {
        findOne: jest.fn().mockResolvedValue(null),
        findOneOrFail: jest.fn().mockResolvedValue(messageWithAuthor),
        save: jest.fn().mockResolvedValue(savedMessage),
      };
      const subscriptionService = {
        publish: jest.fn(),
      };
      const userWorkspaceRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const service = createTeamCommsService({
        channelMemberRepository,
        channelRepository,
        messageRepository,
        subscriptionService,
        userWorkspaceRepository,
      });

      await expect(
        service.sendMessage({
          attachments: [],
          body: ' New message ',
          channelId: 'channel-id',
          userWorkspaceId: 'current-user-workspace-id',
          workspaceId: 'workspace-id',
        }),
      ).resolves.toEqual(
        expect.objectContaining({
          conversationName: 'customer-success',
        }),
      );

      expect(subscriptionService.publish).toHaveBeenCalledWith({
        channel: SubscriptionChannel.TEAM_COMMS_MESSAGES_CHANNEL,
        payload: {
          onTeamMessageEvent: expect.objectContaining({
            body: 'New message',
            channelId: 'channel-id',
            isNewMessage: true,
            messageId: 'message-id',
            type: TeamMessageEventType.UPSERTED,
          }),
        },
        workspaceId: 'workspace-id',
      });
    });
  });

  describe('sendDirectMessage', () => {
    it('rejects whitespace-only direct messages without attachments', async () => {
      const service = createTeamCommsService({});

      await expect(
        service.sendDirectMessage({
          attachments: [],
          body: '   ',
          directMessageThreadId: 'direct-message-thread-id',
          userWorkspaceId: 'current-user-workspace-id',
          workspaceId: 'workspace-id',
        }),
      ).rejects.toThrow('Message body or attachment is required.');
    });

    it('publishes direct-message sends as new message events', async () => {
      const messageCreatedAt = new Date('2026-06-01T12:00:00.000Z');
      const savedMessage = {
        authorUserWorkspaceId: 'current-user-workspace-id',
        body: 'Direct hello',
        channelId: null,
        directMessageThreadId: 'direct-message-thread-id',
        id: 'message-id',
        parentMessageId: null,
      };
      const messageWithAuthor = {
        ...savedMessage,
        authorUserWorkspace: {
          user: {
            email: 'author@example.com',
            firstName: 'Author',
            lastName: 'User',
          },
        },
        createdAt: messageCreatedAt,
        deletedAt: null,
        pinnedAt: null,
        pinnedByUserWorkspaceId: null,
        updatedAt: messageCreatedAt,
      };
      const directMessageParticipantRepository = {
        find: jest.fn().mockResolvedValue([
          {
            directMessageThreadId: 'direct-message-thread-id',
            userWorkspace: {
              user: {
                email: 'recipient@example.com',
                firstName: 'Recipient',
                lastName: 'User',
              },
            },
          },
        ]),
        findOne: jest.fn().mockResolvedValue({
          directMessageThreadId: 'direct-message-thread-id',
          userWorkspaceId: 'current-user-workspace-id',
        }),
        findOneOrFail: jest.fn().mockResolvedValue({
          directMessageThreadId: 'direct-message-thread-id',
          userWorkspaceId: 'current-user-workspace-id',
        }),
      };
      const messageRepository = {
        findOne: jest.fn().mockResolvedValue(null),
        findOneOrFail: jest.fn().mockResolvedValue(messageWithAuthor),
        save: jest.fn().mockResolvedValue(savedMessage),
      };
      const subscriptionService = {
        publish: jest.fn(),
      };
      const service = createTeamCommsService({
        directMessageParticipantRepository,
        messageRepository,
        subscriptionService,
      });

      await expect(
        service.sendDirectMessage({
          attachments: [],
          body: ' Direct hello ',
          directMessageThreadId: 'direct-message-thread-id',
          userWorkspaceId: 'current-user-workspace-id',
          workspaceId: 'workspace-id',
        }),
      ).resolves.toEqual(
        expect.objectContaining({
          conversationName: 'Recipient User',
        }),
      );

      expect(subscriptionService.publish).toHaveBeenCalledWith({
        channel: SubscriptionChannel.TEAM_COMMS_MESSAGES_CHANNEL,
        payload: {
          onTeamMessageEvent: expect.objectContaining({
            body: 'Direct hello',
            directMessageThreadId: 'direct-message-thread-id',
            isNewMessage: true,
            messageId: 'message-id',
            type: TeamMessageEventType.UPSERTED,
          }),
        },
        workspaceId: 'workspace-id',
      });
    });

    it('does not create broadcast mentions for direct messages', async () => {
      const messageCreatedAt = new Date('2026-06-01T12:00:00.000Z');
      const savedMessage = {
        authorUserWorkspaceId: 'current-user-workspace-id',
        body: '@channel this stays in the direct message',
        channelId: null,
        directMessageThreadId: 'direct-message-thread-id',
        id: 'message-id',
        parentMessageId: null,
      };
      const messageWithAuthor = {
        ...savedMessage,
        authorUserWorkspace: {
          user: {
            email: 'author@example.com',
            firstName: 'Author',
            lastName: 'User',
          },
        },
        createdAt: messageCreatedAt,
        deletedAt: null,
        pinnedAt: null,
        pinnedByUserWorkspaceId: null,
        updatedAt: messageCreatedAt,
      };
      const directMessageParticipantRepository = {
        find: jest.fn().mockResolvedValue([
          {
            userWorkspace: {
              id: 'current-user-workspace-id',
              user: {
                email: 'author@example.com',
                firstName: 'Author',
                lastName: 'User',
              },
            },
          },
          {
            userWorkspace: {
              id: 'recipient-user-workspace-id',
              user: {
                email: 'recipient@example.com',
                firstName: 'Recipient',
                lastName: 'User',
              },
            },
          },
        ]),
        findOneOrFail: jest.fn().mockResolvedValue({
          directMessageThreadId: 'direct-message-thread-id',
          userWorkspaceId: 'current-user-workspace-id',
        }),
      };
      const messageMentionRepository = {
        save: jest.fn(),
      };
      const messageRepository = {
        findOne: jest.fn().mockResolvedValue(null),
        findOneOrFail: jest.fn().mockResolvedValue(messageWithAuthor),
        save: jest.fn().mockResolvedValue(savedMessage),
      };
      const subscriptionService = {
        publish: jest.fn(),
      };
      const service = createTeamCommsService({
        directMessageParticipantRepository,
        messageMentionRepository,
        messageRepository,
        subscriptionService,
      });

      await service.sendDirectMessage({
        attachments: [],
        body: '@channel this stays in the direct message',
        directMessageThreadId: 'direct-message-thread-id',
        userWorkspaceId: 'current-user-workspace-id',
        workspaceId: 'workspace-id',
      });

      expect(messageMentionRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('uploadMessageAttachment', () => {
    it('rejects oversized uploads before writing them to storage', async () => {
      const channelRepository = {
        findOne: jest.fn().mockResolvedValue({
          id: 'channel-id',
          name: 'customer-success',
          visibility: TeamChannelVisibility.PUBLIC,
        }),
      };
      const channelMemberRepository = {
        findOne: jest.fn().mockResolvedValue({
          channelId: 'channel-id',
          userWorkspaceId: 'current-user-workspace-id',
        }),
      };
      const fileStorageService = {
        writeFile: jest.fn().mockResolvedValue({
          id: 'file-id',
          name: 'oversized.bin',
          size: 25 * 1024 * 1024 + 1,
        }),
      };
      const applicationService = {
        findWorkspaceTwentyStandardAndCustomApplicationOrThrow: jest
          .fn()
          .mockResolvedValue({
            workspaceCustomFlatApplication: {
              universalIdentifier: 'application-id',
            },
          }),
      };
      const fileUrlService = {
        signFileByIdUrl: jest
          .fn()
          .mockResolvedValue('https://example.com/file'),
      };
      const service = createTeamCommsService({
        applicationService,
        channelMemberRepository,
        channelRepository,
        fileStorageService,
        fileUrlService,
      });

      await expect(
        service.uploadMessageAttachment({
          channelId: 'channel-id',
          file: Buffer.alloc(25 * 1024 * 1024 + 1),
          filename: 'oversized.bin',
          userWorkspaceId: 'current-user-workspace-id',
          workspaceId: 'workspace-id',
        }),
      ).rejects.toThrow('Attachment is too large.');

      expect(fileStorageService.writeFile).not.toHaveBeenCalled();
      expect(
        applicationService.findWorkspaceTwentyStandardAndCustomApplicationOrThrow,
      ).not.toHaveBeenCalled();
      expect(fileUrlService.signFileByIdUrl).not.toHaveBeenCalled();
    });
  });

  describe('typing indicators', () => {
    it('keeps thread typing indicators out of the main conversation scope', async () => {
      const channelRepository = {
        find: jest.fn().mockResolvedValue([
          {
            id: 'channel-id',
            name: 'general',
            visibility: TeamChannelVisibility.PUBLIC,
          },
        ]),
        findOne: jest.fn().mockResolvedValue({
          id: 'channel-id',
          visibility: TeamChannelVisibility.PUBLIC,
        }),
      };
      const channelMemberRepository = {
        findOne: jest.fn().mockResolvedValue(null),
      };
      const messageRepository = {
        findOne: jest.fn().mockResolvedValue({
          channelId: 'channel-id',
          directMessageThreadId: null,
          id: 'parent-message-id',
          parentMessageId: null,
        }),
      };
      const userWorkspaceRepository = {
        findOneOrFail: jest.fn().mockResolvedValue({
          id: 'other-user-workspace-id',
          user: {
            email: 'other@example.com',
            firstName: 'Other',
            lastName: 'User',
          },
        }),
      };
      const service = createTeamCommsService({
        channelMemberRepository,
        channelRepository,
        messageRepository,
        userWorkspaceRepository,
      });

      await service.heartbeatTyping({
        channelId: 'channel-id',
        directMessageThreadId: null,
        parentMessageId: 'parent-message-id',
        userWorkspaceId: 'other-user-workspace-id',
        workspaceId: 'workspace-id',
      } as never);

      await expect(
        service.getTypingIndicators({
          channelId: 'channel-id',
          directMessageThreadId: null,
          parentMessageId: null,
          userWorkspaceId: 'current-user-workspace-id',
          workspaceId: 'workspace-id',
        } as never),
      ).resolves.toEqual([]);

      await expect(
        service.getTypingIndicators({
          channelId: 'channel-id',
          directMessageThreadId: null,
          parentMessageId: 'parent-message-id',
          userWorkspaceId: 'current-user-workspace-id',
          workspaceId: 'workspace-id',
        } as never),
      ).resolves.toEqual([
        expect.objectContaining({
          channelId: 'channel-id',
          directMessageThreadId: null,
          parentMessageId: 'parent-message-id',
          userWorkspaceId: 'other-user-workspace-id',
        }),
      ]);
    });

    it('rejects channel thread typing for a parent outside the selected channel', async () => {
      const channelRepository = {
        findOne: jest.fn().mockResolvedValue({
          id: 'channel-id',
          name: 'customer-success',
          visibility: TeamChannelVisibility.PUBLIC,
        }),
      };
      const channelMemberRepository = {
        findOne: jest.fn().mockResolvedValue(null),
      };
      const messageRepository = {
        findOne: jest.fn().mockResolvedValue(null),
      };
      const userWorkspaceRepository = {
        findOneOrFail: jest.fn(),
      };
      const service = createTeamCommsService({
        channelMemberRepository,
        channelRepository,
        messageRepository,
        userWorkspaceRepository,
      });

      await expect(
        service.heartbeatTyping({
          channelId: 'channel-id',
          directMessageThreadId: null,
          parentMessageId: 'other-thread-parent-id',
          userWorkspaceId: 'user-workspace-id',
          workspaceId: 'workspace-id',
        } as never),
      ).rejects.toThrow('Replies must belong to the selected channel thread.');

      expect(userWorkspaceRepository.findOneOrFail).not.toHaveBeenCalled();
      expect(messageRepository.findOne).toHaveBeenCalledWith('workspace-id', {
        where: {
          channelId: 'channel-id',
          deletedAt: IsNull(),
          directMessageThreadId: IsNull(),
          id: 'other-thread-parent-id',
          parentMessageId: IsNull(),
        },
      });
    });
  });

  describe('getDirectMessages', () => {
    it('does not create direct-message threads while listing discoverable teammates', async () => {
      const userWorkspaceRepository = {
        find: jest.fn().mockResolvedValue([
          {
            id: 'discoverable-user-workspace-id',
            user: {
              email: 'discoverable@example.com',
              firstName: 'Discoverable',
              lastName: 'User',
            },
          },
        ]),
      };
      const directMessageParticipantRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const directMessageThreadRepository = {
        findOne: jest.fn(),
        save: jest.fn(),
      };
      const service = createTeamCommsService({
        directMessageParticipantRepository,
        directMessageThreadRepository,
        userWorkspaceRepository,
      });

      await expect(
        service.getDirectMessages({
          userWorkspaceId: 'current-user-workspace-id',
          workspaceId: 'workspace-id',
        }),
      ).resolves.toEqual([]);

      expect(directMessageThreadRepository.findOne).not.toHaveBeenCalled();
      expect(directMessageThreadRepository.save).not.toHaveBeenCalled();
    });

    it('keeps already-started direct messages visible beyond the discovery user limit', async () => {
      const existingUserWorkspace = {
        id: 'existing-user-workspace-id',
        user: {
          email: 'existing@example.com',
          firstName: 'Existing',
          lastName: 'Thread',
        },
      };
      const existingThreadUpdatedAt = new Date('2026-06-01T11:00:00.000Z');
      const userWorkspaceRepository = {
        find: jest.fn(),
      };
      const directMessageThreadRepository = {
        findOne: jest.fn().mockResolvedValue({
          id: 'existing-thread-id',
          updatedAt: existingThreadUpdatedAt,
        }),
      };
      const directMessageParticipantRepository = {
        find: jest
          .fn()
          .mockResolvedValueOnce([
            {
              directMessageThreadId: 'existing-thread-id',
              userWorkspaceId: 'current-user-workspace-id',
            },
          ])
          .mockResolvedValueOnce([
            {
              directMessageThreadId: 'existing-thread-id',
              userWorkspace: existingUserWorkspace,
              userWorkspaceId: 'existing-user-workspace-id',
            },
          ]),
        findOne: jest.fn().mockResolvedValue({ id: 'participant-id' }),
        findOneOrFail: jest.fn().mockResolvedValue({
          lastReadAt: null,
          notificationLevel: TeamChannelNotificationLevel.ALL,
        }),
      };
      const messageRepository = {
        count: jest.fn().mockResolvedValue(0),
        findOne: jest.fn().mockResolvedValue(null),
      };
      const service = createTeamCommsService({
        directMessageParticipantRepository,
        directMessageThreadRepository,
        messageRepository,
        userWorkspaceRepository,
      });

      const directMessages = await service.getDirectMessages({
        userWorkspaceId: 'current-user-workspace-id',
        workspaceId: 'workspace-id',
      });

      expect(directMessages).toEqual([
        expect.objectContaining({
          id: 'existing-thread-id',
          notificationLevel: TeamChannelNotificationLevel.ALL,
          participantName: 'Existing Thread',
          participantUserWorkspaceId: 'existing-user-workspace-id',
        }),
      ]);
      expect(userWorkspaceRepository.find).not.toHaveBeenCalled();
      expect(messageRepository.findOne).toHaveBeenCalledWith('workspace-id', {
        order: { createdAt: 'DESC' },
        where: {
          deletedAt: IsNull(),
          directMessageThreadId: 'existing-thread-id',
          parentMessageId: IsNull(),
        },
      });
      expect(messageRepository.count).toHaveBeenCalledWith('workspace-id', {
        where: {
          authorUserWorkspaceId: Not('current-user-workspace-id'),
          deletedAt: IsNull(),
          directMessageThreadId: 'existing-thread-id',
          parentMessageId: IsNull(),
        },
      });
    });

    it('skips direct-message rows whose other participant user is unavailable', async () => {
      const directMessageParticipantRepository = {
        find: jest
          .fn()
          .mockResolvedValueOnce([
            {
              directMessageThreadId: 'stale-thread-id',
              userWorkspaceId: 'current-user-workspace-id',
            },
          ])
          .mockResolvedValueOnce([
            {
              directMessageThreadId: 'stale-thread-id',
              userWorkspace: null,
              userWorkspaceId: 'deleted-user-workspace-id',
            },
          ]),
      };
      const service = createTeamCommsService({
        directMessageParticipantRepository,
      });

      await expect(
        service.getDirectMessages({
          userWorkspaceId: 'current-user-workspace-id',
          workspaceId: 'workspace-id',
        }),
      ).resolves.toEqual([]);
    });

    it('uses participant creation time as the unread baseline before a direct message is read', async () => {
      const participantCreatedAt = new Date('2026-06-01T12:00:00.000Z');
      const otherUserWorkspace = {
        id: 'other-user-workspace-id',
        user: {
          email: 'other@example.com',
          firstName: 'Other',
          lastName: 'User',
        },
      };
      const directMessageThreadRepository = {
        findOne: jest.fn().mockResolvedValue({
          id: 'direct-message-thread-id',
          updatedAt: participantCreatedAt,
        }),
      };
      const directMessageParticipantRepository = {
        find: jest
          .fn()
          .mockResolvedValueOnce([
            {
              directMessageThreadId: 'direct-message-thread-id',
              userWorkspaceId: 'current-user-workspace-id',
            },
          ])
          .mockResolvedValueOnce([
            {
              directMessageThreadId: 'direct-message-thread-id',
              userWorkspace: otherUserWorkspace,
              userWorkspaceId: 'other-user-workspace-id',
            },
          ]),
        findOne: jest.fn().mockResolvedValue({ id: 'participant-id' }),
        findOneOrFail: jest.fn().mockResolvedValue({
          createdAt: participantCreatedAt,
          lastReadAt: null,
          notificationLevel: TeamChannelNotificationLevel.ALL,
        }),
      };
      const messageRepository = {
        count: jest.fn().mockResolvedValue(1),
        findOne: jest.fn().mockResolvedValue(null),
      };
      const service = createTeamCommsService({
        directMessageParticipantRepository,
        directMessageThreadRepository,
        messageRepository,
      });

      await expect(
        service.getDirectMessages({
          userWorkspaceId: 'current-user-workspace-id',
          workspaceId: 'workspace-id',
        }),
      ).resolves.toEqual([
        expect.objectContaining({
          id: 'direct-message-thread-id',
          unreadCount: 1,
        }),
      ]);
      expect(messageRepository.count).toHaveBeenCalledWith('workspace-id', {
        where: {
          authorUserWorkspaceId: Not('current-user-workspace-id'),
          createdAt: MoreThan(participantCreatedAt),
          deletedAt: IsNull(),
          directMessageThreadId: 'direct-message-thread-id',
          parentMessageId: IsNull(),
        },
      });
    });

    it('uses a readable last-message preview for attachment-only direct messages', async () => {
      const lastMessageCreatedAt = new Date('2026-06-01T12:00:00.000Z');
      const otherUserWorkspace = {
        id: 'other-user-workspace-id',
        user: {
          email: 'other@example.com',
          firstName: 'Other',
          lastName: 'User',
        },
      };
      const directMessageThreadRepository = {
        findOne: jest.fn().mockResolvedValue({
          id: 'direct-message-thread-id',
          updatedAt: new Date('2026-06-01T11:00:00.000Z'),
        }),
      };
      const directMessageParticipantRepository = {
        find: jest
          .fn()
          .mockResolvedValueOnce([
            {
              directMessageThreadId: 'direct-message-thread-id',
              userWorkspaceId: 'current-user-workspace-id',
            },
          ])
          .mockResolvedValueOnce([
            {
              directMessageThreadId: 'direct-message-thread-id',
              userWorkspace: otherUserWorkspace,
              userWorkspaceId: 'other-user-workspace-id',
            },
          ]),
        findOne: jest.fn().mockResolvedValue({ id: 'participant-id' }),
        findOneOrFail: jest.fn().mockResolvedValue({
          lastReadAt: null,
          notificationLevel: TeamChannelNotificationLevel.ALL,
        }),
      };
      const messageRepository = {
        count: jest.fn().mockResolvedValue(0),
        findOne: jest.fn().mockResolvedValue({
          body: '   ',
          createdAt: lastMessageCreatedAt,
        }),
      };
      const service = createTeamCommsService({
        directMessageParticipantRepository,
        directMessageThreadRepository,
        messageRepository,
      });

      await expect(
        service.getDirectMessages({
          userWorkspaceId: 'current-user-workspace-id',
          workspaceId: 'workspace-id',
        }),
      ).resolves.toEqual([
        expect.objectContaining({
          id: 'direct-message-thread-id',
          lastMessageBody: 'Attachment message',
          updatedAt: lastMessageCreatedAt,
        }),
      ]);
    });
  });

  describe('getMessages', () => {
    it('loads the newest channel messages while returning them in chronological display order', async () => {
      const olderLatestMessage = {
        attachments: [],
        authorUserWorkspace: {
          user: {
            email: 'older@example.com',
            firstName: 'Older',
            lastName: 'Latest',
          },
        },
        authorUserWorkspaceId: 'older-author-user-workspace-id',
        body: 'Older latest message',
        channelId: 'channel-id',
        createdAt: new Date('2026-06-01T12:00:00.000Z'),
        deletedAt: null,
        directMessageThreadId: null,
        id: 'older-latest-message-id',
        parentMessageId: null,
        pinnedAt: null,
        pinnedByUserWorkspaceId: null,
        reactions: [],
        updatedAt: new Date('2026-06-01T12:00:00.000Z'),
      };
      const newestMessage = {
        ...olderLatestMessage,
        authorUserWorkspace: {
          user: {
            email: 'newest@example.com',
            firstName: 'Newest',
            lastName: 'Author',
          },
        },
        authorUserWorkspaceId: 'newest-author-user-workspace-id',
        body: 'Newest message',
        createdAt: new Date('2026-06-01T12:05:00.000Z'),
        id: 'newest-message-id',
        updatedAt: new Date('2026-06-01T12:05:00.000Z'),
      };
      const channelRepository = {
        findOne: jest.fn().mockResolvedValue({
          id: 'channel-id',
          name: 'customer-success',
          visibility: TeamChannelVisibility.PUBLIC,
        }),
      };
      const channelMemberRepository = {
        findOne: jest.fn().mockResolvedValue({
          channelId: 'channel-id',
          role: 'member',
          userWorkspaceId: 'current-user-workspace-id',
        }),
      };
      const messageAttachmentRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const messageBookmarkRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const messageReactionRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const messageRepository = {
        createQueryBuilder: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          addSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          getRawMany: jest.fn().mockResolvedValue([]),
        }),
        find: jest.fn().mockResolvedValue([newestMessage, olderLatestMessage]),
      };
      const service = createTeamCommsService({
        channelMemberRepository,
        channelRepository,
        messageAttachmentRepository,
        messageBookmarkRepository,
        messageReactionRepository,
        messageRepository,
      });

      const messages = await service.getMessages({
        channelId: 'channel-id',
        userWorkspaceId: 'current-user-workspace-id',
        workspaceId: 'workspace-id',
      });

      expect(messageRepository.find).toHaveBeenCalledWith('workspace-id', {
        order: { createdAt: 'DESC' },
        relations: { authorUserWorkspace: { user: true } },
        take: 100,
        where: {
          channelId: 'channel-id',
          deletedAt: IsNull(),
          parentMessageId: IsNull(),
        },
      });
      expect(messages.map((message) => message.id)).toEqual([
        'older-latest-message-id',
        'newest-message-id',
      ]);
      expect(messages).toEqual([
        expect.objectContaining({
          conversationName: 'customer-success',
          id: 'older-latest-message-id',
        }),
        expect.objectContaining({
          conversationName: 'customer-success',
          id: 'newest-message-id',
        }),
      ]);
    });

    it('loads channel messages before a cursor for history pagination', async () => {
      const before = '2026-06-01T12:00:00.000Z';
      const channelRepository = {
        findOne: jest.fn().mockResolvedValue({
          id: 'channel-id',
          name: 'customer-success',
          visibility: TeamChannelVisibility.PUBLIC,
        }),
      };
      const channelMemberRepository = {
        findOne: jest.fn().mockResolvedValue({
          channelId: 'channel-id',
          role: 'member',
          userWorkspaceId: 'current-user-workspace-id',
        }),
      };
      const messageAttachmentRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const messageBookmarkRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const messageReactionRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const messageRepository = {
        createQueryBuilder: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          addSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          getRawMany: jest.fn().mockResolvedValue([]),
        }),
        find: jest.fn().mockResolvedValue([]),
      };
      const service = createTeamCommsService({
        channelMemberRepository,
        channelRepository,
        messageAttachmentRepository,
        messageBookmarkRepository,
        messageReactionRepository,
        messageRepository,
      });

      await service.getMessages({
        before,
        channelId: 'channel-id',
        userWorkspaceId: 'current-user-workspace-id',
        workspaceId: 'workspace-id',
      });

      expect(messageRepository.find).toHaveBeenCalledWith('workspace-id', {
        order: { createdAt: 'DESC' },
        relations: { authorUserWorkspace: { user: true } },
        take: 100,
        where: {
          channelId: 'channel-id',
          createdAt: LessThan(new Date(before)),
          deletedAt: IsNull(),
          parentMessageId: IsNull(),
        },
      });
    });
  });

  describe('searchMessages', () => {
    it('scopes attachment filename matches to readable conversations before applying the limit', async () => {
      const channelRepository = {
        count: jest.fn().mockResolvedValue(1),
        find: jest.fn().mockResolvedValue([
          {
            createdAt: new Date('2026-06-01T12:00:00.000Z'),
            deletedAt: null,
            description: null,
            id: 'channel-id',
            name: 'general',
            slug: 'general',
            updatedAt: new Date('2026-06-01T12:00:00.000Z'),
            visibility: TeamChannelVisibility.PUBLIC,
          },
        ]),
      };
      const channelMemberRepository = {
        find: jest.fn().mockResolvedValue([
          {
            channelId: 'channel-id',
            userWorkspaceId: 'current-user-workspace-id',
          },
        ]),
      };
      const directMessageParticipantRepository = {
        find: jest.fn().mockResolvedValue([
          {
            directMessageThreadId: 'direct-message-thread-id',
            userWorkspaceId: 'current-user-workspace-id',
          },
        ]),
      };
      const messageRepository = {
        count: jest.fn().mockResolvedValue(0),
        find: jest.fn().mockResolvedValue([]),
      };
      const messageAttachmentRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const service = createTeamCommsService({
        channelMemberRepository,
        channelRepository,
        directMessageParticipantRepository,
        messageAttachmentRepository,
        messageRepository,
      });

      await service.searchMessages({
        query: 'roadmap',
        userWorkspaceId: 'current-user-workspace-id',
        workspaceId: 'workspace-id',
      });

      expect(messageAttachmentRepository.find).toHaveBeenCalledWith(
        'workspace-id',
        {
          order: { createdAt: 'DESC' },
          relations: { message: { authorUserWorkspace: { user: true } } },
          take: 25,
          where: [
            {
              name: ILike('%roadmap%'),
              message: {
                channelId: In(['channel-id']),
                deletedAt: IsNull(),
              },
            },
            {
              name: ILike('%roadmap%'),
              message: {
                deletedAt: IsNull(),
                directMessageThreadId: In(['direct-message-thread-id']),
              },
            },
          ],
        },
      );
    });
  });

  describe('getFiles', () => {
    it('skips orphaned attachment rows without crashing the files panel', async () => {
      const channelRepository = {
        count: jest.fn().mockResolvedValue(1),
        find: jest.fn().mockResolvedValue([
          {
            createdAt: new Date('2026-06-01T12:00:00.000Z'),
            deletedAt: null,
            description: null,
            id: 'channel-id',
            name: 'general',
            slug: 'general',
            updatedAt: new Date('2026-06-01T12:00:00.000Z'),
            visibility: TeamChannelVisibility.PUBLIC,
          },
        ]),
      };
      const channelMemberRepository = {
        find: jest.fn().mockResolvedValue([
          {
            channelId: 'channel-id',
            userWorkspaceId: 'current-user-workspace-id',
          },
        ]),
      };
      const directMessageParticipantRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const messageAttachmentRepository = {
        find: jest.fn().mockResolvedValue([
          {
            createdAt: new Date('2026-06-01T12:05:00.000Z'),
            id: 'orphan-attachment-id',
            message: null,
            messageId: 'deleted-message-id',
            mimeType: 'application/pdf',
            name: 'stale.pdf',
            size: 128,
            url: 'https://example.com/stale.pdf',
          },
        ]),
      };
      const messageRepository = {
        count: jest.fn().mockResolvedValue(0),
      };
      const service = createTeamCommsService({
        channelMemberRepository,
        channelRepository,
        directMessageParticipantRepository,
        messageAttachmentRepository,
        messageRepository,
      });

      await expect(
        service.getFiles({
          userWorkspaceId: 'current-user-workspace-id',
          workspaceId: 'workspace-id',
        }),
      ).resolves.toEqual([]);
    });
  });

  describe('getDirectMessageMessages', () => {
    it('loads the newest direct messages while returning them in chronological display order', async () => {
      const olderLatestMessage = {
        attachments: [],
        authorUserWorkspace: {
          user: {
            email: 'older@example.com',
            firstName: 'Older',
            lastName: 'Latest',
          },
        },
        authorUserWorkspaceId: 'older-author-user-workspace-id',
        body: 'Older latest direct message',
        channelId: null,
        createdAt: new Date('2026-06-01T12:00:00.000Z'),
        deletedAt: null,
        directMessageThreadId: 'direct-message-thread-id',
        id: 'older-latest-direct-message-id',
        parentMessageId: null,
        pinnedAt: null,
        pinnedByUserWorkspaceId: null,
        reactions: [],
        updatedAt: new Date('2026-06-01T12:00:00.000Z'),
      };
      const newestMessage = {
        ...olderLatestMessage,
        authorUserWorkspace: {
          user: {
            email: 'newest@example.com',
            firstName: 'Newest',
            lastName: 'Author',
          },
        },
        authorUserWorkspaceId: 'newest-author-user-workspace-id',
        body: 'Newest direct message',
        createdAt: new Date('2026-06-01T12:05:00.000Z'),
        id: 'newest-direct-message-id',
        updatedAt: new Date('2026-06-01T12:05:00.000Z'),
      };
      const directMessageParticipantRepository = {
        find: jest.fn().mockResolvedValue([
          {
            directMessageThreadId: 'direct-message-thread-id',
            userWorkspace: {
              user: {
                email: 'ada@example.com',
                firstName: 'Ada',
                lastName: 'Lovelace',
              },
            },
            userWorkspaceId: 'other-user-workspace-id',
          },
        ]),
        findOneOrFail: jest.fn().mockResolvedValue({
          directMessageThreadId: 'direct-message-thread-id',
          userWorkspaceId: 'current-user-workspace-id',
        }),
      };
      const messageAttachmentRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const messageBookmarkRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const messageReactionRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const messageRepository = {
        createQueryBuilder: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          addSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          getRawMany: jest.fn().mockResolvedValue([]),
        }),
        find: jest.fn().mockResolvedValue([newestMessage, olderLatestMessage]),
      };
      const service = createTeamCommsService({
        directMessageParticipantRepository,
        messageAttachmentRepository,
        messageBookmarkRepository,
        messageReactionRepository,
        messageRepository,
      });

      const messages = await service.getDirectMessageMessages({
        directMessageThreadId: 'direct-message-thread-id',
        userWorkspaceId: 'current-user-workspace-id',
        workspaceId: 'workspace-id',
      });

      expect(messageRepository.find).toHaveBeenCalledWith('workspace-id', {
        order: { createdAt: 'DESC' },
        relations: { authorUserWorkspace: { user: true } },
        take: 100,
        where: {
          deletedAt: IsNull(),
          directMessageThreadId: 'direct-message-thread-id',
          parentMessageId: IsNull(),
        },
      });
      expect(messages.map((message) => message.id)).toEqual([
        'older-latest-direct-message-id',
        'newest-direct-message-id',
      ]);
      expect(messages).toEqual([
        expect.objectContaining({
          conversationName: 'Ada Lovelace',
          id: 'older-latest-direct-message-id',
        }),
        expect.objectContaining({
          conversationName: 'Ada Lovelace',
          id: 'newest-direct-message-id',
        }),
      ]);
    });

    it('loads direct messages before a cursor for history pagination', async () => {
      const before = '2026-06-01T12:00:00.000Z';
      const directMessageParticipantRepository = {
        findOneOrFail: jest.fn().mockResolvedValue({
          directMessageThreadId: 'direct-message-thread-id',
          userWorkspaceId: 'current-user-workspace-id',
        }),
      };
      const messageAttachmentRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const messageBookmarkRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const messageReactionRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const messageRepository = {
        createQueryBuilder: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          addSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          getRawMany: jest.fn().mockResolvedValue([]),
        }),
        find: jest.fn().mockResolvedValue([]),
      };
      const service = createTeamCommsService({
        directMessageParticipantRepository,
        messageAttachmentRepository,
        messageBookmarkRepository,
        messageReactionRepository,
        messageRepository,
      });

      await service.getDirectMessageMessages({
        before,
        directMessageThreadId: 'direct-message-thread-id',
        userWorkspaceId: 'current-user-workspace-id',
        workspaceId: 'workspace-id',
      });

      expect(messageRepository.find).toHaveBeenCalledWith('workspace-id', {
        order: { createdAt: 'DESC' },
        relations: { authorUserWorkspace: { user: true } },
        take: 100,
        where: {
          createdAt: LessThan(new Date(before)),
          deletedAt: IsNull(),
          directMessageThreadId: 'direct-message-thread-id',
          parentMessageId: IsNull(),
        },
      });
    });
  });

  describe('updateDirectMessageNotificationLevel', () => {
    it('updates the current user direct-message participant notification level', async () => {
      const directMessageParticipantRepository = {
        findOneOrFail: jest.fn().mockResolvedValue({
          directMessageThreadId: 'thread-id',
          id: 'participant-id',
          notificationLevel: TeamChannelNotificationLevel.ALL,
          userWorkspaceId: 'current-user-workspace-id',
        }),
        save: jest.fn().mockResolvedValue({
          directMessageThreadId: 'thread-id',
          id: 'participant-id',
          notificationLevel: TeamChannelNotificationLevel.MUTED,
          userWorkspaceId: 'current-user-workspace-id',
        }),
      };
      const service = createTeamCommsService({
        directMessageParticipantRepository,
      });

      await expect(
        service.updateDirectMessageNotificationLevel({
          directMessageThreadId: 'thread-id',
          notificationLevel: TeamChannelNotificationLevel.MUTED,
          userWorkspaceId: 'current-user-workspace-id',
          workspaceId: 'workspace-id',
        }),
      ).resolves.toEqual({
        directMessageThreadId: 'thread-id',
        notificationLevel: TeamChannelNotificationLevel.MUTED,
        userWorkspaceId: 'current-user-workspace-id',
      });

      expect(
        directMessageParticipantRepository.findOneOrFail,
      ).toHaveBeenCalledWith('workspace-id', {
        where: {
          directMessageThreadId: 'thread-id',
          userWorkspaceId: 'current-user-workspace-id',
        },
      });
      expect(directMessageParticipantRepository.save).toHaveBeenCalledWith(
        'workspace-id',
        expect.objectContaining({
          id: 'participant-id',
          notificationLevel: TeamChannelNotificationLevel.MUTED,
        }),
      );
    });
  });

  describe('updateNotificationQuietHours', () => {
    it('stores normalized quiet hours for the current user presence', async () => {
      const presenceRepository = {
        findOne: jest.fn().mockResolvedValue({
          notificationPreference: TeamNotificationPreference.ALL,
          notificationQuietHoursEnd: '07:30',
          notificationQuietHoursStart: '22:00',
        }),
        upsert: jest.fn().mockResolvedValue(undefined),
      };
      const userWorkspaceRepository = {
        findOneOrFail: jest.fn().mockResolvedValue({
          id: 'current-user-workspace-id',
          user: {
            email: 'ada@example.com',
            firstName: 'Ada',
            lastName: 'Lovelace',
          },
        }),
      };
      const service = createTeamCommsService({
        presenceRepository,
        userWorkspaceRepository,
      });

      await expect(
        service.updateNotificationQuietHours({
          notificationQuietHoursEnd: ' 07:30 ',
          notificationQuietHoursStart: ' 22:00 ',
          userWorkspaceId: 'current-user-workspace-id',
          workspaceId: 'workspace-id',
        }),
      ).resolves.toEqual(
        expect.objectContaining({
          email: 'ada@example.com',
          name: 'Ada Lovelace',
          notificationQuietHoursEnd: '07:30',
          notificationQuietHoursStart: '22:00',
          userWorkspaceId: 'current-user-workspace-id',
        }),
      );
      expect(presenceRepository.upsert).toHaveBeenCalledWith(
        'workspace-id',
        expect.objectContaining({
          notificationQuietHoursEnd: '07:30',
          notificationQuietHoursStart: '22:00',
          userWorkspaceId: 'current-user-workspace-id',
        }),
        ['workspaceId', 'userWorkspaceId'],
      );
    });

    it('rejects quiet hours when only one boundary is set', async () => {
      const presenceRepository = {
        findOne: jest.fn(),
        upsert: jest.fn(),
      };
      const service = createTeamCommsService({ presenceRepository });

      await expect(
        service.updateNotificationQuietHours({
          notificationQuietHoursEnd: null,
          notificationQuietHoursStart: '22:00',
          userWorkspaceId: 'current-user-workspace-id',
          workspaceId: 'workspace-id',
        }),
      ).rejects.toThrow('Quiet hours require both a start and end time.');
      expect(presenceRepository.upsert).not.toHaveBeenCalled();
    });

    it('rejects malformed quiet hours', async () => {
      const presenceRepository = {
        findOne: jest.fn(),
        upsert: jest.fn(),
      };
      const service = createTeamCommsService({ presenceRepository });

      await expect(
        service.updateNotificationQuietHours({
          notificationQuietHoursEnd: '07:30',
          notificationQuietHoursStart: '25:99',
          userWorkspaceId: 'current-user-workspace-id',
          workspaceId: 'workspace-id',
        }),
      ).rejects.toThrow('Quiet hours time must use the HH:mm format.');
      expect(presenceRepository.upsert).not.toHaveBeenCalled();
    });
  });

  describe('getInboxItems', () => {
    it('returns no inbox notification items when the user globally mutes team notifications', async () => {
      const updatedAt = new Date('2026-06-01T12:00:00.000Z');
      const channelMemberRepository = {
        find: jest.fn().mockResolvedValue([
          {
            channelId: 'channel-id',
            notificationLevel: TeamChannelNotificationLevel.ALL,
          },
        ]),
      };
      const messageRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const presenceRepository = {
        findOne: jest.fn().mockResolvedValue({
          notificationPreference: TeamNotificationPreference.MUTED,
        }),
      };
      const service = createTeamCommsService({
        channelMemberRepository,
        messageRepository,
        presenceRepository,
      });

      jest.spyOn(service, 'getChannels').mockResolvedValue([
        {
          createdAt: updatedAt,
          description: null,
          id: 'channel-id',
          isMember: true,
          notificationLevel: TeamChannelNotificationLevel.ALL,
          name: 'general',
          slug: 'general',
          unreadCount: 2,
          updatedAt,
          visibility: TeamChannelVisibility.PUBLIC,
        },
      ]);
      jest.spyOn(service, 'getMentions').mockResolvedValue([
        {
          authorName: 'Ada Lovelace',
          body: '@current please review',
          channelId: 'channel-id',
          conversationName: 'general',
          conversationType: 'channel',
          createdAt: updatedAt,
          directMessageThreadId: null,
          id: 'mention-id',
          messageId: 'message-id',
          parentMessageId: null,
          readAt: null,
        },
      ]);
      jest.spyOn(service as any, 'getThreadInboxItems').mockResolvedValue([
        {
          channelId: 'channel-id',
          directMessageThreadId: null,
          id: 'thread:parent-message-id',
          mentionId: null,
          messageId: 'reply-message-id',
          parentMessageId: 'parent-message-id',
          subtitle: 'Thread follow-up',
          title: 'Thread in # general',
          type: TeamInboxItemType.THREAD,
          unreadCount: 1,
          updatedAt,
        },
      ]);
      jest.spyOn(service, 'getDirectMessages').mockResolvedValue([
        {
          id: 'direct-message-id',
          lastMessageBody: 'Visible unread',
          notificationLevel: TeamChannelNotificationLevel.ALL,
          participantEmail: 'ada@example.com',
          participantName: 'Ada',
          participantUserWorkspaceId: 'ada-user-workspace-id',
          unreadCount: 2,
          updatedAt,
        },
      ]);

      await expect(
        service.getInboxItems({
          userWorkspaceId: 'current-user-workspace-id',
          workspaceId: 'workspace-id',
        }),
      ).resolves.toEqual([]);
      expect(presenceRepository.findOne).toHaveBeenCalledWith('workspace-id', {
        where: {
          userWorkspaceId: 'current-user-workspace-id',
        },
      });
    });

    it('keeps mention and direct-message inbox items when the user globally allows mentions only', async () => {
      const updatedAt = new Date('2026-06-01T12:00:00.000Z');
      const channelMemberRepository = {
        find: jest.fn().mockResolvedValue([
          {
            channelId: 'channel-id',
            notificationLevel: TeamChannelNotificationLevel.ALL,
          },
        ]),
      };
      const messageRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const presenceRepository = {
        findOne: jest.fn().mockResolvedValue({
          notificationPreference: TeamNotificationPreference.MENTIONS,
        }),
      };
      const service = createTeamCommsService({
        channelMemberRepository,
        messageRepository,
        presenceRepository,
      });

      jest.spyOn(service, 'getChannels').mockResolvedValue([
        {
          createdAt: updatedAt,
          description: null,
          id: 'channel-id',
          isMember: true,
          notificationLevel: TeamChannelNotificationLevel.ALL,
          name: 'general',
          slug: 'general',
          unreadCount: 2,
          updatedAt,
          visibility: TeamChannelVisibility.PUBLIC,
        },
      ]);
      jest.spyOn(service, 'getMentions').mockResolvedValue([
        {
          authorName: 'Ada Lovelace',
          body: '@current please review',
          channelId: 'channel-id',
          conversationName: 'general',
          conversationType: 'channel',
          createdAt: updatedAt,
          directMessageThreadId: null,
          id: 'mention-id',
          messageId: 'message-id',
          parentMessageId: null,
          readAt: null,
        },
      ]);
      jest.spyOn(service as any, 'getThreadInboxItems').mockResolvedValue([
        {
          channelId: 'channel-id',
          directMessageThreadId: null,
          id: 'thread:parent-message-id',
          mentionId: null,
          messageId: 'reply-message-id',
          parentMessageId: 'parent-message-id',
          subtitle: 'Thread follow-up',
          title: 'Thread in # general',
          type: TeamInboxItemType.THREAD,
          unreadCount: 1,
          updatedAt,
        },
      ]);
      jest.spyOn(service, 'getDirectMessages').mockResolvedValue([
        {
          id: 'direct-message-id',
          lastMessageBody: 'Visible unread',
          notificationLevel: TeamChannelNotificationLevel.ALL,
          participantEmail: 'ada@example.com',
          participantName: 'Ada',
          participantUserWorkspaceId: 'ada-user-workspace-id',
          unreadCount: 2,
          updatedAt,
        },
      ]);

      await expect(
        service.getInboxItems({
          userWorkspaceId: 'current-user-workspace-id',
          workspaceId: 'workspace-id',
        }),
      ).resolves.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            directMessageThreadId: 'direct-message-id',
            id: 'direct:direct-message-id',
            type: TeamInboxItemType.DIRECT_MESSAGE,
            unreadCount: 2,
          }),
          expect.objectContaining({
            id: 'thread:parent-message-id',
            type: TeamInboxItemType.THREAD,
            unreadCount: 1,
          }),
          expect.objectContaining({
            id: 'mention:mention-id',
            type: TeamInboxItemType.MENTION,
            unreadCount: 1,
          }),
        ]),
      );
    });

    it('only includes channel unread items when the channel allows all notifications', async () => {
      const updatedAt = new Date('2026-06-01T12:00:00.000Z');
      const channelMemberRepository = {
        find: jest.fn().mockResolvedValue([
          {
            channelId: 'all-channel-id',
            notificationLevel: TeamChannelNotificationLevel.ALL,
          },
          {
            channelId: 'mentions-channel-id',
            notificationLevel: TeamChannelNotificationLevel.MENTIONS,
          },
        ]),
      };
      const messageRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const service = createTeamCommsService({
        channelMemberRepository,
        messageRepository,
      });

      jest.spyOn(service, 'getChannels').mockResolvedValue([
        {
          createdAt: updatedAt,
          description: null,
          id: 'all-channel-id',
          isMember: true,
          notificationLevel: TeamChannelNotificationLevel.ALL,
          name: 'general',
          slug: 'general',
          unreadCount: 2,
          updatedAt,
          visibility: TeamChannelVisibility.PUBLIC,
        },
        {
          createdAt: updatedAt,
          description: null,
          id: 'mentions-channel-id',
          isMember: true,
          notificationLevel: TeamChannelNotificationLevel.ALL,
          name: 'announcements',
          slug: 'announcements',
          unreadCount: 3,
          updatedAt,
          visibility: TeamChannelVisibility.PUBLIC,
        },
      ]);
      jest.spyOn(service, 'getMentions').mockResolvedValue([]);
      jest.spyOn(service, 'getDirectMessages').mockResolvedValue([]);

      await expect(
        service.getInboxItems({
          userWorkspaceId: 'current-user-workspace-id',
          workspaceId: 'workspace-id',
        }),
      ).resolves.toEqual([
        expect.objectContaining({
          channelId: 'all-channel-id',
          title: '# general',
          unreadCount: 2,
        }),
      ]);
    });

    it('only includes direct-message unread items when the direct message allows all notifications', async () => {
      const updatedAt = new Date('2026-06-01T12:00:00.000Z');
      const channelMemberRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const messageRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const service = createTeamCommsService({
        channelMemberRepository,
        messageRepository,
      });

      jest.spyOn(service, 'getChannels').mockResolvedValue([]);
      jest.spyOn(service, 'getMentions').mockResolvedValue([]);
      jest.spyOn(service, 'getDirectMessages').mockResolvedValue([
        {
          id: 'all-direct-message-id',
          lastMessageBody: 'Visible unread',
          notificationLevel: TeamChannelNotificationLevel.ALL,
          participantEmail: 'ada@example.com',
          participantName: 'Ada',
          participantUserWorkspaceId: 'ada-user-workspace-id',
          unreadCount: 2,
          updatedAt,
        },
        {
          id: 'mentions-direct-message-id',
          lastMessageBody: 'Mention-only unread',
          notificationLevel: TeamChannelNotificationLevel.MENTIONS,
          participantEmail: 'grace@example.com',
          participantName: 'Grace',
          participantUserWorkspaceId: 'grace-user-workspace-id',
          unreadCount: 3,
          updatedAt,
        },
      ]);

      await expect(
        service.getInboxItems({
          userWorkspaceId: 'current-user-workspace-id',
          workspaceId: 'workspace-id',
        }),
      ).resolves.toEqual([
        expect.objectContaining({
          directMessageThreadId: 'all-direct-message-id',
          title: 'Ada',
          unreadCount: 2,
        }),
      ]);
    });

    it('includes unread channel thread replies for threads the user participates in', async () => {
      const lastReadAt = new Date('2026-06-01T11:00:00.000Z');
      const replyCreatedAt = new Date('2026-06-01T12:00:00.000Z');
      const channelMemberRepository = {
        find: jest.fn().mockResolvedValue([
          {
            channelId: 'channel-id',
            lastReadAt,
            notificationLevel: TeamChannelNotificationLevel.ALL,
          },
        ]),
      };
      const messageRepository = {
        find: jest
          .fn()
          .mockResolvedValueOnce([
            {
              authorUserWorkspaceId: 'current-user-workspace-id',
              channelId: 'channel-id',
              directMessageThreadId: null,
              id: 'parent-message-id',
              parentMessageId: null,
            },
          ])
          .mockResolvedValueOnce([
            {
              authorUserWorkspaceId: 'other-user-workspace-id',
              body: 'I added a follow-up',
              channelId: 'channel-id',
              createdAt: replyCreatedAt,
              directMessageThreadId: null,
              id: 'reply-message-id',
              parentMessageId: 'parent-message-id',
            },
          ]),
      };
      const messageThreadReadRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const service = createTeamCommsService({
        channelMemberRepository,
        messageRepository,
        messageThreadReadRepository,
      });

      jest.spyOn(service, 'getChannels').mockResolvedValue([
        {
          createdAt: lastReadAt,
          description: null,
          id: 'channel-id',
          isMember: true,
          notificationLevel: TeamChannelNotificationLevel.ALL,
          name: 'general',
          slug: 'general',
          unreadCount: 0,
          updatedAt: lastReadAt,
          visibility: TeamChannelVisibility.PUBLIC,
        },
      ]);
      jest.spyOn(service, 'getMentions').mockResolvedValue([]);
      jest.spyOn(service, 'getDirectMessages').mockResolvedValue([]);

      await expect(
        service.getInboxItems({
          userWorkspaceId: 'current-user-workspace-id',
          workspaceId: 'workspace-id',
        }),
      ).resolves.toEqual([
        expect.objectContaining({
          channelId: 'channel-id',
          id: 'thread:parent-message-id',
          messageId: 'reply-message-id',
          parentMessageId: 'parent-message-id',
          subtitle: 'I added a follow-up',
          title: 'Thread in # general',
          type: TeamInboxItemType.THREAD,
          unreadCount: 1,
          updatedAt: replyCreatedAt,
        }),
      ]);
      expect(messageRepository.find).toHaveBeenNthCalledWith(
        1,
        'workspace-id',
        {
          where: {
            authorUserWorkspaceId: 'current-user-workspace-id',
            deletedAt: IsNull(),
          },
        },
      );
      expect(messageRepository.find).toHaveBeenNthCalledWith(
        2,
        'workspace-id',
        {
          order: { createdAt: 'DESC' },
          where: {
            authorUserWorkspaceId: Not('current-user-workspace-id'),
            deletedAt: IsNull(),
            parentMessageId: In(['parent-message-id']),
          },
        },
      );
    });

    it('uses an attachment fallback for blank thread inbox previews', async () => {
      const lastReadAt = new Date('2026-06-01T11:00:00.000Z');
      const replyCreatedAt = new Date('2026-06-01T12:00:00.000Z');
      const channelMemberRepository = {
        find: jest.fn().mockResolvedValue([
          {
            channelId: 'channel-id',
            lastReadAt,
            notificationLevel: TeamChannelNotificationLevel.ALL,
          },
        ]),
      };
      const messageRepository = {
        find: jest
          .fn()
          .mockResolvedValueOnce([
            {
              authorUserWorkspaceId: 'current-user-workspace-id',
              channelId: 'channel-id',
              directMessageThreadId: null,
              id: 'parent-message-id',
              parentMessageId: null,
            },
          ])
          .mockResolvedValueOnce([
            {
              authorUserWorkspaceId: 'other-user-workspace-id',
              body: '   ',
              channelId: 'channel-id',
              createdAt: replyCreatedAt,
              directMessageThreadId: null,
              id: 'reply-message-id',
              parentMessageId: 'parent-message-id',
            },
          ]),
      };
      const service = createTeamCommsService({
        channelMemberRepository,
        messageRepository,
      });

      jest.spyOn(service, 'getChannels').mockResolvedValue([
        {
          createdAt: lastReadAt,
          description: null,
          id: 'channel-id',
          isMember: true,
          notificationLevel: TeamChannelNotificationLevel.ALL,
          name: 'general',
          slug: 'general',
          unreadCount: 0,
          updatedAt: lastReadAt,
          visibility: TeamChannelVisibility.PUBLIC,
        },
      ]);
      jest.spyOn(service, 'getMentions').mockResolvedValue([]);
      jest.spyOn(service, 'getDirectMessages').mockResolvedValue([]);

      await expect(
        service.getInboxItems({
          userWorkspaceId: 'current-user-workspace-id',
          workspaceId: 'workspace-id',
        }),
      ).resolves.toEqual([
        expect.objectContaining({
          id: 'thread:parent-message-id',
          subtitle: 'Attachment message',
          type: TeamInboxItemType.THREAD,
        }),
      ]);
    });

    it('includes unread channel thread replies for threads the user has opened', async () => {
      const channelReadAt = new Date('2026-06-01T10:00:00.000Z');
      const threadReadAt = new Date('2026-06-01T11:00:00.000Z');
      const replyCreatedAt = new Date('2026-06-01T12:00:00.000Z');
      const channelMemberRepository = {
        find: jest.fn().mockResolvedValue([
          {
            channelId: 'channel-id',
            lastReadAt: channelReadAt,
            notificationLevel: TeamChannelNotificationLevel.ALL,
          },
        ]),
      };
      const messageRepository = {
        find: jest
          .fn()
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([
            {
              authorUserWorkspaceId: 'other-user-workspace-id',
              body: 'Opened thread follow-up',
              channelId: 'channel-id',
              createdAt: replyCreatedAt,
              directMessageThreadId: null,
              id: 'reply-message-id',
              parentMessageId: 'opened-parent-message-id',
            },
          ]),
      };
      const messageThreadReadRepository = {
        find: jest
          .fn()
          .mockResolvedValueOnce([
            {
              lastReadAt: threadReadAt,
              parentMessageId: 'opened-parent-message-id',
              userWorkspaceId: 'current-user-workspace-id',
            },
          ])
          .mockResolvedValueOnce([
            {
              lastReadAt: threadReadAt,
              parentMessageId: 'opened-parent-message-id',
              userWorkspaceId: 'current-user-workspace-id',
            },
          ]),
      };
      const service = createTeamCommsService({
        channelMemberRepository,
        messageRepository,
        messageThreadReadRepository,
      });

      jest.spyOn(service, 'getChannels').mockResolvedValue([
        {
          createdAt: channelReadAt,
          description: null,
          id: 'channel-id',
          isMember: true,
          notificationLevel: TeamChannelNotificationLevel.ALL,
          name: 'general',
          slug: 'general',
          unreadCount: 0,
          updatedAt: channelReadAt,
          visibility: TeamChannelVisibility.PUBLIC,
        },
      ]);
      jest.spyOn(service, 'getMentions').mockResolvedValue([]);
      jest.spyOn(service, 'getDirectMessages').mockResolvedValue([]);

      await expect(
        service.getInboxItems({
          userWorkspaceId: 'current-user-workspace-id',
          workspaceId: 'workspace-id',
        }),
      ).resolves.toEqual([
        expect.objectContaining({
          channelId: 'channel-id',
          id: 'thread:opened-parent-message-id',
          messageId: 'reply-message-id',
          parentMessageId: 'opened-parent-message-id',
          subtitle: 'Opened thread follow-up',
          title: 'Thread in # general',
          type: TeamInboxItemType.THREAD,
          unreadCount: 1,
          updatedAt: replyCreatedAt,
        }),
      ]);
      expect(messageRepository.find).toHaveBeenNthCalledWith(
        2,
        'workspace-id',
        {
          order: { createdAt: 'DESC' },
          where: {
            authorUserWorkspaceId: Not('current-user-workspace-id'),
            deletedAt: IsNull(),
            parentMessageId: In(['opened-parent-message-id']),
          },
        },
      );
    });

    it('excludes thread replies already covered by the user thread read state', async () => {
      const channelReadAt = new Date('2026-06-01T10:00:00.000Z');
      const threadReadAt = new Date('2026-06-01T12:00:00.000Z');
      const readReplyCreatedAt = new Date('2026-06-01T11:30:00.000Z');
      const unreadReplyCreatedAt = new Date('2026-06-01T12:30:00.000Z');
      const channelMemberRepository = {
        find: jest.fn().mockResolvedValue([
          {
            channelId: 'channel-id',
            lastReadAt: channelReadAt,
            notificationLevel: TeamChannelNotificationLevel.ALL,
          },
        ]),
      };
      const messageRepository = {
        find: jest
          .fn()
          .mockResolvedValueOnce([
            {
              authorUserWorkspaceId: 'current-user-workspace-id',
              channelId: 'channel-id',
              directMessageThreadId: null,
              id: 'parent-message-id',
              parentMessageId: null,
            },
          ])
          .mockResolvedValueOnce([
            {
              authorUserWorkspaceId: 'other-user-workspace-id',
              body: 'Already read',
              channelId: 'channel-id',
              createdAt: readReplyCreatedAt,
              directMessageThreadId: null,
              id: 'read-reply-message-id',
              parentMessageId: 'parent-message-id',
            },
            {
              authorUserWorkspaceId: 'other-user-workspace-id',
              body: 'New follow-up',
              channelId: 'channel-id',
              createdAt: unreadReplyCreatedAt,
              directMessageThreadId: null,
              id: 'unread-reply-message-id',
              parentMessageId: 'parent-message-id',
            },
          ]),
      };
      const messageThreadReadRepository = {
        find: jest.fn().mockResolvedValue([
          {
            lastReadAt: threadReadAt,
            parentMessageId: 'parent-message-id',
            userWorkspaceId: 'current-user-workspace-id',
          },
        ]),
      };
      const service = createTeamCommsService({
        channelMemberRepository,
        messageRepository,
        messageThreadReadRepository,
      });

      jest.spyOn(service, 'getChannels').mockResolvedValue([
        {
          createdAt: channelReadAt,
          description: null,
          id: 'channel-id',
          isMember: true,
          notificationLevel: TeamChannelNotificationLevel.ALL,
          name: 'general',
          slug: 'general',
          unreadCount: 0,
          updatedAt: channelReadAt,
          visibility: TeamChannelVisibility.PUBLIC,
        },
      ]);
      jest.spyOn(service, 'getMentions').mockResolvedValue([]);
      jest.spyOn(service, 'getDirectMessages').mockResolvedValue([]);

      await expect(
        service.getInboxItems({
          userWorkspaceId: 'current-user-workspace-id',
          workspaceId: 'workspace-id',
        }),
      ).resolves.toEqual([
        expect.objectContaining({
          messageId: 'unread-reply-message-id',
          parentMessageId: 'parent-message-id',
          subtitle: 'New follow-up',
          unreadCount: 1,
        }),
      ]);
      expect(messageThreadReadRepository.find).toHaveBeenCalledWith(
        'workspace-id',
        {
          where: {
            parentMessageId: In(['parent-message-id']),
            userWorkspaceId: 'current-user-workspace-id',
          },
        },
      );
    });

    it('uses membership creation time as the channel thread unread baseline before a channel is read', async () => {
      const membershipCreatedAt = new Date('2026-06-01T12:00:00.000Z');
      const oldReplyCreatedAt = new Date('2026-06-01T11:30:00.000Z');
      const newReplyCreatedAt = new Date('2026-06-01T12:30:00.000Z');
      const channelMemberRepository = {
        find: jest.fn().mockResolvedValue([
          {
            channelId: 'channel-id',
            createdAt: membershipCreatedAt,
            lastReadAt: null,
            notificationLevel: TeamChannelNotificationLevel.ALL,
          },
        ]),
      };
      const messageRepository = {
        find: jest
          .fn()
          .mockResolvedValueOnce([
            {
              authorUserWorkspaceId: 'current-user-workspace-id',
              channelId: 'channel-id',
              directMessageThreadId: null,
              id: 'parent-message-id',
              parentMessageId: null,
            },
          ])
          .mockResolvedValueOnce([
            {
              authorUserWorkspaceId: 'other-user-workspace-id',
              body: 'Old follow-up',
              channelId: 'channel-id',
              createdAt: oldReplyCreatedAt,
              directMessageThreadId: null,
              id: 'old-reply-message-id',
              parentMessageId: 'parent-message-id',
            },
            {
              authorUserWorkspaceId: 'other-user-workspace-id',
              body: 'New follow-up',
              channelId: 'channel-id',
              createdAt: newReplyCreatedAt,
              directMessageThreadId: null,
              id: 'new-reply-message-id',
              parentMessageId: 'parent-message-id',
            },
          ]),
      };
      const messageThreadReadRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const service = createTeamCommsService({
        channelMemberRepository,
        messageRepository,
        messageThreadReadRepository,
      });

      jest.spyOn(service, 'getChannels').mockResolvedValue([
        {
          createdAt: membershipCreatedAt,
          description: null,
          id: 'channel-id',
          isMember: true,
          notificationLevel: TeamChannelNotificationLevel.ALL,
          name: 'general',
          slug: 'general',
          unreadCount: 0,
          updatedAt: membershipCreatedAt,
          visibility: TeamChannelVisibility.PUBLIC,
        },
      ]);
      jest.spyOn(service, 'getMentions').mockResolvedValue([]);
      jest.spyOn(service, 'getDirectMessages').mockResolvedValue([]);

      await expect(
        service.getInboxItems({
          userWorkspaceId: 'current-user-workspace-id',
          workspaceId: 'workspace-id',
        }),
      ).resolves.toEqual([
        expect.objectContaining({
          messageId: 'new-reply-message-id',
          parentMessageId: 'parent-message-id',
          subtitle: 'New follow-up',
          unreadCount: 1,
        }),
      ]);
    });

    it('includes unread direct-message thread replies for threads the user participates in', async () => {
      const lastReadAt = new Date('2026-06-01T11:00:00.000Z');
      const replyCreatedAt = new Date('2026-06-01T12:00:00.000Z');
      const channelMemberRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const directMessageParticipantRepository = {
        find: jest.fn().mockResolvedValue([
          {
            directMessageThreadId: 'direct-message-thread-id',
            lastReadAt,
            notificationLevel: TeamChannelNotificationLevel.ALL,
            userWorkspaceId: 'current-user-workspace-id',
          },
        ]),
      };
      const messageRepository = {
        find: jest
          .fn()
          .mockResolvedValueOnce([
            {
              authorUserWorkspaceId: 'current-user-workspace-id',
              channelId: null,
              directMessageThreadId: 'direct-message-thread-id',
              id: 'parent-message-id',
              parentMessageId: null,
            },
          ])
          .mockResolvedValueOnce([
            {
              authorUserWorkspaceId: 'other-user-workspace-id',
              body: 'DM thread follow-up',
              channelId: null,
              createdAt: replyCreatedAt,
              directMessageThreadId: 'direct-message-thread-id',
              id: 'reply-message-id',
              parentMessageId: 'parent-message-id',
            },
          ]),
      };
      const messageThreadReadRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const service = createTeamCommsService({
        channelMemberRepository,
        directMessageParticipantRepository,
        messageRepository,
        messageThreadReadRepository,
      });

      jest.spyOn(service, 'getChannels').mockResolvedValue([]);
      jest.spyOn(service, 'getMentions').mockResolvedValue([]);
      jest.spyOn(service, 'getDirectMessages').mockResolvedValue([
        {
          id: 'direct-message-thread-id',
          lastMessageBody: 'Top-level only',
          notificationLevel: TeamChannelNotificationLevel.ALL,
          participantEmail: 'ada@example.com',
          participantName: 'Ada Lovelace',
          participantUserWorkspaceId: 'ada-user-workspace-id',
          unreadCount: 0,
          updatedAt: lastReadAt,
        },
      ]);

      await expect(
        service.getInboxItems({
          userWorkspaceId: 'current-user-workspace-id',
          workspaceId: 'workspace-id',
        }),
      ).resolves.toEqual([
        expect.objectContaining({
          channelId: null,
          directMessageThreadId: 'direct-message-thread-id',
          id: 'thread:parent-message-id',
          messageId: 'reply-message-id',
          parentMessageId: 'parent-message-id',
          subtitle: 'DM thread follow-up',
          title: 'Thread with Ada Lovelace',
          type: TeamInboxItemType.THREAD,
          unreadCount: 1,
          updatedAt: replyCreatedAt,
        }),
      ]);
    });

    it('uses participant creation time as the direct-message thread unread baseline before a direct message is read', async () => {
      const participantCreatedAt = new Date('2026-06-01T12:00:00.000Z');
      const oldReplyCreatedAt = new Date('2026-06-01T11:30:00.000Z');
      const newReplyCreatedAt = new Date('2026-06-01T12:30:00.000Z');
      const channelMemberRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const directMessageParticipantRepository = {
        find: jest.fn().mockResolvedValue([
          {
            createdAt: participantCreatedAt,
            directMessageThreadId: 'direct-message-thread-id',
            lastReadAt: null,
            notificationLevel: TeamChannelNotificationLevel.ALL,
            userWorkspaceId: 'current-user-workspace-id',
          },
        ]),
      };
      const messageRepository = {
        find: jest
          .fn()
          .mockResolvedValueOnce([
            {
              authorUserWorkspaceId: 'current-user-workspace-id',
              channelId: null,
              directMessageThreadId: 'direct-message-thread-id',
              id: 'parent-message-id',
              parentMessageId: null,
            },
          ])
          .mockResolvedValueOnce([
            {
              authorUserWorkspaceId: 'other-user-workspace-id',
              body: 'Old DM follow-up',
              channelId: null,
              createdAt: oldReplyCreatedAt,
              directMessageThreadId: 'direct-message-thread-id',
              id: 'old-reply-message-id',
              parentMessageId: 'parent-message-id',
            },
            {
              authorUserWorkspaceId: 'other-user-workspace-id',
              body: 'New DM follow-up',
              channelId: null,
              createdAt: newReplyCreatedAt,
              directMessageThreadId: 'direct-message-thread-id',
              id: 'new-reply-message-id',
              parentMessageId: 'parent-message-id',
            },
          ]),
      };
      const messageThreadReadRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const service = createTeamCommsService({
        channelMemberRepository,
        directMessageParticipantRepository,
        messageRepository,
        messageThreadReadRepository,
      });

      jest.spyOn(service, 'getChannels').mockResolvedValue([]);
      jest.spyOn(service, 'getMentions').mockResolvedValue([]);
      jest.spyOn(service, 'getDirectMessages').mockResolvedValue([
        {
          id: 'direct-message-thread-id',
          lastMessageBody: 'Top-level only',
          notificationLevel: TeamChannelNotificationLevel.ALL,
          participantEmail: 'ada@example.com',
          participantName: 'Ada Lovelace',
          participantUserWorkspaceId: 'ada-user-workspace-id',
          unreadCount: 0,
          updatedAt: participantCreatedAt,
        },
      ]);

      await expect(
        service.getInboxItems({
          userWorkspaceId: 'current-user-workspace-id',
          workspaceId: 'workspace-id',
        }),
      ).resolves.toEqual([
        expect.objectContaining({
          directMessageThreadId: 'direct-message-thread-id',
          messageId: 'new-reply-message-id',
          parentMessageId: 'parent-message-id',
          subtitle: 'New DM follow-up',
          unreadCount: 1,
        }),
      ]);
    });
  });

  describe('getPinnedMessages', () => {
    it('loads pinned top-level messages for an accessible channel independent of the loaded message page', async () => {
      const pinnedAt = new Date('2026-06-01T12:00:00.000Z');
      const message = {
        authorUserWorkspace: {
          user: {
            email: 'author@example.com',
            firstName: 'Author',
            lastName: 'User',
          },
        },
        authorUserWorkspaceId: 'author-user-workspace-id',
        body: 'Pinned decision',
        channelId: 'channel-id',
        createdAt: pinnedAt,
        deletedAt: null,
        directMessageThreadId: null,
        id: 'pinned-message-id',
        parentMessageId: null,
        pinnedAt,
        pinnedByUserWorkspaceId: 'owner-user-workspace-id',
        updatedAt: pinnedAt,
      };
      const channelRepository = {
        findOne: jest.fn().mockResolvedValue({
          id: 'channel-id',
          name: 'customer-success',
          visibility: TeamChannelVisibility.PUBLIC,
        }),
      };
      const channelMemberRepository = {
        findOne: jest.fn().mockResolvedValue({
          channelId: 'channel-id',
          role: 'member',
          userWorkspaceId: 'current-user-workspace-id',
        }),
      };
      const messageAttachmentRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const messageBookmarkRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const messageReactionRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const messageRepository = {
        count: jest.fn().mockResolvedValue(0),
        createQueryBuilder: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          addSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          getRawMany: jest.fn().mockResolvedValue([]),
        }),
        find: jest.fn().mockResolvedValue([message]),
      };
      const service = createTeamCommsService({
        channelMemberRepository,
        channelRepository,
        messageAttachmentRepository,
        messageBookmarkRepository,
        messageReactionRepository,
        messageRepository,
      });

      await expect(
        service.getPinnedMessages({
          channelId: 'channel-id',
          directMessageThreadId: null,
          userWorkspaceId: 'current-user-workspace-id',
          workspaceId: 'workspace-id',
        }),
      ).resolves.toEqual([
        expect.objectContaining({
          body: 'Pinned decision',
          id: 'pinned-message-id',
          isPinned: true,
        }),
      ]);
      expect(messageRepository.find).toHaveBeenCalledWith('workspace-id', {
        order: { pinnedAt: 'DESC' },
        relations: { authorUserWorkspace: { user: true } },
        take: 50,
        where: {
          channelId: 'channel-id',
          deletedAt: IsNull(),
          pinnedAt: Not(IsNull()),
        },
      });
    });

    it('loads pinned thread replies for an accessible channel', async () => {
      const pinnedAt = new Date('2026-06-01T12:00:00.000Z');
      const reply = {
        authorUserWorkspace: {
          user: {
            email: 'author@example.com',
            firstName: 'Author',
            lastName: 'User',
          },
        },
        authorUserWorkspaceId: 'author-user-workspace-id',
        body: 'Pinned thread reply',
        channelId: 'channel-id',
        createdAt: pinnedAt,
        deletedAt: null,
        directMessageThreadId: null,
        id: 'pinned-reply-id',
        parentMessageId: 'parent-message-id',
        pinnedAt,
        pinnedByUserWorkspaceId: 'owner-user-workspace-id',
        updatedAt: pinnedAt,
      };
      const channelRepository = {
        findOne: jest.fn().mockResolvedValue({
          id: 'channel-id',
          name: 'customer-success',
          visibility: TeamChannelVisibility.PUBLIC,
        }),
      };
      const channelMemberRepository = {
        findOne: jest.fn().mockResolvedValue({
          channelId: 'channel-id',
          role: 'member',
          userWorkspaceId: 'current-user-workspace-id',
        }),
      };
      const messageAttachmentRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const messageBookmarkRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const messageReactionRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const messageRepository = {
        count: jest.fn().mockResolvedValue(0),
        createQueryBuilder: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          addSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          getRawMany: jest.fn().mockResolvedValue([]),
        }),
        find: jest.fn().mockResolvedValue([reply]),
      };
      const service = createTeamCommsService({
        channelMemberRepository,
        channelRepository,
        messageAttachmentRepository,
        messageBookmarkRepository,
        messageReactionRepository,
        messageRepository,
      });

      await expect(
        service.getPinnedMessages({
          channelId: 'channel-id',
          directMessageThreadId: null,
          userWorkspaceId: 'current-user-workspace-id',
          workspaceId: 'workspace-id',
        }),
      ).resolves.toEqual([
        expect.objectContaining({
          body: 'Pinned thread reply',
          conversationName: 'customer-success',
          id: 'pinned-reply-id',
          isPinned: true,
          parentMessageId: 'parent-message-id',
        }),
      ]);
      expect(messageRepository.find).toHaveBeenCalledWith(
        'workspace-id',
        expect.objectContaining({
          where: expect.not.objectContaining({
            parentMessageId: IsNull(),
          }),
        }),
      );
    });

    it('loads pinned messages across accessible channels and direct messages when no conversation is selected', async () => {
      const pinnedAt = new Date('2026-06-01T12:00:00.000Z');
      const channelMessage = {
        authorUserWorkspace: {
          user: {
            email: 'author@example.com',
            firstName: 'Author',
            lastName: 'User',
          },
        },
        authorUserWorkspaceId: 'author-user-workspace-id',
        body: 'Pinned channel decision',
        channelId: 'channel-id',
        createdAt: pinnedAt,
        deletedAt: null,
        directMessageThreadId: null,
        id: 'pinned-channel-message-id',
        parentMessageId: null,
        pinnedAt,
        pinnedByUserWorkspaceId: 'owner-user-workspace-id',
        updatedAt: pinnedAt,
      };
      const directMessage = {
        authorUserWorkspace: {
          user: {
            email: 'author@example.com',
            firstName: 'Author',
            lastName: 'User',
          },
        },
        authorUserWorkspaceId: 'author-user-workspace-id',
        body: 'Pinned direct decision',
        channelId: null,
        createdAt: pinnedAt,
        deletedAt: null,
        directMessageThreadId: 'direct-message-thread-id',
        id: 'pinned-direct-message-id',
        parentMessageId: null,
        pinnedAt,
        pinnedByUserWorkspaceId: 'owner-user-workspace-id',
        updatedAt: pinnedAt,
      };
      const channelRepository = {
        findOne: jest.fn().mockResolvedValue({
          id: 'channel-id',
          name: 'customer-success',
          visibility: TeamChannelVisibility.PUBLIC,
        }),
      };
      const channelMemberRepository = {
        find: jest.fn().mockResolvedValue([
          {
            channelId: 'channel-id',
            role: 'member',
            userWorkspaceId: 'current-user-workspace-id',
          },
        ]),
        findOne: jest.fn().mockResolvedValue({
          channelId: 'channel-id',
          role: 'member',
          userWorkspaceId: 'current-user-workspace-id',
        }),
      };
      const directMessageParticipantRepository = {
        find: jest.fn().mockResolvedValue([
          {
            directMessageThreadId: 'direct-message-thread-id',
            userWorkspaceId: 'current-user-workspace-id',
          },
        ]),
        findOneOrFail: jest.fn().mockResolvedValue({
          directMessageThreadId: 'direct-message-thread-id',
          userWorkspace: {
            user: {
              firstName: 'Direct',
              lastName: 'User',
            },
          },
          userWorkspaceId: 'other-user-workspace-id',
        }),
      };
      const messageAttachmentRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const messageBookmarkRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const messageReactionRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const messageRepository = {
        count: jest.fn().mockResolvedValue(0),
        createQueryBuilder: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          addSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          getRawMany: jest.fn().mockResolvedValue([]),
        }),
        find: jest.fn().mockResolvedValue([channelMessage, directMessage]),
      };
      const service = createTeamCommsService({
        channelMemberRepository,
        channelRepository,
        directMessageParticipantRepository,
        messageAttachmentRepository,
        messageBookmarkRepository,
        messageReactionRepository,
        messageRepository,
      });

      await expect(
        service.getPinnedMessages({
          channelId: null,
          directMessageThreadId: null,
          userWorkspaceId: 'current-user-workspace-id',
          workspaceId: 'workspace-id',
        }),
      ).resolves.toEqual([
        expect.objectContaining({
          body: 'Pinned channel decision',
          conversationName: 'customer-success',
          id: 'pinned-channel-message-id',
          isPinned: true,
        }),
        expect.objectContaining({
          body: 'Pinned direct decision',
          conversationName: 'Direct message',
          id: 'pinned-direct-message-id',
          isPinned: true,
        }),
      ]);
      expect(messageRepository.find).toHaveBeenCalledWith('workspace-id', {
        order: { pinnedAt: 'DESC' },
        relations: { authorUserWorkspace: { user: true } },
        take: 50,
        where: [
          {
            channelId: In(['channel-id']),
            deletedAt: IsNull(),
            pinnedAt: Not(IsNull()),
          },
          {
            deletedAt: IsNull(),
            directMessageThreadId: In(['direct-message-thread-id']),
            pinnedAt: Not(IsNull()),
          },
        ],
      });
    });
  });

  describe('getSavedMessages', () => {
    it('includes conversation names for saved channel messages', async () => {
      const createdAt = new Date('2026-06-01T12:00:00.000Z');
      const message = {
        authorUserWorkspace: {
          user: {
            email: 'author@example.com',
            firstName: 'Author',
            lastName: 'User',
          },
        },
        authorUserWorkspaceId: 'author-user-workspace-id',
        body: 'Saved decision',
        channelId: 'channel-id',
        createdAt,
        deletedAt: null,
        directMessageThreadId: null,
        id: 'saved-message-id',
        parentMessageId: null,
        pinnedAt: null,
        pinnedByUserWorkspaceId: null,
        updatedAt: createdAt,
      };
      const channelRepository = {
        find: jest.fn().mockResolvedValue([
          {
            id: 'channel-id',
            name: 'customer-success',
          },
        ]),
        findOne: jest.fn().mockResolvedValue({
          id: 'channel-id',
          visibility: TeamChannelVisibility.PUBLIC,
        }),
      };
      const channelMemberRepository = {
        findOne: jest.fn().mockResolvedValue({
          channelId: 'channel-id',
          role: 'member',
          userWorkspaceId: 'current-user-workspace-id',
        }),
      };
      const messageAttachmentRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const messageBookmarkRepository = {
        find: jest.fn().mockResolvedValue([
          {
            createdAt,
            message,
            messageId: 'saved-message-id',
            userWorkspaceId: 'current-user-workspace-id',
          },
        ]),
      };
      const messageReactionRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const messageRepository = {
        count: jest.fn().mockResolvedValue(0),
        createQueryBuilder: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          addSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          getRawMany: jest.fn().mockResolvedValue([]),
        }),
        findOne: jest.fn().mockResolvedValue(message),
      };
      const service = createTeamCommsService({
        channelMemberRepository,
        channelRepository,
        messageAttachmentRepository,
        messageBookmarkRepository,
        messageReactionRepository,
        messageRepository,
      });

      await expect(
        service.getSavedMessages({
          userWorkspaceId: 'current-user-workspace-id',
          workspaceId: 'workspace-id',
        }),
      ).resolves.toEqual([
        expect.objectContaining({
          body: 'Saved decision',
          conversationName: 'customer-success',
          id: 'saved-message-id',
          isSaved: true,
        }),
      ]);
    });
  });

  describe('getPresence', () => {
    it('marks the authenticated user workspace on presence rows', async () => {
      const updatedAt = new Date('2026-06-01T12:00:00.000Z');
      const userWorkspaceRepository = {
        find: jest.fn().mockResolvedValue([
          {
            id: 'current-user-workspace-id',
            updatedAt,
            user: {
              email: 'current@example.com',
              firstName: 'Current',
              lastName: 'User',
            },
          },
          {
            id: 'other-user-workspace-id',
            updatedAt,
            user: {
              email: 'other@example.com',
              firstName: 'Other',
              lastName: 'User',
            },
          },
        ]),
      };
      const presenceRepository = { find: jest.fn().mockResolvedValue([]) };
      const service = createTeamCommsService({
        presenceRepository,
        userWorkspaceRepository,
      });

      const presence = await service.getPresence({
        userWorkspaceId: 'current-user-workspace-id',
        workspaceId: 'workspace-id',
      });

      expect(presence).toEqual([
        expect.objectContaining({
          isCurrentUser: true,
          userWorkspaceId: 'current-user-workspace-id',
        }),
        expect.objectContaining({
          isCurrentUser: false,
          userWorkspaceId: 'other-user-workspace-id',
        }),
      ]);
    });

    it('includes the authenticated user even when they are outside the first presence page', async () => {
      const updatedAt = new Date('2026-06-01T12:00:00.000Z');
      const currentUserWorkspace = {
        id: 'current-user-workspace-id',
        updatedAt,
        user: {
          email: 'current@example.com',
          firstName: 'Current',
          lastName: 'User',
        },
      };
      const userWorkspaceRepository = {
        find: jest.fn().mockResolvedValue([
          {
            id: 'other-user-workspace-id',
            updatedAt,
            user: {
              email: 'other@example.com',
              firstName: 'Other',
              lastName: 'User',
            },
          },
        ]),
        findOneOrFail: jest.fn().mockResolvedValue(currentUserWorkspace),
      };
      const presenceRepository = { find: jest.fn().mockResolvedValue([]) };
      const service = createTeamCommsService({
        presenceRepository,
        userWorkspaceRepository,
      });

      const presence = await service.getPresence({
        userWorkspaceId: 'current-user-workspace-id',
        workspaceId: 'workspace-id',
      });

      expect(presence).toEqual([
        expect.objectContaining({
          isCurrentUser: true,
          userWorkspaceId: 'current-user-workspace-id',
        }),
        expect.objectContaining({
          isCurrentUser: false,
          userWorkspaceId: 'other-user-workspace-id',
        }),
      ]);
    });
  });

  describe('markInboxRead', () => {
    it('marks all inbox surfaces read without depending on paginated inbox items', async () => {
      const now = new Date('2026-06-01T12:00:00.000Z');
      const channelMemberRepository = { update: jest.fn() };
      const directMessageParticipantRepository = { update: jest.fn() };
      const messageRepository = {
        find: jest.fn().mockResolvedValue([
          { id: 'parent-message-id', parentMessageId: null },
          { id: 'reply-message-id', parentMessageId: 'other-parent-id' },
          { id: 'duplicate-reply-id', parentMessageId: 'other-parent-id' },
        ]),
      };
      const messageMentionRepository = { update: jest.fn() };
      const messageThreadReadRepository = {
        find: jest.fn().mockResolvedValue([]),
        upsert: jest.fn(),
      };
      const service = createTeamCommsService({
        channelMemberRepository,
        directMessageParticipantRepository,
        messageMentionRepository,
        messageRepository,
        messageThreadReadRepository,
      });
      const getInboxItemsSpy = jest.spyOn(service, 'getInboxItems');

      jest.setSystemTime(now);

      await service.markInboxRead({
        userWorkspaceId: 'user-workspace-id',
        workspaceId: 'workspace-id',
      });

      expect(getInboxItemsSpy).not.toHaveBeenCalled();
      expect(channelMemberRepository.update).toHaveBeenCalledWith(
        'workspace-id',
        { userWorkspaceId: 'user-workspace-id' },
        { lastReadAt: now },
      );
      expect(directMessageParticipantRepository.update).toHaveBeenCalledWith(
        'workspace-id',
        { userWorkspaceId: 'user-workspace-id' },
        { lastReadAt: now },
      );
      expect(messageMentionRepository.update).toHaveBeenCalledWith(
        'workspace-id',
        {
          mentionedUserWorkspaceId: 'user-workspace-id',
          readAt: IsNull(),
        },
        { readAt: now },
      );
      expect(messageRepository.find).toHaveBeenCalledWith('workspace-id', {
        where: {
          authorUserWorkspaceId: 'user-workspace-id',
          deletedAt: IsNull(),
        },
      });
      expect(messageThreadReadRepository.upsert).toHaveBeenCalledWith(
        'workspace-id',
        [
          {
            lastReadAt: now,
            parentMessageId: 'parent-message-id',
            userWorkspaceId: 'user-workspace-id',
          },
          {
            lastReadAt: now,
            parentMessageId: 'other-parent-id',
            userWorkspaceId: 'user-workspace-id',
          },
        ],
        ['parentMessageId', 'userWorkspaceId'],
      );
    });
  });

  describe('markChannelRead', () => {
    it('marks unread mentions in the opened channel as read', async () => {
      const now = new Date('2026-06-01T12:00:00.000Z');
      const channelRepository = {
        findOne: jest.fn().mockResolvedValue({
          id: 'channel-id',
          visibility: TeamChannelVisibility.PUBLIC,
        }),
      };
      const channelMemberRepository = {
        findOne: jest.fn().mockResolvedValue({
          channelId: 'channel-id',
          userWorkspaceId: 'user-workspace-id',
        }),
        update: jest.fn(),
      };
      const messageMentionRepository = {
        find: jest.fn().mockResolvedValue([
          {
            id: 'channel-mention-id',
            message: {
              channelId: 'channel-id',
              directMessageThreadId: null,
              parentMessageId: null,
            },
          },
          {
            id: 'channel-thread-mention-id',
            message: {
              channelId: 'channel-id',
              directMessageThreadId: null,
              parentMessageId: 'parent-message-id',
            },
          },
          {
            id: 'other-channel-mention-id',
            message: {
              channelId: 'other-channel-id',
              directMessageThreadId: null,
              parentMessageId: null,
            },
          },
        ]),
        update: jest.fn(),
      };
      const service = createTeamCommsService({
        channelMemberRepository,
        channelRepository,
        messageMentionRepository,
      });

      jest.setSystemTime(now);

      await service.markChannelRead({
        channelId: 'channel-id',
        userWorkspaceId: 'user-workspace-id',
        workspaceId: 'workspace-id',
      });

      expect(messageMentionRepository.update).toHaveBeenCalledWith(
        'workspace-id',
        { id: In(['channel-mention-id']) },
        { readAt: now },
      );
    });
  });

  describe('markDirectMessageRead', () => {
    it('marks unread mentions in the opened direct message as read', async () => {
      const now = new Date('2026-06-01T12:00:00.000Z');
      const directMessageParticipantRepository = {
        findOneOrFail: jest.fn().mockResolvedValue({
          directMessageThreadId: 'direct-message-thread-id',
          userWorkspaceId: 'user-workspace-id',
        }),
        update: jest.fn(),
      };
      const messageMentionRepository = {
        find: jest.fn().mockResolvedValue([
          {
            id: 'direct-message-mention-id',
            message: {
              channelId: null,
              directMessageThreadId: 'direct-message-thread-id',
              parentMessageId: null,
            },
          },
          {
            id: 'direct-message-thread-mention-id',
            message: {
              channelId: null,
              directMessageThreadId: 'direct-message-thread-id',
              parentMessageId: 'parent-message-id',
            },
          },
          {
            id: 'other-direct-message-mention-id',
            message: {
              channelId: null,
              directMessageThreadId: 'other-direct-message-thread-id',
              parentMessageId: null,
            },
          },
        ]),
        update: jest.fn(),
      };
      const service = createTeamCommsService({
        directMessageParticipantRepository,
        messageMentionRepository,
      });

      jest.setSystemTime(now);

      await service.markDirectMessageRead({
        directMessageThreadId: 'direct-message-thread-id',
        userWorkspaceId: 'user-workspace-id',
        workspaceId: 'workspace-id',
      });

      expect(messageMentionRepository.update).toHaveBeenCalledWith(
        'workspace-id',
        { id: In(['direct-message-mention-id']) },
        { readAt: now },
      );
    });
  });

  describe('markMessageThreadRead', () => {
    it('marks unread mentions inside the opened thread as read', async () => {
      const now = new Date('2026-06-01T12:00:00.000Z');
      const channelRepository = {
        findOne: jest.fn().mockResolvedValue({
          id: 'channel-id',
          visibility: TeamChannelVisibility.PUBLIC,
        }),
      };
      const channelMemberRepository = {
        findOne: jest.fn().mockResolvedValue({
          channelId: 'channel-id',
          userWorkspaceId: 'user-workspace-id',
        }),
      };
      const messageRepository = {
        findOne: jest.fn().mockResolvedValue({
          authorUserWorkspace: {
            user: {
              email: 'author@example.com',
              firstName: 'Author',
              lastName: 'User',
            },
          },
          channelId: 'channel-id',
          deletedAt: null,
          directMessageThreadId: null,
          id: 'parent-message-id',
          parentMessageId: null,
        }),
      };
      const messageMentionRepository = {
        find: jest.fn().mockResolvedValue([
          {
            id: 'thread-mention-id',
            message: {
              channelId: 'channel-id',
              directMessageThreadId: null,
              parentMessageId: 'parent-message-id',
            },
          },
          {
            id: 'other-thread-mention-id',
            message: {
              channelId: 'channel-id',
              directMessageThreadId: null,
              parentMessageId: 'other-parent-message-id',
            },
          },
        ]),
        update: jest.fn(),
      };
      const messageThreadReadRepository = {
        upsert: jest.fn(),
      };
      const service = createTeamCommsService({
        channelMemberRepository,
        channelRepository,
        messageMentionRepository,
        messageRepository,
        messageThreadReadRepository,
      });

      jest.setSystemTime(now);

      await service.markMessageThreadRead({
        parentMessageId: 'parent-message-id',
        userWorkspaceId: 'user-workspace-id',
        workspaceId: 'workspace-id',
      });

      expect(messageMentionRepository.update).toHaveBeenCalledWith(
        'workspace-id',
        { id: In(['thread-mention-id']) },
        { readAt: now },
      );
      expect(messageThreadReadRepository.upsert).toHaveBeenCalledWith(
        'workspace-id',
        {
          lastReadAt: now,
          parentMessageId: 'parent-message-id',
          userWorkspaceId: 'user-workspace-id',
        },
        ['parentMessageId', 'userWorkspaceId'],
      );
    });

    it('normalizes reply targets to the root thread when marking a thread read', async () => {
      const now = new Date('2026-06-01T12:00:00.000Z');
      const channelRepository = {
        findOne: jest.fn().mockResolvedValue({
          id: 'channel-id',
          visibility: TeamChannelVisibility.PUBLIC,
        }),
      };
      const channelMemberRepository = {
        findOne: jest.fn().mockResolvedValue({
          channelId: 'channel-id',
          userWorkspaceId: 'user-workspace-id',
        }),
      };
      const messageRepository = {
        findOne: jest.fn().mockResolvedValue({
          authorUserWorkspace: {
            user: {
              email: 'author@example.com',
              firstName: 'Author',
              lastName: 'User',
            },
          },
          channelId: 'channel-id',
          deletedAt: null,
          directMessageThreadId: null,
          id: 'reply-message-id',
          parentMessageId: 'parent-message-id',
        }),
      };
      const messageMentionRepository = {
        find: jest.fn().mockResolvedValue([
          {
            id: 'thread-mention-id',
            message: {
              channelId: 'channel-id',
              directMessageThreadId: null,
              parentMessageId: 'parent-message-id',
            },
          },
        ]),
        update: jest.fn(),
      };
      const messageThreadReadRepository = {
        upsert: jest.fn(),
      };
      const service = createTeamCommsService({
        channelMemberRepository,
        channelRepository,
        messageMentionRepository,
        messageRepository,
        messageThreadReadRepository,
      });

      jest.setSystemTime(now);

      await service.markMessageThreadRead({
        parentMessageId: 'reply-message-id',
        userWorkspaceId: 'user-workspace-id',
        workspaceId: 'workspace-id',
      });

      expect(messageThreadReadRepository.upsert).toHaveBeenCalledWith(
        'workspace-id',
        {
          lastReadAt: now,
          parentMessageId: 'parent-message-id',
          userWorkspaceId: 'user-workspace-id',
        },
        ['parentMessageId', 'userWorkspaceId'],
      );
      expect(messageMentionRepository.update).toHaveBeenCalledWith(
        'workspace-id',
        { id: In(['thread-mention-id']) },
        { readAt: now },
      );
    });
  });

  describe('getMessageThread', () => {
    it('allows non-members to read threads in public channels', async () => {
      const messageCreatedAt = new Date('2026-06-01T12:00:00.000Z');
      const parentMessage = {
        authorUserWorkspace: {
          user: {
            email: 'author@example.com',
            firstName: 'Author',
            lastName: 'User',
          },
        },
        authorUserWorkspaceId: 'author-user-workspace-id',
        body: 'Public thread starter',
        channelId: 'public-channel-id',
        createdAt: messageCreatedAt,
        deletedAt: null,
        directMessageThreadId: null,
        id: 'parent-message-id',
        parentMessageId: null,
        updatedAt: messageCreatedAt,
      };
      const channelRepository = {
        findOne: jest.fn().mockResolvedValue({
          id: 'public-channel-id',
          name: 'announcements',
          visibility: TeamChannelVisibility.PUBLIC,
        }),
      };
      const channelMemberRepository = {
        findOne: jest.fn().mockResolvedValue(null),
      };
      const messageRepository = {
        createQueryBuilder: jest.fn().mockReturnValue({
          addSelect: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getRawMany: jest.fn().mockResolvedValue([]),
          groupBy: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
        }),
        find: jest.fn().mockResolvedValue([]),
        findOne: jest.fn().mockResolvedValue(parentMessage),
      };
      const messageAttachmentRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const messageBookmarkRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const messageReactionRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const service = createTeamCommsService({
        channelMemberRepository,
        channelRepository,
        messageAttachmentRepository,
        messageBookmarkRepository,
        messageReactionRepository,
        messageRepository,
      });

      const threadMessages = await service.getMessageThread({
        parentMessageId: 'parent-message-id',
        userWorkspaceId: 'reader-user-workspace-id',
        workspaceId: 'workspace-id',
      });

      expect(threadMessages).toEqual([
        expect.objectContaining({
          body: 'Public thread starter',
          channelId: 'public-channel-id',
          conversationName: 'announcements',
          id: 'parent-message-id',
        }),
      ]);
      expect(messageRepository.find).toHaveBeenCalledWith('workspace-id', {
        order: { createdAt: 'DESC' },
        relations: { authorUserWorkspace: { user: true } },
        take: 100,
        where: { deletedAt: IsNull(), parentMessageId: 'parent-message-id' },
      });
    });

    it('loads earlier thread replies before the requested cursor', async () => {
      const messageCreatedAt = new Date('2026-06-01T12:00:00.000Z');
      const before = '2026-06-01T12:30:00.000Z';
      const parentMessage = {
        authorUserWorkspace: {
          user: {
            email: 'author@example.com',
            firstName: 'Author',
            lastName: 'User',
          },
        },
        authorUserWorkspaceId: 'author-user-workspace-id',
        body: 'Public thread starter',
        channelId: 'public-channel-id',
        createdAt: messageCreatedAt,
        deletedAt: null,
        directMessageThreadId: null,
        id: 'parent-message-id',
        parentMessageId: null,
        updatedAt: messageCreatedAt,
      };
      const channelRepository = {
        findOne: jest.fn().mockResolvedValue({
          id: 'public-channel-id',
          visibility: TeamChannelVisibility.PUBLIC,
        }),
      };
      const channelMemberRepository = {
        findOne: jest.fn().mockResolvedValue(null),
      };
      const messageRepository = {
        createQueryBuilder: jest.fn().mockReturnValue({
          addSelect: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getRawMany: jest.fn().mockResolvedValue([]),
          groupBy: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
        }),
        find: jest.fn().mockResolvedValue([]),
        findOne: jest.fn().mockResolvedValue(parentMessage),
      };
      const messageAttachmentRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const messageBookmarkRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const messageReactionRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const service = createTeamCommsService({
        channelMemberRepository,
        channelRepository,
        messageAttachmentRepository,
        messageBookmarkRepository,
        messageReactionRepository,
        messageRepository,
      });

      await service.getMessageThread({
        before,
        parentMessageId: 'parent-message-id',
        userWorkspaceId: 'reader-user-workspace-id',
        workspaceId: 'workspace-id',
      });

      expect(messageRepository.find).toHaveBeenCalledWith('workspace-id', {
        order: { createdAt: 'DESC' },
        relations: { authorUserWorkspace: { user: true } },
        take: 100,
        where: {
          createdAt: LessThan(new Date(before)),
          deletedAt: IsNull(),
          parentMessageId: 'parent-message-id',
        },
      });
    });
  });

  describe('markMessageUnread', () => {
    it('reopens the current user mention when marking a mentioned message unread', async () => {
      const messageCreatedAt = new Date('2026-06-01T12:00:00.000Z');
      const channelRepository = {
        findOne: jest.fn().mockResolvedValue({
          id: 'channel-id',
          visibility: TeamChannelVisibility.PUBLIC,
        }),
      };
      const channelMemberRepository = {
        findOne: jest.fn().mockResolvedValue({
          channelId: 'channel-id',
          userWorkspaceId: 'user-workspace-id',
        }),
        update: jest.fn(),
      };
      const messageMentionRepository = { update: jest.fn() };
      const messageRepository = {
        findOne: jest.fn().mockResolvedValue({
          authorUserWorkspace: {
            user: {
              email: 'sender@example.com',
              firstName: 'Sender',
              lastName: 'User',
            },
          },
          channelId: 'channel-id',
          createdAt: messageCreatedAt,
          deletedAt: null,
          directMessageThreadId: null,
          id: 'message-id',
        }),
      };
      const service = createTeamCommsService({
        channelMemberRepository,
        channelRepository,
        messageMentionRepository,
        messageRepository,
      });

      await service.markMessageUnread({
        messageId: 'message-id',
        userWorkspaceId: 'user-workspace-id',
        workspaceId: 'workspace-id',
      });

      expect(messageMentionRepository.update).toHaveBeenCalledWith(
        'workspace-id',
        {
          mentionedUserWorkspaceId: 'user-workspace-id',
          messageId: 'message-id',
        },
        { readAt: null },
      );
    });

    it('moves thread read state back when marking a thread reply unread', async () => {
      const messageCreatedAt = new Date('2026-06-01T12:00:00.000Z');
      const lastReadAt = new Date('2026-06-01T11:59:59.999Z');
      const channelRepository = {
        findOne: jest.fn().mockResolvedValue({
          id: 'channel-id',
          visibility: TeamChannelVisibility.PUBLIC,
        }),
      };
      const channelMemberRepository = {
        findOne: jest.fn().mockResolvedValue({
          channelId: 'channel-id',
          userWorkspaceId: 'user-workspace-id',
        }),
        update: jest.fn(),
      };
      const messageMentionRepository = { update: jest.fn() };
      const messageRepository = {
        findOne: jest.fn().mockResolvedValue({
          authorUserWorkspace: {
            user: {
              email: 'sender@example.com',
              firstName: 'Sender',
              lastName: 'User',
            },
          },
          channelId: 'channel-id',
          createdAt: messageCreatedAt,
          deletedAt: null,
          directMessageThreadId: null,
          id: 'reply-message-id',
          parentMessageId: 'parent-message-id',
        }),
      };
      const messageThreadReadRepository = { upsert: jest.fn() };
      const service = createTeamCommsService({
        channelMemberRepository,
        channelRepository,
        messageMentionRepository,
        messageRepository,
        messageThreadReadRepository,
      });

      await service.markMessageUnread({
        messageId: 'reply-message-id',
        userWorkspaceId: 'user-workspace-id',
        workspaceId: 'workspace-id',
      });

      expect(channelMemberRepository.update).not.toHaveBeenCalled();
      expect(messageThreadReadRepository.upsert).toHaveBeenCalledWith(
        'workspace-id',
        {
          lastReadAt,
          parentMessageId: 'parent-message-id',
          userWorkspaceId: 'user-workspace-id',
        },
        ['parentMessageId', 'userWorkspaceId'],
      );
    });

    it('moves direct-message thread read state back when marking a reply unread', async () => {
      const messageCreatedAt = new Date('2026-06-01T12:00:00.000Z');
      const lastReadAt = new Date('2026-06-01T11:59:59.999Z');
      const directMessageParticipantRepository = {
        findOneOrFail: jest.fn().mockResolvedValue({
          directMessageThreadId: 'direct-message-thread-id',
          userWorkspaceId: 'user-workspace-id',
        }),
        update: jest.fn(),
      };
      const messageMentionRepository = { update: jest.fn() };
      const messageRepository = {
        findOne: jest.fn().mockResolvedValue({
          authorUserWorkspace: {
            user: {
              email: 'sender@example.com',
              firstName: 'Sender',
              lastName: 'User',
            },
          },
          channelId: null,
          createdAt: messageCreatedAt,
          deletedAt: null,
          directMessageThreadId: 'direct-message-thread-id',
          id: 'reply-message-id',
          parentMessageId: 'parent-message-id',
        }),
      };
      const messageThreadReadRepository = { upsert: jest.fn() };
      const service = createTeamCommsService({
        directMessageParticipantRepository,
        messageMentionRepository,
        messageRepository,
        messageThreadReadRepository,
      });

      await service.markMessageUnread({
        messageId: 'reply-message-id',
        userWorkspaceId: 'user-workspace-id',
        workspaceId: 'workspace-id',
      });

      expect(directMessageParticipantRepository.update).not.toHaveBeenCalled();
      expect(messageThreadReadRepository.upsert).toHaveBeenCalledWith(
        'workspace-id',
        {
          lastReadAt,
          parentMessageId: 'parent-message-id',
          userWorkspaceId: 'user-workspace-id',
        },
        ['parentMessageId', 'userWorkspaceId'],
      );
    });
  });

  describe('getMentions', () => {
    it('scopes mention lookup to readable conversations before applying the limit', async () => {
      const channelRepository = {
        count: jest.fn().mockResolvedValue(1),
        find: jest.fn().mockResolvedValue([
          {
            createdAt: new Date('2026-06-01T12:00:00.000Z'),
            deletedAt: null,
            description: null,
            id: 'channel-id',
            name: 'general',
            slug: 'general',
            updatedAt: new Date('2026-06-01T12:00:00.000Z'),
            visibility: TeamChannelVisibility.PUBLIC,
          },
        ]),
      };
      const channelMemberRepository = {
        find: jest.fn().mockResolvedValue([
          {
            channelId: 'channel-id',
            userWorkspaceId: 'current-user-workspace-id',
          },
        ]),
      };
      const directMessageParticipantRepository = {
        find: jest.fn().mockResolvedValue([
          {
            directMessageThreadId: 'direct-message-thread-id',
            userWorkspaceId: 'current-user-workspace-id',
          },
        ]),
      };
      const messageMentionRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const messageRepository = {
        count: jest.fn().mockResolvedValue(0),
      };
      const service = createTeamCommsService({
        channelMemberRepository,
        channelRepository,
        directMessageParticipantRepository,
        messageMentionRepository,
        messageRepository,
      });

      await service.getMentions({
        userWorkspaceId: 'current-user-workspace-id',
        workspaceId: 'workspace-id',
      });

      expect(messageMentionRepository.find).toHaveBeenCalledWith(
        'workspace-id',
        {
          order: { createdAt: 'DESC' },
          relations: {
            message: {
              authorUserWorkspace: { user: true },
              channel: true,
            },
          },
          take: 25,
          where: [
            {
              mentionedUserWorkspaceId: 'current-user-workspace-id',
              message: {
                channelId: In(['channel-id']),
                deletedAt: IsNull(),
              },
            },
            {
              mentionedUserWorkspaceId: 'current-user-workspace-id',
              message: {
                deletedAt: IsNull(),
                directMessageThreadId: In(['direct-message-thread-id']),
              },
            },
          ],
        },
      );
    });

    it('hides stale mentions from private channels the user can no longer read', async () => {
      const channelRepository = {
        count: jest.fn().mockResolvedValue(1),
        find: jest.fn().mockResolvedValue([]),
        findOne: jest.fn().mockResolvedValue({
          id: 'private-channel-id',
          visibility: TeamChannelVisibility.PRIVATE,
        }),
      };
      const channelMemberRepository = {
        find: jest.fn().mockResolvedValue([]),
        findOne: jest.fn().mockResolvedValue(null),
      };
      const directMessageParticipantRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const messageMentionRepository = {
        find: jest.fn().mockResolvedValue([
          {
            createdAt: new Date('2026-06-01T12:00:00.000Z'),
            id: 'mention-id',
            message: {
              authorUserWorkspace: {
                user: {
                  email: 'sender@example.com',
                  firstName: 'Sender',
                  lastName: 'User',
                },
              },
              body: '@current please review',
              channel: { name: 'private-channel' },
              channelId: 'private-channel-id',
              createdAt: new Date('2026-06-01T12:00:00.000Z'),
              deletedAt: null,
              directMessageThreadId: null,
              id: 'message-id',
              parentMessageId: null,
            },
            messageId: 'message-id',
            readAt: null,
          },
        ]),
      };
      const service = createTeamCommsService({
        channelMemberRepository,
        channelRepository,
        directMessageParticipantRepository,
        messageMentionRepository,
      });

      await expect(
        service.getMentions({
          userWorkspaceId: 'current-user-workspace-id',
          workspaceId: 'workspace-id',
        }),
      ).resolves.toEqual([]);
    });
  });

  describe('toggleMessageBookmark', () => {
    it('publishes a message event so saved-message panels refresh in open clients', async () => {
      const messageCreatedAt = new Date('2026-06-01T12:00:00.000Z');
      const message = {
        authorUserWorkspace: {
          user: {
            email: 'author@example.com',
            firstName: 'Author',
            lastName: 'User',
          },
        },
        authorUserWorkspaceId: 'author-user-workspace-id',
        body: 'Save this update',
        channelId: 'channel-id',
        createdAt: messageCreatedAt,
        deletedAt: null,
        directMessageThreadId: null,
        id: 'message-id',
        parentMessageId: null,
        pinnedAt: null,
        pinnedByUserWorkspaceId: null,
        updatedAt: messageCreatedAt,
      };
      const channelRepository = {
        findOne: jest.fn().mockResolvedValue({
          id: 'channel-id',
          visibility: TeamChannelVisibility.PUBLIC,
        }),
      };
      const channelMemberRepository = {
        findOne: jest.fn().mockResolvedValue({
          channelId: 'channel-id',
          userWorkspaceId: 'current-user-workspace-id',
        }),
      };
      const messageAttachmentRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const messageBookmarkRepository = {
        findOne: jest.fn().mockResolvedValue(null),
        save: jest.fn(),
      };
      const messageReactionRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const messageRepository = {
        count: jest.fn().mockResolvedValue(0),
        findOne: jest.fn().mockResolvedValue(message),
      };
      const subscriptionService = {
        publish: jest.fn(),
      };
      const service = createTeamCommsService({
        channelMemberRepository,
        channelRepository,
        messageAttachmentRepository,
        messageBookmarkRepository,
        messageReactionRepository,
        messageRepository,
        subscriptionService,
      });

      await service.toggleMessageBookmark({
        messageId: 'message-id',
        userWorkspaceId: 'current-user-workspace-id',
        workspaceId: 'workspace-id',
      });

      expect(subscriptionService.publish).toHaveBeenCalledWith({
        channel: SubscriptionChannel.TEAM_COMMS_MESSAGES_CHANNEL,
        payload: {
          onTeamMessageEvent: expect.objectContaining({
            body: 'Save this update',
            channelId: 'channel-id',
            directMessageThreadId: null,
            isNewMessage: false,
            messageId: 'message-id',
            parentMessageId: null,
            type: TeamMessageEventType.UPSERTED,
          }),
        },
        workspaceId: 'workspace-id',
      });
    });
  });

  describe('message reminders', () => {
    const messageCreatedAt = new Date('2026-06-01T12:00:00.000Z');
    const message = {
      authorUserWorkspace: {
        user: {
          email: 'author@example.com',
          firstName: 'Author',
          lastName: 'User',
        },
      },
      authorUserWorkspaceId: 'author-user-workspace-id',
      body: 'Follow up tomorrow',
      channelId: 'channel-id',
      createdAt: messageCreatedAt,
      deletedAt: null,
      directMessageThreadId: null,
      id: 'message-id',
      parentMessageId: null,
      pinnedAt: null,
      pinnedByUserWorkspaceId: null,
      updatedAt: messageCreatedAt,
    };

    const createReminderTestService = () => {
      const channelRepository = {
        find: jest.fn().mockResolvedValue([
          {
            id: 'channel-id',
            name: 'general',
            visibility: TeamChannelVisibility.PUBLIC,
          },
        ]),
        findOne: jest.fn().mockResolvedValue({
          id: 'channel-id',
          visibility: TeamChannelVisibility.PUBLIC,
        }),
      };
      const channelMemberRepository = {
        findOne: jest.fn().mockResolvedValue({
          channelId: 'channel-id',
          userWorkspaceId: 'current-user-workspace-id',
        }),
      };
      const messageReminderRepository = {
        delete: jest.fn(),
        findOneOrFail: jest.fn().mockResolvedValue({
          id: 'reminder-id',
          message,
          messageId: 'message-id',
          remindAt: new Date('2026-06-02T12:00:00.000Z'),
          userWorkspaceId: 'current-user-workspace-id',
        }),
        upsert: jest.fn(),
      };
      const messageRepository = {
        findOne: jest.fn().mockResolvedValue(message),
      };
      const subscriptionService = {
        publish: jest.fn(),
      };
      const service = createTeamCommsService({
        channelMemberRepository,
        channelRepository,
        messageReminderRepository,
        messageRepository,
        subscriptionService,
      });

      return { messageReminderRepository, service, subscriptionService };
    };

    it('publishes a message event when a reminder is set', async () => {
      const { service, subscriptionService } = createReminderTestService();

      await service.setMessageReminder({
        messageId: 'message-id',
        remindAt: new Date('2026-06-02T12:00:00.000Z'),
        userWorkspaceId: 'current-user-workspace-id',
        workspaceId: 'workspace-id',
      });

      expect(subscriptionService.publish).toHaveBeenCalledWith({
        channel: SubscriptionChannel.TEAM_COMMS_MESSAGES_CHANNEL,
        payload: {
          onTeamMessageEvent: expect.objectContaining({
            body: 'Follow up tomorrow',
            channelId: 'channel-id',
            directMessageThreadId: null,
            isNewMessage: false,
            messageId: 'message-id',
            parentMessageId: null,
            type: TeamMessageEventType.UPSERTED,
          }),
        },
        workspaceId: 'workspace-id',
      });
    });

    it('rejects reminders scheduled in the past', async () => {
      const { messageReminderRepository, service } =
        createReminderTestService();

      await expect(
        service.setMessageReminder({
          messageId: 'message-id',
          remindAt: new Date('2000-01-01T00:00:00.000Z'),
          userWorkspaceId: 'current-user-workspace-id',
          workspaceId: 'workspace-id',
        }),
      ).rejects.toThrow('Reminder time must be in the future.');
      expect(messageReminderRepository.upsert).not.toHaveBeenCalled();
    });

    it('publishes a message event when a reminder is dismissed', async () => {
      const { service, subscriptionService } = createReminderTestService();

      await service.dismissMessageReminder({
        messageId: 'message-id',
        userWorkspaceId: 'current-user-workspace-id',
        workspaceId: 'workspace-id',
      });

      expect(subscriptionService.publish).toHaveBeenCalledWith({
        channel: SubscriptionChannel.TEAM_COMMS_MESSAGES_CHANNEL,
        payload: {
          onTeamMessageEvent: expect.objectContaining({
            body: 'Follow up tomorrow',
            channelId: 'channel-id',
            directMessageThreadId: null,
            isNewMessage: false,
            messageId: 'message-id',
            parentMessageId: null,
            type: TeamMessageEventType.UPSERTED,
          }),
        },
        workspaceId: 'workspace-id',
      });
    });
  });

  describe('updateMessage', () => {
    it('does not sync mentions from inline code, URL paths, or email addresses', async () => {
      const messageCreatedAt = new Date('2026-06-01T12:00:00.000Z');
      const message = {
        authorUserWorkspace: {
          user: {
            email: 'author@example.com',
            firstName: 'Author',
            lastName: 'User',
          },
        },
        authorUserWorkspaceId: 'author-user-workspace-id',
        body: 'Heads up',
        channelId: 'channel-id',
        createdAt: messageCreatedAt,
        deletedAt: null,
        directMessageThreadId: null,
        id: 'message-id',
        parentMessageId: null,
        pinnedAt: null,
        pinnedByUserWorkspaceId: null,
        updatedAt: messageCreatedAt,
      };
      const updatedMessage = {
        ...message,
        body: 'Run `@channel` then open https://example.com/@everyone and email ada@example.com',
      };
      const channelRepository = {
        findOne: jest.fn().mockResolvedValue({
          id: 'channel-id',
          visibility: TeamChannelVisibility.PUBLIC,
        }),
      };
      const channelMemberRepository = {
        findOne: jest.fn().mockResolvedValue({
          channelId: 'channel-id',
          userWorkspaceId: 'author-user-workspace-id',
        }),
      };
      const messageRepository = {
        count: jest.fn().mockResolvedValue(0),
        findOne: jest.fn().mockResolvedValue(message),
        findOneOrFail: jest.fn().mockResolvedValue(updatedMessage),
        update: jest.fn(),
      };
      const messageAttachmentRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const messageMentionRepository = {
        delete: jest.fn(),
        find: jest.fn().mockResolvedValue([]),
        save: jest.fn(),
      };
      const messageReactionRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const subscriptionService = {
        publish: jest.fn(),
      };
      const userWorkspaceRepository = {
        find: jest.fn().mockResolvedValue([
          {
            id: 'author-user-workspace-id',
            user: {
              email: 'author@example.com',
              firstName: 'Author',
              lastName: 'User',
            },
          },
          {
            id: 'ada-user-workspace-id',
            user: {
              email: 'ada@example.com',
              firstName: 'Ada',
              lastName: 'Lovelace',
            },
          },
          {
            id: 'grace-user-workspace-id',
            user: {
              email: 'grace@example.com',
              firstName: 'Grace',
              lastName: 'Hopper',
            },
          },
        ]),
      };
      const service = createTeamCommsService({
        channelMemberRepository,
        channelRepository,
        messageAttachmentRepository,
        messageMentionRepository,
        messageReactionRepository,
        messageRepository,
        subscriptionService,
        userWorkspaceRepository,
      });

      await service.updateMessage({
        body: updatedMessage.body,
        messageId: 'message-id',
        userWorkspaceId: 'author-user-workspace-id',
        workspaceId: 'workspace-id',
      });

      expect(messageMentionRepository.save).not.toHaveBeenCalled();
    });

    it('syncs @here mentions only to currently online eligible recipients', async () => {
      const now = new Date('2026-06-01T12:00:00.000Z');
      const message = {
        authorUserWorkspace: {
          user: {
            email: 'author@example.com',
            firstName: 'Author',
            lastName: 'User',
          },
        },
        authorUserWorkspaceId: 'author-user-workspace-id',
        body: 'Heads up',
        channelId: 'channel-id',
        createdAt: now,
        deletedAt: null,
        directMessageThreadId: null,
        id: 'message-id',
        parentMessageId: null,
        pinnedAt: null,
        pinnedByUserWorkspaceId: null,
        updatedAt: now,
      };
      const updatedMessage = {
        ...message,
        body: '@here heads up',
      };
      const channelRepository = {
        findOne: jest.fn().mockResolvedValue({
          id: 'channel-id',
          visibility: TeamChannelVisibility.PUBLIC,
        }),
      };
      const channelMemberRepository = {
        findOne: jest.fn().mockResolvedValue({
          channelId: 'channel-id',
          userWorkspaceId: 'author-user-workspace-id',
        }),
      };
      const messageRepository = {
        count: jest.fn().mockResolvedValue(0),
        findOne: jest.fn().mockResolvedValue(message),
        findOneOrFail: jest.fn().mockResolvedValue(updatedMessage),
        update: jest.fn(),
      };
      const messageAttachmentRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const messageMentionRepository = {
        delete: jest.fn(),
        find: jest.fn().mockResolvedValue([]),
        save: jest.fn(),
      };
      const messageReactionRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const presenceRepository = {
        find: jest.fn().mockResolvedValue([
          {
            lastSeenAt: new Date('2026-06-01T11:59:40.000Z'),
            userWorkspaceId: 'online-recipient-user-workspace-id',
          },
          {
            lastSeenAt: new Date('2026-06-01T11:58:00.000Z'),
            userWorkspaceId: 'offline-recipient-user-workspace-id',
          },
        ]),
      };
      const subscriptionService = {
        publish: jest.fn(),
      };
      const userWorkspaceRepository = {
        find: jest.fn().mockResolvedValue([
          {
            id: 'author-user-workspace-id',
            user: {
              email: 'author@example.com',
              firstName: 'Author',
              lastName: 'User',
            },
          },
          {
            id: 'online-recipient-user-workspace-id',
            user: {
              email: 'online@example.com',
              firstName: 'Online',
              lastName: 'Recipient',
            },
          },
          {
            id: 'offline-recipient-user-workspace-id',
            user: {
              email: 'offline@example.com',
              firstName: 'Offline',
              lastName: 'Recipient',
            },
          },
        ]),
      };
      const service = createTeamCommsService({
        channelMemberRepository,
        channelRepository,
        messageAttachmentRepository,
        messageMentionRepository,
        messageReactionRepository,
        messageRepository,
        presenceRepository,
        subscriptionService,
        userWorkspaceRepository,
      });

      jest.setSystemTime(now);

      await service.updateMessage({
        body: '@here heads up',
        messageId: 'message-id',
        userWorkspaceId: 'author-user-workspace-id',
        workspaceId: 'workspace-id',
      });

      expect(messageMentionRepository.save).toHaveBeenCalledWith(
        'workspace-id',
        {
          mentionedUserWorkspaceId: 'online-recipient-user-workspace-id',
          messageId: 'message-id',
          readAt: null,
        },
      );
      expect(messageMentionRepository.save).not.toHaveBeenCalledWith(
        'workspace-id',
        expect.objectContaining({
          mentionedUserWorkspaceId: 'offline-recipient-user-workspace-id',
        }),
      );
      expect(messageMentionRepository.save).not.toHaveBeenCalledWith(
        'workspace-id',
        expect.objectContaining({
          mentionedUserWorkspaceId: 'author-user-workspace-id',
        }),
      );
    });

    it('syncs @channel mentions to every eligible channel recipient except the editor', async () => {
      const messageCreatedAt = new Date('2026-06-01T12:00:00.000Z');
      const message = {
        authorUserWorkspace: {
          user: {
            email: 'author@example.com',
            firstName: 'Author',
            lastName: 'User',
          },
        },
        authorUserWorkspaceId: 'author-user-workspace-id',
        body: 'Heads up',
        channelId: 'channel-id',
        createdAt: messageCreatedAt,
        deletedAt: null,
        directMessageThreadId: null,
        id: 'message-id',
        parentMessageId: null,
        pinnedAt: null,
        pinnedByUserWorkspaceId: null,
        updatedAt: messageCreatedAt,
      };
      const updatedMessage = {
        ...message,
        body: '@channel heads up',
      };
      const channelRepository = {
        findOne: jest.fn().mockResolvedValue({
          id: 'channel-id',
          visibility: TeamChannelVisibility.PUBLIC,
        }),
      };
      const channelMemberRepository = {
        findOne: jest.fn().mockResolvedValue({
          channelId: 'channel-id',
          userWorkspaceId: 'author-user-workspace-id',
        }),
      };
      const messageRepository = {
        count: jest.fn().mockResolvedValue(0),
        findOne: jest.fn().mockResolvedValue(message),
        findOneOrFail: jest.fn().mockResolvedValue(updatedMessage),
        update: jest.fn(),
      };
      const messageAttachmentRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const messageMentionRepository = {
        delete: jest.fn(),
        find: jest.fn().mockResolvedValue([]),
        save: jest.fn(),
      };
      const messageReactionRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const subscriptionService = {
        publish: jest.fn(),
      };
      const userWorkspaceRepository = {
        find: jest.fn().mockResolvedValue([
          {
            id: 'author-user-workspace-id',
            user: {
              email: 'author@example.com',
              firstName: 'Author',
              lastName: 'User',
            },
          },
          {
            id: 'first-recipient-user-workspace-id',
            user: {
              email: 'first@example.com',
              firstName: 'First',
              lastName: 'Recipient',
            },
          },
          {
            id: 'second-recipient-user-workspace-id',
            user: {
              email: 'second@example.com',
              firstName: 'Second',
              lastName: 'Recipient',
            },
          },
        ]),
      };
      const service = createTeamCommsService({
        channelMemberRepository,
        channelRepository,
        messageAttachmentRepository,
        messageMentionRepository,
        messageReactionRepository,
        messageRepository,
        subscriptionService,
        userWorkspaceRepository,
      });

      await service.updateMessage({
        body: '@channel heads up',
        messageId: 'message-id',
        userWorkspaceId: 'author-user-workspace-id',
        workspaceId: 'workspace-id',
      });

      expect(messageMentionRepository.save).toHaveBeenCalledWith(
        'workspace-id',
        {
          mentionedUserWorkspaceId: 'first-recipient-user-workspace-id',
          messageId: 'message-id',
          readAt: null,
        },
      );
      expect(messageMentionRepository.save).toHaveBeenCalledWith(
        'workspace-id',
        {
          mentionedUserWorkspaceId: 'second-recipient-user-workspace-id',
          messageId: 'message-id',
          readAt: null,
        },
      );
      expect(messageMentionRepository.save).not.toHaveBeenCalledWith(
        'workspace-id',
        expect.objectContaining({
          mentionedUserWorkspaceId: 'author-user-workspace-id',
        }),
      );
    });

    it('syncs @everyone mentions to every eligible channel recipient except the editor', async () => {
      const messageCreatedAt = new Date('2026-06-01T12:00:00.000Z');
      const message = {
        authorUserWorkspace: {
          user: {
            email: 'author@example.com',
            firstName: 'Author',
            lastName: 'User',
          },
        },
        authorUserWorkspaceId: 'author-user-workspace-id',
        body: 'Heads up',
        channelId: 'channel-id',
        createdAt: messageCreatedAt,
        deletedAt: null,
        directMessageThreadId: null,
        id: 'message-id',
        parentMessageId: null,
        pinnedAt: null,
        pinnedByUserWorkspaceId: null,
        updatedAt: messageCreatedAt,
      };
      const updatedMessage = {
        ...message,
        body: '@everyone heads up',
      };
      const channelRepository = {
        findOne: jest.fn().mockResolvedValue({
          id: 'channel-id',
          visibility: TeamChannelVisibility.PUBLIC,
        }),
      };
      const channelMemberRepository = {
        findOne: jest.fn().mockResolvedValue({
          channelId: 'channel-id',
          userWorkspaceId: 'author-user-workspace-id',
        }),
      };
      const messageRepository = {
        count: jest.fn().mockResolvedValue(0),
        findOne: jest.fn().mockResolvedValue(message),
        findOneOrFail: jest.fn().mockResolvedValue(updatedMessage),
        update: jest.fn(),
      };
      const messageAttachmentRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const messageMentionRepository = {
        delete: jest.fn(),
        find: jest.fn().mockResolvedValue([]),
        save: jest.fn(),
      };
      const messageReactionRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const subscriptionService = {
        publish: jest.fn(),
      };
      const userWorkspaceRepository = {
        find: jest.fn().mockResolvedValue([
          {
            id: 'author-user-workspace-id',
            user: {
              email: 'author@example.com',
              firstName: 'Author',
              lastName: 'User',
            },
          },
          {
            id: 'first-recipient-user-workspace-id',
            user: {
              email: 'first@example.com',
              firstName: 'First',
              lastName: 'Recipient',
            },
          },
          {
            id: 'second-recipient-user-workspace-id',
            user: {
              email: 'second@example.com',
              firstName: 'Second',
              lastName: 'Recipient',
            },
          },
        ]),
      };
      const service = createTeamCommsService({
        channelMemberRepository,
        channelRepository,
        messageAttachmentRepository,
        messageMentionRepository,
        messageReactionRepository,
        messageRepository,
        subscriptionService,
        userWorkspaceRepository,
      });

      await service.updateMessage({
        body: '@everyone heads up',
        messageId: 'message-id',
        userWorkspaceId: 'author-user-workspace-id',
        workspaceId: 'workspace-id',
      });

      expect(messageMentionRepository.save).toHaveBeenCalledWith(
        'workspace-id',
        {
          mentionedUserWorkspaceId: 'first-recipient-user-workspace-id',
          messageId: 'message-id',
          readAt: null,
        },
      );
      expect(messageMentionRepository.save).toHaveBeenCalledWith(
        'workspace-id',
        {
          mentionedUserWorkspaceId: 'second-recipient-user-workspace-id',
          messageId: 'message-id',
          readAt: null,
        },
      );
      expect(messageMentionRepository.save).not.toHaveBeenCalledWith(
        'workspace-id',
        expect.objectContaining({
          mentionedUserWorkspaceId: 'author-user-workspace-id',
        }),
      );
    });

    it('syncs mentions when a message edit adds and removes mentioned teammates', async () => {
      const messageCreatedAt = new Date('2026-06-01T12:00:00.000Z');
      const message = {
        authorUserWorkspace: {
          user: {
            email: 'author@example.com',
            firstName: 'Author',
            lastName: 'User',
          },
        },
        authorUserWorkspaceId: 'author-user-workspace-id',
        body: '@keep please review',
        channelId: 'channel-id',
        createdAt: messageCreatedAt,
        deletedAt: null,
        directMessageThreadId: null,
        id: 'message-id',
        parentMessageId: null,
        pinnedAt: null,
        pinnedByUserWorkspaceId: null,
        updatedAt: messageCreatedAt,
      };
      const updatedMessage = {
        ...message,
        body: '@keep and @new please review',
      };
      const channelRepository = {
        findOne: jest.fn().mockResolvedValue({
          id: 'channel-id',
          visibility: TeamChannelVisibility.PUBLIC,
        }),
      };
      const channelMemberRepository = {
        findOne: jest.fn().mockResolvedValue({
          channelId: 'channel-id',
          userWorkspaceId: 'author-user-workspace-id',
        }),
      };
      const messageRepository = {
        count: jest.fn().mockResolvedValue(0),
        findOne: jest.fn().mockResolvedValue(message),
        findOneOrFail: jest.fn().mockResolvedValue(updatedMessage),
        update: jest.fn(),
      };
      const messageAttachmentRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const messageMentionRepository = {
        delete: jest.fn(),
        find: jest.fn().mockResolvedValue([
          {
            id: 'keep-mention-id',
            mentionedUserWorkspaceId: 'keep-user-workspace-id',
          },
          {
            id: 'stale-mention-id',
            mentionedUserWorkspaceId: 'stale-user-workspace-id',
          },
        ]),
        save: jest.fn(),
      };
      const messageReactionRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      const subscriptionService = {
        publish: jest.fn(),
      };
      const userWorkspaceRepository = {
        find: jest.fn().mockResolvedValue([
          {
            id: 'keep-user-workspace-id',
            user: {
              email: 'keep@example.com',
              firstName: 'Keep',
              lastName: 'User',
            },
          },
          {
            id: 'new-user-workspace-id',
            user: {
              email: 'new@example.com',
              firstName: 'New',
              lastName: 'User',
            },
          },
          {
            id: 'stale-user-workspace-id',
            user: {
              email: 'stale@example.com',
              firstName: 'Stale',
              lastName: 'User',
            },
          },
        ]),
      };
      const service = createTeamCommsService({
        channelMemberRepository,
        channelRepository,
        messageAttachmentRepository,
        messageMentionRepository,
        messageReactionRepository,
        messageRepository,
        subscriptionService,
        userWorkspaceRepository,
      });

      await service.updateMessage({
        body: '@keep and @new please review',
        messageId: 'message-id',
        userWorkspaceId: 'author-user-workspace-id',
        workspaceId: 'workspace-id',
      });

      expect(messageMentionRepository.delete).toHaveBeenCalledWith(
        'workspace-id',
        { id: In(['stale-mention-id']) },
      );
      expect(messageMentionRepository.save).toHaveBeenCalledWith(
        'workspace-id',
        {
          mentionedUserWorkspaceId: 'new-user-workspace-id',
          messageId: 'message-id',
          readAt: null,
        },
      );
      expect(messageMentionRepository.save).not.toHaveBeenCalledWith(
        'workspace-id',
        expect.objectContaining({
          mentionedUserWorkspaceId: 'keep-user-workspace-id',
        }),
      );
    });
  });

  describe('deleteMessage', () => {
    it('removes message side records when deleting a message', async () => {
      const messageCreatedAt = new Date('2026-06-01T12:00:00.000Z');
      const message = {
        authorUserWorkspace: {
          user: {
            email: 'author@example.com',
            firstName: 'Author',
            lastName: 'User',
          },
        },
        authorUserWorkspaceId: 'author-user-workspace-id',
        body: '@ada please review',
        channelId: 'channel-id',
        createdAt: messageCreatedAt,
        deletedAt: null,
        directMessageThreadId: null,
        id: 'message-id',
        parentMessageId: null,
        pinnedAt: null,
        pinnedByUserWorkspaceId: null,
        updatedAt: messageCreatedAt,
      };
      const channelMemberRepository = {
        findOne: jest.fn().mockResolvedValue({
          channelId: 'channel-id',
          userWorkspaceId: 'author-user-workspace-id',
        }),
      };
      const channelRepository = {
        findOne: jest.fn().mockResolvedValue({
          id: 'channel-id',
          visibility: TeamChannelVisibility.PUBLIC,
        }),
      };
      const messageAttachmentRepository = {
        delete: jest.fn(),
      };
      const messageBookmarkRepository = {
        delete: jest.fn(),
      };
      const messageMentionRepository = {
        delete: jest.fn(),
      };
      const messageReactionRepository = {
        delete: jest.fn(),
      };
      const messageReminderRepository = {
        delete: jest.fn(),
      };
      const messageRepository = {
        find: jest.fn().mockResolvedValue([]),
        findOne: jest.fn().mockResolvedValue(message),
        update: jest.fn(),
      };
      const subscriptionService = {
        publish: jest.fn(),
      };
      const service = createTeamCommsService({
        channelMemberRepository,
        channelRepository,
        messageAttachmentRepository,
        messageBookmarkRepository,
        messageMentionRepository,
        messageReactionRepository,
        messageReminderRepository,
        messageRepository,
        subscriptionService,
      });

      await expect(
        service.deleteMessage({
          messageId: 'message-id',
          userWorkspaceId: 'author-user-workspace-id',
          workspaceId: 'workspace-id',
        }),
      ).resolves.toBe(true);

      for (const repository of [
        messageAttachmentRepository,
        messageBookmarkRepository,
        messageMentionRepository,
        messageReactionRepository,
        messageReminderRepository,
      ]) {
        expect(repository.delete).toHaveBeenCalledWith('workspace-id', {
          messageId: In(['message-id']),
        });
      }
    });

    it('deletes thread replies and their side records when deleting a root message', async () => {
      const messageCreatedAt = new Date('2026-06-01T12:00:00.000Z');
      const message = {
        authorUserWorkspace: {
          user: {
            email: 'author@example.com',
            firstName: 'Author',
            lastName: 'User',
          },
        },
        authorUserWorkspaceId: 'author-user-workspace-id',
        body: 'Thread starter',
        channelId: 'channel-id',
        createdAt: messageCreatedAt,
        deletedAt: null,
        directMessageThreadId: null,
        id: 'message-id',
        parentMessageId: null,
        pinnedAt: null,
        pinnedByUserWorkspaceId: null,
        updatedAt: messageCreatedAt,
      };
      const channelMemberRepository = {
        findOne: jest.fn().mockResolvedValue({
          channelId: 'channel-id',
          userWorkspaceId: 'author-user-workspace-id',
        }),
      };
      const channelRepository = {
        findOne: jest.fn().mockResolvedValue({
          id: 'channel-id',
          visibility: TeamChannelVisibility.PUBLIC,
        }),
      };
      const messageAttachmentRepository = {
        delete: jest.fn(),
      };
      const messageBookmarkRepository = {
        delete: jest.fn(),
      };
      const messageMentionRepository = {
        delete: jest.fn(),
      };
      const messageReactionRepository = {
        delete: jest.fn(),
      };
      const messageReminderRepository = {
        delete: jest.fn(),
      };
      const messageRepository = {
        find: jest
          .fn()
          .mockResolvedValue([
            { id: 'first-reply-id' },
            { id: 'second-reply-id' },
          ]),
        findOne: jest.fn().mockResolvedValue(message),
        update: jest.fn(),
      };
      const subscriptionService = {
        publish: jest.fn(),
      };
      const service = createTeamCommsService({
        channelMemberRepository,
        channelRepository,
        messageAttachmentRepository,
        messageBookmarkRepository,
        messageMentionRepository,
        messageReactionRepository,
        messageReminderRepository,
        messageRepository,
        subscriptionService,
      });

      await service.deleteMessage({
        messageId: 'message-id',
        userWorkspaceId: 'author-user-workspace-id',
        workspaceId: 'workspace-id',
      });

      expect(messageRepository.find).toHaveBeenCalledWith('workspace-id', {
        select: { id: true },
        where: {
          deletedAt: IsNull(),
          parentMessageId: 'message-id',
        },
      });
      expect(messageRepository.update).toHaveBeenCalledWith(
        'workspace-id',
        { id: In(['message-id', 'first-reply-id', 'second-reply-id']) },
        { deletedAt: expect.any(Date) },
      );
      for (const repository of [
        messageAttachmentRepository,
        messageBookmarkRepository,
        messageMentionRepository,
        messageReactionRepository,
        messageReminderRepository,
      ]) {
        expect(repository.delete).toHaveBeenCalledWith('workspace-id', {
          messageId: In(['message-id', 'first-reply-id', 'second-reply-id']),
        });
      }
    });

    it('removes thread read state when deleting a root thread message', async () => {
      const messageCreatedAt = new Date('2026-06-01T12:00:00.000Z');
      const message = {
        authorUserWorkspace: {
          user: {
            email: 'author@example.com',
            firstName: 'Author',
            lastName: 'User',
          },
        },
        authorUserWorkspaceId: 'author-user-workspace-id',
        body: 'Thread starter',
        channelId: 'channel-id',
        createdAt: messageCreatedAt,
        deletedAt: null,
        directMessageThreadId: null,
        id: 'message-id',
        parentMessageId: null,
        pinnedAt: null,
        pinnedByUserWorkspaceId: null,
        updatedAt: messageCreatedAt,
      };
      const channelMemberRepository = {
        findOne: jest.fn().mockResolvedValue({
          channelId: 'channel-id',
          userWorkspaceId: 'author-user-workspace-id',
        }),
      };
      const channelRepository = {
        findOne: jest.fn().mockResolvedValue({
          id: 'channel-id',
          visibility: TeamChannelVisibility.PUBLIC,
        }),
      };
      const messageAttachmentRepository = {
        delete: jest.fn(),
      };
      const messageBookmarkRepository = {
        delete: jest.fn(),
      };
      const messageMentionRepository = {
        delete: jest.fn(),
      };
      const messageReactionRepository = {
        delete: jest.fn(),
      };
      const messageReminderRepository = {
        delete: jest.fn(),
      };
      const messageRepository = {
        find: jest.fn().mockResolvedValue([]),
        findOne: jest.fn().mockResolvedValue(message),
        update: jest.fn(),
      };
      const messageThreadReadRepository = {
        delete: jest.fn(),
      };
      const subscriptionService = {
        publish: jest.fn(),
      };
      const service = createTeamCommsService({
        channelMemberRepository,
        channelRepository,
        messageAttachmentRepository,
        messageBookmarkRepository,
        messageMentionRepository,
        messageReactionRepository,
        messageReminderRepository,
        messageRepository,
        messageThreadReadRepository,
        subscriptionService,
      });

      await service.deleteMessage({
        messageId: 'message-id',
        userWorkspaceId: 'author-user-workspace-id',
        workspaceId: 'workspace-id',
      });

      expect(messageThreadReadRepository.delete).toHaveBeenCalledWith(
        'workspace-id',
        { parentMessageId: In(['message-id']) },
      );
    });
  });

  describe('createDirectMessage', () => {
    it('returns an existing direct-message thread for the selected workspace user', async () => {
      const updatedAt = new Date('2026-06-01T12:00:00.000Z');
      const userWorkspaceRepository = {
        findOne: jest.fn().mockResolvedValue({
          id: 'participant-user-workspace-id',
          user: {
            email: 'ada@example.com',
            firstName: 'Ada',
            lastName: 'Lovelace',
          },
        }),
      };
      const directMessageThreadRepository = {
        findOne: jest.fn().mockResolvedValue({
          id: 'thread-id',
          updatedAt,
        }),
      };
      const directMessageParticipantRepository = {
        findOne: jest.fn().mockResolvedValue({ id: 'participant-id' }),
        findOneOrFail: jest.fn().mockResolvedValue({ lastReadAt: null }),
      };
      const messageRepository = {
        count: jest.fn().mockResolvedValue(0),
        findOne: jest.fn().mockResolvedValue(null),
      };
      const service = createTeamCommsService({
        directMessageParticipantRepository,
        directMessageThreadRepository,
        messageRepository,
        userWorkspaceRepository,
      });

      await expect(
        service.createDirectMessage({
          participantUserWorkspaceId: 'participant-user-workspace-id',
          userWorkspaceId: 'current-user-workspace-id',
          workspaceId: 'workspace-id',
        }),
      ).resolves.toEqual({
        id: 'thread-id',
        lastMessageBody: null,
        participantEmail: 'ada@example.com',
        participantName: 'Ada Lovelace',
        participantUserWorkspaceId: 'participant-user-workspace-id',
        unreadCount: 0,
        updatedAt,
      });
    });

    it('rejects starting a direct message with the current user', async () => {
      const service = createTeamCommsService({});

      await expect(
        service.createDirectMessage({
          participantUserWorkspaceId: 'current-user-workspace-id',
          userWorkspaceId: 'current-user-workspace-id',
          workspaceId: 'workspace-id',
        }),
      ).rejects.toThrow('Cannot start a direct message with yourself.');
    });
  });
});
