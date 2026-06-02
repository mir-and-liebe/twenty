type TeamComposerKeyboardEvent = {
  ctrlKey: boolean;
  isComposing: boolean;
  key: string;
  metaKey: boolean;
  shiftKey: boolean;
};

export const shouldSendTeamComposerMessage = ({
  ctrlKey,
  isComposing,
  key,
  metaKey,
  shiftKey,
}: TeamComposerKeyboardEvent) =>
  key === 'Enter' && !shiftKey && !metaKey && !ctrlKey && !isComposing;
