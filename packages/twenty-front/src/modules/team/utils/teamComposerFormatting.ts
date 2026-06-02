export type TeamComposerFormatShortcut =
  | 'bold'
  | 'code'
  | 'italic'
  | 'strikethrough';

type TeamComposerFormatKeyboardEvent = {
  ctrlKey: boolean;
  isComposing: boolean;
  key: string;
  metaKey: boolean;
  shiftKey: boolean;
};

const TEAM_COMPOSER_FORMAT_MARKERS: Record<TeamComposerFormatShortcut, string> =
  {
    bold: '**',
    code: '`',
    italic: '_',
    strikethrough: '~',
  };

export const getTeamComposerFormatShortcut = ({
  ctrlKey,
  isComposing,
  key,
  metaKey,
  shiftKey,
}: TeamComposerFormatKeyboardEvent): TeamComposerFormatShortcut | null => {
  if (isComposing || (!metaKey && !ctrlKey)) {
    return null;
  }

  const normalizedKey = key.toLowerCase();

  if (!shiftKey && normalizedKey === 'b') {
    return 'bold';
  }

  if (!shiftKey && normalizedKey === 'i') {
    return 'italic';
  }

  if (shiftKey && normalizedKey === 'x') {
    return 'strikethrough';
  }

  if (shiftKey && normalizedKey === 'c') {
    return 'code';
  }

  return null;
};

export const applyTeamComposerFormatShortcut = ({
  draft,
  format,
  selectionEnd,
  selectionStart,
}: {
  draft: string;
  format: TeamComposerFormatShortcut;
  selectionEnd: number;
  selectionStart: number;
}) => {
  const marker = TEAM_COMPOSER_FORMAT_MARKERS[format];
  const safeSelectionStart = Math.max(
    0,
    Math.min(selectionStart, draft.length),
  );
  const safeSelectionEnd = Math.max(
    safeSelectionStart,
    Math.min(selectionEnd, draft.length),
  );
  const selectedText = draft.slice(safeSelectionStart, safeSelectionEnd);
  const nextDraft = `${draft.slice(
    0,
    safeSelectionStart,
  )}${marker}${selectedText}${marker}${draft.slice(safeSelectionEnd)}`;
  const nextSelectionStart =
    safeSelectionStart + marker.length + selectedText.length;

  return {
    draft: nextDraft,
    selectionEnd: nextSelectionStart,
    selectionStart: nextSelectionStart,
  };
};
