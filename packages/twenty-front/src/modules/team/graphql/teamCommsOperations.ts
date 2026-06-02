import { gql } from '@apollo/client';

export const GET_TEAM_CHANNELS = gql`
  query GetTeamChannels {
    teamChannels {
      id
      name
      slug
      description
      visibility
      unreadCount
      isMember
      notificationLevel
      createdAt
      updatedAt
    }
  }
`;

export const GET_TEAM_MESSAGES = gql`
  query GetTeamMessages($channelId: UUID!, $before: String) {
    teamMessages(channelId: $channelId, before: $before) {
      id
      channelId
      directMessageThreadId
      authorUserWorkspaceId
      authorName
      conversationName
      body
      canEdit
      canDelete
      parentMessageId
      isPinned
      isSaved
      pinnedAt
      pinnedByUserWorkspaceId
      reactions {
        emoji
        count
        hasReacted
      }
      attachments {
        id
        name
        url
        mimeType
        size
        createdAt
      }
      replyCount
      createdAt
      updatedAt
    }
  }
`;

export const ON_TEAM_MESSAGE_EVENT = gql`
  subscription OnTeamMessageEvent(
    $channelId: UUID
    $directMessageThreadId: UUID
  ) {
    onTeamMessageEvent(
      channelId: $channelId
      directMessageThreadId: $directMessageThreadId
    ) {
      type
      isNewMessage
      messageId
      authorUserWorkspaceId
      authorName
      body
      channelId
      directMessageThreadId
      parentMessageId
    }
  }
`;

export const GET_TEAM_CHANNEL_MEMBERS = gql`
  query GetTeamChannelMembers($channelId: UUID!) {
    teamChannelMembers(channelId: $channelId) {
      id
      channelId
      userWorkspaceId
      name
      email
      role
      notificationLevel
      isCurrentUser
      createdAt
    }
  }
`;

export const GET_TEAM_TYPING_INDICATORS = gql`
  query GetTeamTypingIndicators(
    $channelId: UUID
    $directMessageThreadId: UUID
    $parentMessageId: UUID
  ) {
    teamTypingIndicators(
      channelId: $channelId
      directMessageThreadId: $directMessageThreadId
      parentMessageId: $parentMessageId
    ) {
      userWorkspaceId
      name
      channelId
      directMessageThreadId
      parentMessageId
      expiresAt
    }
  }
`;

export const HEARTBEAT_TEAM_TYPING = gql`
  mutation HeartbeatTeamTyping(
    $channelId: UUID
    $directMessageThreadId: UUID
    $parentMessageId: UUID
  ) {
    heartbeatTeamTyping(
      channelId: $channelId
      directMessageThreadId: $directMessageThreadId
      parentMessageId: $parentMessageId
    ) {
      userWorkspaceId
      name
      channelId
      directMessageThreadId
      parentMessageId
      expiresAt
    }
  }
`;

export const SEND_TEAM_MESSAGE = gql`
  mutation SendTeamMessage(
    $channelId: UUID!
    $body: String!
    $parentMessageId: UUID
    $attachments: [TeamMessageAttachmentInput!]
  ) {
    sendTeamMessage(
      channelId: $channelId
      body: $body
      parentMessageId: $parentMessageId
      attachments: $attachments
    ) {
      id
      channelId
      directMessageThreadId
      authorUserWorkspaceId
      authorName
      conversationName
      body
      canEdit
      canDelete
      parentMessageId
      isPinned
      isSaved
      pinnedAt
      pinnedByUserWorkspaceId
      reactions {
        emoji
        count
        hasReacted
      }
      attachments {
        id
        name
        url
        mimeType
        size
        createdAt
      }
      replyCount
      createdAt
      updatedAt
    }
  }
`;

export const UPLOAD_TEAM_MESSAGE_ATTACHMENT = gql`
  mutation UploadTeamMessageAttachment(
    $file: Upload!
    $channelId: UUID
    $directMessageThreadId: UUID
  ) {
    uploadTeamMessageAttachment(
      file: $file
      channelId: $channelId
      directMessageThreadId: $directMessageThreadId
    ) {
      id
      path
      size
      createdAt
      url
    }
  }
`;

