import { buildTeamMessageLink } from '@/team/utils/teamMessageLinks';

describe('team message links', () => {
  it('builds a channel permalink for a root message without forcing the thread panel', () => {
    expect(
      buildTeamMessageLink({
        channelId: 'channel-1',
        messageId: 'message-1',
        origin: 'https://crm.test',
        pathname: '/team',
        parentMessageId: null,
      }),
    ).toBe(
      'https://crm.test/team?teamChannelId=channel-1&teamMessageId=message-1',
    );
  });

  it('builds a direct message thread permalink for a reply', () => {
    expect(
      buildTeamMessageLink({
        directMessageThreadId: 'dm-1',
        messageId: 'reply-1',
        origin: 'https://crm.test',
        parentMessageId: 'message-1',
        pathname: '/team',
      }),
    ).toBe(
      'https://crm.test/team?teamDirectMessageId=dm-1&teamThreadParentMessageId=message-1&teamMessageId=reply-1',
    );
  });

  it('rejects message permalinks without exactly one conversation target', () => {
    expect(() =>
      buildTeamMessageLink({
        messageId: 'message-1',
        origin: 'https://crm.test',
        pathname: '/team',
      }),
    ).toThrow('Exactly one Team Comms conversation is required.');

    expect(() =>
      buildTeamMessageLink({
        channelId: 'channel-1',
        directMessageThreadId: 'dm-1',
        messageId: 'message-1',
        origin: 'https://crm.test',
        pathname: '/team',
      }),
    ).toThrow('Exactly one Team Comms conversation is required.');
  });
});
