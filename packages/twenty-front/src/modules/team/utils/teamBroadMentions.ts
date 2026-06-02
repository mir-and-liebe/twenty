import {
  formatTeamMessageBody,
  formatTeamMessageTextSegments,
} from '@/team/utils/teamMessageFormatting';

const BROAD_TEAM_MENTION_ALIASES = new Set(['channel', 'everyone', 'here']);

const normalizeTeamMentionAlias = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]/g, '');

export const getTeamBroadMentionAliases = (messageBody: string) =>
  [
    ...new Set(
      formatTeamMessageBody(messageBody)
        .filter((block) => block.type !== 'code-block')
        .flatMap((block) => formatTeamMessageTextSegments(block.text))
        .filter((segment) => segment.type === 'mention')
        .map((segment) => normalizeTeamMentionAlias(segment.text.slice(1)))
        .filter((alias) => BROAD_TEAM_MENTION_ALIASES.has(alias)),
    ),
  ].sort();

export const hasTeamBroadMention = (messageBody: string) =>
  getTeamBroadMentionAliases(messageBody).length > 0;