export const CREATE_TEAM_CHANNEL = gql`
  mutation CreateTeamChannel(
    $name: String!
    $description: String
    $visibility: TeamChannelVisibility
  ) {
    createTeamChannel(
      name: $name
      description: $description
      visibility: $visibility
    ) {
      id
      name
      slug
      description
      visibility
      unreadCount
      isMember
      notificationLevel
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_TEAM_CHANNEL = gql`
  mutation UpdateTeamChannel(
    $channelId: UUID!
    $name: String!
    $description: String
    $visibility: TeamChannelVisibility
  ) {
    updateTeamChannel(
      channelId: $channelId
      name: $name
      description: $description
      visibility: $visibility
    ) {
      id
      name
      slug
      description
      visibility
      unreadCount
      isMember
      notificationLevel
      createdAt
      updatedAt
    }
  }
`;

export const JOIN_TEAM_CHANNEL = gql`
  mutation JoinTeamChannel($channelId: UUID!) {
    joinTeamChannel(channelId: $channelId) {
      id
      name
      slug
      description
      visibility
      unreadCount
      isMember
      notificationLevel
      createdAt
      updatedAt
    }
  }
`;

export const INVITE_TEAM_CHANNEL_MEMBER = gql`
  mutation InviteTeamChannelMember($channelId: UUID!, $userWorkspaceId: UUID!) {
    inviteTeamChannelMember(
      channelId: $channelId
      userWorkspaceId: $userWorkspaceId
    ) {
      id
      channelId
      userWorkspaceId
      name
      email
      role
      notificationLevel
      isCurrentUser
      createdAt
    }
  }
`;

export const REMOVE_TEAM_CHANNEL_MEMBER = gql`
  mutation RemoveTeamChannelMember($channelId: UUID!, $userWorkspaceId: UUID!) {
    removeTeamChannelMember(
      channelId: $channelId
      userWorkspaceId: $userWorkspaceId
    )
  }
`;

export const UPDATE_TEAM_CHANNEL_MEMBER_ROLE = gql`
  mutation UpdateTeamChannelMemberRole(
    $channelId: UUID!
    $userWorkspaceId: UUID!
    $role: TeamChannelMemberRole!
  ) {
    updateTeamChannelMemberRole(
      channelId: $channelId
      userWorkspaceId: $userWorkspaceId
      role: $role
    ) {
      id
      channelId
      userWorkspaceId
      name
      email
      role
      notificationLevel
      isCurrentUser
      createdAt
    }
  }
`;

export const LEAVE_TEAM_CHANNEL = gql`
  mutation LeaveTeamChannel($channelId: UUID!) {
    leaveTeamChannel(channelId: $channelId)
  }
`;

export const ARCHIVE_TEAM_CHANNEL = gql`
  mutation ArchiveTeamChannel($channelId: UUID!) {
    archiveTeamChannel(channelId: $channelId)
  }
`;

export const UPDATE_TEAM_CHANNEL_NOTIFICATION_LEVEL = gql`
  mutation UpdateTeamChannelNotificationLevel(
    $channelId: UUID!
    $notificationLevel: TeamChannelNotificationLevel!
  ) {
    updateTeamChannelNotificationLevel(
      channelId: $channelId
      notificationLevel: $notificationLevel
    ) {
      id
      channelId
      userWorkspaceId
      name
      email
      role
      notificationLevel
      isCurrentUser
      createdAt
    }
  }
`;

export const GET_TEAM_DIRECT_MESSAGES = gql`
  query GetTeamDirectMessages {
    teamDirectMessages {
      id
      participantUserWorkspaceId
      participantName
      participantEmail
      unreadCount
      notificationLevel
      lastMessageBody
      updatedAt
    }
  }
`;

export const GET_TEAM_MEMBERS = gql`
  query GetTeamMembers($query: String!) {
    teamMembers(query: $query) {
      userWorkspaceId
      name
      email
    }
  }
`;

export const CREATE_TEAM_DIRECT_MESSAGE = gql`
  mutation CreateTeamDirectMessage($participantUserWorkspaceId: UUID!) {
    createTeamDirectMessage(
      participantUserWorkspaceId: $participantUserWorkspaceId
    ) {
      id
      participantUserWorkspaceId
      participantName
      participantEmail
      unreadCount
      notificationLevel
      lastMessageBody
      updatedAt
    }
  }
