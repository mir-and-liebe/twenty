import {
  getTeamBroadMentionAliases,
  hasTeamBroadMention,
} from '@/team/utils/teamBroadMentions';

describe('team broad mentions', () => {
  it('detects channel broadcast mentions in rendered message text', () => {
    expect(getTeamBroadMentionAliases('@channel and @here')).toEqual([
      'channel',
      'here',
    ]);
    expect(hasTeamBroadMention('Heads up @everyone')).toBe(true);
  });

  it('ignores broad mention text inside code and urls', () => {
    expect(
      getTeamBroadMentionAliases(
        'Run `@channel` then open https://example.com/@everyone',
      ),
    ).toEqual([]);
    expect(
      getTeamBroadMentionAliases('```ts\nconst ping = "@here";\n```'),
    ).toEqual([]);
  });

  it('does not treat personal mentions as broadcast mentions', () => {
    expect(getTeamBroadMentionAliases('@ada please review')).toEqual([]);
    expect(hasTeamBroadMention('@ada please review')).toBe(false);
  });
});
