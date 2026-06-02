import { getTeamUnreadDividerMessageId } from '@/team/utils/teamUnreadDivider';

describe('team unread divider', () => {
  const messages = [{ id: 'first' }, { id: 'second' }, { id: 'third' }];

  it('places the unread divider before the marked message', () => {
    expect(
      getTeamUnreadDividerMessageId({
        markedUnreadMessageId: 'second',
        messages,
      }),
    ).toBe('second');
  });

  it('does not place a divider when no visible message is marked unread', () => {
    expect(
      getTeamUnreadDividerMessageId({
        markedUnreadMessageId: null,
        messages,
      }),
    ).toBeNull();

    expect(
      getTeamUnreadDividerMessageId({
        markedUnreadMessageId: 'missing',
        messages,
      }),
    ).toBeNull();
  });
});
