export const isTeamConversationMuted = (notificationLevel?: string | null) =>
  notificationLevel?.toLowerCase() === 'muted';

export const getNextTeamConversationMuteLevel = (
  notificationLevel?: string | null,
) => (isTeamConversationMuted(notificationLevel) ? 'ALL' : 'MUTED');
