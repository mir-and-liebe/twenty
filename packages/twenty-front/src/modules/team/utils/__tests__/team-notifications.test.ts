import {
  getDueTeamNotificationCandidates,
  getNewTeamNotificationCandidates,
  getTeamLiveMessageNotificationBody,
  getTeamNotificationTitle,
  getTeamUnreadBadgeCount,
  shouldShowTeamLiveMessageNotification,
} from '@/team/utils/teamNotifications';

const NOW = new Date('2026-06-01T10:00:00.000Z').getTime();

describe('team notifications', () => {
  it('counts unread inbox items and due reminders for the team badge', () => {
    expect(
      getTeamUnreadBadgeCount({
        inboxItems: [
          { id: 'sales', title: 'sales', type: 'CHANNEL', unreadCount: 3 },
          { id: 'ops', title: 'ops', type: 'CHANNEL', unreadCount: 0 },
        ],
        now: NOW,
        reminders: [
          {
            id: 'due-reminder',
            body: 'Follow up',
            conversationName: 'sales',
            remindAt: '2026-06-01T09:59:00.000Z',
          },
          {
            id: 'future-reminder',
            body: 'Later',
            conversationName: 'sales',
            remindAt: '2026-06-01T10:01:00.000Z',
          },
        ],
      }),
    ).toBe(4);
  });

  it('formats the document title with the unread team count', () => {
    expect(
      getTeamNotificationTitle({ baseTitle: 'Team Comms', count: 0 }),
    ).toBe('Team Comms');
    expect(
      getTeamNotificationTitle({ baseTitle: 'Team Comms', count: 7 }),
    ).toBe('(7) Team Comms');
  });

  it('formats attachment-only live message notifications with a readable fallback', () => {
    expect(getTeamLiveMessageNotificationBody(' Quarterly report ')).toBe(
      'Quarterly report',
    );
    expect(
      getTeamLiveMessageNotificationBody('Ship **today** with :rocket:'),
    ).toBe('Ship today with 🚀');
    expect(getTeamLiveMessageNotificationBody('   ')).toBe(
      'Attachment message',
    );
  });

  it('creates notification candidates for unread inbox items and due reminders', () => {
    expect(
      getDueTeamNotificationCandidates({
        inboxItems: [
          {
            id: 'mention-1',
            title: 'Mention in sales',
            subtitle: 'Can you review?',
            type: 'MENTION',
            unreadCount: 1,
          },
          {
            id: 'quiet-channel',
            title: 'ops',
            subtitle: '0 unread',
            type: 'CHANNEL',
            unreadCount: 0,
          },
        ],
        now: NOW,
        reminders: [
          {
            id: 'reminder-1',
            body: 'Send the quote',
            conversationName: 'sales',
            remindAt: '2026-06-01T09:00:00.000Z',
          },
        ],
      }),
    ).toEqual([
      {
        body: 'Can you review?',
        id: 'inbox:mention-1',
        title: 'Mention in sales',
      },
      {
        body: 'Send the quote',
        id: 'reminder:reminder-1',
        title: 'Reminder in sales',
      },
    ]);
  });

  it('formats attachment-only inbox and reminder notification candidates with a readable fallback', () => {
    expect(
      getDueTeamNotificationCandidates({
        inboxItems: [
          {
            id: 'thread-1',
            title: 'Thread in # sales',
            subtitle: '   ',
            type: 'THREAD',
            unreadCount: 1,
          },
        ],
        now: NOW,
        reminders: [
          {
            id: 'reminder-1',
            body: '   ',
            conversationName: 'sales',
            remindAt: '2026-06-01T09:00:00.000Z',
          },
        ],
      }),
    ).toEqual([
      {
        body: 'Attachment message',
        id: 'inbox:thread-1',
        title: 'Thread in # sales',
      },
      {
        body: 'Attachment message',
        id: 'reminder:reminder-1',
        title: 'Reminder in sales',
      },
    ]);
  });

  it('returns only notification candidates that were not already seen', () => {
    expect(
      getNewTeamNotificationCandidates({
        candidates: [
          { id: 'inbox:mention-1', title: 'Mention', body: 'First' },
          { id: 'reminder:reminder-1', title: 'Reminder', body: 'Second' },
        ],
        seenCandidateIds: new Set(['inbox:mention-1']),
      }),
    ).toEqual([
      { id: 'reminder:reminder-1', title: 'Reminder', body: 'Second' },
    ]);
  });

  it('keeps direct messages, thread replies, mentions, and reminders for mentions-only notification preference', () => {
    expect(
      getTeamUnreadBadgeCount({
        inboxItems: [
          { id: 'sales', title: 'sales', type: 'CHANNEL', unreadCount: 4 },
          {
            id: 'direct-message-1',
            title: 'Ada',
            type: 'directMessage',
            unreadCount: 3,
          },
          {
            id: 'thread-1',
            title: 'Thread in # sales',
            type: 'thread',
            unreadCount: 2,
          },
          {
            id: 'mention-1',
            title: 'Mention in sales',
            type: 'MENTION',
            unreadCount: 1,
          },
        ],
        now: NOW,
        preference: 'MENTIONS',
        reminders: [
          {
            id: 'due-reminder',
            body: 'Follow up',
            conversationName: 'sales',
            remindAt: '2026-06-01T09:59:00.000Z',
          },
        ],
      }),
    ).toBe(7);
    expect(
      getDueTeamNotificationCandidates({
        inboxItems: [
          { id: 'sales', title: 'sales', type: 'CHANNEL', unreadCount: 4 },
          {
            id: 'direct-message-1',
            title: 'Ada',
            subtitle: 'Can you review?',
            type: 'directMessage',
            unreadCount: 3,
          },
          {
            id: 'thread-1',
            title: 'Thread in # sales',
            subtitle: 'Follow-up from Grace',
            type: 'thread',
            unreadCount: 2,
          },
          {
            id: 'mention-1',
            title: 'Mention in sales',
            type: 'MENTION',
            unreadCount: 1,
          },
        ],
        now: NOW,
        preference: 'MENTIONS',
        reminders: [],
      }),
    ).toEqual([
      {
        body: 'Can you review?',
        id: 'inbox:direct-message-1',
        title: 'Ada',
      },
      {
        body: 'Follow-up from Grace',
        id: 'inbox:thread-1',
        title: 'Thread in # sales',
      },
      {
        body: '1 unread',
        id: 'inbox:mention-1',
        title: 'Mention in sales',
      },
    ]);
  });

  it('suppresses team notification badge and candidates when muted', () => {
    expect(
      getTeamUnreadBadgeCount({
        inboxItems: [
          {
            id: 'mention-1',
            title: 'Mention',
            type: 'MENTION',
            unreadCount: 1,
          },
        ],
        now: NOW,
        preference: 'MUTED',
        reminders: [
          {
            id: 'due-reminder',
            body: 'Follow up',
            conversationName: 'sales',
            remindAt: '2026-06-01T09:59:00.000Z',
          },
        ],
      }),
    ).toBe(0);
    expect(
      getDueTeamNotificationCandidates({
        inboxItems: [
          {
            id: 'mention-1',
            title: 'Mention',
            type: 'MENTION',
            unreadCount: 1,
          },
        ],
        now: NOW,
        preference: 'MUTED',
        reminders: [
          {
            id: 'due-reminder',
            body: 'Follow up',
            conversationName: 'sales',
            remindAt: '2026-06-01T09:59:00.000Z',
          },
        ],
      }),
    ).toEqual([]);
  });

  it('suppresses notification candidates during quiet hours without clearing the unread badge', () => {
    const inboxItems = [
      {
        id: 'mention-1',
        title: 'Mention',
        type: 'MENTION',
        unreadCount: 1,
      },
    ];
    const reminders = [
      {
        id: 'due-reminder',
        body: 'Follow up',
        conversationName: 'sales',
        remindAt: '2026-06-01T09:59:00.000Z',
      },
    ];

    expect(
      getDueTeamNotificationCandidates({
        inboxItems,
        now: new Date('2026-06-01T22:30:00.000Z').getTime(),
        quietHours: { end: '07:30', start: '22:00' },
        reminders,
      }),
    ).toEqual([]);
    expect(
      getDueTeamNotificationCandidates({
        inboxItems,
        now: new Date('2026-06-01T06:30:00.000Z').getTime(),
        quietHours: { end: '07:30', start: '22:00' },
        reminders,
      }),
    ).toEqual([]);
    expect(
      getTeamUnreadBadgeCount({
        inboxItems,
        now: new Date('2026-06-01T22:30:00.000Z').getTime(),
        preference: 'ALL',
        reminders,
      }),
    ).toBe(2);
  });

  it('gates live message snackbars with user preference, quiet hours, and mention state', () => {
    const currentUser = {
      email: 'ada.lovelace@example.com',
      name: 'Ada Lovelace',
      userWorkspaceId: 'current-user-workspace-id',
    };
    const baseEvent = {
      authorUserWorkspaceId: 'other-user-workspace-id',
      body: 'Can you review this?',
      isNewMessage: true,
      parentMessageId: null,
      type: 'UPSERTED',
    };

    expect(
      shouldShowTeamLiveMessageNotification({
        conversationNotificationLevel: 'ALL',
        currentUser,
        event: baseEvent,
        now: NOW,
        preference: 'ALL',
      }),
    ).toBe(true);
    expect(
      shouldShowTeamLiveMessageNotification({
        conversationNotificationLevel: 'ALL',
        currentUser,
        event: baseEvent,
        now: NOW,
        preference: 'MUTED',
      }),
    ).toBe(false);
    expect(
      shouldShowTeamLiveMessageNotification({
        conversationNotificationLevel: 'ALL',
        currentUser,
        event: baseEvent,
        now: new Date('2026-06-01T22:30:00.000Z').getTime(),
        preference: 'ALL',
        quietHours: { end: '07:30', start: '22:00' },
      }),
    ).toBe(false);
    expect(
      shouldShowTeamLiveMessageNotification({
        conversationNotificationLevel: 'ALL',
        currentUser,
        event: baseEvent,
        now: NOW,
        preference: 'MENTIONS',
      }),
    ).toBe(false);
    expect(
      shouldShowTeamLiveMessageNotification({
        conversationNotificationLevel: 'ALL',
        currentUser,
        event: {
          ...baseEvent,
          body: 'Can @ada.lovelace review this?',
        },
        now: NOW,
        preference: 'MENTIONS',
      }),
    ).toBe(true);
    expect(
      shouldShowTeamLiveMessageNotification({
        conversationNotificationLevel: 'MENTIONS',
        currentUser,
        event: {
          ...baseEvent,
          body: 'Can @AdaLovelace review this?',
        },
        now: NOW,
        preference: 'ALL',
      }),
    ).toBe(true);
    expect(
      shouldShowTeamLiveMessageNotification({
        conversationNotificationLevel: 'MENTIONS',
        currentUser,
        event: {
          ...baseEvent,
          body: '@channel heads up',
          channelId: 'channel-id',
        },
        now: NOW,
        preference: 'ALL',
      }),
    ).toBe(true);
    expect(
      shouldShowTeamLiveMessageNotification({
        conversationNotificationLevel: 'MENTIONS',
        currentUser,
        event: {
          ...baseEvent,
          body: '@here standup is starting',
          channelId: 'channel-id',
        },
        now: NOW,
        preference: 'ALL',
      }),
    ).toBe(true);
    expect(
      shouldShowTeamLiveMessageNotification({
        conversationNotificationLevel: 'MENTIONS',
        currentUser,
        event: {
          ...baseEvent,
          body: '@everyone policy update',
          channelId: 'channel-id',
        },
        now: NOW,
        preference: 'ALL',
      }),
    ).toBe(true);
    expect(
      shouldShowTeamLiveMessageNotification({
        conversationNotificationLevel: 'ALL',
        currentUser,
        event: {
          ...baseEvent,
          isNewMessage: false,
        },
        now: NOW,
        preference: 'ALL',
      }),
    ).toBe(false);
    expect(
      shouldShowTeamLiveMessageNotification({
        conversationNotificationLevel: 'ALL',
        currentUser,
        event: {
          ...baseEvent,
          authorUserWorkspaceId: currentUser.userWorkspaceId,
        },
        now: NOW,
        preference: 'ALL',
      }),
    ).toBe(false);
    expect(
      shouldShowTeamLiveMessageNotification({
        conversationNotificationLevel: 'ALL',
        currentUser,
        event: {
          ...baseEvent,
          body: 'Thread context without a mention',
          parentMessageId: 'parent-message-id',
        },
        now: NOW,
        preference: 'ALL',
      }),
    ).toBe(false);
    expect(
      shouldShowTeamLiveMessageNotification({
        conversationNotificationLevel: 'MENTIONS',
        currentUser,
        event: {
          ...baseEvent,
          body: 'Thread ping for @ada.lovelace',
          parentMessageId: 'parent-message-id',
        },
        now: NOW,
        preference: 'ALL',
      }),
    ).toBe(true);
  });

  it('treats omitted parent message ids as root message live notifications', () => {
    expect(
      shouldShowTeamLiveMessageNotification({
        conversationNotificationLevel: 'ALL',
        currentUser: {
          email: 'ada.lovelace@example.com',
          name: 'Ada Lovelace',
          userWorkspaceId: 'current-user-workspace-id',
        },
        event: {
          authorUserWorkspaceId: 'other-user-workspace-id',
          body: 'Root channel update',
          channelId: 'channel-id',
          isNewMessage: true,
          type: 'UPSERTED',
        },
        now: NOW,
        preference: 'ALL',
      }),
    ).toBe(true);
  });

  it('does not trigger mention-only live notifications from code links or email addresses', () => {
    const currentUser = {
      email: 'ada.lovelace@example.com',
      name: 'Ada Lovelace',
      userWorkspaceId: 'current-user-workspace-id',
    };
    const baseEvent = {
      authorUserWorkspaceId: 'other-user-workspace-id',
      isNewMessage: true,
      parentMessageId: null,
      type: 'UPSERTED',
    };

    expect(
      shouldShowTeamLiveMessageNotification({
        conversationNotificationLevel: 'MENTIONS',
        currentUser,
        event: {
          ...baseEvent,
          body: 'Run `@channel` then open https://example.com/@everyone and email ada@example.com',
        },
        now: NOW,
        preference: 'ALL',
      }),
    ).toBe(false);
    expect(
      shouldShowTeamLiveMessageNotification({
        conversationNotificationLevel: 'MENTIONS',
        currentUser,
        event: {
          ...baseEvent,
          body: 'Real ping for @channel',
          channelId: 'channel-id',
        },
        now: NOW,
        preference: 'ALL',
      }),
    ).toBe(true);
  });

  it('does not trigger mention-only live notifications from fenced code blocks', () => {
    const currentUser = {
      email: 'ada.lovelace@example.com',
      name: 'Ada Lovelace',
      userWorkspaceId: 'current-user-workspace-id',
    };
    const baseEvent = {
      authorUserWorkspaceId: 'other-user-workspace-id',
      channelId: 'channel-id',
      isNewMessage: true,
      parentMessageId: null,
      type: 'UPSERTED',
    };

    expect(
      shouldShowTeamLiveMessageNotification({
        conversationNotificationLevel: 'MENTIONS',
        currentUser,
        event: {
          ...baseEvent,
          body: 'Snippet:\n```ts\nconst assignee = "@ada.lovelace";\n```\nNo ping here.',
        },
        now: NOW,
        preference: 'ALL',
      }),
    ).toBe(false);
    expect(
      shouldShowTeamLiveMessageNotification({
        conversationNotificationLevel: 'MENTIONS',
        currentUser,
        event: {
          ...baseEvent,
          body: 'Snippet:\n```ts\nconst assignee = "@ada.lovelace";\n```\nReal ping for @ada.lovelace',
        },
        now: NOW,
        preference: 'ALL',
      }),
    ).toBe(true);
  });

  it('does not treat broad channel mentions as live direct-message pings', () => {
    const currentUser = {
      email: 'ada.lovelace@example.com',
      name: 'Ada Lovelace',
      userWorkspaceId: 'current-user-workspace-id',
    };
    const baseEvent = {
      authorUserWorkspaceId: 'other-user-workspace-id',
      directMessageThreadId: 'direct-message-thread-id',
      isNewMessage: true,
      parentMessageId: null,
      type: 'UPSERTED',
    };

    expect(
      shouldShowTeamLiveMessageNotification({
        conversationNotificationLevel: 'MENTIONS',
        currentUser,
        event: {
          ...baseEvent,
          body: '@channel this should stay in the DM',
        },
        now: NOW,
        preference: 'ALL',
      }),
    ).toBe(false);
    expect(
      shouldShowTeamLiveMessageNotification({
        conversationNotificationLevel: 'MENTIONS',
        currentUser,
        event: {
          ...baseEvent,
          body: 'Can @ada.lovelace review this?',
        },
        now: NOW,
        preference: 'ALL',
      }),
    ).toBe(true);
  });

  it('keeps root direct-message live notifications under mentions-only preferences', () => {
    expect(
      shouldShowTeamLiveMessageNotification({
        conversationNotificationLevel: 'ALL',
        currentUser: {
          email: 'ada.lovelace@example.com',
          name: 'Ada Lovelace',
          userWorkspaceId: 'current-user-workspace-id',
        },
        event: {
          authorUserWorkspaceId: 'other-user-workspace-id',
          body: 'Can you review the client note?',
          directMessageThreadId: 'direct-message-thread-id',
          isNewMessage: true,
          parentMessageId: null,
          type: 'UPSERTED',
        },
        now: NOW,
        preference: 'MENTIONS',
      }),
    ).toBe(true);
  });

  it('keeps direct-message thread reply live notifications when the direct message allows all messages', () => {
    expect(
      shouldShowTeamLiveMessageNotification({
        conversationNotificationLevel: 'ALL',
        currentUser: {
          email: 'ada.lovelace@example.com',
          name: 'Ada Lovelace',
          userWorkspaceId: 'current-user-workspace-id',
        },
        event: {
          authorUserWorkspaceId: 'other-user-workspace-id',
          body: 'Following up in the client thread',
          directMessageThreadId: 'direct-message-thread-id',
          isNewMessage: true,
          parentMessageId: 'parent-message-id',
          type: 'UPSERTED',
        },
        now: NOW,
        preference: 'MENTIONS',
      }),
    ).toBe(true);
  });
});
