export type TeamComposerCommandSuggestion = {
  command: string;
  description: string;
  usage: string;
};

export const TEAM_COMPOSER_COMMAND_SUGGESTIONS = [
  {
    command: 'me',
    description: 'Send an action message',
    usage: '/me shipped the release',
  },
  {
    command: 'quote',
    description: 'Format text as a quote',
    usage: '/quote customer said yes',
  },
  {
    command: 'code',
    description: 'Format text as a code block',
    usage: '/code yarn start',
  },
  {
    command: 'shrug',
    description: 'Append a shrug',
    usage: '/shrug',
  },
  {
    command: 'tableflip',
    description: 'Append a table flip',
    usage: '/tableflip',
  },
  {
    command: 'unflip',
    description: 'Append a table reset',
    usage: '/unflip',
  },
] as const satisfies TeamComposerCommandSuggestion[];

export const getActiveTeamComposerCommandQuery = (draftMessage: string) => {
  const firstLine = draftMessage.split('\n')[0] ?? '';

  if (!firstLine.startsWith('/')) {
    return null;
  }

  const [rawCommandToken] = firstLine.split(/\s+/);

  if (
    rawCommandToken === undefined ||
    firstLine.length > rawCommandToken.length
  ) {
    return null;
  }

  return rawCommandToken.slice(1).toLowerCase();
};

export const getTeamComposerCommandSuggestions = (draftMessage: string) => {
  const commandQuery = getActiveTeamComposerCommandQuery(draftMessage);

  if (commandQuery === null) {
    return [];
  }

  return TEAM_COMPOSER_COMMAND_SUGGESTIONS.filter((suggestion) =>
    suggestion.command.startsWith(commandQuery),
  );
};

export const insertTeamComposerCommandSuggestion = ({
  command,
  draftMessage,
}: {
  command: string;
  draftMessage: string;
}) => {
  const firstLine = draftMessage.split('\n')[0] ?? '';
  const [, ...restLines] = draftMessage.split('\n');
  const [rawCommandToken] = firstLine.split(/\s+/);

  if (!firstLine.startsWith('/') || rawCommandToken === undefined) {
    return `/${command} `;
  }

  const nextFirstLine = firstLine.replace(rawCommandToken, `/${command}`);

  if (restLines.length > 0) {
    return [
      nextFirstLine.endsWith(' ') ? nextFirstLine : `${nextFirstLine} `,
      ...restLines,
    ].join('\n');
  }

  const nextDraftMessage = [nextFirstLine, ...restLines].join('\n');

  return nextDraftMessage.endsWith(' ')
    ? nextDraftMessage
    : `${nextDraftMessage} `;
};
