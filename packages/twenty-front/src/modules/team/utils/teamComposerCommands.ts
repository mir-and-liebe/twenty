import { expandTeamEmojiShortcodes } from '@/team/utils/teamEmojiShortcodes';

const TEAM_COMPOSER_COMMAND_EXPANSIONS = {
  shrug: '¯\\_(ツ)_/¯',
  tableflip: '(╯°□°）╯︵ ┻━┻',
  unflip: '┬─┬ ノ( ゜-゜ノ)',
} as const;

export const applyTeamComposerCommand = (messageBody: string) => {
  const [rawCommand, ...messageParts] = messageBody.split(' ');
  const command = rawCommand.startsWith('/')
    ? rawCommand.slice(1).toLowerCase()
    : '';
  const remainingMessage = messageParts.join(' ').trim();

  if (command === 'me' && remainingMessage.length > 0) {
    return `_${expandTeamEmojiShortcodes(remainingMessage)}_`;
  }

  if (command === 'quote' && remainingMessage.length > 0) {
    return remainingMessage
      .split('\n')
      .map((line) => `> ${expandTeamEmojiShortcodes(line)}`)
      .join('\n');
  }

  if (command === 'code' && remainingMessage.length > 0) {
    return `\`\`\`\n${remainingMessage}\n\`\`\``;
  }

  const commandExpansion =
    TEAM_COMPOSER_COMMAND_EXPANSIONS[
      command as keyof typeof TEAM_COMPOSER_COMMAND_EXPANSIONS
    ];

  if (!commandExpansion) {
    return expandTeamEmojiShortcodes(messageBody);
  }

  const expandedMessage =
    remainingMessage.length > 0
      ? `${remainingMessage} ${commandExpansion}`
      : commandExpansion;

  return expandTeamEmojiShortcodes(expandedMessage);
};