`;

export const UPDATE_TEAM_DIRECT_MESSAGE_NOTIFICATION_LEVEL = gql`
  mutation UpdateTeamDirectMessageNotificationLevel(
    $directMessageThreadId: UUID!
    $notificationLevel: TeamChannelNotificationLevel!
  ) {
    updateTeamDirectMessageNotificationLevel(
      directMessageThreadId: $directMessageThreadId
      notificationLevel: $notificationLevel
    ) {
      directMessageThreadId
      notificationLevel
    }
  }
`;

export const GET_TEAM_INBOX = gql`
  query GetTeamInbox {
    teamInbox {
      type
      id
      channelId
      directMessageThreadId
      mentionId
      messageId
      parentMessageId
      title
      subtitle
      unreadCount
      updatedAt
    }
  }
`;

export const GET_TEAM_SAVED_MESSAGES = gql`
  query GetTeamSavedMessages {
    teamSavedMessages {
      id
      channelId
      directMessageThreadId
      authorUserWorkspaceId
      authorName
      conversationName
      body
      canEdit
      canDelete
      parentMessageId
      isPinned
      isSaved
      pinnedAt
      pinnedByUserWorkspaceId
      reactions {
        emoji
        count
        hasReacted
      }
      attachments {
        id
        name
        url
        mimeType
        size
        createdAt
      }
      replyCount
      createdAt
      updatedAt
    }
  }
`;

export const GET_TEAM_PINNED_MESSAGES = gql`
  query GetTeamPinnedMessages($channelId: UUID, $directMessageThreadId: UUID) {
    teamPinnedMessages(
      channelId: $channelId
      directMessageThreadId: $directMessageThreadId
    ) {
      id
      channelId
      directMessageThreadId
      authorUserWorkspaceId
      authorName
      conversationName
      body
      canEdit
      canDelete
      parentMessageId
      isPinned
      isSaved
      pinnedAt
      pinnedByUserWorkspaceId
      reactions {
        emoji
        count
        hasReacted
      }
      attachments {
        id
        name
        url
        mimeType
        size
        createdAt
      }
      replyCount
      createdAt
      updatedAt
    }
  }
`;

export const GET_TEAM_FILES = gql`
  query GetTeamFiles {
    teamFiles {
      id
      messageId
      channelId
      directMessageThreadId
      parentMessageId
      conversationName
      conversationType
      authorName
      name
      url
      mimeType
      size
      createdAt
    }
  }
`;

export const GET_TEAM_MESSAGE_REMINDERS = gql`
  query GetTeamMessageReminders {
    teamMessageReminders {
      id
      messageId
      channelId
      directMessageThreadId
      parentMessageId
      conversationName
      conversationType
      authorName
      body
      remindAt
      createdAt
    }
  }
`;

export const GET_TEAM_PRESENCE = gql`
  query GetTeamPresence {
    teamPresence {
      userWorkspaceId
      name
      email
      isOnline
      isCurrentUser
      lastSeenAt
      statusText
      statusEmoji
      notificationPreference
      notificationQuietHoursStart
      notificationQuietHoursEnd
    }
  }
`;

export const HEARTBEAT_TEAM_PRESENCE = gql`
  mutation HeartbeatTeamPresence {
    heartbeatTeamPresence {
      userWorkspaceId
      name
      email
      isOnline
      isCurrentUser
      lastSeenAt
      statusText
      statusEmoji
      notificationPreference
      notificationQuietHoursStart
      notificationQuietHoursEnd
    }
  }
`;

export const UPDATE_TEAM_PRESENCE_STATUS = gql`
  mutation UpdateTeamPresenceStatus($statusText: String, $statusEmoji: String) {
    updateTeamPresenceStatus(
      statusText: $statusText
      statusEmoji: $statusEmoji
    ) {
      userWorkspaceId
      name
      email
      isOnline
      isCurrentUser
      lastSeenAt
      statusText
      statusEmoji
      notificationPreference
      notificationQuietHoursStart
      notificationQuietHoursEnd
    }
  }
`;

export const UPDATE_TEAM_NOTIFICATION_PREFERENCE = gql`
  mutation UpdateTeamNotificationPreference(
    $notificationPreference: TeamNotificationPreference!
  ) {
    updateTeamNotificationPreference(
      notificationPreference: $notificationPreference
    ) {
      userWorkspaceId
      name
      email
      isOnline
      isCurrentUser
      lastSeenAt
      statusText
      statusEmoji
      notificationPreference
      notificationQuietHoursStart
      notificationQuietHoursEnd
    }
  }
