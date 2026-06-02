import {
  clearTeamDraft,
  getTeamDraftStorageKey,
  loadTeamDraft,
  saveTeamDraft,
} from '@/team/utils/teamDrafts';

describe('team drafts', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('stores independent drafts per channel direct message and thread', () => {
    const channelKey = getTeamDraftStorageKey({
      conversationId: 'sales',
      conversationType: 'channel',
    });
    const directMessageKey = getTeamDraftStorageKey({
      conversationId: 'dm-1',
      conversationType: 'direct-message',
    });
    const threadKey = getTeamDraftStorageKey({
      conversationId: 'sales',
      conversationType: 'channel-thread',
      parentMessageId: 'message-1',
    });

    saveTeamDraft({ key: channelKey, value: 'Channel draft' });
    saveTeamDraft({ key: directMessageKey, value: 'DM draft' });
    saveTeamDraft({ key: threadKey, value: 'Thread draft' });

    expect(loadTeamDraft(channelKey)).toBe('Channel draft');
    expect(loadTeamDraft(directMessageKey)).toBe('DM draft');
    expect(loadTeamDraft(threadKey)).toBe('Thread draft');

    clearTeamDraft(channelKey);

    expect(loadTeamDraft(channelKey)).toBe('');
    expect(loadTeamDraft(directMessageKey)).toBe('DM draft');
    expect(loadTeamDraft(threadKey)).toBe('Thread draft');
  });

  it('does not persist blank drafts', () => {
    const key = getTeamDraftStorageKey({
      conversationId: 'sales',
      conversationType: 'channel',
    });

    saveTeamDraft({ key, value: 'Draft' });
    saveTeamDraft({ key, value: '   ' });

    expect(loadTeamDraft(key)).toBe('');
  });
});
