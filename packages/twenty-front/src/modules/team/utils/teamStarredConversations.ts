export type TeamStarredConversationType = 'channel' | 'direct-message';

const TEAM_STARRED_CONVERSATIONS_STORAGE_KEY =
  'twenty:team-comms:starred-conversations';

const getLocalStorage = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
};

export const getTeamStarredConversationKey = ({
  conversationId,
  conversationType,
}: {
  conversationId: string;
  conversationType: TeamStarredConversationType;
}) => `${conversationType}:${conversationId}`;

export const getTeamStarredConversationsStorageKey = ({
  workspaceId,
}: {
  workspaceId?: string | null;
} = {}) =>
  workspaceId
    ? `${TEAM_STARRED_CONVERSATIONS_STORAGE_KEY}:${workspaceId}`
    : TEAM_STARRED_CONVERSATIONS_STORAGE_KEY;

const parseTeamStarredConversationKeys = (rawValue: string | null) => {
  if (!rawValue) {
    return new Set<string>();
  }

  const parsedValue = JSON.parse(rawValue);

  return Array.isArray(parsedValue)
    ? new Set(parsedValue.filter((value) => typeof value === 'string'))
    : new Set<string>();
};

export const loadTeamStarredConversationKeys = ({
  workspaceId,
}: {
  workspaceId?: string | null;
} = {}) => {
  try {
    const localStorage = getLocalStorage();
    const scopedRawValue = localStorage?.getItem(
      getTeamStarredConversationsStorageKey({ workspaceId }),
    );

    if (scopedRawValue) {
      return parseTeamStarredConversationKeys(scopedRawValue);
    }

    return parseTeamStarredConversationKeys(
      localStorage?.getItem(getTeamStarredConversationsStorageKey()) ?? null,
    );
  } catch {
    return new Set<string>();
  }
};

export const saveTeamStarredConversationKeys = (
  starredConversationKeys: Set<string>,
  {
    workspaceId,
  }: {
    workspaceId?: string | null;
  } = {},
) => {
  try {
    getLocalStorage()?.setItem(
      getTeamStarredConversationsStorageKey({ workspaceId }),
      JSON.stringify([...starredConversationKeys]),
    );
  } catch {
    return;
  }
};

export const toggleTeamStarredConversationKey = ({
  conversationKey,
  currentKeys,
}: {
  conversationKey: string;
  currentKeys: Set<string>;
}) => {
  const nextKeys = new Set(currentKeys);

  if (nextKeys.has(conversationKey)) {
    nextKeys.delete(conversationKey);

    return nextKeys;
  }

  nextKeys.add(conversationKey);

  return nextKeys;
};

export const sortTeamConversationsByStarred = <TConversation>({
  conversations,
  getConversationKey,
  starredConversationKeys,
}: {
  conversations: Array<
    TConversation & { unreadCount?: number; updatedAt?: string }
  >;
  getConversationKey: (conversation: TConversation) => string;
  starredConversationKeys: Set<string>;
}) =>
  [...conversations].sort((firstConversation, secondConversation) => {
    const isFirstConversationStarred = starredConversationKeys.has(
      getConversationKey(firstConversation),
    );
    const isSecondConversationStarred = starredConversationKeys.has(
      getConversationKey(secondConversation),
    );

    if (isFirstConversationStarred === isSecondConversationStarred) {
      const firstUnreadCount = firstConversation.unreadCount ?? 0;
      const secondUnreadCount = secondConversation.unreadCount ?? 0;

      if (firstUnreadCount !== secondUnreadCount) {
        return secondUnreadCount - firstUnreadCount;
      }

      const firstUpdatedAt = firstConversation.updatedAt
        ? new Date(firstConversation.updatedAt).getTime()
        : 0;
      const secondUpdatedAt = secondConversation.updatedAt
        ? new Date(secondConversation.updatedAt).getTime()
        : 0;

      return secondUpdatedAt - firstUpdatedAt;
    }

    return isFirstConversationStarred ? -1 : 1;
  });