`;

export const UPDATE_TEAM_NOTIFICATION_QUIET_HOURS = gql`
  mutation UpdateTeamNotificationQuietHours(
    $notificationQuietHoursStart: String
    $notificationQuietHoursEnd: String
  ) {
    updateTeamNotificationQuietHours(
      notificationQuietHoursStart: $notificationQuietHoursStart
      notificationQuietHoursEnd: $notificationQuietHoursEnd
    ) {
      userWorkspaceId
      name
      email
      isOnline
      isCurrentUser
      lastSeenAt
      statusText
      statusEmoji
      notificationPreference
      notificationQuietHoursStart
      notificationQuietHoursEnd
    }
  }
`;

export const GET_TEAM_DIRECT_MESSAGE_MESSAGES = gql`
  query GetTeamDirectMessageMessages(
    $directMessageThreadId: UUID!
    $before: String
  ) {
    teamDirectMessageMessages(
      directMessageThreadId: $directMessageThreadId
      before: $before
    ) {
      id
      channelId
      directMessageThreadId
      authorUserWorkspaceId
      authorName
      conversationName
      body
      canEdit
      canDelete
      parentMessageId
      isPinned
      isSaved
      pinnedAt
      pinnedByUserWorkspaceId
      reactions {
        emoji
        count
        hasReacted
      }
      attachments {
        id
        name
        url
        mimeType
        size
        createdAt
      }
      replyCount
      createdAt
      updatedAt
    }
  }
`;

export const SEARCH_TEAM_MESSAGES = gql`
  query SearchTeamMessages($query: String!) {
    teamMessageSearch(query: $query) {
      id
      channelId
      directMessageThreadId
      parentMessageId
      conversationName
      conversationType
      authorName
      body
      matchType
      attachmentName
      attachmentUrl
      createdAt
    }
  }
`;

export const GET_TEAM_MENTIONS = gql`
  query GetTeamMentions {
    teamMentions {
      id
      messageId
      channelId
      directMessageThreadId
      parentMessageId
      conversationName
      conversationType
      authorName
      body
      createdAt
      readAt
    }
  }
`;

export const SEND_TEAM_DIRECT_MESSAGE = gql`
  mutation SendTeamDirectMessage(
    $directMessageThreadId: UUID!
    $body: String!
    $parentMessageId: UUID
    $attachments: [TeamMessageAttachmentInput!]
  ) {
    sendTeamDirectMessage(
      directMessageThreadId: $directMessageThreadId
      body: $body
      parentMessageId: $parentMessageId
      attachments: $attachments
    ) {
      id
      channelId
      directMessageThreadId
      authorUserWorkspaceId
      authorName
      conversationName
      body
      canEdit
      canDelete
      parentMessageId
      isPinned
      isSaved
      pinnedAt
      pinnedByUserWorkspaceId
      reactions {
        emoji
        count
        hasReacted
      }
      attachments {
        id
        name
        url
        mimeType
        size
        createdAt
      }
      replyCount
      createdAt
      updatedAt
    }
  }
`;

export const GET_TEAM_MESSAGE_THREAD = gql`
  query GetTeamMessageThread($parentMessageId: UUID!, $before: String) {
    teamMessageThread(parentMessageId: $parentMessageId, before: $before) {
      id
      channelId
      directMessageThreadId
      authorUserWorkspaceId
      authorName
      conversationName
      body
      canEdit
      canDelete
      parentMessageId
      isPinned
      isSaved
      pinnedAt
      pinnedByUserWorkspaceId
      reactions {
        emoji
        count
        hasReacted
      }
      attachments {
        id
        name
        url
        mimeType
        size
        createdAt
      }
      replyCount
      createdAt
      updatedAt
    }
  }
`;

export const TOGGLE_TEAM_MESSAGE_REACTION = gql`
  mutation ToggleTeamMessageReaction($messageId: UUID!, $emoji: String!) {
    toggleTeamMessageReaction(messageId: $messageId, emoji: $emoji) {
      id
      channelId
      directMessageThreadId
      authorUserWorkspaceId
      authorName
      body
      canEdit
      canDelete
      parentMessageId
      isPinned
      isSaved
      pinnedAt
      pinnedByUserWorkspaceId
      reactions {
        emoji
        count
        hasReacted
      }
      attachments {
        id
        name
        url
        mimeType
        size
        createdAt
      }
      replyCount
      createdAt
      updatedAt
    }
  }
