import { getTeamConversationTarget } from '@/team/utils/teamConversationTargets';

describe('team conversation targets', () => {
  it('resolves channel targets with a thread parent when available', () => {
    expect(
      getTeamConversationTarget({
        channelId: 'channel-1',
        messageId: 'reply-1',
        parentMessageId: 'root-1',
      }),
    ).toEqual({
      channelId: 'channel-1',
      directMessageThreadId: null,
      messageId: 'reply-1',
      threadParentMessageId: 'root-1',
    });
  });

  it('keeps root message-level targets in the main conversation by default', () => {
    expect(
      getTeamConversationTarget({
        directMessageThreadId: 'dm-1',
        messageId: 'message-1',
      }),
    ).toEqual({
      channelId: null,
      directMessageThreadId: 'dm-1',
      messageId: 'message-1',
      threadParentMessageId: null,
    });
  });

  it('accepts TeamMessage-shaped targets with an id field without opening a thread', () => {
    expect(
      getTeamConversationTarget({
        channelId: 'channel-1',
        id: 'message-1',
        parentMessageId: null,
      }),
    ).toEqual({
      channelId: 'channel-1',
      directMessageThreadId: null,
      messageId: 'message-1',
      threadParentMessageId: null,
    });
  });

  it('opens the thread panel when a target explicitly requests a thread parent', () => {
    expect(
      getTeamConversationTarget({
        channelId: 'channel-1',
        messageId: 'message-1',
        threadParentMessageId: 'message-1',
      }),
    ).toEqual({
      channelId: 'channel-1',
      directMessageThreadId: null,
      messageId: 'message-1',
      threadParentMessageId: 'message-1',
    });
  });

  it('keeps conversation-only targets out of the thread panel', () => {
    expect(getTeamConversationTarget({ channelId: 'channel-1' })).toEqual({
      channelId: 'channel-1',
      directMessageThreadId: null,
      messageId: null,
      threadParentMessageId: null,
    });
  });
});
