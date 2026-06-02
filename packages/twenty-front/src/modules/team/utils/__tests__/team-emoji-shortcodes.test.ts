import {
  expandTeamEmojiShortcodes,
  getActiveTeamEmojiShortcodeQuery,
  getTeamEmojiShortcodeSuggestions,
  insertTeamEmojiShortcodeSuggestion,
} from '@/team/utils/teamEmojiShortcodes';

describe('team emoji shortcodes', () => {
  it('expands supported Slack-style emoji shortcodes in text', () => {
    expect(expandTeamEmojiShortcodes('Ship :rocket: :white_check_mark:')).toBe(
      'Ship 🚀 ✅',
    );
    expect(expandTeamEmojiShortcodes(':thumbsup: :eyes: :tada:')).toBe(
      '👍 👀 🎉',
    );
  });

  it('preserves unsupported shortcodes literally', () => {
    expect(expandTeamEmojiShortcodes('Keep :custom_company_emoji:')).toBe(
      'Keep :custom_company_emoji:',
    );
  });

  it('detects active Slack-style emoji shortcode queries at the end of a draft', () => {
    expect(getActiveTeamEmojiShortcodeQuery(':roc')).toBe('roc');
    expect(getActiveTeamEmojiShortcodeQuery('Ship it :white')).toBe('white');
    expect(getActiveTeamEmojiShortcodeQuery('Ship :rocket: now')).toBeNull();
  });

  it('filters emoji shortcode suggestions by prefix', () => {
    expect(
      getTeamEmojiShortcodeSuggestions('Ship :ro').map(
        (suggestion) => suggestion.name,
      ),
    ).toEqual(['rocket']);

    expect(
      getTeamEmojiShortcodeSuggestions(':th').map(
        (suggestion) => suggestion.name,
      ),
    ).toEqual(['thumbsdown', 'thumbsup']);
  });

  it('inserts selected emoji suggestions without losing draft context', () => {
    expect(
      insertTeamEmojiShortcodeSuggestion({
        draftMessage: 'Ship :ro',
        suggestion: {
          emoji: '🚀',
          name: 'rocket',
          shortcode: ':rocket:',
        },
      }),
    ).toBe('Ship 🚀 ');
  });
});
