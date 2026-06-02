import {
  getTeamHighlightedMessageId,
  getTeamMessageElementId,
  getTeamMessageScrollTarget,
} from '@/team/utils/teamHighlightedMessage';

describe('team highlighted message', () => {
  it('returns the requested message id when it is visible', () => {
    expect(
      getTeamHighlightedMessageId({
        messages: [{ id: 'message-1' }, { id: 'message-2' }],
        requestedMessageId: 'message-2',
      }),
    ).toBe('message-2');
  });

  it('returns null when no message id was requested', () => {
    expect(
      getTeamHighlightedMessageId({
        messages: [{ id: 'message-1' }],
        requestedMessageId: null,
      }),
    ).toBeNull();
  });

  it('returns null when the requested message is not visible', () => {
    expect(
      getTeamHighlightedMessageId({
        messages: [{ id: 'message-1' }],
        requestedMessageId: 'message-2',
      }),
    ).toBeNull();
  });

  it('uses the thread highlighted message as the preferred scroll target', () => {
    expect(
      getTeamMessageScrollTarget({
        mainHighlightedMessageId: 'message-1',
        threadHighlightedMessageId: 'reply-1',
      }),
    ).toEqual({
      messageId: 'reply-1',
      scope: 'thread',
    });
  });

  it('falls back to the main highlighted message as the scroll target', () => {
    expect(
      getTeamMessageScrollTarget({
        mainHighlightedMessageId: 'message-1',
        threadHighlightedMessageId: null,
      }),
    ).toEqual({
      messageId: 'message-1',
      scope: 'main',
    });
  });

  it('returns null when no highlighted message is visible', () => {
    expect(
      getTeamMessageScrollTarget({
        mainHighlightedMessageId: null,
        threadHighlightedMessageId: null,
      }),
    ).toBeNull();
  });

  it('builds stable element ids for scrollable messages', () => {
    expect(
      getTeamMessageElementId({ messageId: 'message-1', scope: 'main' }),
    ).toBe('team-message-main-message-1');

    expect(
      getTeamMessageElementId({ messageId: 'reply-1', scope: 'thread' }),
    ).toBe('team-message-thread-reply-1');
  });
});
