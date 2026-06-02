type TeamEditableMessage = {
  canEdit: boolean;
};

export const getLastEditableTeamMessage = <
  TMessage extends TeamEditableMessage,
>(
  messages: TMessage[],
) => {
  return [...messages].reverse().find((message) => message.canEdit) ?? null;
};
