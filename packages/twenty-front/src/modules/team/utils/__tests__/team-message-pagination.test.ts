import { mergeEarlierTeamMessages } from '@/team/utils/teamMessagePagination';

describe('team message pagination', () => {
  it('prepends older messages without duplicating already loaded messages', () => {
    expect(
      mergeEarlierTeamMessages({
        existingMessages: [{ id: 'message-2' }, { id: 'message-3' }],
        olderMessages: [{ id: 'message-1' }, { id: 'message-2' }],
        pageSize: 2,
      }),
    ).toEqual({
      hasLoadedAllEarlierMessages: false,
      messages: [{ id: 'message-1' }, { id: 'message-2' }, { id: 'message-3' }],
    });
  });

  it('marks earlier history exhausted when the older page is smaller than the page size', () => {
    expect(
      mergeEarlierTeamMessages({
        existingMessages: [{ id: 'message-3' }],
        olderMessages: [{ id: 'message-1' }],
        pageSize: 2,
      }),
    ).toEqual({
      hasLoadedAllEarlierMessages: true,
      messages: [{ id: 'message-1' }, { id: 'message-3' }],
    });
  });

  it('marks earlier history exhausted when no older messages are returned', () => {
    expect(
      mergeEarlierTeamMessages({
        existingMessages: [{ id: 'message-1' }],
        olderMessages: [],
        pageSize: 100,
      }),
    ).toEqual({
      hasLoadedAllEarlierMessages: true,
      messages: [{ id: 'message-1' }],
    });
  });
});
