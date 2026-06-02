export const buildTeamMessageLink = ({
  channelId,
  directMessageThreadId,
  messageId,
  origin,
  parentMessageId,
  pathname,
}: {
  channelId?: string | null;
  directMessageThreadId?: string | null;
  messageId: string;
  origin: string;
  parentMessageId?: string | null;
  pathname: string;
}) => {
  if (Boolean(channelId) === Boolean(directMessageThreadId)) {
    throw new Error('Exactly one Team Comms conversation is required.');
  }

  const url = new URL(pathname, origin);
  const threadParentMessageId = parentMessageId ?? messageId;

  if (channelId) {
    url.searchParams.set('teamChannelId', channelId);
  }

  if (directMessageThreadId) {
    url.searchParams.set('teamDirectMessageId', directMessageThreadId);
  }

  if (threadParentMessageId !== messageId) {
    url.searchParams.set('teamThreadParentMessageId', threadParentMessageId);
  }

  url.searchParams.set('teamMessageId', messageId);

  return url.toString();
};
