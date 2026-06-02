import { formatTeamTypingIndicatorText } from '@/team/utils/teamTypingIndicators';

describe('formatTeamTypingIndicatorText', () => {
  it('returns no text when nobody is typing', () => {
    expect(formatTeamTypingIndicatorText([])).toBeNull();
  });

  it('formats one active typer', () => {
    expect(formatTeamTypingIndicatorText([{ name: 'Ada' }])).toBe(
      'Ada is typing...',
    );
  });

  it('formats two active typers', () => {
    expect(
      formatTeamTypingIndicatorText([{ name: 'Ada' }, { name: 'Grace' }]),
    ).toBe('Ada, Grace are typing...');
  });

  it('summarizes additional active typers instead of hiding them', () => {
    expect(
      formatTeamTypingIndicatorText([
        { name: 'Ada' },
        { name: 'Grace' },
        { name: 'Linus' },
        { name: 'Margaret' },
      ]),
    ).toBe('Ada, Grace and 2 others are typing...');
  });
});