`;

export const TOGGLE_TEAM_MESSAGE_PIN = gql`
  mutation ToggleTeamMessagePin($messageId: UUID!) {
    toggleTeamMessagePin(messageId: $messageId) {
      id
      channelId
      directMessageThreadId
      authorUserWorkspaceId
      authorName
      body
      canEdit
      canDelete
      parentMessageId
      isPinned
      isSaved
      pinnedAt
      pinnedByUserWorkspaceId
      reactions {
        emoji
        count
        hasReacted
      }
      attachments {
        id
        name
        url
        mimeType
        size
        createdAt
      }
      replyCount
      createdAt
      updatedAt
    }
  }
`;

export const TOGGLE_TEAM_MESSAGE_BOOKMARK = gql`
  mutation ToggleTeamMessageBookmark($messageId: UUID!) {
    toggleTeamMessageBookmark(messageId: $messageId) {
      id
      channelId
      directMessageThreadId
      authorUserWorkspaceId
      authorName
      body
      canEdit
      canDelete
      parentMessageId
      isPinned
      isSaved
      pinnedAt
      pinnedByUserWorkspaceId
      reactions {
        emoji
        count
        hasReacted
      }
      attachments {
        id
        name
        url
        mimeType
        size
        createdAt
      }
      replyCount
      createdAt
      updatedAt
    }
  }
`;

export const SET_TEAM_MESSAGE_REMINDER = gql`
  mutation SetTeamMessageReminder($messageId: UUID!, $remindAt: DateTime!) {
    setTeamMessageReminder(messageId: $messageId, remindAt: $remindAt) {
      id
      messageId
      channelId
      directMessageThreadId
      conversationName
      conversationType
      authorName
      body
      remindAt
      createdAt
    }
  }
`;

export const DISMISS_TEAM_MESSAGE_REMINDER = gql`
  mutation DismissTeamMessageReminder($messageId: UUID!) {
    dismissTeamMessageReminder(messageId: $messageId)
  }
`;

export const UPDATE_TEAM_MESSAGE = gql`
  mutation UpdateTeamMessage($messageId: UUID!, $body: String!) {
    updateTeamMessage(messageId: $messageId, body: $body) {
      id
      channelId
      directMessageThreadId
      authorUserWorkspaceId
      authorName
      body
      canEdit
      canDelete
      parentMessageId
      isPinned
      isSaved
      pinnedAt
      pinnedByUserWorkspaceId
      reactions {
        emoji
        count
        hasReacted
      }
      attachments {
        id
        name
        url
        mimeType
        size
        createdAt
      }
      replyCount
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_TEAM_MESSAGE = gql`
  mutation DeleteTeamMessage($messageId: UUID!) {
    deleteTeamMessage(messageId: $messageId)
  }
`;

export const MARK_TEAM_CHANNEL_READ = gql`
  mutation MarkTeamChannelRead($channelId: UUID!) {
    markTeamChannelRead(channelId: $channelId)
  }
`;

export const MARK_TEAM_DIRECT_MESSAGE_READ = gql`
  mutation MarkTeamDirectMessageRead($directMessageThreadId: UUID!) {
    markTeamDirectMessageRead(directMessageThreadId: $directMessageThreadId)
  }
`;

export const MARK_TEAM_MESSAGE_THREAD_READ = gql`
  mutation MarkTeamMessageThreadRead($parentMessageId: UUID!) {
    markTeamMessageThreadRead(parentMessageId: $parentMessageId)
  }
`;

export const MARK_TEAM_INBOX_READ = gql`
  mutation MarkTeamInboxRead {
    markTeamInboxRead
  }
`;

export const MARK_TEAM_MESSAGE_UNREAD = gql`
  mutation MarkTeamMessageUnread($messageId: UUID!) {
    markTeamMessageUnread(messageId: $messageId)
  }
`;

export const MARK_TEAM_MENTION_READ = gql`
  mutation MarkTeamMentionRead($mentionId: UUID!) {
    markTeamMentionRead(mentionId: $mentionId)
  }
`;
