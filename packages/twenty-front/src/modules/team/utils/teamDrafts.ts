type TeamDraftConversationType =
  | 'channel'
  | 'channel-thread'
  | 'direct-message'
  | 'direct-message-thread';

const TEAM_DRAFT_STORAGE_PREFIX = 'twenty:team-comms:draft';

export const getTeamDraftStorageKey = ({
  conversationId,
  conversationType,
  parentMessageId,
}: {
  conversationId: string | null | undefined;
  conversationType: TeamDraftConversationType;
  parentMessageId?: string | null;
}) =>
  [
    TEAM_DRAFT_STORAGE_PREFIX,
    conversationType,
    conversationId ?? 'none',
    parentMessageId ?? 'root',
  ].join(':');

const getLocalStorage = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
};

export const loadTeamDraft = (key: string) => {
  try {
    return getLocalStorage()?.getItem(key) ?? '';
  } catch {
    return '';
  }
};

export const saveTeamDraft = ({
  key,
  value,
}: {
  key: string;
  value: string;
}) => {
  try {
    if (value.trim().length === 0) {
      getLocalStorage()?.removeItem(key);

      return;
    }

    getLocalStorage()?.setItem(key, value);
  } catch {
    return;
  }
};

export const clearTeamDraft = (key: string) => {
  try {
    getLocalStorage()?.removeItem(key);
  } catch {
    return;
  }
};
