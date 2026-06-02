type TeamEditKeyboardEvent = {
  ctrlKey: boolean;
  isComposing: boolean;
  key: string;
  metaKey: boolean;
  shiftKey: boolean;
};

export const shouldSaveTeamMessageEdit = ({
  ctrlKey,
  isComposing,
  key,
  metaKey,
  shiftKey,
}: TeamEditKeyboardEvent) =>
  key === 'Enter' && !shiftKey && !metaKey && !ctrlKey && !isComposing;

export const shouldCancelTeamMessageEdit = ({
  isComposing,
  key,
}: TeamEditKeyboardEvent) => key === 'Escape' && !isComposing;

export const shouldStartEditingLastTeamMessage = ({
  ctrlKey,
  draft,
  isComposing,
  key,
  metaKey,
  shiftKey,
}: TeamEditKeyboardEvent & { draft: string }) =>
  key === 'ArrowUp' &&
  draft.trim().length === 0 &&
  !shiftKey &&
  !metaKey &&
  !ctrlKey &&
  !isComposing;

export const shouldCloseTeamThread = ({
  hasOpenThread,
  isComposing,
  isEditingMessage,
  key,
}: Pick<TeamEditKeyboardEvent, 'isComposing' | 'key'> & {
  hasOpenThread: boolean;
  isEditingMessage: boolean;
}) => key === 'Escape' && hasOpenThread && !isEditingMessage && !isComposing;
