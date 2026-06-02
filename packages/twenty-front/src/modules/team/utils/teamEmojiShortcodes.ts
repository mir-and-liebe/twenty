const TEAM_EMOJI_SHORTCODE_EXPANSIONS = {
  eyes: '👀',
  fire: '🔥',
  heart: '❤️',
  party: '🎉',
  pray: '🙏',
  rocket: '🚀',
  tada: '🎉',
  thumbsdown: '👎',
  thumbsup: '👍',
  warning: '⚠️',
  white_check_mark: '✅',
  x: '❌',
} as const;

const TEAM_EMOJI_SHORTCODE_PATTERN = /:([a-z0-9_+-]+):/g;
const ACTIVE_TEAM_EMOJI_SHORTCODE_PATTERN = /(^|\s):([a-z0-9_+-]*)$/;

export type TeamEmojiShortcodeSuggestion = {
  emoji: string;
  name: keyof typeof TEAM_EMOJI_SHORTCODE_EXPANSIONS;
  shortcode: string;
};

export const TEAM_EMOJI_SHORTCODE_SUGGESTIONS = Object.entries(
  TEAM_EMOJI_SHORTCODE_EXPANSIONS,
).map(
  ([name, emoji]) =>
    ({
      emoji,
      name,
      shortcode: `:${name}:`,
    }) as TeamEmojiShortcodeSuggestion,
);

export const expandTeamEmojiShortcodes = (text: string) =>
  text.replace(TEAM_EMOJI_SHORTCODE_PATTERN, (shortcode, shortcodeName) => {
    const expansion =
      TEAM_EMOJI_SHORTCODE_EXPANSIONS[
        shortcodeName as keyof typeof TEAM_EMOJI_SHORTCODE_EXPANSIONS
      ];

    return expansion ?? shortcode;
  });

export const getActiveTeamEmojiShortcodeQuery = (draftMessage: string) => {
  const match = draftMessage.match(ACTIVE_TEAM_EMOJI_SHORTCODE_PATTERN);

  return match?.[2]?.toLowerCase() ?? null;
};

export const getTeamEmojiShortcodeSuggestions = (draftMessage: string) => {
  const shortcodeQuery = getActiveTeamEmojiShortcodeQuery(draftMessage);

  if (shortcodeQuery === null) {
    return [];
  }

  return TEAM_EMOJI_SHORTCODE_SUGGESTIONS.filter((suggestion) =>
    suggestion.name.startsWith(shortcodeQuery),
  ).slice(0, 5);
};

export const insertTeamEmojiShortcodeSuggestion = ({
  draftMessage,
  suggestion,
}: {
  draftMessage: string;
  suggestion: TeamEmojiShortcodeSuggestion;
}) =>
  draftMessage.replace(
    ACTIVE_TEAM_EMOJI_SHORTCODE_PATTERN,
    (_match, leadingWhitespace) => `${leadingWhitespace}${suggestion.emoji} `,
  );
