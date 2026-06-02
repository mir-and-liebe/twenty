import {
  getNextTeamConversationMuteLevel,
  isTeamConversationMuted,
} from '@/team/utils/teamConversationNotifications';

describe('team conversation notifications', () => {
  it('detects muted conversations regardless of backend casing', () => {
    expect(isTeamConversationMuted('muted')).toBe(true);
    expect(isTeamConversationMuted('MUTED')).toBe(true);
    expect(isTeamConversationMuted('Muted')).toBe(true);
  });

  it('keeps active notification levels unmuted', () => {
    expect(isTeamConversationMuted('all')).toBe(false);
    expect(isTeamConversationMuted('mentions')).toBe(false);
    expect(isTeamConversationMuted(null)).toBe(false);
    expect(isTeamConversationMuted(undefined)).toBe(false);
  });

  it('toggles conversations between muted and all-message notification levels', () => {
    expect(getNextTeamConversationMuteLevel('muted')).toBe('ALL');
    expect(getNextTeamConversationMuteLevel('MUTED')).toBe('ALL');
    expect(getNextTeamConversationMuteLevel('mentions')).toBe('MUTED');
    expect(getNextTeamConversationMuteLevel('ALL')).toBe('MUTED');
    expect(getNextTeamConversationMuteLevel(null)).toBe('MUTED');
  });
});
