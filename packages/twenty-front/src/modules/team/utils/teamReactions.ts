import { expandTeamEmojiShortcodes } from '@/team/utils/teamEmojiShortcodes';

const TEAM_REACTION_MAX_LENGTH = 32;

export const normalizeTeamReactionInput = (reaction: string) => {
  const normalizedReaction = expandTeamEmojiShortcodes(reaction.trim());

  if (
    normalizedReaction.length === 0 ||
    normalizedReaction.length > TEAM_REACTION_MAX_LENGTH
  ) {
    return null;
  }

  return normalizedReaction;
};
