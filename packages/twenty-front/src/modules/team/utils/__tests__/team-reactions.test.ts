import { normalizeTeamReactionInput } from '@/team/utils/teamReactions';

describe('team reactions', () => {
  it('normalizes custom reaction input before sending it', () => {
    expect(normalizeTeamReactionInput('  🚀  ')).toBe('🚀');
    expect(normalizeTeamReactionInput(' shipped ')).toBe('shipped');
    expect(normalizeTeamReactionInput('')).toBeNull();
    expect(normalizeTeamReactionInput(' '.repeat(4))).toBeNull();
  });

  it('expands Slack-style emoji shortcodes for custom reactions', () => {
    expect(normalizeTeamReactionInput(':rocket:')).toBe('🚀');
    expect(normalizeTeamReactionInput(' :white_check_mark: ')).toBe('✅');
  });

  it('rejects reactions that are too long for the backend limit', () => {
    expect(normalizeTeamReactionInput('a'.repeat(32))).toBe('a'.repeat(32));
    expect(normalizeTeamReactionInput('a'.repeat(33))).toBeNull();
  });
});
