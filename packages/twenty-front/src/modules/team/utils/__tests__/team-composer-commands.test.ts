import { applyTeamComposerCommand } from '@/team/utils/teamComposerCommands';

describe('team composer commands', () => {
  it('expands known slash commands before sending a team message', () => {
    expect(applyTeamComposerCommand('/shrug')).toBe('¯\\_(ツ)_/¯');
    expect(applyTeamComposerCommand('/shrug maybe')).toBe('maybe ¯\\_(ツ)_/¯');
    expect(applyTeamComposerCommand('/tableflip')).toBe('(╯°□°）╯︵ ┻━┻');
    expect(applyTeamComposerCommand('/unflip thanks')).toBe(
      'thanks ┬─┬ ノ( ゜-゜ノ)',
    );
  });

  it('preserves regular messages and unknown slash commands', () => {
    expect(applyTeamComposerCommand('normal update')).toBe('normal update');
    expect(applyTeamComposerCommand('/unknown keep this')).toBe(
      '/unknown keep this',
    );
  });

  it('expands Slack-style emoji shortcodes before sending', () => {
    expect(applyTeamComposerCommand('Deploy is :rocket:')).toBe('Deploy is 🚀');
    expect(applyTeamComposerCommand(':white_check_mark: shipped')).toBe(
      '✅ shipped',
    );
  });

  it('expands /me action messages into rendered action text', () => {
    expect(applyTeamComposerCommand('/me shipped :rocket:')).toBe(
      '_shipped 🚀_',
    );
    expect(applyTeamComposerCommand('/ME checks deploy')).toBe(
      '_checks deploy_',
    );
  });

  it('expands /quote messages into rendered quote blocks', () => {
    expect(applyTeamComposerCommand('/quote Ship it :rocket:')).toBe(
      '> Ship it 🚀',
    );
    expect(applyTeamComposerCommand('/QUOTE first line\nsecond line')).toBe(
      '> first line\n> second line',
    );
  });

  it('expands /code messages into rendered code blocks', () => {
    expect(applyTeamComposerCommand('/code yarn start')).toBe(
      '```\nyarn start\n```',
    );
    expect(applyTeamComposerCommand('/CODE const status = "ready";')).toBe(
      '```\nconst status = "ready";\n```',
    );
  });
});
