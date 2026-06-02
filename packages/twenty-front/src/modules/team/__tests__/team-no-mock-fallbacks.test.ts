import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const normalizeSourceWhitespace = (source: string) =>
  source.replace(/\s+/g, ' ').trim();

describe('Team Comms production surfaces', () => {
  it.each([
    'packages/twenty-front/src/pages/team/TeamPage.tsx',
    'packages/twenty-front/src/modules/team/components/NavigationDrawerTeamContent.tsx',
  ])('does not fall back to mock data in %s', (filePath) => {
    const source = readFileSync(path.join(process.cwd(), filePath), 'utf8');

    expect(source).not.toContain('TEAM_COMMS_MOCK_DATA');
  });

  it('refreshes derived inbox surfaces when live message events arrive', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );

    expect(source).toContain('refetch: refetchInbox');
    expect(source).toContain('refetch: refetchMentions');
    expect(source).toContain('refetchTeamDataSafely(refetchInbox)');
    expect(source).toContain('refetchTeamDataSafely(refetchMentions)');
  });

  it('refreshes derived side surfaces when live message events arrive', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );

    expect(source).toContain('refetch: refetchSavedMessages');
    expect(source).toContain('refetch: refetchFiles');
    expect(source).toContain('refetch: refetchMessageReminders');
    expect(source).toContain('refetch: refetchPinnedMessages');
    expect(source).toContain('refetchTeamDataSafely(refetchSavedMessages)');
    expect(source).toContain('refetchTeamDataSafely(refetchFiles)');
    expect(source).toContain('refetchTeamDataSafely(refetchMessageReminders)');
    expect(source).toContain('refetchTeamDataSafely(refetchPinnedMessages)');
  });

  it('keeps live-event refetch failures from surfacing unhandled rejections', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const liveMessageEventSource = source.slice(
      source.indexOf('sseClient.subscribe<OnTeamMessageEventSubscription>'),
      source.indexOf('error: () => {', source.indexOf('sseClient.subscribe')),
    );

    expect(source).toContain('const refetchTeamDataSafely =');
    expect(source).toContain('.catch(() => {})');

    for (const refetchName of [
      'refetchChannels',
      'refetchDirectMessages',
      'refetchDirectMessageMessages',
      'refetchChannelMessages',
      'refetchInbox',
      'refetchMentions',
      'refetchSavedMessages',
      'refetchFiles',
      'refetchMessageReminders',
      'refetchPinnedMessages',
      'refetchThreadMessages',
    ]) {
      expect(liveMessageEventSource).toContain(
        `refetchTeamDataSafely(${refetchName})`,
      );
      expect(liveMessageEventSource).not.toContain(`void ${refetchName}();`);
    }
  });

  it('keeps send mutations decoupled from blocking refetch queries', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const sendMutationHooksSource = source.slice(
      source.indexOf('const [sendTeamMessage] ='),
      source.indexOf('const [createTeamDirectMessage] ='),
    );
    const sendMessageSource = source.slice(
      source.indexOf(
        'const handleSendMessage = async (draftMessageOverride?: string) => {',
      ),
      source.indexOf('const handleRequestTeamNotifications'),
    );
    const sendThreadReplySource = source.slice(
      source.indexOf(
        'const handleSendThreadReply = async (threadDraftMessageOverride?: string) => {',
      ),
      source.indexOf('const handleSelectChannel ='),
    );

    expect(sendMutationHooksSource).toContain(
      'useMutation<SendTeamMessageMutation>(SEND_TEAM_MESSAGE)',
    );
    expect(sendMutationHooksSource).toContain(
      'useMutation<SendTeamDirectMessageMutation>',
    );
    expect(sendMutationHooksSource).not.toContain('refetchQueries');
    expect(sendMessageSource).toContain(
      'refetchTeamDataSafely(refetchDirectMessageMessages)',
    );
    expect(sendMessageSource).toContain(
      'refetchTeamDataSafely(refetchChannelMessages)',
    );
    expect(sendThreadReplySource).toContain(
      'refetchTeamDataSafely(refetchThreadMessages)',
    );
  });

  it('refreshes derived side surfaces when a message is deleted', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const deleteMutationSource = source.slice(
      source.indexOf('const [deleteTeamMessage]'),
      source.indexOf(
        'useEffect(() => {',
        source.indexOf('const [deleteTeamMessage]'),
      ),
    );

    expect(deleteMutationSource).toContain('GET_TEAM_INBOX');
    expect(deleteMutationSource).toContain('GET_TEAM_MENTIONS');
    expect(deleteMutationSource).toContain('GET_TEAM_SAVED_MESSAGES');
    expect(deleteMutationSource).toContain('GET_TEAM_FILES');
    expect(deleteMutationSource).toContain('GET_TEAM_MESSAGE_REMINDERS');
    expect(deleteMutationSource).toContain('GET_TEAM_PINNED_MESSAGES');
  });

  it('closes an open thread when a live delete event removes the thread parent', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const liveMessageEventSource = source.slice(
      source.indexOf('sseClient.subscribe<OnTeamMessageEventSubscription>'),
      source.indexOf('error: () => {', source.indexOf('sseClient.subscribe')),
    );

    expect(liveMessageEventSource).toContain("event.type === 'DELETED'");
    expect(liveMessageEventSource).toContain(
      'event.messageId === selectedThreadParentMessageId',
    );
    expect(liveMessageEventSource).toContain(
      'setSelectedThreadParentMessageId(null)',
    );
    expect(liveMessageEventSource).toContain(
      'event.messageId === selectedMessageId',
    );
    expect(liveMessageEventSource).toContain('setSelectedMessageId(null)');
  });

  it('refreshes mention surfaces when a message is edited', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const updateMutationSource = source.slice(
      source.indexOf('const [updateTeamMessage]'),
      source.indexOf('const [deleteTeamMessage]'),
    );

    expect(updateMutationSource).toContain('GET_TEAM_INBOX');
    expect(updateMutationSource).toContain('GET_TEAM_MENTIONS');
  });

  it('refreshes derived side surfaces when a channel is left or archived', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const channelCloseMutationSource = source.slice(
      source.indexOf('const [leaveTeamChannel]'),
      source.indexOf('const [updateTeamChannelNotificationLevel]'),
    );

    for (const operation of [
      'GET_TEAM_MENTIONS',
      'GET_TEAM_SAVED_MESSAGES',
      'GET_TEAM_FILES',
      'GET_TEAM_MESSAGE_REMINDERS',
      'GET_TEAM_PINNED_MESSAGES',
    ]) {
      expect(channelCloseMutationSource).toContain(operation);
    }
  });

  it('refreshes the inbox when direct-message notification settings change', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const directMessageNotificationMutationSource = source.slice(
      source.indexOf('const [updateTeamDirectMessageNotificationLevel]'),
      source.indexOf('const [toggleTeamMessageReaction]'),
    );
    const directMessageNotificationSelectSource = source.slice(
      source.indexOf('aria-label={t`Direct message notifications`}'),
      source.indexOf('<option value="ALL">{t`All messages`}</option>'),
    );

    expect(directMessageNotificationMutationSource).toContain(
      'GET_TEAM_DIRECT_MESSAGES',
    );
    expect(directMessageNotificationMutationSource).toContain('GET_TEAM_INBOX');
    expect(directMessageNotificationSelectSource).toContain(
      'disabled={isUpdatingDirectMessageNotificationLevel}',
    );
  });

  it('refreshes inbox and mentions when conversations are marked read', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const readMutationSource = source.slice(
      source.indexOf('const [markTeamChannelRead]'),
      source.indexOf('const [markTeamMessageThreadRead]'),
    );

    expect(readMutationSource).toContain('GET_TEAM_CHANNELS');
    expect(readMutationSource).toContain('GET_TEAM_DIRECT_MESSAGES');
    expect(readMutationSource).toContain('GET_TEAM_INBOX');
    expect(readMutationSource).toContain('GET_TEAM_MENTIONS');
  });

  it('refreshes mentions when a message is marked unread', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const unreadMutationSource = source.slice(
      source.indexOf('const [markTeamMessageUnread]'),
      source.indexOf('const [markTeamMentionRead]'),
    );

    expect(unreadMutationSource).toContain('GET_TEAM_CHANNELS');
    expect(unreadMutationSource).toContain('GET_TEAM_DIRECT_MESSAGES');
    expect(unreadMutationSource).toContain('GET_TEAM_INBOX');
    expect(unreadMutationSource).toContain('GET_TEAM_MENTIONS');
  });

  it('refreshes inbox and mentions when a mention is marked read', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const mentionReadMutationSource = source.slice(
      source.indexOf('const [markTeamMentionRead]'),
      source.indexOf('const [heartbeatTeamPresence]'),
    );

    expect(mentionReadMutationSource).toContain('GET_TEAM_INBOX');
    expect(mentionReadMutationSource).toContain('GET_TEAM_MENTIONS');
  });

  it('navigates pinned-message clicks to the actual message target', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const pinnedMessagesSource = source.slice(
      source.indexOf('{pinnedMessages.length > 0 && !isTeamPanelFocused ? ('),
      source.indexOf('<StyledMessageList>'),
    );

    expect(pinnedMessagesSource).toContain(
      'onClick={() => handleSelectTeamConversationTarget(message)}',
    );
    expect(pinnedMessagesSource).not.toContain(
      'onClick={() => handleOpenThread(message.id)}',
    );
  });

  it('clears stale message and thread state when switching conversations', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const channelSelectionSource = source.slice(
      source.indexOf('const handleSelectChannel ='),
      source.indexOf('const handleSelectDirectMessage ='),
    );
    const directMessageSelectionSource = source.slice(
      source.indexOf('const handleSelectDirectMessage ='),
      source.indexOf('const handleCreateChannel ='),
    );

    for (const selectionSource of [
      channelSelectionSource,
      directMessageSelectionSource,
    ]) {
      expect(selectionSource).toContain('setSelectedMessageId(null)');
      expect(selectionSource).toContain(
        'setSelectedThreadParentMessageId(null)',
      );
    }

    expect(channelSelectionSource).toContain(
      'setSelectedDirectMessageId(null)',
    );
    expect(directMessageSelectionSource).toContain(
      'setSelectedChannelId(null)',
    );
    expect(source).toContain('onClick={() => handleSelectChannel(channel)}');
    expect(source).toContain(
      'onClick={() => handleSelectDirectMessage(directMessage)}',
    );
  });

  it('focuses the right composer after switching conversations or opening a thread', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const channelSelectionSource = source.slice(
      source.indexOf('const handleSelectChannel ='),
      source.indexOf('const handleSelectDirectMessage ='),
    );
    const directMessageSelectionSource = source.slice(
      source.indexOf('const handleSelectDirectMessage ='),
      source.indexOf('const handleCreateChannel ='),
    );
    const openThreadSource = source.slice(
      source.indexOf('const handleOpenThread ='),
      source.indexOf('const renderTeamMessageTextSegments ='),
    );

    expect(source).toContain('const focusTeamComposerInput =');
    expect(source).toContain('requestAnimationFrame(() =>');
    expect(channelSelectionSource).toContain(
      'focusTeamComposerInput(draftMessageInputElement)',
    );
    expect(directMessageSelectionSource).toContain(
      'focusTeamComposerInput(draftMessageInputElement)',
    );
    expect(openThreadSource).toContain(
      'focusTeamComposerInput(threadDraftMessageInputElement)',
    );
  });

  it('keeps unjoined public channels out of the default selected channel fallback', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const channelFallbackSource = source.slice(
      source.indexOf('const sortedJoinedChannels ='),
      source.indexOf('const liveMessageEventSubscriptionTargets ='),
    );
    const selectionRecoverySource = source.slice(
      source.indexOf(
        'setSelectedDirectMessageId(null);',
        source.indexOf('useEffect(() => {'),
      ),
      source.indexOf('const requestedThreadParentMessageId ='),
    );

    expect(channelFallbackSource).toContain('channel.isMember !== false');
    expect(channelFallbackSource).toContain('selectableJoinedChannels[0]?.id');
    expect(selectionRecoverySource).toContain(
      'selectableJoinedChannels[0]?.id',
    );
    expect(selectionRecoverySource).toContain(
      'setSelectedChannelId(selectableJoinedChannels[0].id)',
    );
  });

  it('shows discoverable public channels separately with inline join actions', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const discoverableChannelsSource = source.slice(
      source.indexOf('const sortedDiscoverablePublicChannels ='),
      source.indexOf('const sortedDirectMessages ='),
    );
    const joinChannelSource = source.slice(
      source.indexOf('const handleJoinChannel = async'),
      source.indexOf('const handleInviteChannelMember = async'),
    );
    const discoverableChannelsRenderSource = source.slice(
      source.indexOf('Browse public channels'),
      source.indexOf('<StyledPanelHeader>', source.indexOf('Direct Messages')),
    );

    expect(discoverableChannelsSource).toContain('channel.isMember === false');
    expect(discoverableChannelsSource).toContain(
      "channel.visibility === 'PUBLIC'",
    );
    expect(discoverableChannelsSource).toContain(
      'normalizedBrowsePublicChannelsQuery',
    );
    expect(discoverableChannelsSource).toContain(
      'visibleDiscoverablePublicChannels',
    );
    expect(discoverableChannelsRenderSource).toContain(
      'visibleDiscoverablePublicChannels.map',
    );
    expect(discoverableChannelsRenderSource).toContain(
      'visibleDiscoverablePublicChannels.length > 0',
    );
    expect(discoverableChannelsRenderSource).toContain(
      'No public channels match.',
    );
    expect(discoverableChannelsRenderSource).toContain(
      'browsePublicChannelsQuery',
    );
    expect(discoverableChannelsRenderSource).toContain(
      'setBrowsePublicChannelsQuery',
    );
    expect(discoverableChannelsRenderSource).toContain(
      'aria-label={t`Clear public channel search`}',
    );
    expect(discoverableChannelsRenderSource).toContain(
      "setBrowsePublicChannelsQuery('')",
    );
    expect(discoverableChannelsRenderSource).toContain(
      'onClick={() => handleSelectChannel(channel)}',
    );
    expect(discoverableChannelsRenderSource).toContain(
      'onClick={() => void handleJoinChannel(channel.id)}',
    );
    const joinChannelSuccessSource = joinChannelSource.slice(
      joinChannelSource.indexOf('if (!data?.joinTeamChannel) {'),
    );

    expect(joinChannelSource).toContain('if (!data?.joinTeamChannel) {');
    expect(joinChannelSource).toContain(
      'enqueueErrorSnackBar({ message: t`Failed to join channel.` });',
    );
    expect(joinChannelSuccessSource).toContain(
      "setBrowsePublicChannelsQuery('')",
    );
  });

  it('shows joined channel topics in the channel list', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const channelsListSource = source.slice(
      source.indexOf('{sortedJoinedChannels.map((channel) => ('),
      source.indexOf('sortedDiscoverablePublicChannels.length > 0'),
    );

    expect(channelsListSource).toContain('<StyledListItemTextStack>');
    expect(channelsListSource).toContain('<StyledListItemPrimaryText>');
    expect(channelsListSource).toContain('channel.name');
    expect(channelsListSource).toContain('channel.description ? (');
    expect(channelsListSource).toContain('<StyledListItemSecondaryText>');
    expect(channelsListSource).toContain('{channel.description}');
  });

  it('lets users set a channel description when creating a channel', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const createChannelSource = source.slice(
      source.indexOf('const handleCreateChannel = async () => {'),
      source.indexOf('const handleCreateDirectMessage = async () => {'),
    );
    const createChannelFormSource = source.slice(
      source.indexOf('<StyledCreateChannelForm'),
      source.indexOf(
        '</StyledCreateChannelForm>',
        source.indexOf('<StyledCreateChannelForm'),
      ),
    );

    expect(source).toContain(
      "const [newChannelDescription, setNewChannelDescription] = useState('')",
    );
    expect(createChannelSource).toContain(
      'const trimmedChannelDescription = newChannelDescription.trim();',
    );
    expect(createChannelSource).toContain(
      'description:\n            trimmedChannelDescription.length > 0',
    );
    expect(createChannelSource).toContain('? trimmedChannelDescription');
    expect(createChannelSource).toContain("setNewChannelDescription('');");
    expect(createChannelSource).not.toContain('description: null');
    expect(createChannelFormSource).toContain(
      'aria-label={t`New channel description`}',
    );
    expect(createChannelFormSource).toContain('value={newChannelDescription}');
    expect(createChannelFormSource).toContain('setNewChannelDescription');
  });

  it('sorts channel and direct-message lists through the shared activity-aware sorter', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const conversationSortingSource = source.slice(
      source.indexOf('const sortedChannels = useMemo'),
      source.indexOf('const normalizedMessageSearchQuery ='),
    );

    expect(conversationSortingSource).toContain(
      'sortTeamConversationsByStarred({',
    );
    expect(conversationSortingSource).toContain('conversations: channels');
    expect(conversationSortingSource).toContain(
      'conversations: directMessages',
    );
    expect(conversationSortingSource).toContain('starredConversationKeys');
  });

  it('shows muted markers for muted channels and direct messages', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const channelsListSource = source.slice(
      source.indexOf('{sortedJoinedChannels.map((channel) => ('),
      source.indexOf('sortedDiscoverablePublicChannels.length > 0'),
    );
    const directMessagesListSource = source.slice(
      source.indexOf('{sortedDirectMessages.map((directMessage) => {'),
      source.indexOf('</StyledList>', source.indexOf('{sortedDirectMessages')),
    );
    const quickMuteSource = source.slice(
      source.indexOf('const handleToggleSelectedConversationMute ='),
      source.indexOf('const handleQuoteMessage ='),
    );
    const conversationNotificationHandlersSource = source.slice(
      source.indexOf('const handleUpdateChannelNotificationLevel = async'),
      source.indexOf('const handleUpdatePresenceStatus = async'),
    );
    const panelHeaderSource = source.slice(
      source.indexOf('<StyledPanelHeader>', source.indexOf('<StyledPanel>')),
      source.indexOf(
        '{isDirectMessageSelected &&',
        source.indexOf('<StyledPanelHeader>', source.indexOf('<StyledPanel>')),
      ),
    );
    const channelNotificationSelectSource = source.slice(
      source.lastIndexOf(
        '<StyledSelect',
        source.indexOf(
          'currentUserChannelMember.notificationLevel.toUpperCase()',
        ),
      ),
      source.indexOf(
        '<option value="ALL">{t`All messages`}</option>',
        source.indexOf(
          'currentUserChannelMember.notificationLevel.toUpperCase()',
        ),
      ),
    );

    expect(source).toContain('IconBellOff');
    expect(source).toContain('StyledMutedConversationMarker');
    expect(source).toContain('isTeamConversationMuted');
    expect(source).toContain('getNextTeamConversationMuteLevel');
    expect(channelsListSource).toContain(
      'isTeamConversationMuted(channel.notificationLevel)',
    );
    expect(directMessagesListSource).toContain('isTeamConversationMuted(');
    expect(directMessagesListSource).toContain(
      'directMessage.notificationLevel',
    );
    expect(channelsListSource).toContain('t`Muted conversation`');
    expect(directMessagesListSource).toContain('t`Muted conversation`');
    expect(quickMuteSource).toContain('getNextTeamConversationMuteLevel(');
    expect(quickMuteSource).toContain('selectedConversationNotificationLevel');
    expect(quickMuteSource).toContain(
      'handleUpdateDirectMessageNotificationLevel(',
    );
    expect(quickMuteSource).toContain('handleUpdateChannelNotificationLevel(');
    expect(quickMuteSource).toContain('Conversation muted.');
    expect(quickMuteSource).toContain('Conversation unmuted.');
    expect(conversationNotificationHandlersSource).toContain(
      'isUpdatingChannelNotificationLevel',
    );
    expect(conversationNotificationHandlersSource).toContain(
      'setIsUpdatingChannelNotificationLevel(true);',
    );
    expect(conversationNotificationHandlersSource).toContain(
      'setIsUpdatingChannelNotificationLevel(false);',
    );
    expect(conversationNotificationHandlersSource).toContain(
      'isUpdatingDirectMessageNotificationLevel',
    );
    expect(conversationNotificationHandlersSource).toContain(
      'setIsUpdatingDirectMessageNotificationLevel(true);',
    );
    expect(conversationNotificationHandlersSource).toContain(
      'setIsUpdatingDirectMessageNotificationLevel(false);',
    );
    expect(panelHeaderSource).toContain('canToggleSelectedConversationMute');
    expect(panelHeaderSource).toContain('handleToggleSelectedConversationMute');
    expect(panelHeaderSource).toContain(
      'disabled={isUpdatingSelectedConversationNotificationLevel}',
    );
    expect(panelHeaderSource).toContain('isSelectedConversationMuted');
    expect(panelHeaderSource).toContain('t`Unmute`');
    expect(panelHeaderSource).toContain('t`Mute`');
    expect(channelNotificationSelectSource).toContain(
      'disabled={isUpdatingChannelNotificationLevel}',
    );
  });

  it('marks unread conversations read as soon as they are opened', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const channelSelectionSource = source.slice(
      source.indexOf('const handleSelectChannel ='),
      source.indexOf('const handleSelectDirectMessage ='),
    );
    const directMessageSelectionSource = source.slice(
      source.indexOf('const handleSelectDirectMessage ='),
      source.indexOf('const handleCreateChannel ='),
    );

    expect(channelSelectionSource).toContain('channel.unreadCount > 0');
    expect(channelSelectionSource).toContain('markTeamChannelRead');
    expect(channelSelectionSource).toContain('Failed to mark channel read.');
    expect(channelSelectionSource).toContain('.catch(() => {');
    expect(directMessageSelectionSource).toContain(
      'directMessage.unreadCount > 0',
    );
    expect(directMessageSelectionSource).toContain('markTeamDirectMessageRead');
    expect(directMessageSelectionSource).toContain(
      'Failed to mark direct message read.',
    );
    expect(directMessageSelectionSource).toContain('.catch(() => {');
    expect(source).toContain('onClick={() => handleSelectChannel(channel)}');
    expect(source).toContain(
      'onClick={() => handleSelectDirectMessage(directMessage)}',
    );
  });

  it('lets users jump to new or latest messages in conversations and threads', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const jumpTargetSource = source.slice(
      source.indexOf('const latestMainMessageId ='),
      source.indexOf('const pinnedMessages ='),
    );
    const jumpHandlerSource = source.slice(
      source.indexOf('const handleJumpToTeamMessage ='),
      source.indexOf('const handleMarkMessageUnread ='),
    );
    const mainHeaderSource = source.slice(
      source.indexOf('{hasSelectedConversation && messages.length > 0 ? ('),
      source.indexOf(
        '{!isTeamPanelFocused ? (',
        source.indexOf('{hasSelectedConversation && messages.length > 0 ? ('),
      ),
    );
    const threadHeaderSource = source.slice(
      source.indexOf('{visibleThreadMessages.length > 0 ? ('),
      source.indexOf(
        '<StyledIconButton',
        source.indexOf('{visibleThreadMessages.length > 0 ? ('),
      ),
    );

    expect(jumpTargetSource).toContain('latestMainMessageId');
    expect(jumpTargetSource).toContain('latestThreadMessageId');
    expect(jumpHandlerSource).toContain(
      'getTeamMessageElementId({ messageId, scope })',
    );
    expect(jumpHandlerSource).toContain('scrollIntoView');
    expect(jumpHandlerSource).toContain(
      'messageId: mainUnreadDividerMessageId ?? latestMainMessageId',
    );
    expect(jumpHandlerSource).toContain(
      'messageId: threadUnreadDividerMessageId ?? latestThreadMessageId',
    );
    expect(mainHeaderSource).toContain(
      'onClick={handleJumpToMainConversationActivity}',
    );
    expect(mainHeaderSource).toContain('Jump to new');
    expect(mainHeaderSource).toContain('Jump to latest');
    expect(threadHeaderSource).toContain(
      'onClick={handleJumpToThreadActivity}',
    );
    expect(threadHeaderSource).toContain('Jump to new');
    expect(threadHeaderSource).toContain('Jump to latest');
  });

  it('routes saved-message clicks through shared target navigation', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const savedMessageSelectionSource = source.slice(
      source.indexOf('const handleSelectSavedMessage ='),
      source.indexOf('const handleSelectFile ='),
    );

    expect(savedMessageSelectionSource).toContain(
      'handleSelectTeamConversationTarget(message)',
    );
    expect(savedMessageSelectionSource).not.toContain(
      'setSelectedDirectMessageId(message.directMessageThreadId)',
    );
    expect(savedMessageSelectionSource).not.toContain(
      'setSelectedChannelId(message.channelId)',
    );
  });

  it('clears the message search query after opening a search result', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const searchResultSelectionSource = source.slice(
      source.indexOf('const handleSelectSearchResult ='),
      source.indexOf('const handleSelectMention ='),
    );

    expect(searchResultSelectionSource).toContain(
      'handleSelectTeamConversationTarget({',
    );
    expect(searchResultSelectionSource).toContain("setMessageSearchQuery('')");
  });

  it('lets users open attachment search results without losing message navigation', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const searchResultsSource = source.slice(
      source.indexOf('messageSearchResults.map((result) => ('),
      source.indexOf(
        '</StyledSearchResults>',
        source.indexOf('messageSearchResults.map((result) => ('),
      ),
    );

    expect(searchResultsSource).toContain('handleSelectSearchResult(result)');
    expect(searchResultsSource).toContain('result.attachmentName');
    expect(searchResultsSource).toContain('result.attachmentUrl ? (');
    expect(searchResultsSource).toContain('href={result.attachmentUrl}');
    expect(searchResultsSource).toContain('Open file');
  });

  it('shows an explicit empty state when message search has no matches', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const searchResultsSource = source.slice(
      source.indexOf('messageSearchResults.length > 0 ? ('),
      source.indexOf(
        '</StyledSearchResults>',
        source.indexOf('messageSearchResults.length > 0 ? ('),
      ),
    );

    expect(searchResultsSource).toContain('messageSearchResults.map');
    expect(searchResultsSource).toContain('No matching team messages.');
  });

  it('shows message search loading before falling back to no matches', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const messageSearchQuerySource = source.slice(
      source.indexOf('const { data: messageSearchData'),
      source.indexOf('const messageSearchResults ='),
    );
    const searchResultsSource = source.slice(
      source.indexOf('isMessageSearchLoading ? ('),
      source.indexOf(
        'No matching team messages.',
        source.indexOf('isMessageSearchLoading ? ('),
      ),
    );
    const searchBoxSource = source.slice(
      source.indexOf('const renderTeamMessageSearchResults = () =>'),
      source.indexOf('const renderTeamMessageSearchBox = () => ('),
    );

    expect(messageSearchQuerySource).toContain(
      'loading: isMessageSearchLoading',
    );
    expect(searchBoxSource).toContain(
      'normalizedMessageSearchQuery.length > 0',
    );
    expect(searchBoxSource).toContain('Keep typing to search team messages.');
    expect(searchResultsSource).toContain('Searching team messages...');
    expect(searchResultsSource).toContain('messageSearchResults.length > 0');
  });

  it('keeps message search available when either channels or direct messages are available', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const messageSearchSource = source.slice(
      source.indexOf('const { data: messageSearchData'),
      source.indexOf('const messageSearchResults ='),
    );

    expect(messageSearchSource).toContain(
      '(!isUsingApiChannels && !isUsingApiDirectMessages)',
    );
    expect(messageSearchSource).not.toContain(
      '!isUsingApiChannels || normalizedMessageSearchQuery.length < 2',
    );
  });

  it('keeps side surfaces available when either channels or direct messages are available', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );

    for (const queryTypeName of [
      'GetTeamMentionsQuery',
      'GetTeamInboxQuery',
      'GetTeamSavedMessagesQuery',
      'GetTeamFilesQuery',
      'GetTeamMessageRemindersQuery',
    ]) {
      const querySource = source.slice(
        source.indexOf(`useQuery<${queryTypeName}`),
        source.indexOf('});', source.indexOf(`useQuery<${queryTypeName}`)),
      );

      expect(querySource).toContain(
        'skip: !isUsingApiChannels && !isUsingApiDirectMessages',
      );
      expect(querySource).not.toContain('skip: !isUsingApiChannels,');
    }
  });

  it('keeps presence and notification effects available for direct-message-only use', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const presenceQuerySource = source.slice(
      source.indexOf('useQuery<GetTeamPresenceQuery>'),
      source.indexOf('const presence = useMemo'),
    );
    const desktopNotificationSource = source.slice(
      source.indexOf("teamNotificationPermission !== 'granted'"),
      source.indexOf('if (!hasInitializedTeamNotifications)'),
    );
    const presenceHeartbeatSource = source.slice(
      source.indexOf('if (!isUsingApiChannels && !isUsingApiDirectMessages)'),
      source.indexOf(
        'const activeDraftMessage =',
        source.indexOf('const heartbeatTeamPresenceSafely ='),
      ),
    );

    for (const effectSource of [
      presenceQuerySource,
      desktopNotificationSource,
      presenceHeartbeatSource,
    ]) {
      expect(effectSource).toContain(
        '!isUsingApiChannels && !isUsingApiDirectMessages',
      );
      expect(effectSource).not.toContain('!isUsingApiChannels)');
      expect(effectSource).not.toContain('!isUsingApiChannels,');
    }
  });

  it('keeps team badge counts and due notifications available for direct-message-only use', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const unreadBadgeSource = source.slice(
      source.indexOf('const teamUnreadBadgeCount = useMemo'),
      source.indexOf('const teamNotificationCandidates = useMemo'),
    );
    const notificationCandidateSource = source.slice(
      source.indexOf('const teamNotificationCandidates = useMemo'),
      source.indexOf('const teamNotificationButtonLabel ='),
    );

    for (const notificationSource of [
      unreadBadgeSource,
      notificationCandidateSource,
    ]) {
      expect(notificationSource).toContain(
        '!isUsingApiChannels && !isUsingApiDirectMessages',
      );
      expect(notificationSource).not.toContain('isUsingApiChannels ?');
      expect(notificationSource).toContain('isUsingApiDirectMessages');
    }
  });

  it('clears stale deep-link message state when URL params disappear', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const threadParamEffectSource = source.slice(
      source.indexOf(
        'const requestedThreadParentMessageId = searchParams.get(',
      ),
      source.indexOf('const requestedMessageId = searchParams.get('),
    );
    const messageParamEffectSource = source.slice(
      source.indexOf('const requestedMessageId = searchParams.get('),
      source.indexOf('if (messageScrollTarget === null)'),
    );

    expect(threadParamEffectSource).toContain(
      'setSelectedThreadParentMessageId(null)',
    );
    expect(messageParamEffectSource).toContain('setSelectedMessageId(null)');
  });

  it('does not auto-select the first channel while a valid direct message is selected', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const conversationParamEffectSource = source.slice(
      source.indexOf(
        "const requestedDirectMessageId = searchParams.get('teamDirectMessageId')",
      ),
      source.indexOf(
        'const requestedThreadParentMessageId = searchParams.get(',
      ),
    );

    expect(conversationParamEffectSource).toContain(
      'selectedDirectMessageId !== null',
    );
    expect(conversationParamEffectSource).toContain('directMessages.some(');
    expect(conversationParamEffectSource).toContain(
      'setSelectedDirectMessageId(null)',
    );
  });

  it('shows every available team file in the focused Files route instead of truncating', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const focusedFilesRouteSource = source.slice(
      source.indexOf("if (focusedTeamPanel === 'files')"),
      source.indexOf("if (focusedTeamPanel === 'reminders')"),
    );

    expect(focusedFilesRouteSource).toContain(
      'files.map((file) => renderTeamFile(file))',
    );
    expect(focusedFilesRouteSource).not.toContain('files.slice(');
  });

  it('lets users copy file links from the focused Files route', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const copyFileSource = source.slice(
      source.indexOf('const handleCopyFileLink = async'),
      source.indexOf('const handleSelectReminder ='),
    );
    const fileRowSource = source.slice(
      source.indexOf('const renderTeamFile = (file: TeamFile)'),
      source.indexOf('const renderTeamReminder ='),
    );

    expect(copyFileSource).toContain('handleCopyTeamResource');
    expect(copyFileSource).toContain('copyKey: `file-link:${file.id}`');
    expect(copyFileSource).toContain('value: file.url');
    expect(copyFileSource).toContain('File link copied.');
    expect(copyFileSource).toContain('Failed to copy file link.');
    expect(fileRowSource).toContain('handleSelectFile(file)');
    expect(fileRowSource).toContain('Open file');
    expect(fileRowSource).toContain(
      'disabled={copyingTeamResourceKey === `file-link:${file.id}`}',
    );
    expect(fileRowSource).toContain('void handleCopyFileLink(file)');
    expect(fileRowSource).toContain('Copy file link');
  });

  it('shows file size metadata in the focused Files route', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const fileRowSource = source.slice(
      source.indexOf('const renderTeamFile = (file: TeamFile)'),
      source.indexOf('const renderTeamReminder ='),
    );

    expect(fileRowSource).toContain('file.size !== undefined');
    expect(fileRowSource).toContain('file.size !== null');
    expect(fileRowSource).toContain('formatFileSize(file.size)');
  });

  it('shows when files were shared in the focused Files route', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const fileRowSource = source.slice(
      source.indexOf('const renderTeamFile = (file: TeamFile)'),
      source.indexOf('const renderTeamReminder ='),
    );

    expect(fileRowSource).toContain('file.createdAt ? (');
    expect(fileRowSource).toContain('new Intl.DateTimeFormat');
    expect(fileRowSource).toContain('new Date(file.createdAt)');
  });

  it('lets users jump from files to the source message thread or copy its link', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const fileRowSource = source.slice(
      source.indexOf('const renderTeamFile = (file: TeamFile)'),
      source.indexOf('const renderTeamReminder ='),
    );

    expect(fileRowSource).toContain('void handleCopyMessageLink(file)');
    expect(fileRowSource).toContain('Copy message link');
    expect(fileRowSource).toContain('handleOpenTeamMessageThreadTarget(file)');
    expect(fileRowSource).toContain('Open thread');
  });

  it('lets users snooze reminders from the focused Reminders route', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const snoozeReminderSource = source.slice(
      source.indexOf('const handleSnoozeMessageReminder = async'),
      source.indexOf('const handleLoadEarlierMessages = async'),
    );
    const dismissReminderSource = source.slice(
      source.indexOf('const handleDismissMessageReminder = async'),
      source.indexOf('const handleDismissAllMessageReminders = async'),
    );
    const dismissAllRemindersSource = source.slice(
      source.indexOf('const handleDismissAllMessageReminders = async'),
      source.indexOf('const handleSnoozeMessageReminder = async'),
    );
    const reminderRowSource = source.slice(
      source.indexOf(
        'const renderTeamReminder = (reminder: TeamMessageReminder)',
      ),
      source.indexOf('const renderTeamMention = (mention: TeamMention)'),
    );
    const focusedHeaderSource = source.slice(
      source.indexOf("focusedTeamPanel === 'inbox' && inboxItems.length > 0"),
      source.indexOf('{!isTeamPanelFocused ? ('),
    );

    expect(snoozeReminderSource).toContain('setTeamMessageReminder');
    expect(snoozeReminderSource).toContain(
      'optionValue: DEFAULT_TEAM_MESSAGE_REMINDER_OPTION_VALUE',
    );
    expect(snoozeReminderSource).toContain(
      'clearMessageReminderOption(messageId);',
    );
    expect(snoozeReminderSource).toContain('snoozingReminderMessageId');
    expect(snoozeReminderSource).toContain(
      'setSnoozingReminderMessageId(messageId);',
    );
    expect(snoozeReminderSource).toContain(
      'setSnoozingReminderMessageId(null);',
    );
    expect(snoozeReminderSource).toContain('Failed to snooze reminder.');
    expect(dismissReminderSource).toContain('dismissingReminderMessageId');
    expect(dismissReminderSource).toContain(
      'setDismissingReminderMessageId(messageId);',
    );
    expect(dismissReminderSource).toContain(
      'setDismissingReminderMessageId(null);',
    );
    expect(dismissAllRemindersSource).toContain('reminders.length === 0');
    expect(dismissAllRemindersSource).toContain('isDismissingAllReminders');
    expect(dismissAllRemindersSource).toContain(
      'setIsDismissingAllReminders(true);',
    );
    expect(dismissAllRemindersSource).toContain(
      'setIsDismissingAllReminders(false);',
    );
    expect(dismissAllRemindersSource).toContain('Promise.all');
    expect(dismissAllRemindersSource).toContain('reminder.messageId');
    expect(dismissAllRemindersSource).toContain(
      'clearMessageReminderOption(reminder.messageId);',
    );
    expect(dismissAllRemindersSource).toContain('Failed to dismiss reminders.');
    expect(focusedHeaderSource).toContain("focusedTeamPanel === 'reminders'");
    expect(focusedHeaderSource).toContain('handleDismissAllMessageReminders()');
    expect(focusedHeaderSource).toContain(
      'disabled={isDismissingAllReminders}',
    );
    expect(focusedHeaderSource).toContain('Dismiss all');
    expect(reminderRowSource).toContain('handleSelectReminder(reminder)');
    expect(reminderRowSource).toContain('role="button"');
    expect(reminderRowSource).toContain('tabIndex={0}');
    expect(reminderRowSource).toContain('onKeyDown={(event) =>');
    expect(reminderRowSource).toContain("event.key !== 'Enter'");
    expect(reminderRowSource).toContain("event.key !== ' '");
    expect(reminderRowSource).toContain('event.preventDefault();');
    expect(reminderRowSource).toContain('event.stopPropagation();');
    expect(reminderRowSource).toContain(
      'void handleSnoozeMessageReminder(reminder.messageId)',
    );
    expect(reminderRowSource).toContain(
      'disabled={snoozingReminderMessageId === reminder.messageId}',
    );
    expect(reminderRowSource).toContain('Snooze');
    expect(reminderRowSource).toContain(
      'void handleDismissMessageReminder(reminder.messageId)',
    );
    expect(reminderRowSource).toContain(
      'disabled={dismissingReminderMessageId === reminder.messageId}',
    );
    expect(reminderRowSource).toContain('Dismiss');
    expect(reminderRowSource).toContain('void handleCopyMessageText(reminder)');
    expect(reminderRowSource).toContain('void handleCopyMessageLink(reminder)');
    expect(reminderRowSource).toContain('Copy text');
    expect(reminderRowSource).toContain('Copy link');
  });

  it('keeps focused Team surfaces out of the secondary sidebar panel', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const secondarySidebarSource = source.slice(
      source.indexOf('<StyledStatusForm'),
      source.indexOf('{onlineTeammates.length > 0 ? ('),
    );

    expect(secondarySidebarSource).toContain('inboxItems.length > 0');
    expect(secondarySidebarSource).not.toContain('savedMessages.length > 0');
    expect(secondarySidebarSource).not.toContain('files.length > 0');
    expect(secondarySidebarSource).not.toContain('reminders.length > 0');
    expect(secondarySidebarSource).not.toContain('mentions.length > 0');
  });

  it('shows every online teammate instead of truncating the online panel', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const onlinePanelSource = source.slice(
      source.indexOf('{onlineTeammates.length > 0 ? ('),
      source.indexOf('<StyledPanelTitle>{t`Channels`}</StyledPanelTitle>'),
    );

    expect(onlinePanelSource).toContain(
      'onlineTeammates.map((presenceItem) => (',
    );
    expect(onlinePanelSource).toContain(
      'openingDirectMessageUserWorkspaceId ===',
    );
    expect(onlinePanelSource).toContain('presenceItem.userWorkspaceId');
    expect(onlinePanelSource).not.toContain('onlineTeammates.slice(');
  });

  it('shows teammate statuses in direct-message and channel member people lists', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const directMessageListSource = source.slice(
      source.indexOf('{sortedDirectMessages.map((directMessage) => {'),
      source.indexOf(
        '</StyledSidebarPanel>',
        source.indexOf('{sortedDirectMessages.map'),
      ),
    );
    const channelMemberListSource = source.slice(
      source.indexOf('{sortedChannelMembers.map((member) => {'),
      source.indexOf(
        '</StyledList>',
        source.indexOf('{sortedChannelMembers.map'),
      ),
    );

    expect(directMessageListSource).toContain(
      'participantPresence?.statusText',
    );
    expect(directMessageListSource).toContain(
      'participantPresence?.statusEmoji',
    );
    expect(channelMemberListSource).toContain('memberPresence?.statusText');
    expect(channelMemberListSource).toContain('memberPresence?.statusEmoji');
  });

  it('lets users start a direct message from a channel member row', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const channelMemberListSource = source.slice(
      source.indexOf('{sortedChannelMembers.map((member) => {'),
      source.indexOf(
        '</StyledList>',
        source.indexOf('{sortedChannelMembers.map'),
      ),
    );
    const openDirectMessageWithTeammateSource = source.slice(
      source.indexOf('const handleOpenDirectMessageWithTeammate = async'),
      source.indexOf('const handleUpdateChannelDetails = async'),
    );

    expect(channelMemberListSource).toContain('!member.isCurrentUser ? (');
    expect(channelMemberListSource).toContain(
      'void handleOpenDirectMessageWithTeammate(',
    );
    expect(channelMemberListSource).toContain('member.userWorkspaceId');
    expect(channelMemberListSource).toContain('t`Message`');
    expect(openDirectMessageWithTeammateSource).toContain(
      "setSelectedInviteUserWorkspaceId('')",
    );
    expect(openDirectMessageWithTeammateSource).toContain(
      "setInviteMemberSearchQuery('')",
    );
    expect(openDirectMessageWithTeammateSource).toContain(
      'if (!data?.createTeamDirectMessage) {',
    );
    expect(openDirectMessageWithTeammateSource).toContain(
      'enqueueErrorSnackBar({ message: t`Failed to start direct message.` });',
    );
  });

  it('renders channel members in a stable owner-first sorted order', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const channelMembersSource = source.slice(
      source.indexOf('const channelMembers = useMemo('),
      source.indexOf('const channelMemberUserWorkspaceIds = useMemo('),
    );
    const channelMemberListSource = source.slice(
      source.indexOf('{sortedChannelMembers.map((member) => {'),
      source.indexOf(
        '</StyledList>',
        source.indexOf('{sortedChannelMembers.map'),
      ),
    );

    expect(source).toContain('sortTeamChannelMembers');
    expect(channelMembersSource).toContain(
      'const sortedChannelMembers = useMemo',
    );
    expect(channelMembersSource).toContain(
      'sortTeamChannelMembers(channelMembers)',
    );
    expect(channelMemberListSource).toContain(
      '{sortedChannelMembers.map((member) => {',
    );
    expect(channelMemberListSource).not.toContain(
      '{channelMembers.map((member) => {',
    );
  });

  it('shows teammate presence context before starting a direct message', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const directMessageSearchSource = source.slice(
      source.indexOf(
        '<StyledCreateChannelInput',
        source.indexOf('Direct Messages'),
      ),
      source.indexOf('{directMessageCandidates.map((candidate) => {'),
    );
    const directMessageCandidateSource = source.slice(
      source.indexOf('{directMessageCandidates.map((candidate) => {'),
      source.indexOf(
        '</StyledSelect>',
        source.indexOf('directMessageCandidates.map'),
      ),
    );

    expect(directMessageSearchSource).toContain(
      'aria-label={t`Clear direct message search`}',
    );
    expect(directMessageSearchSource).toContain(
      "setNewDirectMessageSearchQuery('')",
    );
    expect(directMessageSearchSource).toContain(
      "setSelectedNewDirectMessageUserWorkspaceId('')",
    );
    expect(directMessageCandidateSource).toContain(
      'candidatePresence?.isOnline',
    );
    expect(directMessageCandidateSource).toContain(
      'candidatePresence?.statusText',
    );
    expect(directMessageCandidateSource).toContain(
      'candidatePresence?.statusEmoji',
    );
    expect(directMessageCandidateSource).toContain('t`online`');
    expect(directMessageCandidateSource).toContain('t`offline`');
  });

  it('shows teammate presence context before inviting a channel member', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const inviteCandidateSource = source.slice(
      source.indexOf('{inviteCandidates.map((candidate) => {'),
      source.indexOf('</StyledSelect>', source.indexOf('inviteCandidates.map')),
    );

    expect(inviteCandidateSource).toContain(
      'inviteCandidatePresence?.isOnline',
    );
    expect(inviteCandidateSource).toContain(
      'inviteCandidatePresence?.statusText',
    );
    expect(inviteCandidateSource).toContain(
      'inviteCandidatePresence?.statusEmoji',
    );
    expect(inviteCandidateSource).toContain('t`online`');
    expect(inviteCandidateSource).toContain('t`offline`');
  });

  it('shows an empty state when channel member invite search has no matches', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const inviteMemberSearchSource = source.slice(
      source.lastIndexOf(
        '<StyledCreateChannelInput',
        source.indexOf('{inviteCandidates.map((candidate) => {'),
      ),
      source.indexOf(
        '<StyledList>',
        source.indexOf('{inviteCandidates.map((candidate) => {'),
      ),
    );

    expect(inviteMemberSearchSource).toContain(
      'normalizedInviteMemberSearchQuery.length >= 2',
    );
    expect(inviteMemberSearchSource).toContain(
      'aria-label={t`Clear member invite search`}',
    );
    expect(inviteMemberSearchSource).toContain(
      "setInviteMemberSearchQuery('')",
    );
    expect(inviteMemberSearchSource).toContain(
      "setSelectedInviteUserWorkspaceId('')",
    );
    expect(inviteMemberSearchSource).toContain('inviteCandidates.length === 0');
    expect(inviteMemberSearchSource).toContain(
      'No teammates match this search.',
    );
  });

  it('keeps the selected channel topic visible in the conversation header', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const panelHeaderSource = source.slice(
      source.indexOf('<StyledPanelHeader>', source.indexOf('<StyledPanel>')),
      source.indexOf(
        '<StyledPanelHeaderSpacer />',
        source.indexOf('<StyledPanelHeader>', source.indexOf('<StyledPanel>')),
      ),
    );

    expect(source).toContain('StyledPanelTitleStack');
    expect(source).toContain('StyledPanelSubtitle');
    expect(panelHeaderSource).toContain('!isTeamPanelFocused');
    expect(panelHeaderSource).toContain('!isDirectMessageSelected');
    expect(panelHeaderSource).toContain(
      'effectiveSelectedChannel?.description',
    );
    expect(panelHeaderSource).toContain(
      '{effectiveSelectedChannel.description}',
    );
  });

  it('lets users copy a selected conversation link from the header', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const copyConversationSource = source.slice(
      source.indexOf('const handleCopyConversationLink = async () => {'),
      source.indexOf('const handleCopyMessageLink = async'),
    );
    const panelHeaderSource = source.slice(
      source.indexOf('<StyledPanelHeader>', source.indexOf('<StyledPanel>')),
      source.indexOf(
        '{isDirectMessageSelected &&',
        source.indexOf('<StyledPanelHeader>', source.indexOf('<StyledPanel>')),
      ),
    );

    expect(copyConversationSource).toContain("new URL('/team',");
    expect(copyConversationSource).toContain(
      'conversationUrl.searchParams.set(',
    );
    expect(copyConversationSource).toContain("'teamDirectMessageId'");
    expect(copyConversationSource).toContain("'teamChannelId'");
    expect(copyConversationSource).toContain('handleCopyTeamResource');
    expect(copyConversationSource).toContain('conversation-link');
    expect(copyConversationSource).toContain(
      'value: conversationUrl.toString()',
    );
    expect(copyConversationSource).toContain('Conversation link copied.');
    expect(copyConversationSource).toContain(
      'Failed to copy conversation link.',
    );
    expect(panelHeaderSource).toContain('handleCopyConversationLink');
    expect(panelHeaderSource).toContain('copyingTeamResourceKey');
    expect(panelHeaderSource).toContain('t`Copy link`');
  });

  it('shows author statuses in main and thread message metadata', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const teamMessageTypeSource = source.slice(
      source.indexOf('type TeamMessage = {'),
      source.indexOf('type TeamMessageAttachment = {'),
    );
    const authorStatusRendererSource = source.slice(
      source.indexOf('const renderTeamMessageAuthorStatus ='),
      source.indexOf('const renderTeamMessageTextSegments ='),
    );
    const mainMessageSource = source.slice(
      source.indexOf('{messages.map((message, messageIndex) => ('),
      source.indexOf('<StyledMessageTime', source.indexOf('{messages.map')),
    );
    const threadMessageSource = source.slice(
      source.indexOf('{visibleThreadMessages.map((message, messageIndex) => ('),
      source.indexOf(
        '<StyledMessageTime',
        source.indexOf(
          '{visibleThreadMessages.map((message, messageIndex) => (',
        ),
      ),
    );

    expect(teamMessageTypeSource).toContain('authorUserWorkspaceId: string');
    expect(authorStatusRendererSource).toContain(
      'presenceByUserWorkspaceId.get(',
    );
    expect(authorStatusRendererSource).toContain(
      'message.authorUserWorkspaceId',
    );
    expect(authorStatusRendererSource).toContain('authorPresence?.statusText');
    expect(authorStatusRendererSource).toContain('authorPresence?.statusEmoji');
    expect(mainMessageSource).toContain(
      '{renderTeamMessageAuthorStatus(message)}',
    );
    expect(threadMessageSource).toContain(
      '{renderTeamMessageAuthorStatus(message)}',
    );
  });

  it('scopes starred conversations to the current workspace', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const starredConversationSource = source.slice(
      source.indexOf('const currentWorkspace ='),
      source.indexOf('const [lastMarkedReadKey'),
    );
    const starredConversationSaveSource = source.slice(
      source.indexOf('saveTeamStarredConversationKeys'),
      source.indexOf('const intervalId = window.setInterval'),
    );
    const starToggleSource = source.slice(
      source.indexOf('const handleToggleSelectedConversationStar = () => {'),
      source.indexOf('const handleToggleSelectedConversationMute = () => {'),
    );

    expect(source).toContain('currentWorkspaceState');
    expect(starredConversationSource).toContain('currentWorkspaceId');
    expect(starredConversationSource).toContain(
      'loadTeamStarredConversationKeys({ workspaceId: currentWorkspaceId })',
    );
    expect(starredConversationSaveSource).toContain(
      'loadedStarredConversationWorkspaceId !== currentWorkspaceId',
    );
    expect(starredConversationSaveSource).toContain(
      'saveTeamStarredConversationKeys(starredConversationKeys, {',
    );
    expect(starredConversationSaveSource).toContain(
      'workspaceId: currentWorkspaceId',
    );
    expect(starredConversationSource).toContain(
      'isTogglingSelectedConversationStar',
    );
    expect(starToggleSource).toContain('isTogglingSelectedConversationStar');
    expect(starToggleSource).toContain(
      'setIsTogglingSelectedConversationStar(true);',
    );
    expect(starToggleSource).toContain(
      'setIsTogglingSelectedConversationStar(false);',
    );
    expect(starToggleSource).toContain('Conversation starred.');
    expect(starToggleSource).toContain('Conversation unstarred.');
    expect(source).toContain(
      'disabled={\n                    selectedConversationStarKey === null ||\n                    isTogglingSelectedConversationStar\n                  }',
    );
  });

  it('subscribes only to the active conversation for live message events', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );

    expect(source).toContain('liveMessageEventSubscriptionTargets');
    expect(source).toContain(
      'return [{ directMessageThreadId: effectiveSelectedDirectMessageId }]',
    );
    expect(source).toContain(
      'return [{ channelId: effectiveSelectedChannelId }]',
    );
    expect(source).not.toContain(
      'channels.map((channel) => ({ channelId: channel.id }))',
    );
    expect(source).not.toContain('directMessages.map((directMessage) => ({');
    expect(source).toContain('target.channelId === event.channelId');
    expect(source).toContain(
      'target.directMessageThreadId === event.directMessageThreadId',
    );
  });

  it('preserves thread deep links when the selected conversation hydrates', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const resetThreadSource = source.slice(
      source.indexOf("searchParams.has('teamThreadParentMessageId')"),
      source.indexOf(
        'if (!sseClient || liveMessageEventSubscriptionTargets.length === 0)',
      ),
    );

    expect(resetThreadSource).toContain(
      "searchParams.has('teamThreadParentMessageId')",
    );
    expect(resetThreadSource).toContain(
      'setSelectedThreadParentMessageId(null)',
    );
    expect(resetThreadSource).toContain(
      '[searchParams, selectedChannelId, selectedDirectMessageId]',
    );
  });

  it('lets users close an open thread with Escape without overriding nested handlers', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const closeThreadSource = source.slice(
      source.indexOf('const handleCloseThread = useCallback'),
      source.indexOf(
        'const renderTeamMessageTextSegments',
        source.indexOf('const handleCloseThread = useCallback'),
      ),
    );
    const closeButtonSource = source.slice(
      source.indexOf('aria-label={t`Close thread`}'),
      source.indexOf(
        '</StyledIconButton>',
        source.indexOf('aria-label={t`Close thread`}'),
      ),
    );

    expect(source).toContain('shouldCloseTeamThread');
    expect(closeThreadSource).toContain('event.defaultPrevented');
    expect(closeThreadSource).toContain('handleTeamThreadCloseShortcut');
    expect(closeThreadSource).toContain(
      'hasOpenThread: selectedThreadParentMessageId !== null',
    );
    expect(closeThreadSource).toContain(
      'isEditingMessage: editingMessageId !== null',
    );
    expect(closeThreadSource).toContain('handleCloseThread()');
    expect(closeThreadSource).toContain(
      "window.addEventListener('keydown', handleTeamThreadCloseShortcut)",
    );
    expect(closeThreadSource).toContain(
      "window.removeEventListener('keydown', handleTeamThreadCloseShortcut)",
    );
    expect(closeButtonSource).toContain('onClick={handleCloseThread}');
  });

  it('lets users copy an open thread link from the thread header', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const copyThreadSource = source.slice(
      source.indexOf('const handleCopyThreadLink = async () => {'),
      source.indexOf('const handleCopyConversationLink = async () => {'),
    );
    const threadHeaderSource = source.slice(
      source.indexOf('{selectedThreadParentMessageId ? ('),
      source.indexOf(
        '<StyledMessageList>',
        source.indexOf('{selectedThreadParentMessageId ? ('),
      ),
    );

    expect(copyThreadSource).toContain('selectedThreadParentMessageId');
    expect(copyThreadSource).toContain('buildTeamMessageLink({');
    expect(copyThreadSource).toContain(
      'messageId: selectedThreadParentMessageId',
    );
    expect(copyThreadSource).toContain(
      'parentMessageId: selectedThreadParentMessageId',
    );
    expect(copyThreadSource).toContain('handleCopyTeamResource');
    expect(copyThreadSource).toContain(
      'copyKey: `thread-link:${selectedThreadParentMessageId}`',
    );
    expect(copyThreadSource).toContain('value: threadLink');
    expect(copyThreadSource).toContain('Thread link copied.');
    expect(copyThreadSource).toContain('Failed to copy thread link.');
    expect(threadHeaderSource).toContain('handleCopyThreadLink');
    expect(threadHeaderSource).toContain('copyingTeamResourceKey');
    expect(threadHeaderSource).toContain('t`Copy link`');
  });

  it('shows parent message context in the thread header', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const threadHeaderSource = source.slice(
      source.indexOf('{selectedThreadParentMessageId ? ('),
      source.indexOf(
        '<StyledMessageList>',
        source.indexOf('{selectedThreadParentMessageId ? ('),
      ),
    );

    expect(threadHeaderSource).toContain('selectedThreadParentMessage ? (');
    expect(threadHeaderSource).toContain(
      'selectedThreadParentMessage.authorName',
    );
    expect(threadHeaderSource).toContain(
      'selectedThreadParentMessage.body.length > 0',
    );
    expect(threadHeaderSource).toContain('t`Attachment message`');
    expect(threadHeaderSource).toContain('<StyledPanelSubtitle>');
  });

  it('keeps Team Comms conversation navigation reflected in the URL', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );

    expect(source).toContain('getTeamConversationSearchParams');
    expect(source).toContain('const navigateToTeamConversation = useCallback(');
    expect(source).toContain("pathname: '/team'");
    expect(source).toContain(
      'navigateToTeamConversation({ channelId: channel.id })',
    );
    expect(source).toContain(
      'navigateToTeamConversation({ directMessageThreadId: directMessage.id })',
    );
    expect(source).toContain('navigateToTeamConversation(target)');
    expect(source).toContain('threadParentMessageId: messageId');
  });

  it('opens Team side surfaces as focused routes instead of auto-selecting the first channel', () => {
    const pageSource = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const navigationSource = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/modules/team/components/NavigationDrawerTeamContent.tsx',
      ),
      'utf8',
    );
    const selectedConversationHydrationSource = pageSource.slice(
      pageSource.indexOf("searchParams.get('teamDirectMessageId')"),
      pageSource.indexOf('if (selectedDirectMessageId !== null)'),
    );
    const focusedPanelSource = pageSource.slice(
      pageSource.indexOf('const renderFocusedTeamPanel = () => {'),
      pageSource.indexOf(
        'return null;',
        pageSource.indexOf('const renderFocusedTeamPanel = () => {'),
      ),
    );

    expect(navigationSource).toContain("searchParams.get('teamPanel')");
    expect(navigationSource).toContain('to="/team?teamPanel=inbox"');
    expect(navigationSource).toContain('to="/team?teamPanel=mentions"');
    expect(navigationSource).toContain('to="/team?teamPanel=search"');
    expect(navigationSource).toContain('to="/team?teamPanel=threads"');
    expect(navigationSource).toContain('to="/team?teamPanel=saved"');
    expect(navigationSource).toContain('to="/team?teamPanel=pinned"');
    expect(navigationSource).toContain('to="/team?teamPanel=files"');
    expect(navigationSource).toContain('to="/team?teamPanel=reminders"');
    expect(navigationSource).toContain('Icon={IconClock}');
    expect(navigationSource).toContain(
      "active={activeTeamPanel === 'mentions'}",
    );
    expect(navigationSource).toContain("active={activeTeamPanel === 'search'}");
    expect(navigationSource).toContain(
      "active={activeTeamPanel === 'threads'}",
    );
    expect(navigationSource).toContain("active={activeTeamPanel === 'saved'}");
    expect(navigationSource).toContain("active={activeTeamPanel === 'pinned'}");
    expect(navigationSource).toContain("active={activeTeamPanel === 'files'}");
    expect(navigationSource).toContain(
      "active={activeTeamPanel === 'reminders'}",
    );
    expect(pageSource).toContain('const TEAM_FOCUSED_PANELS = [');
    expect(pageSource).toContain('IconClock');
    expect(pageSource).toContain('const getTeamFocusedPanel = (');
    expect(pageSource).toContain(
      "const focusedTeamPanel = getTeamFocusedPanel(searchParams.get('teamPanel'))",
    );
    expect(selectedConversationHydrationSource).toContain(
      'if (isTeamPanelFocused)',
    );
    expect(selectedConversationHydrationSource).toContain(
      'setSelectedChannelId(null)',
    );
    expect(selectedConversationHydrationSource).toContain(
      'setSelectedDirectMessageId(null)',
    );
    expect(selectedConversationHydrationSource).toContain('return;');
    expect(pageSource).toContain(
      'const effectiveSelectedChannelId = isTeamPanelFocused',
    );
    expect(pageSource).toContain(
      'const hasSelectedConversation =\n    !isTeamPanelFocused',
    );
    expect(pageSource).toContain(
      '{isTeamPanelFocused ? renderFocusedTeamPanel() : null}',
    );
    expect(pageSource).toContain(
      '{!hasSelectedConversation && !isTeamPanelFocused ? (',
    );
    expect(focusedPanelSource).toContain("focusedTeamPanel === 'inbox'");
    expect(focusedPanelSource).toContain("focusedTeamPanel === 'mentions'");
    expect(focusedPanelSource).toContain("focusedTeamPanel === 'search'");
    expect(focusedPanelSource).toContain("focusedTeamPanel === 'threads'");
    expect(focusedPanelSource).toContain("focusedTeamPanel === 'saved'");
    expect(focusedPanelSource).toContain("focusedTeamPanel === 'pinned'");
    expect(focusedPanelSource).toContain("focusedTeamPanel === 'files'");
    expect(focusedPanelSource).toContain("focusedTeamPanel === 'reminders'");
    expect(focusedPanelSource).toContain('renderTeamInboxItem(item)');
    expect(focusedPanelSource).toContain('renderTeamMention(mention)');
    expect(focusedPanelSource).toContain('renderTeamMessageSearchBox()');
    expect(focusedPanelSource).toContain('renderTeamSavedMessage(message)');
    expect(focusedPanelSource).toContain('renderTeamPinnedMessage(message)');
    expect(focusedPanelSource).toContain('renderTeamFile(file)');
    expect(focusedPanelSource).toContain('renderTeamReminder(reminder)');
    expect(focusedPanelSource).toContain('No unread team messages.');
    expect(focusedPanelSource).toContain('No team mentions.');
    expect(focusedPanelSource).toContain('No unread team threads.');
    expect(focusedPanelSource).toContain('No saved team messages.');
    expect(focusedPanelSource).toContain('No pinned team messages.');
    expect(focusedPanelSource).toContain('No team files.');
    expect(focusedPanelSource).toContain('No team reminders.');
  });

  it('opens focused message search with the command palette shortcut', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const searchShortcutSource = source.slice(
      source.indexOf('const handleTeamSearchShortcut ='),
      source.indexOf(
        "window.addEventListener('keydown', handleTeamSearchShortcut)",
      ),
    );

    expect(source).toContain('shouldFocusTeamMessageSearch');
    expect(source).toContain('focusTeamSearchInput');
    expect(source).toContain('messageSearchInputElement');
    expect(searchShortcutSource).toContain("search: '?teamPanel=search'");
    expect(searchShortcutSource).toContain('event.preventDefault()');
    expect(searchShortcutSource).toContain(
      'focusTeamSearchInput(messageSearchInputElement)',
    );
    expect(source).toContain(
      "window.addEventListener('keydown', handleTeamSearchShortcut)",
    );
    expect(source).toContain(
      "window.removeEventListener('keydown', handleTeamSearchShortcut)",
    );
    expect(source).toContain('ref={setMessageSearchInputElement}');
    expect(source).toContain('aria-label={t`Search team messages`}');
    expect(source).toContain('aria-label={t`Clear message search`}');
    expect(source).toContain("setMessageSearchQuery('')");
  });

  it('shows pending work badges on focused Team navigation items', () => {
    const navigationSource = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/modules/team/components/NavigationDrawerTeamContent.tsx',
      ),
      'utf8',
    );

    expect(navigationSource).toContain('GET_TEAM_INBOX');
    expect(navigationSource).toContain('GET_TEAM_MENTIONS');
    expect(navigationSource).toContain('GET_TEAM_SAVED_MESSAGES');
    expect(navigationSource).toContain('GET_TEAM_FILES');
    expect(navigationSource).toContain('GET_TEAM_MESSAGE_REMINDERS');
    expect(navigationSource).toContain('GET_TEAM_PINNED_MESSAGES');
    expect(navigationSource).toContain(
      'const TEAM_DRAWER_REFRESH_INTERVAL_MS = 30000',
    );
    expect(navigationSource).toContain('IconClock');
    expect(navigationSource).toContain('const inboxCount = inboxItems.reduce');
    expect(navigationSource).toContain('const threadInboxCount = inboxItems');
    expect(navigationSource).toContain('mention.readAt === null');
    expect(navigationSource).toContain(
      'remindersData?.teamMessageReminders ?? []',
    );
    expect(navigationSource).toContain(
      'pinnedMessagesData?.teamPinnedMessages ?? []',
    );
    expect(navigationSource).toContain(
      'savedMessagesData?.teamSavedMessages ?? []',
    );
    expect(navigationSource).toContain('filesData?.teamFiles ?? []');
    expect(navigationSource).toContain('inboxCount > 0 ? (');
    expect(navigationSource).toContain('threadInboxCount > 0 ? (');
    expect(navigationSource).toContain('unreadMentionCount > 0 ? (');
    expect(navigationSource).toContain('savedMessages.length > 0 ? (');
    expect(navigationSource).toContain('files.length > 0 ? (');
    expect(navigationSource).toContain('reminders.length > 0 ? (');
    expect(navigationSource).toContain('pinnedMessages.length > 0 ? (');
    expect(navigationSource.match(/pollInterval/g)).toHaveLength(8);
    expect(navigationSource).toContain(
      'pollInterval: TEAM_DRAWER_REFRESH_INTERVAL_MS',
    );
  });

  it('keeps focused Pinned route actionable', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const pinnedMessageSource = source.slice(
      source.indexOf('const renderTeamPinnedMessage = (message: TeamMessage)'),
      source.indexOf('const renderTeamFile = (file: TeamFile)'),
    );

    expect(source).toContain("'pinned'");
    expect(source).toContain("focusedTeamPanel === 'pinned'");
    expect(source).toContain(
      "const shouldQueryGlobalPinnedMessages = focusedTeamPanel === 'pinned'",
    );
    expect(source).toContain('!shouldQueryGlobalPinnedMessages &&');
    expect(source).toContain('!isComposerEnabled && !isTeamPanelFocused');
    expect(source).toContain('togglingPinnedMessageId');
    expect(source).toContain('pinnedMessages.map');
    expect(pinnedMessageSource).toContain(
      'handleSelectTeamConversationTarget(message)',
    );
    expect(pinnedMessageSource).toContain(
      'handleToggleMessagePin(message.id, true)',
    );
    expect(pinnedMessageSource).toContain(
      'disabled={togglingPinnedMessageId === message.id}',
    );
    expect(pinnedMessageSource).toContain('Unpin');
  });

  it('keeps focused Inbox, Mentions, and Saved routes actionable', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const focusedHeaderSource = source.slice(
      source.indexOf("focusedTeamPanel === 'inbox' && inboxItems.length > 0"),
      source.indexOf('{!isTeamPanelFocused ? ('),
    );
    const savedMessageSource = source.slice(
      source.indexOf('const renderTeamSavedMessage = (message: TeamMessage)'),
      source.indexOf('const renderTeamFile = (file: TeamFile)'),
    );
    const mentionMessageSource = source.slice(
      source.indexOf('const renderTeamMention = (mention: TeamMention)'),
      source.indexOf('const focusedTeamPanelTitle ='),
    );
    const markMentionReadSource = source.slice(
      source.indexOf('const handleMarkMentionRead = async'),
      source.indexOf('const handleMarkInboxRead = async'),
    );
    const inboxItemReadSource = source.slice(
      source.indexOf('const handleMarkInboxItemRead = async'),
      source.indexOf('const handleMarkMentionRead = async'),
    );
    const markAllMentionsReadSource = source.slice(
      source.indexOf('const handleMarkAllMentionsRead = async'),
      source.indexOf('const handleMarkInboxRead = async'),
    );
    const markInboxReadSource = source.slice(
      source.indexOf('const handleMarkInboxRead = async'),
      source.indexOf('const handleSelectSavedMessage ='),
    );
    const sidebarInboxHeaderStart = source.indexOf(
      '{inboxItems.length > 0 ? (',
    );
    const sidebarInboxHeaderSource = source.slice(
      sidebarInboxHeaderStart,
      source.indexOf('<StyledSearchResults>', sidebarInboxHeaderStart),
    );
    const toggleSavedMessageSource = source.slice(
      source.indexOf('const handleToggleMessageBookmark = async'),
      source.indexOf('const handleStartEditingMessage ='),
    );

    expect(focusedHeaderSource).toContain('handleMarkInboxRead()');
    expect(focusedHeaderSource).toContain('disabled={isMarkingInboxRead}');
    expect(focusedHeaderSource).toContain("focusedTeamPanel === 'mentions'");
    expect(focusedHeaderSource).toContain(
      'mentions.some((mention) => mention.readAt === null)',
    );
    expect(focusedHeaderSource).toContain('handleMarkAllMentionsRead()');
    expect(focusedHeaderSource).toContain('disabled={isMarkingMentionsRead}');
    expect(focusedHeaderSource).toContain('handleMarkAllThreadsRead()');
    expect(focusedHeaderSource).toContain('disabled={isMarkingThreadsRead}');
    expect(focusedHeaderSource).toContain('Mark all read');
    expect(sidebarInboxHeaderSource).toContain('disabled={isMarkingInboxRead}');
    expect(toggleSavedMessageSource).toContain('togglingSavedMessageId');
    expect(toggleSavedMessageSource).toContain(
      '!isComposerEnabled && !isTeamPanelFocused',
    );
    expect(toggleSavedMessageSource).toContain(
      'Failed to update saved message.',
    );
    expect(toggleSavedMessageSource).toContain('Message unsaved.');
    expect(savedMessageSource).toContain('handleSelectSavedMessage(message)');
    expect(savedMessageSource).toContain(
      'void handleToggleMessageBookmark(message.id, true)',
    );
    expect(savedMessageSource).toContain(
      'disabled={togglingSavedMessageId === message.id}',
    );
    expect(savedMessageSource).toContain('Unsave');
    expect(mentionMessageSource).toContain('handleSelectMention(mention)');
    expect(mentionMessageSource).toContain('mention.readAt === null');
    expect(mentionMessageSource).toContain(
      'void handleMarkMentionRead(mention.id)',
    );
    expect(mentionMessageSource).toContain('Read');
    expect(inboxItemReadSource).toContain('options: { showSuccess: boolean }');
    expect(inboxItemReadSource).toContain('{ showSuccess: false }');
    expect(inboxItemReadSource).toContain('Inbox item marked read.');
    expect(inboxItemReadSource).toContain('Threads marked read.');
    expect(inboxItemReadSource).toContain('isMarkingThreadsRead');
    expect(inboxItemReadSource).toContain('setIsMarkingThreadsRead(true);');
    expect(inboxItemReadSource).toContain('setIsMarkingThreadsRead(false);');
    expect(markMentionReadSource).toContain('markTeamMentionRead');
    expect(markMentionReadSource).toContain('Mention marked read.');
    expect(markMentionReadSource).toContain('Failed to mark mention read.');
    expect(markAllMentionsReadSource).toContain('mentions.filter(');
    expect(markAllMentionsReadSource).toContain(
      '(mention) => mention.readAt === null',
    );
    expect(markAllMentionsReadSource).toContain('Promise.all');
    expect(markAllMentionsReadSource).toContain(
      'Failed to mark mentions read.',
    );
    expect(markAllMentionsReadSource).toContain('Mentions marked read.');
    expect(markAllMentionsReadSource).toContain('isMarkingMentionsRead');
    expect(markAllMentionsReadSource).toContain(
      'setIsMarkingMentionsRead(true);',
    );
    expect(markAllMentionsReadSource).toContain(
      'setIsMarkingMentionsRead(false);',
    );
    expect(markInboxReadSource).toContain('isMarkingInboxRead');
    expect(markInboxReadSource).toContain('setIsMarkingInboxRead(true);');
    expect(markInboxReadSource).toContain('setIsMarkingInboxRead(false);');
  });

  it('opens threads from focused message-reference rows', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const openThreadTargetSource = source.slice(
      source.indexOf('const handleOpenTeamMessageThreadTarget ='),
      source.indexOf('const handleSelectSearchResult ='),
    );

    for (const [startMarker, endMarker, targetName] of [
      ['const renderTeamInboxItem =', 'const renderTeamSavedMessage =', 'item'],
      [
        'const renderTeamSavedMessage =',
        'const renderTeamPinnedMessage =',
        'message',
      ],
      ['const renderTeamPinnedMessage =', 'const renderTeamFile =', 'message'],
      [
        'const renderTeamReminder =',
        'const renderTeamMessageSearchResults =',
        'reminder',
      ],
      [
        'const renderTeamMessageSearchResults =',
        'const renderTeamMessageSearchBox =',
        'result',
      ],
      [
        'const renderTeamMention =',
        'const renderTeamMessageReactionActions =',
        'mention',
      ],
    ] as const) {
      const rowSource = source.slice(
        source.indexOf(startMarker),
        source.indexOf(endMarker),
      );

      expect(rowSource).toContain(
        `handleOpenTeamMessageThreadTarget(${targetName})`,
      );
      expect(rowSource).toContain('t`Open thread`');
    }

    expect(openThreadTargetSource).toContain(
      'target.threadParentMessageId ?? target.messageId',
    );
    expect(openThreadTargetSource).toContain(
      'handleSelectTeamConversationTarget({',
    );
    expect(openThreadTargetSource).toContain('threadParentMessageId');
    expect(openThreadTargetSource).toContain(
      'focusTeamComposerInput(threadDraftMessageInputElement)',
    );
  });

  it('focuses the matching composer after selecting focused message-reference rows', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const selectTargetSource = source.slice(
      source.indexOf('const handleSelectTeamConversationTarget ='),
      source.indexOf('const handleOpenTeamMessageThreadTarget ='),
    );

    expect(selectTargetSource).toContain('target.threadParentMessageId');
    expect(selectTargetSource).toContain(
      'focusTeamComposerInput(threadDraftMessageInputElement)',
    );
    expect(selectTargetSource).toContain(
      'focusTeamComposerInput(draftMessageInputElement)',
    );
  });

  it('keeps the focused Threads route actionable', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const focusedHeaderSource = source.slice(
      source.indexOf('focusedTeamPanel ==='),
      source.indexOf('{hasSelectedConversation && messages.length > 0 ? ('),
    );
    const markAllThreadsReadSource = source.slice(
      source.indexOf('const handleMarkAllThreadsRead = async'),
      source.indexOf('const handleMarkMentionRead = async'),
    );

    expect(source).toContain("'threads'");
    expect(source).toContain("focusedTeamPanel === 'threads'");
    expect(source).toContain('threadInboxItems.map');
    expect(source).toContain('No unread team threads.');
    expect(focusedHeaderSource).toContain('handleMarkAllThreadsRead()');
    expect(markAllThreadsReadSource).toContain('threadInboxItems.length === 0');
    expect(markAllThreadsReadSource).toContain('Promise.all');
    expect(markAllThreadsReadSource).toContain(
      'handleMarkInboxItemRead(item, { showSuccess: false })',
    );
    expect(source).toContain('): Promise<boolean> =>');
    expect(source).toContain('return true;');
    expect(source).toContain('return false;');
    expect(markAllThreadsReadSource).toContain('const didMarkAllThreadsRead =');
    expect(markAllThreadsReadSource).toContain('.every(Boolean)');
    expect(markAllThreadsReadSource).toContain('if (didMarkAllThreadsRead) {');
    expect(markAllThreadsReadSource).toContain('Threads marked read.');
  });

  it('lets users mark one inbox item read without opening every unread item', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const markInboxItemReadSource = source.slice(
      source.indexOf('const handleMarkInboxItemRead'),
      source.indexOf('const handleMarkInboxRead'),
    );
    const inboxItemRendererSource = source.slice(
      source.indexOf('const renderTeamInboxItem'),
      source.indexOf('return (', source.indexOf('const renderTeamInboxItem')),
    );
    const inboxPanelSource = source.slice(
      source.indexOf('{inboxItems.map((item) => renderTeamInboxItem(item))}'),
      source.indexOf('{savedMessages.length > 0 ? ('),
    );

    expect(markInboxItemReadSource).toContain('markTeamMentionRead');
    expect(markInboxItemReadSource).toContain('markTeamMessageThreadRead');
    expect(markInboxItemReadSource).toContain('markTeamDirectMessageRead');
    expect(markInboxItemReadSource).toContain('markTeamChannelRead');
    expect(markInboxItemReadSource).not.toContain('markTeamInboxRead');
    expect(inboxItemRendererSource).toContain('StyledInboxResult');
    expect(inboxItemRendererSource).toContain('StyledInboxResultButton');
    expect(inboxItemRendererSource).toContain('handleSelectInboxItem(item)');
    expect(inboxItemRendererSource).toContain('event.stopPropagation()');
    expect(inboxItemRendererSource).toContain('handleMarkInboxItemRead(item)');
    expect(inboxItemRendererSource).toContain('{t`Read`}');
    expect(inboxItemRendererSource).toContain(
      'disabled={copyingTeamResourceKey === `message-text:${item.id}`}',
    );
    expect(inboxItemRendererSource).toContain('body: item.subtitle ??');
    expect(inboxItemRendererSource).toContain('id: item.id');
    expect(inboxItemRendererSource).toContain('handleCopyMessageLink(item)');
    expect(inboxItemRendererSource).toContain(
      'disabled={copyingTeamResourceKey === `message-link:${item.messageId}`}',
    );
    expect(inboxItemRendererSource).toContain('item.messageId != null');
    expect(inboxItemRendererSource).toContain('{t`Copy text`}');
    expect(inboxItemRendererSource).toContain('{t`Copy link`}');
    expect(inboxPanelSource).toContain('renderTeamInboxItem(item)');
  });

  it('requests new-message state for live notification gating', () => {
    const operationsSource = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/modules/team/graphql/teamCommsOperations.ts',
      ),
      'utf8',
    );
    const notificationsSource = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/modules/team/utils/teamNotifications.ts',
      ),
      'utf8',
    );
    const eventSubscriptionSource = operationsSource.slice(
      operationsSource.indexOf('export const ON_TEAM_MESSAGE_EVENT'),
      operationsSource.indexOf('export const GET_TEAM_CHANNEL_MEMBERS'),
    );

    expect(eventSubscriptionSource).toContain('isNewMessage');
    expect(notificationsSource).toContain('event.isNewMessage !== true');
  });

  it('keeps background presence and typing heartbeats from surfacing unhandled rejections', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const presenceHeartbeatSource = source.slice(
      source.indexOf('const heartbeatTeamPresenceSafely ='),
      source.indexOf(
        'const activeDraftMessage =',
        source.indexOf('const heartbeatTeamPresenceSafely ='),
      ),
    );
    const typingHeartbeatSource = source.slice(
      source.indexOf('void heartbeatTeamTyping({ variables })'),
      source.indexOf(
        '}, [',
        source.indexOf('void heartbeatTeamTyping({ variables })'),
      ),
    );

    expect(presenceHeartbeatSource).toContain('heartbeatTeamPresenceSafely');
    expect(presenceHeartbeatSource).toContain('.catch(() => {})');
    expect(typingHeartbeatSource).toContain('.catch(() => {})');
    expect(typingHeartbeatSource).toContain(
      'refetchTeamDataSafely(refetchThreadTypingIndicators)',
    );
    expect(typingHeartbeatSource).toContain(
      'refetchTeamDataSafely(refetchTypingIndicators)',
    );
    expect(typingHeartbeatSource).not.toContain(
      'void refetchThreadTypingIndicators();',
    );
    expect(typingHeartbeatSource).not.toContain(
      'void refetchTypingIndicators();',
    );
  });

  it('throttles typing heartbeats per active conversation target', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const typingHeartbeatSource = source.slice(
      source.indexOf('const activeDraftMessage ='),
      source.indexOf('useEffect(() => {', source.indexOf('setDraftMessage(')),
    );

    expect(typingHeartbeatSource).toContain(
      'const typingHeartbeatKey = isDirectMessageSelected',
    );
    expect(typingHeartbeatSource).toContain('direct-message:');
    expect(typingHeartbeatSource).toContain('channel:');
    expect(typingHeartbeatSource).toContain('selectedThreadParentMessageId');
    expect(typingHeartbeatSource).toContain(
      'lastTypingHeartbeatKey === typingHeartbeatKey',
    );
    expect(typingHeartbeatSource).toContain(
      'setLastTypingHeartbeatKey(typingHeartbeatKey)',
    );
  });

  it('uses channel-level notification settings for live channel message snackbars', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const liveNotificationSource = source.slice(
      source.indexOf('shouldShowTeamLiveMessageNotification({'),
      source.indexOf(
        'enqueueInfoSnackBar({',
        source.indexOf('shouldShowTeamLiveMessageNotification({'),
      ),
    );

    expect(liveNotificationSource).toContain('eventChannel?.notificationLevel');
    expect(liveNotificationSource).toContain(
      "(eventChannel?.isMember ? 'ALL' : 'MUTED')",
    );
    expect(liveNotificationSource).not.toContain(
      "eventChannelMember?.notificationLevel ?? (eventChannel?.isMember ? 'ALL' : 'MENTIONS')",
    );
  });

  it('formats live message snackbar bodies instead of showing blank attachment messages', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const liveNotificationSource = source.slice(
      source.indexOf('enqueueInfoSnackBar({'),
      source.indexOf(
        'dedupeKey: `team-message-event-${event.messageId}`',
        source.indexOf('enqueueInfoSnackBar({'),
      ),
    );

    expect(source).toContain('getTeamLiveMessageNotificationBody');
    expect(liveNotificationSource).toContain(
      'getTeamLiveMessageNotificationBody(event.body)',
    );
    expect(liveNotificationSource).not.toContain(
      'message: t`${event.authorName}: ${event.body}`',
    );
  });

  it('keeps desktop notification construction failures from breaking the notification loop', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const desktopNotificationSource = source.slice(
      source.indexOf('newCandidates.slice(0, 3).forEach'),
      source.indexOf(
        'return new Set([',
        source.indexOf('newCandidates.slice(0, 3).forEach'),
      ),
    );

    expect(desktopNotificationSource).toContain('try {');
    expect(desktopNotificationSource).toContain('new window.Notification');
    expect(desktopNotificationSource).toContain('catch');
  });

  it('formats attachment-only search results with a readable fallback body', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const searchResultSource = source.slice(
      source.indexOf('messageSearchResults.length > 0 ? ('),
      source.indexOf(
        '</StyledSearchResults>',
        source.indexOf('messageSearchResults.length > 0 ? ('),
      ),
    );

    expect(searchResultSource).toContain(
      'getTeamLiveMessageNotificationBody(result.body)',
    );
    expect(searchResultSource).not.toContain('{result.body}');
  });

  it('lets users copy attachment search result file links', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const searchResultSource = source.slice(
      source.indexOf('messageSearchResults.length > 0 ? ('),
      source.indexOf(
        '</StyledSearchResults>',
        source.indexOf('messageSearchResults.length > 0 ? ('),
      ),
    );

    expect(searchResultSource).toContain('result.attachmentUrl ? (');
    expect(searchResultSource).toContain('void handleCopyAttachmentLink({');
    expect(searchResultSource).toContain('url: result.attachmentUrl');
    expect(searchResultSource).toContain('t`Copy file link`');
  });

  it('formats attachment-only inbox subtitles with a readable fallback body', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const inboxItemSource = source.slice(
      source.indexOf('const renderTeamInboxItem'),
      source.indexOf('return (', source.indexOf('const renderTeamInboxItem')),
    );

    expect(inboxItemSource).toContain('getTeamLiveMessageNotificationBody(');
    expect(inboxItemSource).toContain("item.subtitle ?? ''");
    expect(inboxItemSource).not.toContain('{item.subtitle}');
  });

  it('formats attachment-only mention bodies with a readable fallback body', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const mentionSource = source.slice(
      source.indexOf('const renderTeamMention = (mention: TeamMention)'),
      source.indexOf('const renderTeamCustomReactionInput ='),
    );

    expect(mentionSource).toContain('getTeamLiveMessageNotificationBody(');
    expect(mentionSource).toContain("mention.body ?? ''");
    expect(mentionSource).not.toContain('{mention.body}');
  });

  it('supports loading earlier thread replies', () => {
    const pageSource = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const operationsSource = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/modules/team/graphql/teamCommsOperations.ts',
      ),
      'utf8',
    );
    const threadQuerySource = operationsSource.slice(
      operationsSource.indexOf('export const GET_TEAM_MESSAGE_THREAD'),
      operationsSource.indexOf('export const TOGGLE_TEAM_MESSAGE_REACTION'),
    );
    const threadQueryUsageSource = pageSource.slice(
      pageSource.indexOf('data: threadMessagesData'),
      pageSource.indexOf('const messages = useMemo<TeamMessage[]>'),
    );
    const threadLoadEarlierSource = pageSource.slice(
      pageSource.indexOf('const handleLoadEarlierThreadMessages ='),
      pageSource.indexOf('const handleMarkMessageUnread ='),
    );
    const threadPanelSource = pageSource.slice(
      pageSource.indexOf('{selectedThreadParentMessageId ? ('),
      pageSource.indexOf('{visibleThreadMessages.map((message) => ('),
    );
    const mainLoadEarlierButtonSource = pageSource.slice(
      pageSource.indexOf('{canLoadEarlierMessages ? ('),
      pageSource.indexOf('{messages.map((message, messageIndex) => ('),
    );

    expect(threadQuerySource).toContain('$before: String');
    expect(threadQuerySource).toContain('before: $before');
    expect(threadQueryUsageSource).toContain(
      'fetchMore: fetchMoreThreadMessages',
    );
    expect(threadLoadEarlierSource).toContain('fetchMoreThreadMessages');
    expect(threadLoadEarlierSource).toContain('teamMessageThread');
    expect(threadPanelSource).toContain('canLoadEarlierThreadMessages');
    expect(threadPanelSource).toContain('handleLoadEarlierThreadMessages');
    expect(mainLoadEarlierButtonSource).toContain('t`Load earlier messages`');
    expect(mainLoadEarlierButtonSource).toContain('t`Loading messages...`');
    expect(threadPanelSource).toContain('t`Load earlier replies`');
    expect(threadPanelSource).toContain('t`Loading replies...`');
  });

  it('uses the shared typing indicator formatter without hiding extra typers', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const typingIndicatorStart = source.indexOf(
      'const mainTypingIndicatorText',
    );
    const typingIndicatorSource = source.slice(
      typingIndicatorStart,
      source.indexOf('return (', typingIndicatorStart),
    );

    expect(source).toContain('formatTeamTypingIndicatorText');
    expect(typingIndicatorSource).toContain('mainTypingIndicators');
    expect(typingIndicatorSource).toContain('threadTypingIndicators');
    expect(typingIndicatorSource).toContain('formatTeamTypingIndicatorText');
    expect(typingIndicatorSource).not.toContain('.slice(0, 2)');
  });

  it('keeps multiple pending attachments in both message composers', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );

    expect(source).toContain('pendingAttachments');
    expect(source).toContain('pendingThreadAttachments');
    expect(source).toContain('appendTeamPendingAttachments');
    expect(source).toContain('removeTeamPendingAttachmentAtIndex');
    expect(source).toContain('multiple');
    expect(source).toContain('setPendingAttachments([])');
    expect(source).toContain('setPendingThreadAttachments([])');
    expect(source).not.toContain(
      'pendingAttachment ? [pendingAttachment] : []',
    );
    expect(source).not.toContain(
      'pendingThreadAttachment ? [pendingThreadAttachment] : []',
    );
    expect(source).not.toContain('setPendingAttachment(null)');
    expect(source).not.toContain('setPendingThreadAttachment(null)');
  });

  it('shows useful pending attachment metadata before messages are sent', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const mainComposerSource = source.slice(
      source.indexOf('{pendingAttachments.map((attachment, attachmentIndex)'),
      source.indexOf('{selectedThreadParentMessageId ? ('),
    );
    const threadComposerSource = source.slice(
      source.indexOf(
        '{pendingThreadAttachments.map((attachment, attachmentIndex)',
      ),
      source.indexOf(
        '</StyledComposerStack>',
        source.indexOf(
          '{pendingThreadAttachments.map((attachment, attachmentIndex)',
        ),
      ),
    );

    expect(source).toContain("from '@/file/utils/formatFileSize'");
    expect(mainComposerSource).toContain('href={attachment.url}');
    expect(mainComposerSource).toContain('target="_blank"');
    expect(mainComposerSource).toContain('formatFileSize(attachment.size)');
    expect(threadComposerSource).toContain('href={attachment.url}');
    expect(threadComposerSource).toContain('target="_blank"');
    expect(threadComposerSource).toContain('formatFileSize(attachment.size)');
  });

  it('clears pending attachments when switching conversation or thread draft scopes', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const mainAttachmentScopeSource = source.slice(
      source.indexOf('setDraftMessage(loadTeamDraft(draftStorageKey))'),
      source.indexOf(
        'if (loadedDraftStorageKey !== draftStorageKey)',
        source.indexOf('setDraftMessage(loadTeamDraft(draftStorageKey))'),
      ),
    );
    const threadAttachmentScopeSource = source.slice(
      source.indexOf('if (!threadDraftStorageKey) {'),
      source.indexOf(
        'if (',
        source.indexOf('if (!threadDraftStorageKey) {') + 1,
      ),
    );

    expect(mainAttachmentScopeSource).toContain('setPendingAttachments([])');
    expect(threadAttachmentScopeSource).toContain(
      'setPendingThreadAttachments([])',
    );
  });

  it('lets users discard main and thread drafts with pending attachments', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const discardDraftSource = source.slice(
      source.indexOf('const handleDiscardDraftMessage ='),
      source.indexOf('const handleSelectChannel ='),
    );
    const mainComposerStackStart = source.lastIndexOf(
      '<StyledComposerStack',
      source.indexOf('{pendingAttachments.map((attachment, attachmentIndex)'),
    );
    const threadComposerStackStart = source.lastIndexOf(
      '<StyledComposerStack',
      source.indexOf(
        '{pendingThreadAttachments.map((attachment, attachmentIndex)',
      ),
    );
    const mainComposerSource = source.slice(
      mainComposerStackStart,
      source.indexOf('{selectedThreadParentMessageId ? ('),
    );
    const threadComposerSource = source.slice(
      threadComposerStackStart,
      source.indexOf(
        '</StyledComposerStack>',
        source.indexOf(
          '{pendingThreadAttachments.map((attachment, attachmentIndex)',
        ),
      ),
    );

    expect(discardDraftSource).toContain('clearTeamDraft(draftStorageKey)');
    expect(discardDraftSource).toContain('setDraftMessage');
    expect(discardDraftSource).toContain('setPendingAttachments([])');
    expect(discardDraftSource).toContain('draftMessageInputElement.value');
    expect(discardDraftSource).toContain('draftMessageInputElement.focus()');
    expect(discardDraftSource).toContain(
      'clearTeamDraft(threadDraftStorageKey)',
    );
    expect(discardDraftSource).toContain('setThreadDraftMessage');
    expect(discardDraftSource).toContain('setPendingThreadAttachments([])');
    expect(discardDraftSource).toContain(
      'threadDraftMessageInputElement.value',
    );
    expect(discardDraftSource).toContain(
      'threadDraftMessageInputElement.focus()',
    );
    expect(mainComposerSource).toContain('Discard draft');
    expect(mainComposerSource).toContain('handleDiscardDraftMessage');
    expect(mainComposerSource).toContain('pendingAttachments.length > 0');
    expect(threadComposerSource).toContain('Discard draft');
    expect(threadComposerSource).toContain('handleDiscardThreadDraftMessage');
    expect(threadComposerSource).toContain(
      'pendingThreadAttachments.length > 0',
    );
  });

  it('disables attachment pickers when the composer cannot send', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const composerSource = source.slice(
      source.indexOf('{pendingAttachments.map((attachment, attachmentIndex)'),
      source.indexOf('{selectedThreadParentMessageId ? ('),
    );
    const threadComposerSource = source.slice(
      source.indexOf(
        '{pendingThreadAttachments.map((attachment, attachmentIndex)',
      ),
      source.indexOf(
        '</StyledComposerStack>',
        source.indexOf(
          '{pendingThreadAttachments.map((attachment, attachmentIndex)',
        ),
      ),
    );

    expect(composerSource).toContain('<StyledIconButtonLabel');
    expect(composerSource).toContain('disabled={!isComposerEnabled}');
    expect(threadComposerSource).toContain('<StyledIconButtonLabel');
    expect(threadComposerSource).toContain('disabled={!isComposerEnabled}');
  });

  it('warns users when selected attachments exceed the composer limit', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const attachmentSelectionSource = source.slice(
      source.indexOf('const handleSelectAttachments = async ('),
      source.indexOf('const handleAttachmentInputChange = async ('),
    );

    expect(attachmentSelectionSource).toContain(
      'TEAM_PENDING_ATTACHMENT_LIMIT - pendingAttachmentCount',
    );
    expect(attachmentSelectionSource).toContain('Attachment limit reached.');
    expect(attachmentSelectionSource).toContain(
      'Only 5 attachments can be added to one message.',
    );
  });

  it('lets users drop files onto main and thread composers', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const dragDropSource = source.slice(
      source.indexOf('const hasDraggedFiles = ('),
      source.indexOf('const mainTypingIndicatorText'),
    );
    expect(source).toContain('type DragEvent');
    expect(source).toContain('isMainComposerDragActive');
    expect(source).toContain('isThreadComposerDragActive');
    expect(dragDropSource).toContain('handleAttachmentDragEnter');
    expect(dragDropSource).toContain('handleAttachmentDragOver');
    expect(dragDropSource).toContain('handleAttachmentDragLeave');
    expect(dragDropSource).toContain('handleAttachmentDrop');
    expect(dragDropSource).toContain('event.dataTransfer.dropEffect =');
    expect(dragDropSource).toContain('Array.from(event.dataTransfer.files)');
    expect(dragDropSource).toContain('handleSelectAttachments(');
    expect(source).toContain('dragActive={isMainComposerDragActive}');
    expect(source).toContain('setIsMainComposerDragActive');
    expect(source).toContain('setPendingAttachments');
    expect(source).toContain('dragActive={isThreadComposerDragActive}');
    expect(source).toContain('setIsThreadComposerDragActive');
    expect(source).toContain('setPendingThreadAttachments');
    expect(source).toContain('onDrop={(event)');
  });

  it('lets users paste files into main and thread composers', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const pasteSource = source.slice(
      source.indexOf('const handleAttachmentPaste = async ('),
      source.indexOf('const mainTypingIndicatorText'),
    );

    expect(source).toContain('type ClipboardEvent');
    expect(pasteSource).toContain('event.clipboardData.files.length === 0');
    expect(pasteSource).toContain('event.preventDefault()');
    expect(pasteSource).toContain('Array.from(event.clipboardData.files)');
    expect(pasteSource).toContain('handleSelectAttachments(');
    expect(source).toContain('onPaste={(event)');
    expect(source).toContain(
      'pendingAttachmentCount: pendingAttachments.length',
    );
    expect(source).toContain(
      'pendingAttachmentCount: pendingThreadAttachments.length',
    );
  });

  it('does not send messages when the composer is disabled', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const sendMessageSource = source.slice(
      source.indexOf(
        'const handleSendMessage = async (draftMessageOverride?: string) => {',
      ),
      source.indexOf('const handleRequestTeamNotifications'),
    );
    const sendThreadReplySource = source.slice(
      source.indexOf('const handleSendThreadReply = async ('),
      source.indexOf('const handleSelectChannel ='),
    );
    const composerSource = source.slice(
      source.indexOf('{pendingAttachments.map((attachment, attachmentIndex)'),
      source.indexOf('{selectedThreadParentMessageId ? ('),
    );
    const threadComposerSource = source.slice(
      source.indexOf(
        '{pendingThreadAttachments.map((attachment, attachmentIndex)',
      ),
      source.indexOf(
        '</StyledComposerStack>',
        source.indexOf(
          '{pendingThreadAttachments.map((attachment, attachmentIndex)',
        ),
      ),
    );

    expect(sendMessageSource).toContain('!isComposerEnabled');
    expect(sendThreadReplySource).toContain('!isComposerEnabled');
    expect(source).toContain('const [isSendingMessage');
    expect(source).toContain('const [isSendingThreadReply');
    expect(sendMessageSource).toContain('isSendingMessage');
    expect(sendThreadReplySource).toContain('isSendingThreadReply');
    expect(composerSource).toContain('aria-label={t`Send message`}');
    expect(composerSource).toContain('disabled={!isComposerEnabled}');
    expect(composerSource).toContain('isSendingMessage');
    expect(threadComposerSource).toContain('aria-label={t`Send reply`}');
    expect(threadComposerSource).toContain('disabled={!isComposerEnabled}');
    expect(threadComposerSource).toContain('isSendingThreadReply');
  });

  it('keeps drafts and shows an error when sending a message fails', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const sendMessageSource = source.slice(
      source.indexOf(
        'const handleSendMessage = async (draftMessageOverride?: string) => {',
      ),
      source.indexOf('const handleRequestTeamNotifications'),
    );
    const sendThreadReplySource = source.slice(
      source.indexOf('const handleSendThreadReply = async ('),
      source.indexOf('const handleSelectChannel ='),
    );

    expect(sendMessageSource).toContain('try {');
    expect(sendMessageSource).toContain('catch');
    expect(sendMessageSource).toContain('Failed to send message.');
    expect(sendMessageSource.indexOf('isSendingMessage')).toBeLessThan(
      sendMessageSource.indexOf('setIsSendingMessage(true);'),
    );
    expect(sendMessageSource).toContain('setIsSendingMessage(true);');
    expect(sendMessageSource).toContain('setIsSendingMessage(false);');
    expect(sendThreadReplySource).toContain('try {');
    expect(sendThreadReplySource).toContain('catch');
    expect(sendThreadReplySource).toContain('Failed to send reply.');
    expect(sendThreadReplySource.indexOf('isSendingThreadReply')).toBeLessThan(
      sendThreadReplySource.indexOf('setIsSendingThreadReply(true);'),
    );
    expect(sendThreadReplySource).toContain('setIsSendingThreadReply(true);');
    expect(sendThreadReplySource).toContain('setIsSendingThreadReply(false);');
  });

  it('confirms channel broadcast mentions without blocking direct messages', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const sendMessageSource = source.slice(
      source.indexOf(
        'const handleSendMessage = async (draftMessageOverride?: string) => {',
      ),
      source.indexOf('const handleRequestTeamNotifications'),
    );
    const sendThreadReplySource = source.slice(
      source.indexOf('const handleSendThreadReply = async ('),
      source.indexOf('const handleSelectChannel ='),
    );

    expect(source).toContain(
      "import { hasTeamBroadMention } from '@/team/utils/teamBroadMentions';",
    );
    expect(source).toContain('shouldConfirmTeamBroadMention');
    expect(source).toContain(
      'window.confirm(t`Send this broadcast mention to the channel?`)',
    );
    expect(
      sendMessageSource.indexOf('await sendTeamDirectMessage'),
    ).toBeLessThan(sendMessageSource.indexOf('shouldConfirmTeamBroadMention'));
    expect(
      sendMessageSource.indexOf('shouldConfirmTeamBroadMention'),
    ).toBeLessThan(sendMessageSource.indexOf('await sendTeamMessage'));
    expect(
      sendThreadReplySource.indexOf('await sendTeamDirectMessage'),
    ).toBeLessThan(
      sendThreadReplySource.indexOf('shouldConfirmTeamBroadMention'),
    );
    expect(
      sendThreadReplySource.indexOf('shouldConfirmTeamBroadMention'),
    ).toBeLessThan(sendThreadReplySource.indexOf('await sendTeamMessage'));
  });

  it('keeps send mutations decoupled from blocking refetch queries', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const sendMutationSetupSource = source.slice(
      source.indexOf('const [sendTeamMessage] ='),
      source.indexOf('const [createTeamDirectMessage] ='),
    );
    const sendMessageSource = source.slice(
      source.indexOf(
        'const handleSendMessage = async (draftMessageOverride?: string) => {',
      ),
      source.indexOf('const handleRequestTeamNotifications'),
    );

    expect(sendMutationSetupSource).not.toContain('refetchQueries');
    expect(sendMessageSource).toContain(
      'refetchTeamDataSafely(refetchDirectMessageMessages)',
    );
    expect(sendMessageSource).toContain(
      'refetchTeamDataSafely(refetchChannelMessages)',
    );
  });

  it('keeps automatic read receipts retryable when mark-read mutations fail', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const channelReadEffectSource = source.slice(
      source.indexOf('const markReadKey = `channel:'),
      source.indexOf(
        'const handleSendMessage = async (draftMessageOverride?: string) => {',
      ),
    );

    expect(channelReadEffectSource).toContain('previousMarkedReadKey');
    expect(channelReadEffectSource).toContain('Failed to mark channel read.');
    expect(channelReadEffectSource).toContain(
      'Failed to mark direct message read.',
    );
    expect(channelReadEffectSource).toContain('Failed to mark thread read.');
    expect(channelReadEffectSource).toContain(
      'previousLastMarkedReadKey === markReadKey',
    );
  });

  it('shows an error when notification and mention read mutations fail', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const notificationSource = source.slice(
      source.indexOf('const handleRequestTeamNotifications = async () => {'),
      source.indexOf('const handleSendThreadReply = async ('),
    );
    const mentionReadSource = source.slice(
      source.indexOf('const handleSelectMention ='),
      source.indexOf('const handleMarkInboxRead = async () => {'),
    );
    const notificationPreferenceControlSource = source.slice(
      source.indexOf('aria-label={t`Team notification preference`}'),
      source.indexOf('<option value="ALL">{t`All activity`}</option>'),
    );
    const quietHoursControlSource = source.slice(
      source.indexOf('aria-label={t`Quiet hours start`}'),
      source.indexOf('{t`Save quiet`}'),
    );
    const notificationPermissionButtonSource = source.slice(
      source.indexOf('<StyledNotificationPermissionButton'),
      source.indexOf(
        '</StyledNotificationPermissionButton>',
        source.indexOf('<StyledNotificationPermissionButton'),
      ),
    );

    expect(notificationSource).toContain('try {');
    expect(notificationSource).toContain('isRequestingTeamNotifications');
    expect(notificationSource).toContain(
      'setIsRequestingTeamNotifications(true);',
    );
    expect(notificationSource).toContain(
      'setIsRequestingTeamNotifications(false);',
    );
    expect(notificationSource).toContain('Failed to enable notifications.');
    expect(notificationSource).toContain('isUpdatingNotificationPreference');
    expect(notificationSource).toContain(
      'setIsUpdatingNotificationPreference(true);',
    );
    expect(notificationSource).toContain(
      'setIsUpdatingNotificationPreference(false);',
    );
    expect(notificationSource).toContain(
      'Failed to update notification preference.',
    );
    expect(notificationSource).toContain('isUpdatingNotificationQuietHours');
    expect(notificationSource).toContain(
      'setIsUpdatingNotificationQuietHours(true);',
    );
    expect(notificationSource).toContain(
      'setIsUpdatingNotificationQuietHours(false);',
    );
    expect(notificationSource).toContain(
      'Failed to update notification quiet hours.',
    );
    expect(notificationSource).toContain('Notification preference updated.');
    expect(notificationSource).toContain('Notification quiet hours updated.');
    expect(notificationPreferenceControlSource).toContain(
      'disabled={isUpdatingNotificationPreference}',
    );
    expect(quietHoursControlSource).toContain(
      'disabled={isUpdatingNotificationQuietHours}',
    );
    expect(notificationPermissionButtonSource).toContain(
      'teamNotificationPermission !==',
    );
    expect(notificationPermissionButtonSource).toContain(
      'isRequestingTeamNotifications',
    );
    expect(mentionReadSource).toContain('Failed to mark mention read.');
  });

  it('wires one mark-unread click handler per message action surface', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );

    expect(
      source.match(/handleMarkMessageUnread\(message\.id\)/g) ?? [],
    ).toHaveLength(2);
    expect(
      source.split('disabled={markingUnreadMessageId === message.id}'),
    ).toHaveLength(3);
  });

  it('keeps edit/delete state and shows an error when message mutations fail', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const saveEditSource = source.slice(
      source.indexOf('const handleSaveEditingMessage = async () => {'),
      source.indexOf('const handleDeleteMessage = async'),
    );
    const deleteMessageSource = source.slice(
      source.indexOf('const handleDeleteMessage = async'),
      source.indexOf('const handleOpenThread ='),
    );
    const messageEditFormSources = [
      source.slice(
        source.indexOf('{editingMessageId === message.id ? ('),
        source.indexOf('{message.canReply ? ('),
      ),
      source.slice(
        source.lastIndexOf('{editingMessageId === message.id ? ('),
        source.indexOf(
          '{message.canReply ? (',
          source.lastIndexOf('{editingMessageId === message.id ? ('),
        ),
      ),
    ];
    const deleteButtonSources = [
      source.slice(
        source.lastIndexOf(
          '<StyledReplyButton',
          source.indexOf(
            'onClick={() => void handleDeleteMessage(message.id)}',
          ),
        ),
        source.indexOf('{renderTeamMessageReactionActions(message)}'),
      ),
      source.slice(
        source.lastIndexOf(
          '<StyledReplyButton',
          source.lastIndexOf(
            'onClick={() => void handleDeleteMessage(message.id)}',
          ),
        ),
        source.indexOf(
          '{renderTeamMessageReactionActions(message)}',
          source.lastIndexOf(
            'onClick={() => void handleDeleteMessage(message.id)}',
          ),
        ),
      ),
    ];

    expect(source).toContain('const [isSavingMessageEdit');
    expect(source).toContain('setIsSavingMessageEdit');
    expect(source).toContain('const [deletingMessageId');
    expect(source).toContain('setDeletingMessageId');
    expect(saveEditSource.indexOf('isSavingMessageEdit')).toBeLessThan(
      saveEditSource.indexOf('setIsSavingMessageEdit(true);'),
    );
    expect(saveEditSource).toContain('setIsSavingMessageEdit(true);');
    expect(saveEditSource).toContain('setIsSavingMessageEdit(false);');
    expect(saveEditSource).toContain('try {');
    expect(saveEditSource).toContain('catch');
    expect(saveEditSource).toContain('Message updated.');
    expect(saveEditSource).toContain('Failed to update message.');
    expect(
      saveEditSource.indexOf('handleCancelEditingMessage();'),
    ).toBeGreaterThan(saveEditSource.indexOf('await updateTeamMessage'));
    expect(deleteMessageSource).toContain('try {');
    expect(deleteMessageSource).toContain('catch');
    expect(deleteMessageSource).toContain('Message deleted.');
    expect(deleteMessageSource).toContain('Failed to delete message.');
    expect(
      deleteMessageSource.indexOf('deletingMessageId === messageId'),
    ).toBeLessThan(deleteMessageSource.indexOf('window.confirm'));
    expect(deleteMessageSource).toContain('setDeletingMessageId(messageId);');
    expect(deleteMessageSource).toContain('setDeletingMessageId(null);');
    expect(deleteMessageSource).toContain('window.confirm');
    expect(deleteMessageSource).toContain('Delete this message?');
    expect(
      deleteMessageSource.indexOf('await deleteTeamMessage'),
    ).toBeGreaterThan(deleteMessageSource.indexOf('window.confirm'));
    expect(deleteMessageSource).toContain('selectedMessageId === messageId');
    expect(deleteMessageSource).toContain('setSelectedMessageId(null)');
    for (const messageEditFormSource of messageEditFormSources) {
      expect(messageEditFormSource).toContain('isSavingMessageEdit');
      expect(messageEditFormSource).toContain('disabled={isSavingMessageEdit}');
    }
    for (const deleteButtonSource of deleteButtonSources) {
      expect(deleteButtonSource).toContain('deletingMessageId === message.id');
    }
  });

  it('shows an error when conversation management mutations fail', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const conversationManagementSource = source.slice(
      source.indexOf('const handleCreateChannel = async () => {'),
      source.indexOf('const handleSelectTeamConversationTarget ='),
    );
    const createChannelFormSource = source.slice(
      source.indexOf('<StyledCreateChannelForm', source.indexOf('Channels')),
      source.indexOf('</StyledCreateChannelForm>', source.indexOf('Channels')),
    );
    const browsePublicChannelsSource = source.slice(
      source.indexOf('visibleDiscoverablePublicChannels.map'),
      source.indexOf(
        '</StyledSearchResults>',
        source.indexOf('visibleDiscoverablePublicChannels.map'),
      ),
    );
    const createDirectMessageFormSource = source.slice(
      source.indexOf(
        '<StyledCreateChannelForm',
        source.indexOf('Direct Messages'),
      ),
      source.indexOf(
        '</StyledCreateChannelForm>',
        source.indexOf('Direct Messages'),
      ),
    );
    const inviteMemberRenderSource = source.slice(
      source.indexOf('aria-label={t`Invite member`}'),
      source.indexOf('{normalizedInviteMemberSearchQuery.length >= 2'),
    );
    const inviteMemberFormControlsSource = source.slice(
      source.lastIndexOf(
        '<StyledCreateChannelRow>',
        source.indexOf('aria-label={t`Clear member invite search`}'),
      ),
      source.indexOf(
        'aria-label={t`Invite member`}',
        source.indexOf('aria-label={t`Clear member invite search`}'),
      ),
    );
    const messageMemberButtonSource = source.slice(
      source.indexOf('void handleOpenDirectMessageWithTeammate('),
      source.indexOf(
        '{t`Message`}',
        source.indexOf('void handleOpenDirectMessageWithTeammate('),
      ),
    );
    const channelDetailsFormSource = source.slice(
      source.indexOf('<StyledChannelDetailsForm'),
      source.indexOf('</StyledChannelDetailsForm>'),
    );
    const leaveChannelButtonSource = source.slice(
      source.lastIndexOf(
        '<StyledJoinButton',
        source.indexOf('onClick={() => void handleLeaveChannel()}'),
      ),
      source.indexOf('{t`Leave channel`}'),
    );
    const archiveChannelButtonSource = source.slice(
      source.lastIndexOf(
        '<StyledJoinButton',
        source.indexOf('onClick={() => void handleArchiveChannel()}'),
      ),
      source.indexOf('{t`Archive channel`}'),
    );
    const removeMemberButtonSource = source.slice(
      source.indexOf('aria-label={t`Remove member`}'),
      source.indexOf(
        '<IconX size={14} />',
        source.indexOf('aria-label={t`Remove member`}'),
      ),
    );

    for (const errorMessage of [
      'Failed to create channel.',
      'Failed to start direct message.',
      'Failed to update channel.',
      'Failed to join channel.',
      'Failed to invite member.',
      'Failed to remove member.',
      'Failed to update member role.',
      'Failed to leave channel.',
      'Failed to archive channel.',
      'Failed to update notification setting.',
      'Failed to update status.',
      'Failed to clear status.',
    ]) {
      expect(conversationManagementSource).toContain(errorMessage);
    }

    for (const successMessage of [
      'Channel created.',
      'Direct message started.',
      'Channel updated.',
      'Channel joined.',
      'Member invited.',
      'Member removed.',
      'Member role updated.',
      'Channel left.',
      'Channel archived.',
      'Notification setting updated.',
    ]) {
      expect(conversationManagementSource).toContain(successMessage);
    }

    for (const confirmationMessage of [
      'Remove this member from the channel?',
      'Leave this channel?',
      'Archive this channel?',
    ]) {
      expect(conversationManagementSource).toContain(confirmationMessage);
    }

    expect(
      conversationManagementSource.indexOf('await removeTeamChannelMember'),
    ).toBeGreaterThan(
      conversationManagementSource.indexOf(
        'Remove this member from the channel?',
      ),
    );
    expect(
      conversationManagementSource.indexOf('await leaveTeamChannel'),
    ).toBeGreaterThan(
      conversationManagementSource.indexOf('Leave this channel?'),
    );
    expect(
      conversationManagementSource.indexOf('await archiveTeamChannel'),
    ).toBeGreaterThan(
      conversationManagementSource.indexOf('Archive this channel?'),
    );
    expect(conversationManagementSource).toContain(
      'setSuppressedAutoSelectedChannelId(channelIdToLeave);',
    );
    expect(conversationManagementSource).toContain(
      'setSuppressedAutoSelectedChannelId(channelIdToArchive);',
    );

    expect(
      conversationManagementSource.indexOf("setNewChannelName('');"),
    ).toBeGreaterThan(
      conversationManagementSource.indexOf('await createTeamChannel'),
    );
    expect(
      conversationManagementSource.lastIndexOf(
        "setSelectedNewDirectMessageUserWorkspaceId('');",
      ),
    ).toBeGreaterThan(
      conversationManagementSource.indexOf('await createTeamDirectMessage'),
    );
    expect(source).toContain('const [isInvitingChannelMember');
    expect(source).toContain('setIsInvitingChannelMember');
    expect(source).toContain('isCreatingChannel');
    expect(source).toContain('setIsCreatingChannel');
    expect(source).toContain('isCreatingDirectMessage');
    expect(source).toContain('setIsCreatingDirectMessage');
    expect(source).toContain('joiningChannelId');
    expect(source).toContain('setJoiningChannelId');
    expect(source).toContain('openingDirectMessageUserWorkspaceId');
    expect(source).toContain('setOpeningDirectMessageUserWorkspaceId');
    expect(source).toContain('removingChannelMemberUserWorkspaceId');
    expect(source).toContain('setRemovingChannelMemberUserWorkspaceId');
    expect(source).toContain('updatingChannelMemberRoleUserWorkspaceId');
    expect(source).toContain('setUpdatingChannelMemberRoleUserWorkspaceId');
    expect(source).toContain('isLeavingChannel');
    expect(source).toContain('setIsLeavingChannel');
    expect(source).toContain('isArchivingChannel');
    expect(source).toContain('setIsArchivingChannel');
    expect(source).toContain('isUpdatingChannelDetails');
    expect(source).toContain('setIsUpdatingChannelDetails');
    expect(source).toContain('useState(false);');
    expect(source).toContain('useState<string | null>(null);');
    expect(
      conversationManagementSource.indexOf('isUpdatingChannelDetails'),
    ).toBeLessThan(
      conversationManagementSource.indexOf(
        'setIsUpdatingChannelDetails(true);',
      ),
    );
    expect(conversationManagementSource).toContain(
      'setIsUpdatingChannelDetails(true);',
    );
    expect(conversationManagementSource).toContain(
      'setIsUpdatingChannelDetails(false);',
    );
    expect(channelDetailsFormSource).toContain('isUpdatingChannelDetails');
    expect(
      conversationManagementSource.indexOf('isCreatingChannel'),
    ).toBeLessThan(
      conversationManagementSource.indexOf('setIsCreatingChannel(true);'),
    );
    expect(conversationManagementSource).toContain(
      'setIsCreatingChannel(true);',
    );
    expect(conversationManagementSource).toContain(
      'setIsCreatingChannel(false);',
    );
    expect(createChannelFormSource).toContain('isCreatingChannel');
    expect(
      conversationManagementSource.indexOf('isCreatingDirectMessage'),
    ).toBeLessThan(
      conversationManagementSource.indexOf('setIsCreatingDirectMessage(true);'),
    );
    expect(conversationManagementSource).toContain(
      'setIsCreatingDirectMessage(true);',
    );
    expect(conversationManagementSource).toContain(
      'setIsCreatingDirectMessage(false);',
    );
    expect(createDirectMessageFormSource).toContain('isCreatingDirectMessage');
    expect(
      conversationManagementSource.indexOf('joiningChannelId === channelId'),
    ).toBeLessThan(
      conversationManagementSource.indexOf('await joinTeamChannel'),
    );
    expect(conversationManagementSource).toContain(
      'setJoiningChannelId(channelId);',
    );
    expect(conversationManagementSource).toContain(
      'setJoiningChannelId(null);',
    );
    expect(browsePublicChannelsSource).toContain(
      'joiningChannelId === channel.id',
    );
    expect(source).toContain(
      'disabled={joiningChannelId === effectiveSelectedChannel.id}',
    );
    expect(
      conversationManagementSource.indexOf(
        'openingDirectMessageUserWorkspaceId === participantUserWorkspaceId',
      ),
    ).toBeLessThan(
      conversationManagementSource.indexOf(
        'await createTeamDirectMessage',
        conversationManagementSource.indexOf(
          'const handleOpenDirectMessageWithTeammate = async',
        ),
      ),
    );
    expect(conversationManagementSource).toContain(
      'setOpeningDirectMessageUserWorkspaceId(participantUserWorkspaceId);',
    );
    expect(conversationManagementSource).toContain(
      'setOpeningDirectMessageUserWorkspaceId(null);',
    );
    expect(messageMemberButtonSource).toContain(
      'openingDirectMessageUserWorkspaceId ===',
    );
    expect(messageMemberButtonSource).toContain('member.userWorkspaceId');
    expect(
      conversationManagementSource.indexOf('isInvitingChannelMember'),
    ).toBeLessThan(
      conversationManagementSource.indexOf('setIsInvitingChannelMember(true);'),
    );
    expect(conversationManagementSource).toContain(
      'setIsInvitingChannelMember(true);',
    );
    expect(conversationManagementSource).toContain(
      'setIsInvitingChannelMember(false);',
    );
    expect(inviteMemberRenderSource).toContain(
      '!selectedInviteUserWorkspaceId',
    );
    expect(inviteMemberRenderSource).toContain('isInvitingChannelMember');
    expect(inviteMemberFormControlsSource).toContain(
      'disabled={isInvitingChannelMember}',
    );
    expect(
      conversationManagementSource.indexOf(
        'removingChannelMemberUserWorkspaceId === userWorkspaceId',
      ),
    ).toBeLessThan(
      conversationManagementSource.indexOf(
        'Remove this member from the channel?',
      ),
    );
    expect(conversationManagementSource).toContain(
      'setRemovingChannelMemberUserWorkspaceId(userWorkspaceId);',
    );
    expect(conversationManagementSource).toContain(
      'setRemovingChannelMemberUserWorkspaceId(null);',
    );
    expect(
      conversationManagementSource.indexOf(
        'updatingChannelMemberRoleUserWorkspaceId === userWorkspaceId',
      ),
    ).toBeLessThan(
      conversationManagementSource.indexOf('await updateTeamChannelMemberRole'),
    );
    expect(conversationManagementSource).toContain(
      'setUpdatingChannelMemberRoleUserWorkspaceId(userWorkspaceId);',
    );
    expect(conversationManagementSource).toContain(
      'setUpdatingChannelMemberRoleUserWorkspaceId(null);',
    );
    expect(
      conversationManagementSource.indexOf('isLeavingChannel'),
    ).toBeLessThan(conversationManagementSource.indexOf('Leave this channel?'));
    expect(conversationManagementSource).toContain(
      'setIsLeavingChannel(true);',
    );
    expect(conversationManagementSource).toContain(
      'setIsLeavingChannel(false);',
    );
    expect(
      conversationManagementSource.indexOf('isArchivingChannel'),
    ).toBeLessThan(
      conversationManagementSource.indexOf('Archive this channel?'),
    );
    expect(conversationManagementSource).toContain(
      'setIsArchivingChannel(true);',
    );
    expect(conversationManagementSource).toContain(
      'setIsArchivingChannel(false);',
    );
    expect(leaveChannelButtonSource).toContain('isLeavingChannel');
    expect(archiveChannelButtonSource).toContain('isArchivingChannel');
    expect(removeMemberButtonSource).toContain(
      'removingChannelMemberUserWorkspaceId ===',
    );
    expect(removeMemberButtonSource).toContain('member.userWorkspaceId');
  });

  it('renders disabled team action controls with inactive affordance', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const joinButtonSource = source.slice(
      source.indexOf('const StyledJoinButton = styled.button`'),
      source.indexOf('const StyledSearchBox = styled.div`'),
    );
    const inboxResultButtonSource = source.slice(
      source.indexOf('const StyledInboxResultButton = styled.button`'),
      source.indexOf('const StyledInboxFocusList = styled.div`'),
    );
    const fileResultButtonSource = source.slice(
      source.indexOf('const StyledFileResultButton = styled.button`'),
      source.indexOf('const StyledFileOpenLink = styled.a`'),
    );
    const inlineActionButtonSource = source.slice(
      source.indexOf('const StyledInlineActionButton = styled.button`'),
      source.indexOf('const StyledUnreadCount = styled.span`'),
    );

    for (const buttonSource of [
      joinButtonSource,
      inboxResultButtonSource,
      fileResultButtonSource,
      inlineActionButtonSource,
    ]) {
      expect(buttonSource).toContain('&:disabled');
      expect(buttonSource).toContain('cursor: not-allowed');
      expect(buttonSource).toContain('opacity: 0.5');
    }

    expect(joinButtonSource).toContain('&:not(:disabled):hover');
    expect(inlineActionButtonSource).toContain('&:not(:disabled):hover');
  });

  it('keeps selectable team result rows and row actions from submitting forms', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const inboxResultButtonBlocks = source
      .split('<StyledInboxResultButton')
      .slice(1)
      .map((resultButtonSource) =>
        resultButtonSource.slice(0, resultButtonSource.indexOf('>')),
      );
    const fileResultButtonBlocks = source
      .split('<StyledFileResultButton')
      .slice(1)
      .map((resultButtonSource) =>
        resultButtonSource.slice(0, resultButtonSource.indexOf('>')),
      );
    const inlineActionButtonBlocks = source
      .split('<StyledInlineActionButton')
      .slice(1)
      .map((actionButtonSource) =>
        actionButtonSource.slice(0, actionButtonSource.indexOf('>')),
      );
    const replyButtonBlocks = source
      .split('<StyledReplyButton')
      .slice(1)
      .map((replyButtonSource) =>
        replyButtonSource.slice(0, replyButtonSource.indexOf('>')),
      );

    expect(inboxResultButtonBlocks.length).toBeGreaterThan(0);
    expect(fileResultButtonBlocks.length).toBeGreaterThan(0);
    expect(inlineActionButtonBlocks.length).toBeGreaterThan(0);
    expect(replyButtonBlocks.length).toBeGreaterThan(0);

    for (const resultButtonSource of [
      ...inboxResultButtonBlocks,
      ...fileResultButtonBlocks,
      ...inlineActionButtonBlocks,
      ...replyButtonBlocks,
    ]) {
      expect(resultButtonSource).toContain('type="button"');
    }
  });

  it('does not immediately auto-select a channel after leaving or archiving it', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const autoSelectionSource = source.slice(
      source.indexOf('const selectableJoinedChannels = useMemo'),
      source.indexOf('const effectiveSelectedChannelId ='),
    );
    const routeSelectionSource = source.slice(
      source.indexOf('const requestedChannelId = searchParams.get'),
      source.indexOf('useEffect(() => {', source.indexOf('requestedChannelId')),
    );

    expect(autoSelectionSource).toContain('suppressedAutoSelectedChannelId');
    expect(autoSelectionSource).toContain(
      'channel.id !== suppressedAutoSelectedChannelId',
    );
    expect(routeSelectionSource).toContain('selectableJoinedChannels[0]?.id');
  });

  it('keeps create-conversation drafts unless the mutation returns a created conversation', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const createChannelSource = source.slice(
      source.indexOf('const handleCreateChannel = async () => {'),
      source.indexOf('const handleCreateDirectMessage = async () => {'),
    );
    const createDirectMessageSource = source.slice(
      source.indexOf('const handleCreateDirectMessage = async () => {'),
      source.indexOf('const handleOpenDirectMessageWithTeammate = async'),
    );
    const createChannelSuccessSource = createChannelSource.slice(
      createChannelSource.indexOf('if (!data?.createTeamChannel) {'),
    );
    const createDirectMessageSuccessSource = createDirectMessageSource.slice(
      createDirectMessageSource.indexOf(
        'if (!data?.createTeamDirectMessage) {',
      ),
    );

    expect(createChannelSuccessSource).toContain("setNewChannelName('');");
    expect(createChannelSuccessSource).toContain(
      "setNewChannelDescription('');",
    );
    expect(createChannelSuccessSource).toContain(
      'setNewChannelIsPrivate(false);',
    );
    expect(createDirectMessageSuccessSource).toContain(
      "setSelectedNewDirectMessageUserWorkspaceId('');",
    );
    expect(createDirectMessageSuccessSource).toContain(
      "setNewDirectMessageSearchQuery('');",
    );
    expect(createChannelSource).toContain('if (!data?.createTeamChannel) {');
    expect(createChannelSource).toContain(
      'enqueueErrorSnackBar({ message: t`Failed to create channel.` });',
    );
    expect(createDirectMessageSource).toContain(
      'if (!data?.createTeamDirectMessage) {',
    );
    expect(createDirectMessageSource).toContain(
      'enqueueErrorSnackBar({ message: t`Failed to start direct message.` });',
    );
  });

  it('lets people clear their team status with an explicit empty presence update', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const presenceStatusSource = source.slice(
      source.indexOf('const handleUpdatePresenceStatus = async () => {'),
      source.indexOf('const handleInsertDraftMention ='),
    );
    const statusFormSource = source.slice(
      source.indexOf('<StyledStatusForm'),
      source.indexOf('<StyledNotificationPermissionButton'),
    );

    expect(presenceStatusSource).toContain(
      'const handleClearPresenceStatus = async () => {',
    );
    expect(presenceStatusSource).toContain('isUpdatingPresenceStatus');
    expect(presenceStatusSource).toContain(
      'setIsUpdatingPresenceStatus(true);',
    );
    expect(presenceStatusSource).toContain(
      'setIsUpdatingPresenceStatus(false);',
    );
    expect(presenceStatusSource).toContain('statusEmoji: null');
    expect(presenceStatusSource).toContain('statusText: null');
    expect(presenceStatusSource).toContain("setStatusEmoji('');");
    expect(presenceStatusSource).toContain("setStatusText('');");
    expect(presenceStatusSource).toContain('Status updated.');
    expect(presenceStatusSource).toContain('Status cleared.');
    expect(presenceStatusSource).toContain('Failed to clear status.');
    expect(statusFormSource).toContain('disabled={isUpdatingPresenceStatus}');
    expect(statusFormSource).toContain('handleClearPresenceStatus');
    expect(statusFormSource).toContain('{t`Clear`}');
  });

  it('keeps channel member role controls aligned with the backend enum', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const channelMemberRoleControlSource = source.slice(
      source.indexOf('aria-label={t`${member.name} role`}'),
      source.indexOf('aria-label={t`Remove member`}'),
    );

    expect(channelMemberRoleControlSource).toContain('<option value="MEMBER">');
    expect(channelMemberRoleControlSource).toContain('<option value="OWNER">');
    expect(channelMemberRoleControlSource).toContain(
      'disabled={\n                                updatingChannelMemberRoleUserWorkspaceId ===\n                                member.userWorkspaceId\n                              }',
    );
    expect(channelMemberRoleControlSource).not.toContain(
      '<option value="ADMIN">',
    );
  });

  it('shows an error when message action mutations fail', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const messageActionSource = source.slice(
      source.indexOf('const handleMarkInboxRead = async () => {'),
      source.indexOf('const handleStartEditingMessage ='),
    );
    const customReactionSource = source.slice(
      source.indexOf('const handleSendCustomReaction = async'),
      source.indexOf('const handleToggleMessagePin = async'),
    );
    const toggleReactionSource = source.slice(
      source.indexOf('const handleToggleReaction = async'),
      source.indexOf('const handleCustomReactionChange ='),
    );

    for (const errorMessage of [
      'Failed to mark inbox read.',
      'Failed to set reminder.',
      'Failed to dismiss reminder.',
      'Failed to load earlier messages.',
      'Failed to mark message unread.',
      'Failed to update reaction.',
      'Failed to pin message.',
      'Failed to update saved message.',
      'Failed to snooze reminder.',
      'Failed to dismiss reminders.',
    ]) {
      expect(messageActionSource).toContain(errorMessage);
    }

    for (const successMessage of [
      'Reminder set.',
      'Reminder dismissed.',
      'Reminders dismissed.',
      'Reminder snoozed.',
      'Message marked unread.',
      'Message pinned.',
      'Message unpinned.',
      'Message saved.',
      'Message unsaved.',
      'Inbox marked read.',
    ]) {
      expect(messageActionSource).toContain(successMessage);
    }

    expect(messageActionSource).toContain('settingReminderMessageId');
    expect(messageActionSource).toContain(
      'setSettingReminderMessageId(messageId);',
    );
    expect(messageActionSource).toContain('setSettingReminderMessageId(null);');
    expect(messageActionSource).toContain('markingUnreadMessageId');
    expect(messageActionSource).toContain(
      'setMarkingUnreadMessageId(messageId);',
    );
    expect(messageActionSource).toContain('setMarkingUnreadMessageId(null);');
    expect(toggleReactionSource).toContain('togglingReactionMessageId');
    expect(toggleReactionSource).toContain(
      'setTogglingReactionMessageId(messageId);',
    );
    expect(toggleReactionSource).toContain(
      'setTogglingReactionMessageId(null);',
    );
    expect(customReactionSource).toContain('didToggleReaction');
    expect(customReactionSource).toContain('Enter an emoji reaction.');
    expect(
      customReactionSource.indexOf('Enter an emoji reaction.'),
    ).toBeLessThan(customReactionSource.indexOf('didToggleReaction'));
    expect(
      customReactionSource.indexOf('delete nextCustomReactionByMessageId'),
    ).toBeGreaterThan(customReactionSource.indexOf('didToggleReaction'));
  });

  it('clears stale per-message reminder delay choices after successful reminder actions', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const reminderActionSource = source.slice(
      source.indexOf('const clearMessageReminderOption ='),
      source.indexOf('const handleLoadEarlierMessages = async'),
    );
    const reminderControlDisabledExpression =
      'disabled={ !isComposerEnabled || settingReminderMessageId === message.id }';

    expect(reminderActionSource).toContain(
      'const clearMessageReminderOption = (messageId: string) => {',
    );
    expect(reminderActionSource).toContain(
      'delete nextReminderOptionByMessageId[messageId];',
    );
    expect(reminderActionSource).toContain(
      'clearMessageReminderOption(messageId);',
    );
    expect(reminderActionSource).toContain(
      'clearMessageReminderOption(reminder.messageId);',
    );
    expect(
      normalizeSourceWhitespace(source).split(
        reminderControlDisabledExpression,
      ),
    ).toHaveLength(5);
  });

  it('shows specific pin and save feedback based on the current message state', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const pinAndSaveHandlerSource = source.slice(
      source.indexOf('const handleToggleMessagePin = async'),
      source.indexOf('const handleStartEditingMessage ='),
    );
    const mainMessageActionSource = source.slice(
      source.indexOf('void handleToggleMessagePin('),
      source.indexOf('void handleSetMessageReminder(message.id)'),
    );

    expect(pinAndSaveHandlerSource).toContain('isCurrentlyPinned: boolean');
    expect(pinAndSaveHandlerSource).toContain('togglingPinnedMessageId');
    expect(pinAndSaveHandlerSource).toContain(
      'setTogglingPinnedMessageId(messageId);',
    );
    expect(pinAndSaveHandlerSource).toContain(
      'setTogglingPinnedMessageId(null);',
    );
    expect(pinAndSaveHandlerSource).toContain('Message pinned.');
    expect(pinAndSaveHandlerSource).toContain('Message unpinned.');
    expect(pinAndSaveHandlerSource).toContain('isCurrentlySaved: boolean');
    expect(pinAndSaveHandlerSource).toContain('togglingSavedMessageId');
    expect(pinAndSaveHandlerSource).toContain(
      'setTogglingSavedMessageId(messageId);',
    );
    expect(pinAndSaveHandlerSource).toContain(
      'setTogglingSavedMessageId(null);',
    );
    expect(pinAndSaveHandlerSource).toContain('Message saved.');
    expect(pinAndSaveHandlerSource).toContain('Message unsaved.');
    expect(mainMessageActionSource).toContain('void handleToggleMessagePin(');
    expect(mainMessageActionSource).toContain('message.id');
    expect(mainMessageActionSource).toContain('message.isPinned');
    expect(mainMessageActionSource).toContain('togglingPinnedMessageId');
    expect(mainMessageActionSource).toContain(
      'void handleToggleMessageBookmark(',
    );
    expect(mainMessageActionSource).toContain('message.isSaved');
    expect(mainMessageActionSource).toContain('togglingSavedMessageId');
  });

  it('guards message-link copying when the clipboard API is unavailable', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const copyHelperSource = source.slice(
      source.indexOf('const handleCopyTeamResource = async'),
      source.indexOf('const handleSelectReminder ='),
    );

    expect(copyHelperSource).toContain('navigator.clipboard?.writeText');
    expect(copyHelperSource).toContain('throw new Error');
    expect(source).toContain('Failed to copy message link.');
  });

  it('disables duplicate clipboard copy actions while a copy is pending', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const copyHandlersSource = source.slice(
      source.indexOf('const handleCopyTeamResource = async'),
      source.indexOf('const handleSelectAttachments = async'),
    );
    const focusedCopyActionsSource = source.slice(
      source.indexOf('const renderTeamInboxItem ='),
      source.indexOf('const renderTeamMessageSearchBox ='),
    );
    const headerCopyActionsSource = source.slice(
      source.indexOf('<StyledPanelHeader>', source.indexOf('<StyledPanel>')),
      source.indexOf('<StyledMessageList>', source.indexOf('<StyledPanel>')),
    );
    const mainMessageActionsSource = source.slice(
      source.indexOf('{messages.map((message, messageIndex) => ('),
      source.indexOf(
        '{threadTypingIndicatorText !== null',
        source.indexOf('{messages.map((message, messageIndex) => ('),
      ),
    );
    const threadMessageActionsSource = source.slice(
      source.indexOf('{visibleThreadMessages.map((message, messageIndex) => ('),
      source.indexOf(
        '{threadTypingIndicatorText !== null',
        source.indexOf(
          '{visibleThreadMessages.map((message, messageIndex) => (',
        ),
      ),
    );

    expect(source).toContain('const [copyingTeamResourceKey');
    expect(source).toContain('setCopyingTeamResourceKey');
    expect(copyHandlersSource).toContain('copyingTeamResourceKey === copyKey');
    expect(copyHandlersSource).toContain('setCopyingTeamResourceKey(copyKey);');
    expect(copyHandlersSource).toContain('setCopyingTeamResourceKey(null);');

    for (const copyKind of [
      'attachment-link',
      'conversation-link',
      'file-link',
      'message-link',
      'message-text',
      'thread-link',
    ]) {
      expect(copyHandlersSource).toContain(copyKind);
    }

    for (const copyActionsSource of [
      focusedCopyActionsSource,
      headerCopyActionsSource,
      mainMessageActionsSource,
      threadMessageActionsSource,
    ]) {
      expect(copyActionsSource).toContain('copyingTeamResourceKey ===');
    }
  });

  it('keeps copied root-message links in the main conversation', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/modules/team/utils/teamMessageLinks.ts',
      ),
      'utf8',
    );

    expect(source).toContain('if (threadParentMessageId !== messageId)');
    expect(source).toContain(
      "url.searchParams.set('teamThreadParentMessageId', threadParentMessageId)",
    );
  });

  it('disables custom reaction inputs when the composer cannot send', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const customReactionHandlerSource = source.slice(
      source.indexOf(
        'const handleSendCustomReaction = async (messageId: string) => {',
      ),
      source.indexOf('const handleToggleMessagePin ='),
    );
    const mainCustomReactionSource = source.slice(
      source.indexOf('<StyledCustomReactionInput'),
      source.indexOf(
        '</StyledMessageActions>',
        source.indexOf('<StyledCustomReactionInput'),
      ),
    );
    const threadCustomReactionStart = source.indexOf(
      '<StyledCustomReactionInput',
      source.indexOf('{visibleThreadMessages.map((message) => ('),
    );
    const threadCustomReactionSource = source.slice(
      threadCustomReactionStart,
      source.indexOf('</StyledMessageActions>', threadCustomReactionStart),
    );

    expect(customReactionHandlerSource).toContain('!isComposerEnabled');
    expect(customReactionHandlerSource).toContain('togglingReactionMessageId');
    expect(normalizeSourceWhitespace(mainCustomReactionSource)).toContain(
      'disabled={ !isComposerEnabled || togglingReactionMessageId === message.id }',
    );
    expect(normalizeSourceWhitespace(threadCustomReactionSource)).toContain(
      'disabled={ !isComposerEnabled || togglingReactionMessageId === message.id }',
    );
  });

  it('renders existing custom reaction summaries alongside quick reactions', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const reactionActionsSource = source.slice(
      source.indexOf(
        'const renderTeamMessageReactionActions = (message: TeamMessage) => {',
      ),
      source.indexOf('const focusedTeamPanelTitle ='),
    );

    expect(reactionActionsSource).toContain('message.reactions');
    expect(reactionActionsSource).toContain('existingReactionEmojis');
    expect(reactionActionsSource).toContain('QUICK_REACTIONS.filter(');
    expect(reactionActionsSource).toContain(
      '(emoji) => !existingReactionEmojis.has(emoji)',
    );
    expect(reactionActionsSource).toContain('key={reaction.emoji}');
    expect(reactionActionsSource).toContain('reaction.count > 0');
    expect(normalizeSourceWhitespace(reactionActionsSource)).toContain(
      'disabled={ !isComposerEnabled || togglingReactionMessageId === message.id }',
    );
    expect(source).toContain('{renderTeamMessageReactionActions(message)}');
  });

  it('offers emoji shortcode suggestions in custom reaction inputs', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const customReactionSource = source.slice(
      source.indexOf('const customReactionEmojiShortcodeSuggestions ='),
      source.indexOf('const canLoadEarlierMessages ='),
    );
    const customReactionInputSource = source.slice(
      source.indexOf('<StyledCustomReactionInput'),
      source.indexOf(
        '</StyledMessageActions>',
        source.indexOf('<StyledCustomReactionInput'),
      ),
    );

    expect(source).toContain('activeCustomReactionMessageId');
    expect(customReactionSource).toContain(
      'getTeamEmojiShortcodeSuggestions(customReactionDraft)',
    );
    expect(source).toContain(
      'activeCustomReactionEmojiShortcodeSuggestionIndex',
    );
    expect(source).toContain('handleInsertCustomReactionEmojiShortcode');
    expect(customReactionInputSource).toContain(
      'visibleCustomReactionEmojiShortcodeSuggestions',
    );
    expect(customReactionInputSource).toContain(
      'handleInsertCustomReactionEmojiShortcode',
    );
    expect(source).toContain('renderTeamEmojiShortcodeSuggestions');
  });

  it('renders Slack-style strikethrough message segments', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const messageSegmentRendererSource = source.slice(
      source.indexOf('const renderTeamMessageTextSegments = (text: string) =>'),
      source.indexOf('const renderTeamMessageBody ='),
    );

    expect(source).toContain('StyledMessageBodyStrikethrough');
    expect(source).toContain('text-decoration: line-through');
    expect(messageSegmentRendererSource).toContain(
      "segment.type === 'strikethrough'",
    );
  });

  it('shows edited markers in main and thread message metadata', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const mainMessageSource = source.slice(
      source.indexOf('{messages.map((message, messageIndex) => ('),
      source.indexOf('<StyledMessageActions>', source.indexOf('{messages.map')),
    );
    const threadMessageSource = source.slice(
      source.indexOf('{visibleThreadMessages.map((message, messageIndex) => ('),
      source.indexOf(
        '<StyledMessageActions>',
        source.indexOf(
          '{visibleThreadMessages.map((message, messageIndex) => (',
        ),
      ),
    );

    expect(source).toContain('isTeamMessageEdited');
    expect(mainMessageSource).toContain('isTeamMessageEdited({');
    expect(mainMessageSource).toContain('updatedAt: message.updatedAt');
    expect(mainMessageSource).toContain('t` · edited`');
    expect(threadMessageSource).toContain('isTeamMessageEdited({');
    expect(threadMessageSource).toContain('updatedAt: message.updatedAt');
    expect(threadMessageSource).toContain('t` · edited`');
  });

  it('shows date dividers in main and thread message timelines', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const mainMessageSource = source.slice(
      source.indexOf('{messages.map((message, messageIndex) => ('),
      source.indexOf('<StyledMessageActions>', source.indexOf('{messages.map')),
    );
    const threadMessageSource = source.slice(
      source.indexOf('{visibleThreadMessages.map((message, messageIndex) => ('),
      source.indexOf(
        '<StyledMessageActions>',
        source.indexOf(
          '{visibleThreadMessages.map((message, messageIndex) => (',
        ),
      ),
    );

    expect(source).toContain('StyledDateDivider');
    expect(source).toContain('shouldShowTeamMessageDateDivider');
    expect(source).toContain('formatTeamMessageDateDividerLabel');
    expect(mainMessageSource).toContain(
      'previousCreatedAt: messages[messageIndex - 1]?.createdAt',
    );
    expect(mainMessageSource).toContain('<StyledDateDivider>');
    expect(threadMessageSource).toContain(
      'visibleThreadMessages[messageIndex - 1]?.createdAt',
    );
    expect(threadMessageSource).toContain('<StyledDateDivider>');
  });

  it('shows full timestamp hover context in main and thread message metadata', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const mainMessageSource = source.slice(
      source.indexOf('{messages.map((message, messageIndex) => ('),
      source.indexOf('<StyledMessageActions>', source.indexOf('{messages.map')),
    );
    const threadMessageSource = source.slice(
      source.indexOf('{visibleThreadMessages.map((message, messageIndex) => ('),
      source.indexOf(
        '<StyledMessageActions>',
        source.indexOf(
          '{visibleThreadMessages.map((message, messageIndex) => (',
        ),
      ),
    );

    expect(source).toContain('formatTeamMessageTimestampTitle');
    expect(mainMessageSource).toContain(
      'title={formatTeamMessageTimestampTitle(',
    );
    expect(mainMessageSource).toContain('message.createdAt');
    expect(threadMessageSource).toContain(
      'title={formatTeamMessageTimestampTitle(',
    );
    expect(threadMessageSource).toContain('message.createdAt');
  });

  it('copies message text from main and thread message actions', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const mainMessageSource = source.slice(
      source.indexOf('{messages.map((message, messageIndex) => ('),
      source.indexOf('<StyledMessageActions>', source.indexOf('{messages.map')),
    );
    const mainMessageActionsSource = source.slice(
      source.indexOf('<StyledMessageActions>', source.indexOf('{messages.map')),
      source.indexOf(
        '{renderTeamMessageReactionActions(message)}',
        source.indexOf('{messages.map'),
      ),
    );
    const threadMessageSourceStart = source.indexOf(
      '{visibleThreadMessages.map((message, messageIndex) => (',
    );
    const threadMessageActionsSource = source.slice(
      source.indexOf('<StyledMessageActions>', threadMessageSourceStart),
      source.indexOf(
        '{renderTeamMessageReactionActions(message)}',
        threadMessageSourceStart,
      ),
    );
    const savedMessageSource = source.slice(
      source.indexOf('const renderTeamSavedMessage ='),
      source.indexOf('const renderTeamPinnedMessage ='),
    );
    const pinnedMessageSource = source.slice(
      source.indexOf('const renderTeamPinnedMessage ='),
      source.indexOf('const renderTeamFile ='),
    );
    const messageSearchResultSource = source.slice(
      source.indexOf('const renderTeamMessageSearchResults ='),
      source.indexOf('const renderTeamMessageSearchBox ='),
    );
    const mentionMessageSource = source.slice(
      source.indexOf('const renderTeamMention ='),
      source.indexOf('const renderTeamMessageReactionActions ='),
    );
    const reminderMessageSource = source.slice(
      source.indexOf('const renderTeamReminder ='),
      source.indexOf('const renderTeamMessageSearchResults ='),
    );
    const inboxMessageSource = source.slice(
      source.indexOf('const renderTeamInboxItem ='),
      source.indexOf('const renderTeamSavedMessage ='),
    );

    expect(source).toContain('getTeamMessageCopyText');
    expect(source).toContain('const handleCopyMessageText = async');
    expect(source).toContain('value: messageText');
    expect(source).toContain('t`Message text copied.`');
    expect(mainMessageSource).toContain('message.body');
    expect(mainMessageActionsSource).toContain('`message-text:${message.id}`');
    expect(mainMessageActionsSource).toContain(
      'onClick={() => void handleCopyMessageText(message)}',
    );
    expect(mainMessageActionsSource).toContain('t`Copy text`');
    expect(threadMessageActionsSource).toContain(
      '`message-text:${message.id}`',
    );
    expect(threadMessageActionsSource).toContain(
      'onClick={() => void handleCopyMessageText(message)}',
    );
    expect(threadMessageActionsSource).toContain('t`Copy text`');
    expect(savedMessageSource).toContain('void handleCopyMessageText(message)');
    expect(savedMessageSource).toContain('`message-text:${message.id}`');
    expect(savedMessageSource).toContain('t`Copy text`');
    expect(savedMessageSource).toContain('void handleCopyMessageLink(message)');
    expect(savedMessageSource).toContain('`message-link:${message.id}`');
    expect(savedMessageSource).toContain('t`Copy link`');
    expect(savedMessageSource).toContain(
      'handleOpenTeamMessageThreadTarget(message)',
    );
    expect(savedMessageSource).toContain('t`Open thread`');
    expect(pinnedMessageSource).toContain(
      'void handleCopyMessageText(message)',
    );
    expect(pinnedMessageSource).toContain('`message-text:${message.id}`');
    expect(pinnedMessageSource).toContain('t`Copy text`');
    expect(pinnedMessageSource).toContain(
      'void handleCopyMessageLink(message)',
    );
    expect(pinnedMessageSource).toContain('`message-link:${message.id}`');
    expect(pinnedMessageSource).toContain('t`Copy link`');
    expect(pinnedMessageSource).toContain(
      'handleOpenTeamMessageThreadTarget(message)',
    );
    expect(pinnedMessageSource).toContain('t`Open thread`');
    expect(messageSearchResultSource).toContain(
      'void handleCopyMessageText(result)',
    );
    expect(messageSearchResultSource).toContain('`message-text:${result.id}`');
    expect(messageSearchResultSource).toContain(
      'void handleCopyMessageLink(result)',
    );
    expect(messageSearchResultSource).toContain('`message-link:${result.id}`');
    expect(messageSearchResultSource).toContain('t`Copy text`');
    expect(messageSearchResultSource).toContain('t`Copy link`');
    expect(messageSearchResultSource).toContain(
      'handleOpenTeamMessageThreadTarget(result)',
    );
    expect(messageSearchResultSource).toContain('t`Open thread`');
    expect(mentionMessageSource).toContain(
      'void handleCopyMessageText(mention)',
    );
    expect(mentionMessageSource).toContain(
      '`message-text:${mention.messageId}`',
    );
    expect(mentionMessageSource).toContain(
      'void handleCopyMessageLink(mention)',
    );
    expect(mentionMessageSource).toContain(
      '`message-link:${mention.messageId}`',
    );
    expect(mentionMessageSource).toContain('t`Copy text`');
    expect(mentionMessageSource).toContain('t`Copy link`');
    expect(mentionMessageSource).toContain(
      'handleOpenTeamMessageThreadTarget(mention)',
    );
    expect(mentionMessageSource).toContain('t`Open thread`');
    expect(reminderMessageSource).toContain(
      'void handleCopyMessageText(reminder)',
    );
    expect(reminderMessageSource).toContain(
      '`message-text:${reminder.messageId}`',
    );
    expect(reminderMessageSource).toContain(
      'void handleCopyMessageLink(reminder)',
    );
    expect(reminderMessageSource).toContain(
      '`message-link:${reminder.messageId}`',
    );
    expect(reminderMessageSource).toContain('t`Copy text`');
    expect(reminderMessageSource).toContain('t`Copy link`');
    expect(reminderMessageSource).toContain(
      'handleOpenTeamMessageThreadTarget(reminder)',
    );
    expect(reminderMessageSource).toContain('t`Open thread`');
    expect(inboxMessageSource).toContain('body: item.subtitle ??');
    expect(inboxMessageSource).toContain('id: item.id');
    expect(inboxMessageSource).toContain('void handleCopyMessageLink(item)');
    expect(inboxMessageSource).toContain('item.messageId != null');
    expect(inboxMessageSource).toContain('t`Copy text`');
    expect(inboxMessageSource).toContain('t`Copy link`');
    expect(inboxMessageSource).toContain(
      'handleOpenTeamMessageThreadTarget(item)',
    );
    expect(inboxMessageSource).toContain('t`Open thread`');
  });

  it('focuses the target composer after quoting a message', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const quoteMessageSource = source.slice(
      source.indexOf('const handleQuoteMessage = ('),
      source.indexOf('const handleCopyThreadLink = async'),
    );

    expect(quoteMessageSource).toContain('appendTeamQuoteDraft');
    expect(quoteMessageSource).toContain('requestAnimationFrame(() =>');
    expect(quoteMessageSource).toContain('draftMessageInputElement?.focus()');
    expect(quoteMessageSource).toContain(
      'threadDraftMessageInputElement?.focus()',
    );
  });

  it('lets users copy sent attachment links from main and thread messages', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const mainMessageSource = source.slice(
      source.indexOf('{messages.map((message, messageIndex) => ('),
      source.indexOf('<StyledMessageActions>', source.indexOf('{messages.map')),
    );
    const threadMessageSource = source.slice(
      source.indexOf('{visibleThreadMessages.map((message, messageIndex) => ('),
      source.indexOf(
        '<StyledMessageActions>',
        source.indexOf(
          '{visibleThreadMessages.map((message, messageIndex) => (',
        ),
      ),
    );

    expect(source).toContain('const handleCopyAttachmentLink = async');
    expect(source).toContain('value: attachment.url');
    expect(source).toContain('attachment-link');
    expect(source).toContain('Attachment link copied.');
    expect(mainMessageSource).toContain('`attachment-link:${attachment.url}`');
    expect(mainMessageSource).toContain(
      'void handleCopyAttachmentLink(attachment)',
    );
    expect(threadMessageSource).toContain(
      '`attachment-link:${attachment.url}`',
    );
    expect(threadMessageSource).toContain(
      'void handleCopyAttachmentLink(attachment)',
    );
    expect(mainMessageSource).toContain('t`Copy link`');
    expect(threadMessageSource).toContain('t`Copy link`');
  });

  it('shows sent attachment file sizes in main and thread messages', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const mainMessageSource = source.slice(
      source.indexOf('{messages.map((message, messageIndex) => ('),
      source.indexOf('<StyledMessageActions>', source.indexOf('{messages.map')),
    );
    const threadMessageSource = source.slice(
      source.indexOf('{visibleThreadMessages.map((message, messageIndex) => ('),
      source.indexOf(
        '<StyledMessageActions>',
        source.indexOf(
          '{visibleThreadMessages.map((message, messageIndex) => (',
        ),
      ),
    );

    expect(mainMessageSource).toContain('formatFileSize(attachment.size)');
    expect(threadMessageSource).toContain('formatFileSize(attachment.size)');
  });

  it('shows direct-message last-message previews in the sidebar', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const directMessageListSource = source.slice(
      source.indexOf('{sortedDirectMessages.map((directMessage) => {'),
      source.indexOf('</StyledList>', source.indexOf('{sortedDirectMessages')),
    );

    expect(source).toContain('lastMessageBody?: string | null');
    expect(source).toContain('getTeamMessagePreviewBody');
    expect(source).toContain('StyledListItemSecondaryText');
    expect(directMessageListSource).toContain('directMessage.lastMessageBody');
    expect(directMessageListSource).toContain('getTeamMessagePreviewBody({');
    expect(directMessageListSource).toContain('<StyledListItemSecondaryText>');
  });

  it('does not ship a Team Comms mock data module', () => {
    expect(
      existsSync(
        path.join(
          process.cwd(),
          'packages/twenty-front/src/modules/team/constants/teamCommsMockData.ts',
        ),
      ),
    ).toBe(false);
  });

  it('shows Team unread activity on the main navigation tab', () => {
    const tabsRowSource = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/modules/navigation/components/MainNavigationDrawerTabsRow.tsx',
      ),
      'utf8',
    );
    const unreadHookSource = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/modules/team/hooks/useTeamUnreadBadgeCount.ts',
      ),
      'utf8',
    );

    expect(tabsRowSource).toContain('useTeamUnreadBadgeCount');
    expect(tabsRowSource).toContain('StyledTeamUnreadBadge');
    expect(tabsRowSource).toContain('teamUnreadBadgeCount > 0');
    expect(tabsRowSource.indexOf('teamUnreadBadgeCount > 0')).toBeGreaterThan(
      tabsRowSource.indexOf('<IconUsers'),
    );
    expect(tabsRowSource.indexOf('teamUnreadBadgeCount > 0')).toBeLessThan(
      tabsRowSource.indexOf(
        '</StyledTabWrapper>',
        tabsRowSource.indexOf('<IconUsers'),
      ),
    );
    expect(unreadHookSource).toContain('GET_TEAM_INBOX');
    expect(unreadHookSource).toContain('GET_TEAM_MESSAGE_REMINDERS');
    expect(unreadHookSource).toContain('GET_TEAM_PRESENCE');
    expect(unreadHookSource).toContain('getTeamUnreadBadgeCount');
    expect(unreadHookSource).toContain(
      'pollInterval: TEAM_BADGE_REFRESH_INTERVAL_MS',
    );
  });

  it('offers mention suggestions in both message composers', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );

    expect(source).toContain('getActiveTeamMentionQuery');
    expect(source).toContain('getTeamMentionCandidates');
    expect(source).toContain('includeBroadMentions: !isDirectMessageSelected');
    expect(source).toContain('insertTeamMention');
    expect(source).toContain('getNextTeamMentionSuggestionIndex');
    expect(source).toContain('mainMentionCandidates');
    expect(source).toContain('threadMentionCandidates');
    expect(source).toContain('visibleMainMentionCandidates');
    expect(source).toContain('visibleThreadMentionCandidates');
    expect(source).toContain('setDismissedMainComposerSuggestionDraft');
    expect(source).toContain('setDismissedThreadComposerSuggestionDraft');
    expect(source).toContain('activeMainMentionSuggestionIndex');
    expect(source).toContain('activeThreadMentionSuggestionIndex');
    expect(source).toContain('handleInsertDraftMention');
    expect(source).toContain('handleInsertThreadDraftMention');
    expect(source).toContain('shouldSelectTeamMentionSuggestion');
    expect(source).toContain('renderTeamMentionSuggestions');
    expect(source).toContain('active={candidateIndex === activeIndex}');
    expect(source).toContain('candidate.statusText');
    expect(source).toContain('candidate.statusEmoji');
    const mainComposerKeydownSource = source.slice(
      source.indexOf('visibleMainCommandSuggestions.length > 0'),
      source.indexOf(
        '</StyledComposerTextInput>',
        source.indexOf('visibleMainCommandSuggestions.length > 0'),
      ),
    );
    const threadComposerKeydownSource = source.slice(
      source.indexOf('visibleThreadCommandSuggestions.length > 0'),
      source.indexOf(
        '</StyledComposerTextInput>',
        source.indexOf('visibleThreadCommandSuggestions.length > 0'),
      ),
    );

    expect(mainComposerKeydownSource).toContain("event.key === 'Escape'");
    expect(threadComposerKeydownSource).toContain(
      'setDismissedThreadComposerSuggestionDraft',
    );
    expect(
      mainComposerKeydownSource.indexOf('handleInsertDraftMention'),
    ).toBeLessThan(mainComposerKeydownSource.indexOf('void handleSendMessage'));
    expect(
      threadComposerKeydownSource.indexOf('handleInsertThreadDraftMention('),
    ).toBeLessThan(
      threadComposerKeydownSource.indexOf('void handleSendThreadReply'),
    );
  });

  it('offers slash command suggestions in both message composers', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );

    expect(source).toContain('getTeamComposerCommandSuggestions');
    expect(source).toContain('insertTeamComposerCommandSuggestion');
    expect(source).toContain('applyTeamComposerCommand');
    expect(source).toContain('mainCommandSuggestions');
    expect(source).toContain('threadCommandSuggestions');
    expect(source).toContain('visibleMainCommandSuggestions');
    expect(source).toContain('visibleThreadCommandSuggestions');
    expect(source).toContain('dismissedMainComposerSuggestionDraft');
    expect(source).toContain('dismissedThreadComposerSuggestionDraft');
    expect(source).toContain('activeMainCommandSuggestionIndex');
    expect(source).toContain('activeThreadCommandSuggestionIndex');
    expect(source).toContain('setActiveMainCommandSuggestionIndex');
    expect(source).toContain('setActiveThreadCommandSuggestionIndex');
    expect(source).toContain('handleInsertDraftCommand');
    expect(source).toContain('handleInsertThreadDraftCommand');
    expect(source).toContain('renderTeamCommandSuggestions');
    expect(source).toContain('suggestion.usage');
    expect(source).toContain('suggestion.description');
    expect(source).toContain('active={suggestionIndex === activeIndex}');
    expect(source).toContain('suggestions: visibleMainCommandSuggestions');
    expect(source).toContain('suggestions: visibleThreadCommandSuggestions');

    const mainComposerKeydownSource = source.slice(
      source.indexOf('visibleMainCommandSuggestions.length > 0'),
      source.indexOf(
        '</StyledComposerTextInput>',
        source.indexOf('visibleMainCommandSuggestions.length > 0'),
      ),
    );
    const threadComposerKeydownSource = source.slice(
      source.indexOf('visibleThreadCommandSuggestions.length > 0'),
      source.indexOf(
        '</StyledComposerTextInput>',
        source.indexOf('visibleThreadCommandSuggestions.length > 0'),
      ),
    );

    expect(mainComposerKeydownSource).toContain("event.key === 'Escape'");
    expect(threadComposerKeydownSource).toContain(
      'setDismissedThreadComposerSuggestionDraft',
    );
    expect(mainComposerKeydownSource).toContain('handleInsertDraftCommand');
    expect(threadComposerKeydownSource).toContain(
      'handleInsertThreadDraftCommand',
    );
    expect(
      mainComposerKeydownSource.indexOf('handleInsertDraftCommand'),
    ).toBeLessThan(mainComposerKeydownSource.indexOf('void handleSendMessage'));
    expect(
      threadComposerKeydownSource.indexOf('handleInsertThreadDraftCommand'),
    ).toBeLessThan(
      threadComposerKeydownSource.indexOf('void handleSendThreadReply'),
    );
  });

  it('offers emoji shortcode suggestions in both message composers', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );

    expect(source).toContain('getTeamEmojiShortcodeSuggestions');
    expect(source).toContain('insertTeamEmojiShortcodeSuggestion');
    expect(source).toContain('mainEmojiShortcodeSuggestions');
    expect(source).toContain('threadEmojiShortcodeSuggestions');
    expect(source).toContain('visibleMainEmojiShortcodeSuggestions');
    expect(source).toContain('visibleThreadEmojiShortcodeSuggestions');
    expect(source).toContain('activeMainEmojiShortcodeSuggestionIndex');
    expect(source).toContain('activeThreadEmojiShortcodeSuggestionIndex');
    expect(source).toContain('handleInsertDraftEmojiShortcode');
    expect(source).toContain('handleInsertThreadDraftEmojiShortcode');
    expect(source).toContain('renderTeamEmojiShortcodeSuggestions');

    const mainComposerKeydownSource = source.slice(
      source.indexOf('visibleMainCommandSuggestions.length > 0'),
      source.indexOf(
        '</StyledComposerTextInput>',
        source.indexOf('visibleMainCommandSuggestions.length > 0'),
      ),
    );
    const threadComposerKeydownSource = source.slice(
      source.indexOf('visibleThreadCommandSuggestions.length > 0'),
      source.indexOf(
        '</StyledComposerTextInput>',
        source.indexOf('visibleThreadCommandSuggestions.length > 0'),
      ),
    );

    expect(mainComposerKeydownSource).toContain(
      'visibleMainEmojiShortcodeSuggestions.length > 0',
    );
    expect(mainComposerKeydownSource).toContain(
      'handleInsertDraftEmojiShortcode',
    );
    expect(threadComposerKeydownSource).toContain(
      'visibleThreadEmojiShortcodeSuggestions.length > 0',
    );
    expect(threadComposerKeydownSource).toContain(
      'handleInsertThreadDraftEmojiShortcode',
    );
  });

  it('applies Slack-style formatting shortcuts in both message composers', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const mainComposerKeydownSource = source.slice(
      source.indexOf('visibleMainCommandSuggestions.length > 0'),
      source.indexOf(
        '</StyledComposerTextInput>',
        source.indexOf('visibleMainCommandSuggestions.length > 0'),
      ),
    );
    const threadComposerKeydownSource = source.slice(
      source.indexOf('visibleThreadCommandSuggestions.length > 0'),
      source.indexOf(
        '</StyledComposerTextInput>',
        source.indexOf('visibleThreadCommandSuggestions.length > 0'),
      ),
    );

    expect(source).toContain('getTeamComposerFormatShortcut');
    expect(source).toContain('applyTeamComposerFormatShortcut');
    expect(source).toContain('const handleApplyComposerFormatShortcut =');
    expect(source).toContain('setSelectionRange(');
    expect(mainComposerKeydownSource).toContain(
      'handleApplyComposerFormatShortcut({',
    );
    expect(mainComposerKeydownSource).toContain(
      'setComposerDraft: setDraftMessage',
    );
    expect(threadComposerKeydownSource).toContain(
      'handleApplyComposerFormatShortcut({',
    );
    expect(threadComposerKeydownSource).toContain(
      'setComposerDraft: setThreadDraftMessage',
    );
    expect(
      mainComposerKeydownSource.indexOf('handleApplyComposerFormatShortcut({'),
    ).toBeLessThan(mainComposerKeydownSource.indexOf('void handleSendMessage'));
    expect(
      threadComposerKeydownSource.indexOf(
        'handleApplyComposerFormatShortcut({',
      ),
    ).toBeLessThan(
      threadComposerKeydownSource.indexOf('void handleSendThreadReply'),
    );
  });

  it('lets users press Arrow Up in an empty composer to edit their last message', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'packages/twenty-front/src/pages/team/TeamPage.tsx',
      ),
      'utf8',
    );
    const mainComposerKeydownSource = source.slice(
      source.indexOf('visibleMainCommandSuggestions.length > 0'),
      source.indexOf(
        '</StyledComposerTextInput>',
        source.indexOf('visibleMainCommandSuggestions.length > 0'),
      ),
    );
    const threadComposerKeydownSource = source.slice(
      source.indexOf('visibleThreadCommandSuggestions.length > 0'),
      source.indexOf(
        '</StyledComposerTextInput>',
        source.indexOf('visibleThreadCommandSuggestions.length > 0'),
      ),
    );

    expect(source).toContain('shouldStartEditingLastTeamMessage');
    expect(source).toContain('getLastEditableTeamMessage(messages)');
    expect(source).toContain('getLastEditableTeamMessage(');
    expect(source).toContain('visibleThreadMessages');
    expect(mainComposerKeydownSource).toContain(
      'handleStartEditingLastMainMessage()',
    );
    expect(threadComposerKeydownSource).toContain(
      'handleStartEditingLastThreadMessage()',
    );
    expect(
      mainComposerKeydownSource.indexOf('handleStartEditingLastMainMessage()'),
    ).toBeLessThan(mainComposerKeydownSource.indexOf('void handleSendMessage'));
    expect(
      threadComposerKeydownSource.indexOf(
        'handleStartEditingLastThreadMessage()',
      ),
    ).toBeLessThan(
      threadComposerKeydownSource.indexOf('void handleSendThreadReply'),
    );
  });
});
