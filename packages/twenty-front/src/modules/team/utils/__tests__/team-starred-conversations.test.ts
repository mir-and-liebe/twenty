import {
  getTeamStarredConversationsStorageKey,
  getTeamStarredConversationKey,
  loadTeamStarredConversationKeys,
  saveTeamStarredConversationKeys,
  sortTeamConversationsByStarred,
  toggleTeamStarredConversationKey,
} from '@/team/utils/teamStarredConversations';

describe('team starred conversations', () => {
  it('builds stable keys for starred channels and direct messages', () => {
    expect(
      getTeamStarredConversationKey({
        conversationId: 'channel-1',
        conversationType: 'channel',
      }),
    ).toBe('channel:channel-1');

    expect(
      getTeamStarredConversationKey({
        conversationId: 'dm-1',
        conversationType: 'direct-message',
      }),
    ).toBe('direct-message:dm-1');
  });

  it('builds workspace-scoped storage keys with a legacy fallback key', () => {
    expect(getTeamStarredConversationsStorageKey()).toBe(
      'twenty:team-comms:starred-conversations',
    );
    expect(
      getTeamStarredConversationsStorageKey({ workspaceId: 'workspace-id' }),
    ).toBe('twenty:team-comms:starred-conversations:workspace-id');
  });

  it('loads scoped starred conversations before falling back to legacy storage', () => {
    window.localStorage.clear();
    window.localStorage.setItem(
      getTeamStarredConversationsStorageKey(),
      JSON.stringify(['channel:legacy']),
    );

    expect([
      ...loadTeamStarredConversationKeys({ workspaceId: 'workspace-id' }),
    ]).toEqual(['channel:legacy']);

    window.localStorage.setItem(
      getTeamStarredConversationsStorageKey({ workspaceId: 'workspace-id' }),
      JSON.stringify(['direct-message:scoped']),
    );

    expect([
      ...loadTeamStarredConversationKeys({ workspaceId: 'workspace-id' }),
    ]).toEqual(['direct-message:scoped']);
  });

  it('saves starred conversations to workspace-scoped storage', () => {
    window.localStorage.clear();

    saveTeamStarredConversationKeys(new Set(['channel:general']), {
      workspaceId: 'workspace-id',
    });

    expect(
      window.localStorage.getItem(
        getTeamStarredConversationsStorageKey({ workspaceId: 'workspace-id' }),
      ),
    ).toBe(JSON.stringify(['channel:general']));
    expect(
      window.localStorage.getItem(getTeamStarredConversationsStorageKey()),
    ).toBeNull();
  });

  it('toggles starred conversation keys without mutating the current set', () => {
    const currentKeys = new Set(['channel:general']);
    const addedKeys = toggleTeamStarredConversationKey({
      conversationKey: 'direct-message:ada',
      currentKeys,
    });
    const removedKeys = toggleTeamStarredConversationKey({
      conversationKey: 'channel:general',
      currentKeys,
    });

    expect([...addedKeys]).toEqual(['channel:general', 'direct-message:ada']);
    expect([...removedKeys]).toEqual([]);
    expect([...currentKeys]).toEqual(['channel:general']);
  });

  it('moves starred conversations to the top while preserving relative order', () => {
    const conversations = [
      {
        id: 'general',
        name: 'General',
        unreadCount: 0,
        updatedAt: '2026-06-01T09:00:00.000Z',
      },
      {
        id: 'product',
        name: 'Product',
        unreadCount: 4,
        updatedAt: '2026-06-01T11:00:00.000Z',
      },
      {
        id: 'sales',
        name: 'Sales',
        unreadCount: 0,
        updatedAt: '2026-06-01T08:00:00.000Z',
      },
    ];

    expect(
      sortTeamConversationsByStarred({
        conversations,
        getConversationKey: (conversation) =>
          getTeamStarredConversationKey({
            conversationId: conversation.id,
            conversationType: 'channel',
          }),
        starredConversationKeys: new Set(['channel:sales']),
      }).map((conversation) => conversation.id),
    ).toEqual(['sales', 'product', 'general']);
  });

  it('sorts unstarred conversations by unread activity and recency', () => {
    const conversations = [
      {
        id: 'old-unread',
        name: 'Old unread',
        unreadCount: 1,
        updatedAt: '2026-06-01T09:00:00.000Z',
      },
      {
        id: 'recent-read',
        name: 'Recent read',
        unreadCount: 0,
        updatedAt: '2026-06-01T12:00:00.000Z',
      },
      {
        id: 'recent-unread',
        name: 'Recent unread',
        unreadCount: 2,
        updatedAt: '2026-06-01T10:00:00.000Z',
      },
      {
        id: 'older-read',
        name: 'Older read',
        unreadCount: 0,
        updatedAt: '2026-06-01T08:00:00.000Z',
      },
    ];

    expect(
      sortTeamConversationsByStarred({
        conversations,
        getConversationKey: (conversation) =>
          getTeamStarredConversationKey({
            conversationId: conversation.id,
            conversationType: 'direct-message',
          }),
        starredConversationKeys: new Set(),
      }).map((conversation) => conversation.id),
    ).toEqual(['recent-unread', 'old-unread', 'recent-read', 'older-read']);
  });
});
