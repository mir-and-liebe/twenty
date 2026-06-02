import { print } from 'graphql';

import {
  CREATE_TEAM_CHANNEL,
  CREATE_TEAM_DIRECT_MESSAGE,
  GET_TEAM_CHANNELS,
  GET_TEAM_DIRECT_MESSAGE_MESSAGES,
  GET_TEAM_DIRECT_MESSAGES,
  GET_TEAM_FILES,
  GET_TEAM_INBOX,
  GET_TEAM_MENTIONS,
  GET_TEAM_MESSAGE_THREAD,
  GET_TEAM_MEMBERS,
  GET_TEAM_MESSAGE_REMINDERS,
  GET_TEAM_MESSAGES,
  GET_TEAM_PINNED_MESSAGES,
  GET_TEAM_PRESENCE,
  GET_TEAM_SAVED_MESSAGES,
  GET_TEAM_TYPING_INDICATORS,
  HEARTBEAT_TEAM_TYPING,
  JOIN_TEAM_CHANNEL,
  MARK_TEAM_INBOX_READ,
  MARK_TEAM_MESSAGE_UNREAD,
  MARK_TEAM_MESSAGE_THREAD_READ,
  SEARCH_TEAM_MESSAGES,
  UPDATE_TEAM_CHANNEL,
  UPDATE_TEAM_DIRECT_MESSAGE_NOTIFICATION_LEVEL,
} from '@/team/graphql/teamCommsOperations';

describe('team comms GraphQL operations', () => {
  it('requests current-user channel notification levels with channel rows', () => {
    expect(print(GET_TEAM_CHANNELS)).toContain('notificationLevel');
  });

  it('keeps channel mutation payloads aligned with channel rows', () => {
    for (const operation of [
      CREATE_TEAM_CHANNEL,
      UPDATE_TEAM_CHANNEL,
      JOIN_TEAM_CHANNEL,
    ]) {
      expect(print(operation)).toContain('notificationLevel');
    }
  });

  it('defines a message-level mark unread mutation', () => {
    expect(print(MARK_TEAM_MESSAGE_UNREAD)).toContain('markTeamMessageUnread');
    expect(print(MARK_TEAM_MESSAGE_UNREAD)).toContain('$messageId: UUID!');
  });

  it('defines a thread-level mark read mutation', () => {
    expect(print(MARK_TEAM_MESSAGE_THREAD_READ)).toContain(
      'markTeamMessageThreadRead',
    );
    expect(print(MARK_TEAM_MESSAGE_THREAD_READ)).toContain(
      '$parentMessageId: UUID!',
    );
  });

  it('requests parent message ids for result navigation surfaces', () => {
    expect(print(SEARCH_TEAM_MESSAGES)).toContain('parentMessageId');
    expect(print(GET_TEAM_FILES)).toContain('parentMessageId');
    expect(print(GET_TEAM_MENTIONS)).toContain('parentMessageId');
    expect(print(GET_TEAM_MESSAGE_REMINDERS)).toContain('parentMessageId');
  });

  it('requests conversation names for saved-message labels', () => {
    expect(print(GET_TEAM_SAVED_MESSAGES)).toContain('conversationName');
  });

  it('requests message targets for inbox item navigation', () => {
    expect(print(GET_TEAM_INBOX)).toContain('messageId');
    expect(print(GET_TEAM_INBOX)).toContain('parentMessageId');
  });

  it('defines a mark-all-inbox-read mutation', () => {
    expect(print(MARK_TEAM_INBOX_READ)).toContain('markTeamInboxRead');
  });

  it('defines a direct-message creation mutation', () => {
    expect(print(CREATE_TEAM_DIRECT_MESSAGE)).toContain(
      'createTeamDirectMessage',
    );
    expect(print(CREATE_TEAM_DIRECT_MESSAGE)).toContain(
      '$participantUserWorkspaceId: UUID!',
    );
  });

  it('requests and updates direct-message notification levels', () => {
    expect(print(GET_TEAM_DIRECT_MESSAGES)).toContain('notificationLevel');
    expect(print(CREATE_TEAM_DIRECT_MESSAGE)).toContain('notificationLevel');
    expect(print(UPDATE_TEAM_DIRECT_MESSAGE_NOTIFICATION_LEVEL)).toContain(
      'updateTeamDirectMessageNotificationLevel',
    );
    expect(print(UPDATE_TEAM_DIRECT_MESSAGE_NOTIFICATION_LEVEL)).toContain(
      '$notificationLevel: TeamChannelNotificationLevel!',
    );
  });

  it('requests direct-message last-message previews', () => {
    expect(print(GET_TEAM_DIRECT_MESSAGES)).toContain('lastMessageBody');
    expect(print(CREATE_TEAM_DIRECT_MESSAGE)).toContain('lastMessageBody');
  });

  it('defines a teammate search query for direct-message creation', () => {
    expect(print(GET_TEAM_MEMBERS)).toContain('teamMembers');
    expect(print(GET_TEAM_MEMBERS)).toContain('$query: String!');
    expect(print(GET_TEAM_MEMBERS)).toContain('userWorkspaceId');
  });

  it('requests current-user identity on presence rows', () => {
    expect(print(GET_TEAM_PRESENCE)).toContain('isCurrentUser');
  });

  it('scopes typing indicators to a thread when provided', () => {
    expect(print(GET_TEAM_TYPING_INDICATORS)).toContain(
      '$parentMessageId: UUID',
    );
    expect(print(GET_TEAM_TYPING_INDICATORS)).toContain(
      'parentMessageId: $parentMessageId',
    );
    expect(print(GET_TEAM_TYPING_INDICATORS)).toContain('parentMessageId');
    expect(print(HEARTBEAT_TEAM_TYPING)).toContain('$parentMessageId: UUID');
    expect(print(HEARTBEAT_TEAM_TYPING)).toContain(
      'parentMessageId: $parentMessageId',
    );
  });

  it('defines a scoped pinned-message query for channels and direct messages', () => {
    expect(print(GET_TEAM_PINNED_MESSAGES)).toContain('teamPinnedMessages');
    expect(print(GET_TEAM_PINNED_MESSAGES)).toContain('$channelId: UUID');
    expect(print(GET_TEAM_PINNED_MESSAGES)).toContain(
      '$directMessageThreadId: UUID',
    );
    expect(print(GET_TEAM_PINNED_MESSAGES)).toContain('pinnedAt');
  });

  it('defines older-message pagination cursors for channel and direct-message histories', () => {
    expect(print(GET_TEAM_MESSAGES)).toContain('$before: String');
    expect(print(GET_TEAM_MESSAGES)).toContain('before: $before');
    expect(print(GET_TEAM_DIRECT_MESSAGE_MESSAGES)).toContain(
      '$before: String',
    );
    expect(print(GET_TEAM_DIRECT_MESSAGE_MESSAGES)).toContain(
      'before: $before',
    );
  });

  it('requests conversation names for direct-message history labels', () => {
    expect(print(GET_TEAM_DIRECT_MESSAGE_MESSAGES)).toContain(
      'conversationName',
    );
  });

  it('defines older-reply pagination cursors for message threads', () => {
    expect(print(GET_TEAM_MESSAGE_THREAD)).toContain('$before: String');
    expect(print(GET_TEAM_MESSAGE_THREAD)).toContain('before: $before');
  });

  it('requests conversation names for thread message labels', () => {
    expect(print(GET_TEAM_MESSAGE_THREAD)).toContain('conversationName');
  });
});
