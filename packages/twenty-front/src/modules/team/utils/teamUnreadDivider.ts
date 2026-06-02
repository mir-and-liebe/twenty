export const getTeamUnreadDividerMessageId = <TMessage extends { id: string }>({
  markedUnreadMessageId,
  messages,
}: {
  markedUnreadMessageId: string | null;
  messages: TMessage[];
}) => {
  if (markedUnreadMessageId === null) {
    return null;
  }

  return messages.some((message) => message.id === markedUnreadMessageId)
    ? markedUnreadMessageId
    : null;
};
