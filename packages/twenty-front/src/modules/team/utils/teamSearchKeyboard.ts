type TeamSearchShortcutEvent = {
  ctrlKey: boolean;
  isComposing: boolean;
  key: string;
  metaKey: boolean;
  shiftKey: boolean;
};

export const shouldFocusTeamMessageSearch = ({
  ctrlKey,
  isComposing,
  key,
  metaKey,
  shiftKey,
}: TeamSearchShortcutEvent) =>
  key.toLowerCase() === 'k' &&
  !shiftKey &&
  !isComposing &&
  (metaKey || ctrlKey);
