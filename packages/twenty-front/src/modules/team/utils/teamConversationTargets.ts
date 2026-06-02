export type TeamConversationTargetInput = {
  channelId?: string | null;
  directMessageThreadId?: string | null;
  id?: string | null;
  messageId?: string | null;
  parentMessageId?: string | null;
  threadParentMessageId?: string | null;
};

export const getTeamConversationTarget = ({
  channelId,
  directMessageThreadId,
  id,
  messageId,
  parentMessageId,
  threadParentMessageId,
}: TeamConversationTargetInput) => {
  const targetMessageId = messageId ?? id ?? null;

  return {
    channelId: channelId ?? null,
    directMessageThreadId: directMessageThreadId ?? null,
    messageId: targetMessageId,
    threadParentMessageId: threadParentMessageId ?? parentMessageId ?? null,
  };
};
