import {
  getActiveTeamComposerCommandQuery,
  getTeamComposerCommandSuggestions,
  insertTeamComposerCommandSuggestion,
} from '@/team/utils/teamComposerCommandSuggestions';

describe('team composer command suggestions', () => {
  it('detects an active slash command query at the start of the draft', () => {
    expect(getActiveTeamComposerCommandQuery('/')).toBe('');
    expect(getActiveTeamComposerCommandQuery('/sh')).toBe('sh');
    expect(getActiveTeamComposerCommandQuery('/ME')).toBe('me');
  });

  it('hides command suggestions after the command argument starts', () => {
    expect(getActiveTeamComposerCommandQuery('hello /shrug')).toBeNull();
    expect(getActiveTeamComposerCommandQuery('/me waves')).toBeNull();
  });

  it('filters available commands by prefix', () => {
    expect(
      getTeamComposerCommandSuggestions('/t').map(
        (suggestion) => suggestion.command,
      ),
    ).toEqual(['tableflip']);
    expect(
      getTeamComposerCommandSuggestions('/q').map(
        (suggestion) => suggestion.command,
      ),
    ).toEqual(['quote']);
    expect(
      getTeamComposerCommandSuggestions('/c').map(
        (suggestion) => suggestion.command,
      ),
    ).toEqual(['code']);

    expect(
      getTeamComposerCommandSuggestions('/').map(
        (suggestion) => suggestion.command,
      ),
    ).toEqual(['me', 'quote', 'code', 'shrug', 'tableflip', 'unflip']);
  });

  it('inserts the selected command without losing draft context', () => {
    expect(
      insertTeamComposerCommandSuggestion({
        command: 'shrug',
        draftMessage: '/s',
      }),
    ).toBe('/shrug ');

    expect(
      insertTeamComposerCommandSuggestion({
        command: 'me',
        draftMessage: '/m\nsecond line',
      }),
    ).toBe('/me \nsecond line');
  });
});
