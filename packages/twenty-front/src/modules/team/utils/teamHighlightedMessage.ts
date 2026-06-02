type TeamHighlightableMessage = {
  id: string;
};

type TeamMessageScrollTargetScope = 'main' | 'thread';

export const getTeamHighlightedMessageId = ({
  messages,
  requestedMessageId,
}: {
  messages: readonly TeamHighlightableMessage[];
  requestedMessageId: string | null;
}) => {
  if (requestedMessageId === null) {
    return null;
  }

  return messages.some((message) => message.id === requestedMessageId)
    ? requestedMessageId
    : null;
};

export const getTeamMessageScrollTarget = ({
  mainHighlightedMessageId,
  threadHighlightedMessageId,
}: {
  mainHighlightedMessageId: string | null;
  threadHighlightedMessageId: string | null;
}): { messageId: string; scope: TeamMessageScrollTargetScope } | null => {
  if (threadHighlightedMessageId !== null) {
    return {
      messageId: threadHighlightedMessageId,
      scope: 'thread',
    };
  }

  if (mainHighlightedMessageId !== null) {
    return {
      messageId: mainHighlightedMessageId,
      scope: 'main',
    };
  }

  return null;
};

export const getTeamMessageElementId = ({
  messageId,
  scope,
}: {
  messageId: string;
  scope: TeamMessageScrollTargetScope;
}) => `team-message-${scope}-${messageId}`;
