type TeamMessagePaginationItem = {
  id: string;
};

export const mergeEarlierTeamMessages = <
  TeamMessage extends TeamMessagePaginationItem,
>({
  existingMessages,
  olderMessages,
  pageSize,
}: {
  existingMessages: TeamMessage[];
  olderMessages: TeamMessage[];
  pageSize: number;
}) => {
  const existingMessageIds = new Set(
    existingMessages.map((message) => message.id),
  );
  const uniqueOlderMessages = olderMessages.filter(
    (message) => !existingMessageIds.has(message.id),
  );

  return {
    hasLoadedAllEarlierMessages: olderMessages.length < pageSize,
    messages: [...uniqueOlderMessages, ...existingMessages],
  };
};
