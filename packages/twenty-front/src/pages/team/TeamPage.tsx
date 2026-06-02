import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import {
  type ClipboardEvent,
  Fragment,
  type DragEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { print, type ExecutionResult } from 'graphql';
import { isDefined } from 'twenty-shared/utils';
import {
  IconBellOff,
  IconClock,
  IconLock,
  IconMail,
  IconMessage,
  IconNumber,
  IconPaperclip,
  IconPinned,
  IconPlus,
  IconSearch,
  IconSend,
  IconStar,
  IconX,
} from 'twenty-ui/display';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { useMutation, useQuery } from '@apollo/client/react';

import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { formatFileSize } from '@/file/utils/formatFileSize';
import { hasTeamBroadMention } from '@/team/utils/teamBroadMentions';
import {
  applyTeamComposerFormatShortcut,
  getTeamComposerFormatShortcut,
} from '@/team/utils/teamComposerFormatting';
import { sortTeamChannelMembers } from '@/team/utils/teamChannelMembers';
import { shouldSendTeamComposerMessage } from '@/team/utils/teamComposerKeyboard';
import {
  getNextTeamConversationMuteLevel,
  isTeamConversationMuted,
} from '@/team/utils/teamConversationNotifications';
import { applyTeamComposerCommand } from '@/team/utils/teamComposerCommands';
import {
  getTeamComposerCommandSuggestions,
  insertTeamComposerCommandSuggestion,
  type TeamComposerCommandSuggestion,
} from '@/team/utils/teamComposerCommandSuggestions';
import {
  getTeamEmojiShortcodeSuggestions,
  insertTeamEmojiShortcodeSuggestion,
  type TeamEmojiShortcodeSuggestion,
} from '@/team/utils/teamEmojiShortcodes';
import {
  getTeamConversationTarget,
  type TeamConversationTargetInput,
} from '@/team/utils/teamConversationTargets';
import {
  clearTeamDraft,
  getTeamDraftStorageKey,
  loadTeamDraft,
  saveTeamDraft,
} from '@/team/utils/teamDrafts';
import {
  shouldCancelTeamMessageEdit,
  shouldCloseTeamThread,
  shouldSaveTeamMessageEdit,
  shouldStartEditingLastTeamMessage,
} from '@/team/utils/teamEditKeyboard';
import { getLastEditableTeamMessage } from '@/team/utils/teamEditableMessages';
import {
  formatTeamMessageDateDividerLabel,
  formatTeamMessageBody,
  formatTeamMessageTextSegments,
  formatTeamMessageTimestampTitle,
  getTeamMessageCopyText,
  isTeamMessageEdited,
  shouldShowTeamMessageDateDivider,
} from '@/team/utils/teamMessageFormatting';
import { getTeamMessagePreviewBody } from '@/team/utils/teamMessagePreviews';
import {
  getActiveTeamMentionQuery,
  getNextTeamMentionSuggestionIndex,
  getTeamMentionCandidates,
  insertTeamMention,
  shouldSelectTeamMentionSuggestion,
  type TeamMentionCandidate,
} from '@/team/utils/teamMentionSuggestions';
import {
  getTeamMessageElementId,
  getTeamHighlightedMessageId,
  getTeamMessageScrollTarget,
} from '@/team/utils/teamHighlightedMessage';
import { getTeamInviteCandidates } from '@/team/utils/teamInviteCandidates';
import { buildTeamMessageLink } from '@/team/utils/teamMessageLinks';
import {
  DEFAULT_TEAM_MESSAGE_REMINDER_OPTION_VALUE,
  getTeamMessageReminderDate,
  TEAM_MESSAGE_REMINDER_OPTIONS,
} from '@/team/utils/teamMessageReminders';
import {
  appendTeamPendingAttachments,
  removeTeamPendingAttachmentAtIndex,
  TEAM_PENDING_ATTACHMENT_LIMIT,
} from '@/team/utils/teamPendingAttachments';
import { mergeEarlierTeamMessages } from '@/team/utils/teamMessagePagination';
import { getTeamOnlineTeammates } from '@/team/utils/teamOnlineTeammates';
import {
  appendTeamQuoteDraft,
  buildTeamQuoteDraft,
} from '@/team/utils/teamQuoteDrafts';
import { normalizeTeamReactionInput } from '@/team/utils/teamReactions';
import { shouldFocusTeamMessageSearch } from '@/team/utils/teamSearchKeyboard';
import { getTeamUnreadDividerMessageId } from '@/team/utils/teamUnreadDivider';
import {
  getTeamStarredConversationKey,
  loadTeamStarredConversationKeys,
  saveTeamStarredConversationKeys,
  sortTeamConversationsByStarred,
  toggleTeamStarredConversationKey,
} from '@/team/utils/teamStarredConversations';
import {
  getDueTeamNotificationCandidates,
  getNewTeamNotificationCandidates,
  getTeamLiveMessageNotificationBody,
  getTeamNotificationTitle,
  getTeamUnreadBadgeCount,
  shouldShowTeamLiveMessageNotification,
  type TeamNotificationCandidate,
  type TeamNotificationPreference,
  type TeamNotificationQuietHours,
} from '@/team/utils/teamNotifications';
import { formatTeamTypingIndicatorText } from '@/team/utils/teamTypingIndicators';
import {
  ARCHIVE_TEAM_CHANNEL,
  CREATE_TEAM_CHANNEL,
  CREATE_TEAM_DIRECT_MESSAGE,
  DELETE_TEAM_MESSAGE,
  DISMISS_TEAM_MESSAGE_REMINDER,
  GET_TEAM_CHANNEL_MEMBERS,
  GET_TEAM_DIRECT_MESSAGE_MESSAGES,
  GET_TEAM_DIRECT_MESSAGES,
  GET_TEAM_FILES,
  GET_TEAM_CHANNELS,
  GET_TEAM_INBOX,
  GET_TEAM_MENTIONS,
  GET_TEAM_MEMBERS,
  GET_TEAM_MESSAGE_REMINDERS,
  GET_TEAM_PINNED_MESSAGES,
  GET_TEAM_MESSAGE_THREAD,
  GET_TEAM_MESSAGES,
  GET_TEAM_PRESENCE,
  GET_TEAM_SAVED_MESSAGES,
  GET_TEAM_TYPING_INDICATORS,
  HEARTBEAT_TEAM_PRESENCE,
  HEARTBEAT_TEAM_TYPING,
  INVITE_TEAM_CHANNEL_MEMBER,
  JOIN_TEAM_CHANNEL,
  LEAVE_TEAM_CHANNEL,
  MARK_TEAM_CHANNEL_READ,
  MARK_TEAM_DIRECT_MESSAGE_READ,
  MARK_TEAM_INBOX_READ,
  MARK_TEAM_MESSAGE_THREAD_READ,
  MARK_TEAM_MESSAGE_UNREAD,
  MARK_TEAM_MENTION_READ,
  ON_TEAM_MESSAGE_EVENT,
  REMOVE_TEAM_CHANNEL_MEMBER,
  SEARCH_TEAM_MESSAGES,
  SET_TEAM_MESSAGE_REMINDER,
  SEND_TEAM_DIRECT_MESSAGE,
  SEND_TEAM_MESSAGE,
  TOGGLE_TEAM_MESSAGE_PIN,
  TOGGLE_TEAM_MESSAGE_BOOKMARK,
  TOGGLE_TEAM_MESSAGE_REACTION,
  UPDATE_TEAM_CHANNEL,
  UPDATE_TEAM_CHANNEL_MEMBER_ROLE,
  UPDATE_TEAM_CHANNEL_NOTIFICATION_LEVEL,
  UPDATE_TEAM_DIRECT_MESSAGE_NOTIFICATION_LEVEL,
  UPDATE_TEAM_NOTIFICATION_PREFERENCE,
  UPDATE_TEAM_NOTIFICATION_QUIET_HOURS,
  UPDATE_TEAM_PRESENCE_STATUS,
  UPDATE_TEAM_MESSAGE,
  UPLOAD_TEAM_MESSAGE_ATTACHMENT,
} from '@/team/graphql/teamCommsOperations';
import { sseClientState } from '@/sse-db-event/states/sseClientState';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { PageBody } from '@/ui/layout/page/components/PageBody';
import { PageContainer } from '@/ui/layout/page/components/PageContainer';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';
import { PageTitle } from '@/ui/utilities/page-title/components/PageTitle';
import { navigationDrawerActiveTabState } from '@/ui/navigation/states/navigationDrawerActiveTabState';
import { NAVIGATION_DRAWER_TABS } from '@/ui/navigation/states/navigationDrawerTabs';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';

const StyledContent = styled.div<{ hasThread?: boolean }>`
  display: grid;
  gap: ${themeCssVariables.spacing[4]};
  grid-template-columns: ${({ hasThread }) =>
    hasThread
      ? 'minmax(220px, 280px) minmax(0, 1fr) minmax(280px, 360px)'
      : 'minmax(220px, 280px) minmax(0, 1fr)'};
  height: 100%;
  min-height: 0;
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledPanel = styled.section`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  display: flex;
  flex-direction: column;
  min-height: 0;
`;

const StyledSidebarPanel = styled(StyledPanel)`
  overflow: auto;
`;

const StyledPanelHeader = styled.div`
  align-items: center;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  flex-shrink: 0;
  gap: ${themeCssVariables.spacing[2]};
  min-height: ${themeCssVariables.spacing[12]};
  padding: 0 ${themeCssVariables.spacing[4]};
`;

const StyledPanelHeaderSpacer = styled.div`
  flex: 1;
`;

const StyledPanelTitle = styled.h2`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.lg};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin: 0;
`;

const StyledPanelTitleStack = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[1]};
  min-width: 0;
`;

const StyledPanelSubtitle = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  max-width: 520px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledList = styled.div`
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  gap: ${themeCssVariables.spacing[1]};
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledListItem = styled.button<{ active?: boolean }>`
  align-items: center;
  background: ${({ active }) =>
    active ? themeCssVariables.background.transparent.light : 'transparent'};
  border: 0;
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  display: flex;
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.md};
  gap: ${themeCssVariables.spacing[2]};
  line-height: ${themeCssVariables.text.lineHeight.md};
  min-height: ${themeCssVariables.spacing[8]};
  padding: 0 ${themeCssVariables.spacing[2]};
  text-align: left;

  &:hover {
    background: ${themeCssVariables.background.transparent.lighter};
    color: ${themeCssVariables.font.color.primary};
  }

  &:disabled {
    color: ${themeCssVariables.font.color.tertiary};
    cursor: default;
  }

  &:disabled:hover {
    background: transparent;
    color: ${themeCssVariables.font.color.tertiary};
  }
`;

const StyledListItemTextStack = styled.span`
  display: grid;
  flex: 1;
  min-width: 0;
`;

const StyledListItemPrimaryText = styled.span`
  color: inherit;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledListItemSecondaryText = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledMemberRow = styled.div`
  align-items: center;
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.md};
  gap: ${themeCssVariables.spacing[2]};
  min-height: ${themeCssVariables.spacing[8]};
  padding: 0 ${themeCssVariables.spacing[2]};
`;

const StyledConversationPlaceholder = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  flex: 1;
  font-size: ${themeCssVariables.font.size.md};
  justify-content: center;
  min-height: 0;
  padding: ${themeCssVariables.spacing[6]};
  text-align: center;
`;

const StyledCreateChannelForm = styled.form`
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: grid;
  flex-shrink: 0;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledCreateChannelRow = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledCreateChannelInput = styled.input`
  background: transparent;
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  flex: 1;
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.sm};
  height: ${themeCssVariables.spacing[8]};
  min-width: 0;
  outline: 0;
  padding: 0 ${themeCssVariables.spacing[2]};
`;

const StyledStatusForm = styled.form`
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: grid;
  flex-shrink: 0;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledStatusRow = styled.div`
  align-items: center;
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: minmax(64px, 80px) minmax(0, 1fr) auto auto;
`;

const StyledStatusInput = styled(StyledCreateChannelInput)`
  width: 100%;
`;

const StyledStatusSaveButton = styled.button`
  align-items: center;
  background: ${themeCssVariables.background.transparent.light};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  display: flex;
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.sm};
  height: ${themeCssVariables.spacing[8]};
  justify-content: center;
  min-width: 72px;
  padding: 0 ${themeCssVariables.spacing[2]};

  &:not(:disabled):hover {
    background: ${themeCssVariables.background.transparent.lighter};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const StyledNotificationPermissionButton = styled(StyledStatusSaveButton)`
  width: 100%;
`;

const StyledSelect = styled.select`
  background: transparent;
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  flex: 1;
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.sm};
  height: ${themeCssVariables.spacing[8]};
  min-width: 0;
  outline: 0;
  padding: 0 ${themeCssVariables.spacing[2]};
`;

const StyledCreateChannelToggle = styled.label`
  align-items: center;
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledChannelDetailsForm = styled.form`
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledJoinButton = styled.button`
  align-items: center;
  background: ${themeCssVariables.background.transparent.light};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  display: flex;
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[1]};
  height: ${themeCssVariables.spacing[8]};
  padding: 0 ${themeCssVariables.spacing[2]};

  &:not(:disabled):hover {
    background: ${themeCssVariables.background.transparent.lighter};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const StyledSearchBox = styled.div`
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: grid;
  flex-shrink: 0;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledSearchInputWrapper = styled.div`
  align-items: center;
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  height: ${themeCssVariables.spacing[8]};
  padding: 0 ${themeCssVariables.spacing[2]};
`;

const StyledSearchInput = styled.input`
  background: transparent;
  border: 0;
  color: ${themeCssVariables.font.color.primary};
  flex: 1;
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.sm};
  min-width: 0;
  outline: 0;
`;

const StyledSearchResults = styled.div`
  display: grid;
  flex-shrink: 0;
  gap: ${themeCssVariables.spacing[1]};
  max-height: 180px;
  overflow: auto;
`;

const StyledInboxResult = styled.div`
  align-items: center;
  background: transparent;
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.secondary};
  display: grid;
  gap: ${themeCssVariables.spacing[1]};
  grid-template-columns: minmax(0, 1fr) auto;
  padding: ${themeCssVariables.spacing[2]};

  &:hover {
    background: ${themeCssVariables.background.transparent.lighter};
    color: ${themeCssVariables.font.color.primary};
  }
`;

const StyledInboxResultButton = styled.button`
  background: transparent;
  border: 0;
  color: inherit;
  cursor: pointer;
  display: grid;
  font-family: ${themeCssVariables.font.family};
  gap: 2px;
  min-width: 0;
  padding: 0;
  text-align: left;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const StyledInboxFocusList = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  overflow: auto;
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledReminderResult = styled.div`
  background: transparent;
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  display: grid;
  font-family: ${themeCssVariables.font.family};
  gap: 2px;
  padding: ${themeCssVariables.spacing[2]};
  text-align: left;

  &:hover {
    background: ${themeCssVariables.background.transparent.lighter};
    color: ${themeCssVariables.font.color.primary};
  }
`;

const StyledSearchResultMeta = styled.span`
  color: ${themeCssVariables.font.color.light};
  font-size: ${themeCssVariables.font.size.xs};
`;

const StyledSearchResultBody = styled.span`
  font-size: ${themeCssVariables.font.size.sm};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledFileResult = styled.div`
  border-radius: ${themeCssVariables.border.radius.sm};
  display: grid;
  gap: ${themeCssVariables.spacing[1]};
  padding: ${themeCssVariables.spacing[2]};

  &:hover {
    background: ${themeCssVariables.background.transparent.lighter};
  }
`;

const StyledFileResultButton = styled.button`
  background: transparent;
  border: 0;
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  display: grid;
  font-family: ${themeCssVariables.font.family};
  gap: 2px;
  padding: 0;
  text-align: left;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const StyledFileOpenLink = styled.a`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
  text-decoration: none;

  &:hover {
    color: ${themeCssVariables.font.color.primary};
    text-decoration: underline;
  }
`;

const StyledInlineActionButton = styled.button`
  background: transparent;
  border: 0;
  color: ${themeCssVariables.font.color.tertiary};
  cursor: pointer;
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.xs};
  padding: 0;
  text-align: left;

  &:not(:disabled):hover {
    color: ${themeCssVariables.font.color.primary};
    text-decoration: underline;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const StyledUnreadCount = styled.span`
  background: ${themeCssVariables.color.blue};
  border-radius: ${themeCssVariables.border.radius.pill};
  color: ${themeCssVariables.font.color.inverted};
  font-size: ${themeCssVariables.font.size.xs};
  margin-left: auto;
  min-width: ${themeCssVariables.spacing[4]};
  padding: 1px ${themeCssVariables.spacing[1]};
  text-align: center;
`;

const StyledStarredConversationMarker = styled.span`
  color: ${themeCssVariables.color.yellow};
  display: inline-flex;
`;

const StyledMutedConversationMarker = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  display: inline-flex;
`;

const StyledPresenceDot = styled.span<{ online?: boolean }>`
  background: ${({ online }) =>
    online ? themeCssVariables.color.green : themeCssVariables.color.gray8};
  border-radius: ${themeCssVariables.border.radius.rounded};
  height: ${themeCssVariables.spacing[2]};
  margin-left: auto;
  width: ${themeCssVariables.spacing[2]};
`;

const StyledMessageList = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  min-height: 0;
  overflow: auto;
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledLoadEarlierButton = styled.button`
  align-items: center;
  align-self: center;
  background: ${themeCssVariables.background.transparent.light};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  display: flex;
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.sm};
  height: ${themeCssVariables.spacing[8]};
  justify-content: center;
  min-width: 120px;
  padding: 0 ${themeCssVariables.spacing[3]};

  &:disabled {
    color: ${themeCssVariables.font.color.light};
    cursor: default;
  }

  &:not(:disabled):hover {
    background: ${themeCssVariables.background.transparent.lighter};
  }
`;

const StyledMessage = styled.article<{ highlighted?: boolean }>`
  background: ${({ highlighted }) =>
    highlighted
      ? themeCssVariables.background.transparent.light
      : 'transparent'};
  border-radius: ${themeCssVariables.border.radius.sm};
  box-shadow: ${({ highlighted }) =>
    highlighted ? `inset 3px 0 0 ${themeCssVariables.color.blue}` : 'none'};
  display: grid;
  gap: ${themeCssVariables.spacing[1]};
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[2]};
`;

const StyledMessageMeta = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledAuthor = styled.span`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledAuthorStatus = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledMessageTime = styled.span`
  color: ${themeCssVariables.font.color.light};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledMessageBody = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  display: grid;
  font-size: ${themeCssVariables.font.size.md};
  gap: ${themeCssVariables.spacing[1]};
  line-height: ${themeCssVariables.text.lineHeight.md};
  margin: 0;
`;

const StyledMessageBodyText = styled.span`
  white-space: pre-wrap;
`;

const StyledMessageBodyLink = styled.a`
  color: ${themeCssVariables.color.blue};
  text-decoration: none;
  white-space: pre-wrap;

  &:hover {
    text-decoration: underline;
  }
`;

const StyledMessageBodyMention = styled.span`
  background: ${themeCssVariables.background.transparent.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.color.blue};
  font-weight: ${themeCssVariables.font.weight.medium};
  padding: 0 ${themeCssVariables.spacing[1]};
  white-space: pre-wrap;
`;

const StyledMessageBodyCode = styled.code`
  background: ${themeCssVariables.background.transparent.light};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  font-family: monospace;
  font-size: ${themeCssVariables.font.size.sm};
  padding: 0 ${themeCssVariables.spacing[1]};
  white-space: pre-wrap;
`;

const StyledMessageBodyCodeBlock = styled.pre`
  background: ${themeCssVariables.background.transparent.light};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  font-family: monospace;
  font-size: ${themeCssVariables.font.size.sm};
  line-height: ${themeCssVariables.text.lineHeight.md};
  margin: 0;
  overflow-x: auto;
  padding: ${themeCssVariables.spacing[2]};
  white-space: pre;
`;

const StyledMessageBodyBold = styled.strong`
  color: ${themeCssVariables.font.color.primary};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  white-space: pre-wrap;
`;

const StyledMessageBodyItalic = styled.em`
  color: ${themeCssVariables.font.color.secondary};
  white-space: pre-wrap;
`;

const StyledMessageBodyStrikethrough = styled.span`
  color: ${themeCssVariables.font.color.secondary};
  text-decoration: line-through;
  white-space: pre-wrap;
`;

const StyledMessageBodyQuote = styled.blockquote`
  border-left: 2px solid ${themeCssVariables.border.color.strong};
  color: ${themeCssVariables.font.color.light};
  margin: 0;
  padding-left: ${themeCssVariables.spacing[2]};
  white-space: pre-wrap;
`;

const StyledMessageEditForm = styled.div`
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledMessageEditInput = styled.textarea`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  flex: 1;
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.md};
  line-height: ${themeCssVariables.text.lineHeight.md};
  max-height: 120px;
  min-height: ${themeCssVariables.spacing[8]};
  min-width: 0;
  padding: ${themeCssVariables.spacing[2]};
  resize: none;
`;

const StyledAttachmentList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledAttachmentLink = styled.a`
  align-items: center;
  background: ${themeCssVariables.background.transparent.light};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[1]};
  min-height: ${themeCssVariables.spacing[7]};
  padding: 0 ${themeCssVariables.spacing[2]};
  text-decoration: none;

  &:hover {
    background: ${themeCssVariables.background.transparent.lighter};
    color: ${themeCssVariables.font.color.primary};
  }
`;

const StyledPinnedList = styled.div`
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};
`;

const StyledPinnedHeader = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledPinnedMessageButton = styled.button`
  background: ${themeCssVariables.background.transparent.light};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  display: grid;
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[1]};
  padding: ${themeCssVariables.spacing[2]};
  text-align: left;

  &:hover {
    background: ${themeCssVariables.background.transparent.lighter};
    color: ${themeCssVariables.font.color.primary};
  }
`;

const StyledPinnedMessageBody = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledPinnedBadge = styled.span`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  display: inline-flex;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledTypingIndicator = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  min-height: ${themeCssVariables.spacing[6]};
  padding: 0 ${themeCssVariables.spacing[4]} ${themeCssVariables.spacing[2]};
`;

const StyledUnreadDivider = styled.div`
  align-items: center;
  color: ${themeCssVariables.color.red};
  display: grid;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: 1fr auto 1fr;
  margin: ${themeCssVariables.spacing[2]} 0;

  &::before,
  &::after {
    background: ${themeCssVariables.color.red};
    content: '';
    height: 1px;
  }
`;

const StyledDateDivider = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  display: grid;
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.medium};
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: 1fr auto 1fr;
  margin: ${themeCssVariables.spacing[2]} 0;

  &::before,
  &::after {
    background: ${themeCssVariables.border.color.light};
    content: '';
    height: 1px;
  }
`;

const StyledMessageActions = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledReactionButton = styled.button<{ active?: boolean }>`
  align-items: center;
  background: ${({ active }) =>
    active ? themeCssVariables.background.transparent.light : 'transparent'};
  border: 1px solid
    ${({ active }) =>
      active
        ? themeCssVariables.border.color.medium
        : themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.pill};
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  display: flex;
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[1]};
  height: ${themeCssVariables.spacing[6]};
  padding: 0 ${themeCssVariables.spacing[2]};

  &:hover {
    background: ${themeCssVariables.background.transparent.lighter};
    color: ${themeCssVariables.font.color.primary};
  }
`;

const StyledCustomReactionInput = styled.input`
  background: transparent;
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.pill};
  color: ${themeCssVariables.font.color.secondary};
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.sm};
  height: ${themeCssVariables.spacing[6]};
  min-width: 46px;
  outline: 0;
  padding: 0 ${themeCssVariables.spacing[2]};
  width: 64px;

  &:focus {
    border-color: ${themeCssVariables.border.color.medium};
    color: ${themeCssVariables.font.color.primary};
  }
`;

const StyledCustomReactionInputWrapper = styled.span`
  display: grid;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledInlineSelect = styled.select`
  background: transparent;
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.tertiary};
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.sm};
  height: ${themeCssVariables.spacing[6]};
  outline: 0;
  padding: 0 ${themeCssVariables.spacing[1]};

  &:hover {
    background: ${themeCssVariables.background.transparent.lighter};
    color: ${themeCssVariables.font.color.primary};
  }
`;

const StyledReplyButton = styled.button`
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.tertiary};
  cursor: pointer;
  display: flex;
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.sm};
  height: ${themeCssVariables.spacing[6]};
  padding: 0 ${themeCssVariables.spacing[2]};

  &:hover {
    background: ${themeCssVariables.background.transparent.lighter};
    color: ${themeCssVariables.font.color.primary};
  }
`;

const StyledComposer = styled.form`
  align-items: center;
  border-top: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  min-height: ${themeCssVariables.spacing[14]};
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};
`;

const StyledComposerStack = styled.div<{ dragActive?: boolean }>`
  background: ${({ dragActive }) =>
    dragActive
      ? themeCssVariables.background.transparent.light
      : 'transparent'};
  border-top: 1px solid
    ${({ dragActive }) =>
      dragActive
        ? themeCssVariables.border.color.medium
        : themeCssVariables.border.color.light};
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};
`;

const StyledPendingAttachment = styled.div`
  align-items: center;
  background: ${themeCssVariables.background.transparent.light};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[2]};
  min-height: ${themeCssVariables.spacing[7]};
  padding: 0 ${themeCssVariables.spacing[2]};
`;

const StyledPendingAttachmentLink = styled.a`
  color: inherit;
  overflow: hidden;
  text-decoration: none;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:hover {
    color: ${themeCssVariables.font.color.primary};
    text-decoration: underline;
  }
`;

const StyledHiddenFileInput = styled.input`
  display: none;
`;

const StyledComposerInput = styled.div`
  align-items: flex-start;
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.light};
  display: flex;
  flex: 1;
  font-size: ${themeCssVariables.font.size.md};
  min-height: ${themeCssVariables.spacing[8]};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
`;

const StyledComposerField = styled.div`
  display: grid;
  flex: 1;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledComposerTextInput = styled.textarea`
  background: transparent;
  border: 0;
  color: ${themeCssVariables.font.color.primary};
  flex: 1;
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.md};
  line-height: ${themeCssVariables.text.lineHeight.md};
  max-height: 120px;
  min-height: ${themeCssVariables.spacing[5]};
  outline: 0;
  resize: none;
`;

const StyledMentionSuggestions = styled.div`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  box-shadow: ${themeCssVariables.boxShadow.strong};
  display: grid;
  gap: ${themeCssVariables.spacing['0.5']};
  padding: ${themeCssVariables.spacing[1]};
`;

const StyledMentionSuggestionButton = styled.button<{ active?: boolean }>`
  align-items: center;
  background: ${({ active }) =>
    active ? themeCssVariables.background.transparent.light : 'transparent'};
  border: 0;
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  display: grid;
  font-family: ${themeCssVariables.font.family};
  gap: ${themeCssVariables.spacing['0.5']};
  grid-template-columns: 1fr;
  min-height: ${themeCssVariables.spacing[8]};
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[2]};
  text-align: left;

  &:hover {
    background: ${themeCssVariables.background.transparent.lighter};
    color: ${themeCssVariables.font.color.primary};
  }
`;

const StyledMentionSuggestionName = styled.span`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledMentionSuggestionEmail = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
`;

const StyledIconButton = styled.button<{ active?: boolean }>`
  align-items: center;
  background: ${({ active }) =>
    active ? themeCssVariables.background.transparent.light : 'transparent'};
  border: 0;
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${({ active }) =>
    active
      ? themeCssVariables.color.yellow
      : themeCssVariables.font.color.tertiary};
  cursor: pointer;
  display: flex;
  height: ${themeCssVariables.spacing[8]};
  justify-content: center;
  width: ${themeCssVariables.spacing[8]};

  &:hover {
    background: ${themeCssVariables.background.transparent.lighter};
    color: ${themeCssVariables.font.color.primary};
  }
`;

const StyledIconButtonLabel = styled.label<{ disabled?: boolean }>`
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.tertiary};
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  display: flex;
  height: ${themeCssVariables.spacing[8]};
  justify-content: center;
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
  pointer-events: ${({ disabled }) => (disabled ? 'none' : 'auto')};
  width: ${themeCssVariables.spacing[8]};

  &:hover {
    background: ${themeCssVariables.background.transparent.lighter};
    color: ${themeCssVariables.font.color.primary};
  }
`;

type TeamChannel = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  visibility?: 'PUBLIC' | 'PRIVATE' | 'public' | 'private';
  unreadCount: number;
  isMember?: boolean;
  notificationLevel?:
    | 'ALL'
    | 'MENTIONS'
    | 'MUTED'
    | 'all'
    | 'mentions'
    | 'muted'
    | null;
  createdAt?: string;
  updatedAt?: string;
};

type TeamChannelMember = {
  id: string;
  channelId: string;
  userWorkspaceId: string;
  name: string;
  email: string;
  role: 'OWNER' | 'MEMBER' | 'owner' | 'member';
  notificationLevel:
    | 'ALL'
    | 'MENTIONS'
    | 'MUTED'
    | 'all'
    | 'mentions'
    | 'muted';
  isCurrentUser: boolean;
  createdAt: string;
};

type TeamDirectMessage = {
  id: string;
  participantName: string;
  participantEmail: string;
  participantUserWorkspaceId: string;
  notificationLevel:
    | 'ALL'
    | 'MENTIONS'
    | 'MUTED'
    | 'all'
    | 'mentions'
    | 'muted';
  unreadCount: number;
  lastMessageBody?: string | null;
  updatedAt?: string;
};

type TeamMessage = {
  id: string;
  authorName: string;
  authorUserWorkspaceId: string;
  attachments: TeamMessageAttachment[];
  body: string;
  canDelete: boolean;
  canEdit: boolean;
  channelId?: string | null;
  directMessageThreadId?: string | null;
  conversationName?: string;
  createdAt?: string;
  parentMessageId?: string | null;
  isPinned: boolean;
  isSaved: boolean;
  pinnedAt?: string | null;
  pinnedByUserWorkspaceId?: string | null;
  reactions?: TeamMessageReaction[];
  replyCount: number;
  time?: string;
  updatedAt?: string;
};

type TeamMessageAttachment = {
  id?: string;
  name: string;
  url: string;
  mimeType?: string | null;
  size?: number | null;
  createdAt?: string;
};

type TeamCopyResourceInput = {
  copyKey: string;
  errorMessage: string;
  successMessage: string;
  value: string;
};

type TeamMessageReaction = {
  emoji: string;
  count: number;
  hasReacted: boolean;
};

type TeamMessageSearchResult = {
  id: string;
  channelId?: string | null;
  directMessageThreadId?: string | null;
  parentMessageId?: string | null;
  conversationName: string;
  conversationType: 'channel' | 'direct';
  authorName: string;
  body: string;
  matchType: 'message' | 'attachment';
  attachmentName?: string | null;
  attachmentUrl?: string | null;
  createdAt?: string;
};

type TeamFile = {
  id: string;
  messageId: string;
  channelId?: string | null;
  directMessageThreadId?: string | null;
  parentMessageId?: string | null;
  conversationName: string;
  conversationType: 'channel' | 'direct';
  authorName: string;
  name: string;
  url: string;
  mimeType?: string | null;
  size?: number | null;
  createdAt?: string;
};

type TeamMention = {
  id: string;
  messageId: string;
  channelId?: string | null;
  directMessageThreadId?: string | null;
  parentMessageId?: string | null;
  conversationName: string;
  conversationType: 'channel' | 'direct';
  authorName: string;
  body: string;
  createdAt?: string;
  readAt?: string | null;
};

type TeamMessageReminder = {
  id: string;
  messageId: string;
  channelId?: string | null;
  directMessageThreadId?: string | null;
  parentMessageId?: string | null;
  conversationName: string;
  conversationType: 'channel' | 'direct';
  authorName: string;
  body: string;
  remindAt: string;
  createdAt: string;
};

type TeamInboxItem = {
  type:
    | 'CHANNEL'
    | 'DIRECT_MESSAGE'
    | 'MENTION'
    | 'THREAD'
    | 'channel'
    | 'directMessage'
    | 'mention'
    | 'thread';
  id: string;
  channelId?: string | null;
  directMessageThreadId?: string | null;
  mentionId?: string | null;
  messageId?: string | null;
  parentMessageId?: string | null;
  title: string;
  subtitle?: string | null;
  unreadCount: number;
  updatedAt?: string;
};

type TeamPresence = {
  userWorkspaceId: string;
  name: string;
  email: string;
  isOnline: boolean;
  isCurrentUser: boolean;
  lastSeenAt: string;
  notificationPreference:
    | 'ALL'
    | 'MENTIONS'
    | 'MUTED'
    | 'all'
    | 'mentions'
    | 'muted';
  notificationQuietHoursStart?: string | null;
  notificationQuietHoursEnd?: string | null;
  statusText?: string | null;
  statusEmoji?: string | null;
};

type TeamMember = {
  userWorkspaceId: string;
  name: string;
  email: string;
};

type TeamTypingIndicator = {
  userWorkspaceId: string;
  name: string;
  channelId?: string | null;
  directMessageThreadId?: string | null;
  parentMessageId?: string | null;
  expiresAt: string;
};

type TeamMessageEvent = {
  type: 'UPSERTED' | 'DELETED';
  isNewMessage: boolean;
  messageId: string;
  authorUserWorkspaceId: string;
  authorName: string;
  body: string;
  channelId?: string | null;
  directMessageThreadId?: string | null;
  parentMessageId?: string | null;
};

type GetTeamChannelsQuery = {
  teamChannels: TeamChannel[];
};

type GetTeamMessagesQuery = {
  teamMessages: TeamMessage[];
};

type GetTeamChannelMembersQuery = {
  teamChannelMembers: TeamChannelMember[];
};

type GetTeamDirectMessagesQuery = {
  teamDirectMessages: TeamDirectMessage[];
};

type GetTeamMembersQuery = {
  teamMembers: TeamMember[];
};

type GetTeamDirectMessageMessagesQuery = {
  teamDirectMessageMessages: TeamMessage[];
};

type GetTeamMessageThreadQuery = {
  teamMessageThread: TeamMessage[];
};

type SearchTeamMessagesQuery = {
  teamMessageSearch: TeamMessageSearchResult[];
};

type GetTeamMentionsQuery = {
  teamMentions: TeamMention[];
};

type GetTeamInboxQuery = {
  teamInbox: TeamInboxItem[];
};

type GetTeamSavedMessagesQuery = {
  teamSavedMessages: TeamMessage[];
};

type GetTeamPinnedMessagesQuery = {
  teamPinnedMessages: TeamMessage[];
};

type GetTeamFilesQuery = {
  teamFiles: TeamFile[];
};

type GetTeamMessageRemindersQuery = {
  teamMessageReminders: TeamMessageReminder[];
};

type GetTeamPresenceQuery = {
  teamPresence: TeamPresence[];
};

type GetTeamTypingIndicatorsQuery = {
  teamTypingIndicators: TeamTypingIndicator[];
};

type OnTeamMessageEventSubscription = {
  onTeamMessageEvent: TeamMessageEvent;
};

type TeamMessageEventSubscriptionTarget =
  | { channelId: string; directMessageThreadId?: never }
  | { channelId?: never; directMessageThreadId: string };

type SendTeamMessageMutation = {
  sendTeamMessage: TeamMessage;
};

type SendTeamDirectMessageMutation = {
  sendTeamDirectMessage: TeamMessage;
};

type CreateTeamDirectMessageMutation = {
  createTeamDirectMessage: TeamDirectMessage;
};

type MarkTeamChannelReadMutation = {
  markTeamChannelRead: boolean;
};

type MarkTeamDirectMessageReadMutation = {
  markTeamDirectMessageRead: boolean;
};

type MarkTeamMessageThreadReadMutation = {
  markTeamMessageThreadRead: boolean;
};

type MarkTeamInboxReadMutation = {
  markTeamInboxRead: boolean;
};

type MarkTeamMessageUnreadMutation = {
  markTeamMessageUnread: boolean;
};

type MarkTeamMentionReadMutation = {
  markTeamMentionRead: boolean;
};

type HeartbeatTeamPresenceMutation = {
  heartbeatTeamPresence: TeamPresence;
};

type UpdateTeamPresenceStatusMutation = {
  updateTeamPresenceStatus: TeamPresence;
};

type UpdateTeamNotificationPreferenceMutation = {
  updateTeamNotificationPreference: TeamPresence;
};

type UpdateTeamNotificationQuietHoursMutation = {
  updateTeamNotificationQuietHours: TeamPresence;
};

type HeartbeatTeamTypingMutation = {
  heartbeatTeamTyping: TeamTypingIndicator;
};

type ToggleTeamMessageReactionMutation = {
  toggleTeamMessageReaction: TeamMessage;
};

type ToggleTeamMessagePinMutation = {
  toggleTeamMessagePin: TeamMessage;
};

type ToggleTeamMessageBookmarkMutation = {
  toggleTeamMessageBookmark: TeamMessage;
};

type SetTeamMessageReminderMutation = {
  setTeamMessageReminder: TeamMessageReminder;
};

type DismissTeamMessageReminderMutation = {
  dismissTeamMessageReminder: boolean;
};

type UpdateTeamMessageMutation = {
  updateTeamMessage: TeamMessage;
};

type DeleteTeamMessageMutation = {
  deleteTeamMessage: boolean;
};

type CreateTeamChannelMutation = {
  createTeamChannel: TeamChannel;
};

type UpdateTeamChannelMutation = {
  updateTeamChannel: TeamChannel;
};

type JoinTeamChannelMutation = {
  joinTeamChannel: TeamChannel;
};

type InviteTeamChannelMemberMutation = {
  inviteTeamChannelMember: TeamChannelMember;
};

type RemoveTeamChannelMemberMutation = {
  removeTeamChannelMember: boolean;
};

type UpdateTeamChannelMemberRoleMutation = {
  updateTeamChannelMemberRole: TeamChannelMember;
};

type LeaveTeamChannelMutation = {
  leaveTeamChannel: boolean;
};

type ArchiveTeamChannelMutation = {
  archiveTeamChannel: boolean;
};

type UpdateTeamChannelNotificationLevelMutation = {
  updateTeamChannelNotificationLevel: TeamChannelMember;
};

type UpdateTeamDirectMessageNotificationLevelMutation = {
  updateTeamDirectMessageNotificationLevel: {
    directMessageThreadId: string;
    notificationLevel: TeamDirectMessage['notificationLevel'];
  };
};

type UploadTeamMessageAttachmentMutation = {
  uploadTeamMessageAttachment: TeamMessageAttachment;
};

const EMPTY_TEAM_CHANNELS: TeamChannel[] = [];
const EMPTY_TEAM_CHANNEL_MEMBERS: TeamChannelMember[] = [];
const EMPTY_TEAM_DIRECT_MESSAGES: TeamDirectMessage[] = [];
const EMPTY_TEAM_FILES: TeamFile[] = [];
const EMPTY_TEAM_INBOX_ITEMS: TeamInboxItem[] = [];
const EMPTY_TEAM_MEMBERS: TeamMember[] = [];
const EMPTY_TEAM_MENTIONS: TeamMention[] = [];
const EMPTY_TEAM_MESSAGE_REMINDERS: TeamMessageReminder[] = [];
const EMPTY_TEAM_MESSAGES: TeamMessage[] = [];
const EMPTY_TEAM_MESSAGE_SEARCH_RESULTS: TeamMessageSearchResult[] = [];
const EMPTY_TEAM_COMPOSER_COMMAND_SUGGESTIONS: TeamComposerCommandSuggestion[] =
  [];
const EMPTY_TEAM_EMOJI_SHORTCODE_SUGGESTIONS: TeamEmojiShortcodeSuggestion[] =
  [];
const EMPTY_TEAM_NOTIFICATION_CANDIDATES: TeamNotificationCandidate[] = [];
const EMPTY_TEAM_PRESENCE: TeamPresence[] = [];
const EMPTY_TEAM_TYPING_INDICATORS: TeamTypingIndicator[] = [];

const QUICK_REACTIONS = ['👍', '✅', '👀'] as const;
const TEAM_COMMS_LIVE_POLL_INTERVAL_MS = 5000;
const TEAM_PRESENCE_POLL_INTERVAL_MS = 15000;
const TEAM_PRESENCE_HEARTBEAT_INTERVAL_MS = 20000;
const TEAM_TYPING_POLL_INTERVAL_MS = 2000;
const TEAM_TYPING_HEARTBEAT_INTERVAL_MS = 2500;
const TEAM_ATTACHMENT_MAX_SIZE_BYTES = 25 * 1024 * 1024;
const TEAM_MESSAGE_PAGE_SIZE = 100;
const TEAM_FOCUSED_PANELS = [
  'files',
  'inbox',
  'mentions',
  'pinned',
  'reminders',
  'saved',
  'search',
  'threads',
] as const;

type TeamFocusedPanel = (typeof TEAM_FOCUSED_PANELS)[number];

const shouldConfirmTeamBroadMention = ({
  isChannelConversation,
  messageBody,
}: {
  isChannelConversation: boolean;
  messageBody: string;
}) => isChannelConversation && hasTeamBroadMention(messageBody);

const refetchTeamDataSafely = (refetchTeamData: () => Promise<unknown>) => {
  void refetchTeamData().catch(() => {});
};

const getTeamComposerFormDraftValue = (element: HTMLElement) =>
  element.closest('form')?.querySelector('textarea')?.value;

const focusTeamComposerInput = (
  composerInputElement: HTMLTextAreaElement | null,
) => {
  if (composerInputElement === null) {
    return;
  }

  requestAnimationFrame(() => composerInputElement.focus());
};

const focusTeamSearchInput = (searchInputElement: HTMLInputElement | null) => {
  if (searchInputElement === null) {
    return;
  }

  requestAnimationFrame(() => {
    searchInputElement.focus();
    searchInputElement.select();
  });
};

const getTeamConversationSearchParams = ({
  channelId,
  directMessageThreadId,
  messageId,
  threadParentMessageId,
}: {
  channelId?: string | null;
  directMessageThreadId?: string | null;
  messageId?: string | null;
  threadParentMessageId?: string | null;
}) => {
  const nextSearchParams = new URLSearchParams();

  if (channelId) {
    nextSearchParams.set('teamChannelId', channelId);
  }

  if (directMessageThreadId) {
    nextSearchParams.set('teamDirectMessageId', directMessageThreadId);
  }

  if (threadParentMessageId) {
    nextSearchParams.set('teamThreadParentMessageId', threadParentMessageId);
  }

  if (messageId) {
    nextSearchParams.set('teamMessageId', messageId);
  }

  return nextSearchParams.toString();
};

const getTeamFocusedPanel = (
  teamPanel: string | null,
): TeamFocusedPanel | null =>
  TEAM_FOCUSED_PANELS.includes(teamPanel as TeamFocusedPanel)
    ? (teamPanel as TeamFocusedPanel)
    : null;

export const TeamPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const setNavigationDrawerActiveTab = useSetAtomState(
    navigationDrawerActiveTabState,
  );
  const sseClient = useAtomStateValue(sseClientState);
  const currentWorkspace = useAtomStateValue(currentWorkspaceState);
  const currentWorkspaceId = currentWorkspace?.id ?? null;
  const { enqueueErrorSnackBar, enqueueInfoSnackBar } = useSnackBar();
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(
    null,
  );
  const [suppressedAutoSelectedChannelId, setSuppressedAutoSelectedChannelId] =
    useState<string | null>(null);
  const [selectedDirectMessageId, setSelectedDirectMessageId] = useState<
    string | null
  >(null);
  const [selectedThreadParentMessageId, setSelectedThreadParentMessageId] =
    useState<string | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    null,
  );
  const [draftMessage, setDraftMessage] = useState('');
  const [threadDraftMessage, setThreadDraftMessage] = useState('');
  const [
    activeMainMentionSuggestionIndex,
    setActiveMainMentionSuggestionIndex,
  ] = useState(0);
  const [
    activeThreadMentionSuggestionIndex,
    setActiveThreadMentionSuggestionIndex,
  ] = useState(0);
  const [
    activeMainCommandSuggestionIndex,
    setActiveMainCommandSuggestionIndex,
  ] = useState(0);
  const [
    activeThreadCommandSuggestionIndex,
    setActiveThreadCommandSuggestionIndex,
  ] = useState(0);
  const [
    activeMainEmojiShortcodeSuggestionIndex,
    setActiveMainEmojiShortcodeSuggestionIndex,
  ] = useState(0);
  const [
    activeThreadEmojiShortcodeSuggestionIndex,
    setActiveThreadEmojiShortcodeSuggestionIndex,
  ] = useState(0);
  const [
    dismissedMainComposerSuggestionDraft,
    setDismissedMainComposerSuggestionDraft,
  ] = useState('');
  const [
    dismissedThreadComposerSuggestionDraft,
    setDismissedThreadComposerSuggestionDraft,
  ] = useState('');
  const [draftMessageInputElement, setDraftMessageInputElement] =
    useState<HTMLTextAreaElement | null>(null);
  const [threadDraftMessageInputElement, setThreadDraftMessageInputElement] =
    useState<HTMLTextAreaElement | null>(null);
  const [messageSearchInputElement, setMessageSearchInputElement] =
    useState<HTMLInputElement | null>(null);
  const [pendingAttachments, setPendingAttachments] = useState<
    TeamMessageAttachment[]
  >([]);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [pendingThreadAttachments, setPendingThreadAttachments] = useState<
    TeamMessageAttachment[]
  >([]);
  const [isSendingThreadReply, setIsSendingThreadReply] = useState(false);
  const [isMainComposerDragActive, setIsMainComposerDragActive] =
    useState(false);
  const [isThreadComposerDragActive, setIsThreadComposerDragActive] =
    useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageBody, setEditingMessageBody] = useState('');
  const [isSavingMessageEdit, setIsSavingMessageEdit] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(
    null,
  );
  const [customReactionByMessageId, setCustomReactionByMessageId] = useState<
    Record<string, string>
  >({});
  const [activeCustomReactionMessageId, setActiveCustomReactionMessageId] =
    useState<string | null>(null);
  const [
    activeCustomReactionEmojiShortcodeSuggestionIndex,
    setActiveCustomReactionEmojiShortcodeSuggestionIndex,
  ] = useState(0);
  const [reminderOptionByMessageId, setReminderOptionByMessageId] = useState<
    Record<string, string>
  >({});
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDescription, setNewChannelDescription] = useState('');
  const [newChannelIsPrivate, setNewChannelIsPrivate] = useState(false);
  const [browsePublicChannelsQuery, setBrowsePublicChannelsQuery] =
    useState('');
  const [
    selectedNewDirectMessageUserWorkspaceId,
    setSelectedNewDirectMessageUserWorkspaceId,
  ] = useState('');
  const [newDirectMessageSearchQuery, setNewDirectMessageSearchQuery] =
    useState('');
  const [channelDetailsName, setChannelDetailsName] = useState('');
  const [channelDetailsDescription, setChannelDetailsDescription] =
    useState('');
  const [channelDetailsVisibility, setChannelDetailsVisibility] =
    useState<TeamChannel['visibility']>('PUBLIC');
  const [selectedInviteUserWorkspaceId, setSelectedInviteUserWorkspaceId] =
    useState('');
  const [inviteMemberSearchQuery, setInviteMemberSearchQuery] = useState('');
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [isCreatingDirectMessage, setIsCreatingDirectMessage] = useState(false);
  const [joiningChannelId, setJoiningChannelId] = useState<string | null>(null);
  const [
    openingDirectMessageUserWorkspaceId,
    setOpeningDirectMessageUserWorkspaceId,
  ] = useState<string | null>(null);
  const [isInvitingChannelMember, setIsInvitingChannelMember] = useState(false);
  const [isUpdatingChannelDetails, setIsUpdatingChannelDetails] =
    useState(false);
  const [
    removingChannelMemberUserWorkspaceId,
    setRemovingChannelMemberUserWorkspaceId,
  ] = useState<string | null>(null);
  const [
    updatingChannelMemberRoleUserWorkspaceId,
    setUpdatingChannelMemberRoleUserWorkspaceId,
  ] = useState<string | null>(null);
  const [isLeavingChannel, setIsLeavingChannel] = useState(false);
  const [isArchivingChannel, setIsArchivingChannel] = useState(false);
  const [isMarkingInboxRead, setIsMarkingInboxRead] = useState(false);
  const [isMarkingMentionsRead, setIsMarkingMentionsRead] = useState(false);
  const [isMarkingThreadsRead, setIsMarkingThreadsRead] = useState(false);
  const [isDismissingAllReminders, setIsDismissingAllReminders] =
    useState(false);
  const [
    isUpdatingChannelNotificationLevel,
    setIsUpdatingChannelNotificationLevel,
  ] = useState(false);
  const [
    isUpdatingDirectMessageNotificationLevel,
    setIsUpdatingDirectMessageNotificationLevel,
  ] = useState(false);
  const [togglingPinnedMessageId, setTogglingPinnedMessageId] = useState<
    string | null
  >(null);
  const [togglingSavedMessageId, setTogglingSavedMessageId] = useState<
    string | null
  >(null);
  const [togglingReactionMessageId, setTogglingReactionMessageId] = useState<
    string | null
  >(null);
  const [markingUnreadMessageId, setMarkingUnreadMessageId] = useState<
    string | null
  >(null);
  const [settingReminderMessageId, setSettingReminderMessageId] = useState<
    string | null
  >(null);
  const [dismissingReminderMessageId, setDismissingReminderMessageId] =
    useState<string | null>(null);
  const [snoozingReminderMessageId, setSnoozingReminderMessageId] = useState<
    string | null
  >(null);
  const [copyingTeamResourceKey, setCopyingTeamResourceKey] = useState<
    string | null
  >(null);
  const [
    isUpdatingNotificationPreference,
    setIsUpdatingNotificationPreference,
  ] = useState(false);
  const [
    isUpdatingNotificationQuietHours,
    setIsUpdatingNotificationQuietHours,
  ] = useState(false);
  const [isUpdatingPresenceStatus, setIsUpdatingPresenceStatus] =
    useState(false);
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [statusText, setStatusText] = useState('');
  const [statusEmoji, setStatusEmoji] = useState('');
  const [notificationQuietHoursStart, setNotificationQuietHoursStart] =
    useState('');
  const [notificationQuietHoursEnd, setNotificationQuietHoursEnd] =
    useState('');
  const [starredConversationKeys, setStarredConversationKeys] = useState<
    Set<string>
  >(() => loadTeamStarredConversationKeys({ workspaceId: currentWorkspaceId }));
  const [
    loadedStarredConversationWorkspaceId,
    setLoadedStarredConversationWorkspaceId,
  ] = useState<string | null>(currentWorkspaceId);
  const [
    isTogglingSelectedConversationStar,
    setIsTogglingSelectedConversationStar,
  ] = useState(false);
  const [lastMarkedReadKey, setLastMarkedReadKey] = useState<string | null>(
    null,
  );
  const [markedUnreadMessageId, setMarkedUnreadMessageId] = useState<
    string | null
  >(null);
  const [lastTypingHeartbeatAt, setLastTypingHeartbeatAt] = useState(0);
  const [lastTypingHeartbeatKey, setLastTypingHeartbeatKey] = useState<
    string | null
  >(null);
  const [, setNotifiedTeamNotificationIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [hasInitializedTeamNotifications, setHasInitializedTeamNotifications] =
    useState(false);
  const [teamNotificationNow, setTeamNotificationNow] = useState(() =>
    Date.now(),
  );
  const [teamNotificationPermission, setTeamNotificationPermission] = useState<
    NotificationPermission | 'unsupported'
  >(() =>
    typeof window !== 'undefined' && 'Notification' in window
      ? window.Notification.permission
      : 'unsupported',
  );
  const [isRequestingTeamNotifications, setIsRequestingTeamNotifications] =
    useState(false);
  const [isLoadingEarlierMessages, setIsLoadingEarlierMessages] =
    useState(false);
  const [hasLoadedAllEarlierMessages, setHasLoadedAllEarlierMessages] =
    useState(false);
  const [isLoadingEarlierThreadMessages, setIsLoadingEarlierThreadMessages] =
    useState(false);
  const [
    hasLoadedAllEarlierThreadMessages,
    setHasLoadedAllEarlierThreadMessages,
  ] = useState(false);
  const [loadedDraftStorageKey, setLoadedDraftStorageKey] = useState<
    string | null
  >(null);
  const [loadedThreadDraftStorageKey, setLoadedThreadDraftStorageKey] =
    useState<string | null>(null);
  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const focusedTeamPanel = getTeamFocusedPanel(searchParams.get('teamPanel'));
  const isTeamPanelFocused = focusedTeamPanel !== null;
  const navigateToTeamConversation = useCallback(
    ({
      channelId,
      directMessageThreadId,
      messageId,
      replace = false,
      threadParentMessageId,
    }: {
      channelId?: string | null;
      directMessageThreadId?: string | null;
      messageId?: string | null;
      replace?: boolean;
      threadParentMessageId?: string | null;
    }) => {
      const search = getTeamConversationSearchParams({
        channelId,
        directMessageThreadId,
        messageId,
        threadParentMessageId,
      });

      navigate(
        {
          pathname: '/team',
          search: search.length > 0 ? `?${search}` : '',
        },
        { replace },
      );
    },
    [navigate],
  );

  useEffect(() => {
    const handleTeamSearchShortcut = (event: KeyboardEvent) => {
      if (
        !shouldFocusTeamMessageSearch({
          ctrlKey: event.ctrlKey,
          isComposing: event.isComposing,
          key: event.key,
          metaKey: event.metaKey,
          shiftKey: event.shiftKey,
        })
      ) {
        return;
      }

      event.preventDefault();
      navigate(
        {
          pathname: '/team',
          search: '?teamPanel=search',
        },
        { replace: false },
      );
      focusTeamSearchInput(messageSearchInputElement);
    };

    window.addEventListener('keydown', handleTeamSearchShortcut);

    return () =>
      window.removeEventListener('keydown', handleTeamSearchShortcut);
  }, [messageSearchInputElement, navigate]);

  const {
    data: channelsData,
    error: channelsError,
    refetch: refetchChannels,
  } = useQuery<GetTeamChannelsQuery>(GET_TEAM_CHANNELS, {
    fetchPolicy: 'cache-and-network',
    pollInterval: TEAM_COMMS_LIVE_POLL_INTERVAL_MS,
  });

  const apiChannels = channelsData?.teamChannels ?? EMPTY_TEAM_CHANNELS;
  const isUsingApiChannels = !channelsError;
  const {
    data: directMessagesData,
    error: directMessagesError,
    refetch: refetchDirectMessages,
  } = useQuery<GetTeamDirectMessagesQuery>(GET_TEAM_DIRECT_MESSAGES, {
    fetchPolicy: 'cache-and-network',
    pollInterval: TEAM_COMMS_LIVE_POLL_INTERVAL_MS,
  });
  const apiDirectMessages =
    directMessagesData?.teamDirectMessages ?? EMPTY_TEAM_DIRECT_MESSAGES;
  const isUsingApiDirectMessages = !directMessagesError;
  const channels: TeamChannel[] = isUsingApiChannels
    ? apiChannels
    : EMPTY_TEAM_CHANNELS;
  const directMessages = isUsingApiDirectMessages
    ? apiDirectMessages
    : EMPTY_TEAM_DIRECT_MESSAGES;
  const sortedChannels = useMemo(
    () =>
      sortTeamConversationsByStarred({
        conversations: channels,
        getConversationKey: (channel) =>
          getTeamStarredConversationKey({
            conversationId: channel.id,
            conversationType: 'channel',
          }),
        starredConversationKeys,
      }),
    [channels, starredConversationKeys],
  );
  const sortedJoinedChannels = useMemo(
    () => sortedChannels.filter((channel) => channel.isMember !== false),
    [sortedChannels],
  );
  const selectableJoinedChannels = useMemo(
    () =>
      suppressedAutoSelectedChannelId === null
        ? sortedJoinedChannels
        : sortedJoinedChannels.filter(
            (channel) => channel.id !== suppressedAutoSelectedChannelId,
          ),
    [sortedJoinedChannels, suppressedAutoSelectedChannelId],
  );
  const sortedDiscoverablePublicChannels = useMemo(
    () =>
      sortedChannels.filter(
        (channel) =>
          channel.isMember === false &&
          (channel.visibility === 'PUBLIC' || channel.visibility === 'public'),
      ),
    [sortedChannels],
  );
  const normalizedBrowsePublicChannelsQuery = browsePublicChannelsQuery
    .trim()
    .toLowerCase();
  const visibleDiscoverablePublicChannels = useMemo(
    () =>
      normalizedBrowsePublicChannelsQuery.length === 0
        ? sortedDiscoverablePublicChannels
        : sortedDiscoverablePublicChannels.filter((channel) =>
            [channel.name, channel.description ?? '']
              .map((value) => value.toLowerCase())
              .some((value) =>
                value.includes(normalizedBrowsePublicChannelsQuery),
              ),
          ),
    [normalizedBrowsePublicChannelsQuery, sortedDiscoverablePublicChannels],
  );
  const sortedDirectMessages = useMemo(
    () =>
      sortTeamConversationsByStarred({
        conversations: directMessages,
        getConversationKey: (directMessage) =>
          getTeamStarredConversationKey({
            conversationId: directMessage.id,
            conversationType: 'direct-message',
          }),
        starredConversationKeys,
      }),
    [directMessages, starredConversationKeys],
  );
  const normalizedMessageSearchQuery = messageSearchQuery.trim();
  const normalizedNewDirectMessageSearchQuery =
    newDirectMessageSearchQuery.trim();
  const normalizedInviteMemberSearchQuery = inviteMemberSearchQuery.trim();
  const { data: teamMembersData } = useQuery<GetTeamMembersQuery>(
    GET_TEAM_MEMBERS,
    {
      skip:
        !isUsingApiDirectMessages ||
        normalizedNewDirectMessageSearchQuery.length < 2,
      variables: { query: normalizedNewDirectMessageSearchQuery },
    },
  );
  const searchedTeamMembers =
    teamMembersData?.teamMembers ?? EMPTY_TEAM_MEMBERS;
  const { data: inviteTeamMembersData } = useQuery<GetTeamMembersQuery>(
    GET_TEAM_MEMBERS,
    {
      skip: !isUsingApiChannels || normalizedInviteMemberSearchQuery.length < 2,
      variables: { query: normalizedInviteMemberSearchQuery },
    },
  );
  const searchedInviteTeamMembers =
    inviteTeamMembersData?.teamMembers ?? EMPTY_TEAM_MEMBERS;
  const { data: messageSearchData, loading: isMessageSearchLoading } =
    useQuery<SearchTeamMessagesQuery>(SEARCH_TEAM_MESSAGES, {
      skip:
        (!isUsingApiChannels && !isUsingApiDirectMessages) ||
        normalizedMessageSearchQuery.length < 2,
      variables: { query: normalizedMessageSearchQuery },
    });
  const messageSearchResults =
    messageSearchData?.teamMessageSearch ?? EMPTY_TEAM_MESSAGE_SEARCH_RESULTS;
  const { data: mentionsData, refetch: refetchMentions } =
    useQuery<GetTeamMentionsQuery>(GET_TEAM_MENTIONS, {
      fetchPolicy: 'cache-and-network',
      pollInterval: TEAM_COMMS_LIVE_POLL_INTERVAL_MS,
      skip: !isUsingApiChannels && !isUsingApiDirectMessages,
    });
  const mentions = mentionsData?.teamMentions ?? EMPTY_TEAM_MENTIONS;
  const { data: inboxData, refetch: refetchInbox } =
    useQuery<GetTeamInboxQuery>(GET_TEAM_INBOX, {
      fetchPolicy: 'cache-and-network',
      pollInterval: TEAM_COMMS_LIVE_POLL_INTERVAL_MS,
      skip: !isUsingApiChannels && !isUsingApiDirectMessages,
    });
  const inboxItems = useMemo(
    () => inboxData?.teamInbox ?? EMPTY_TEAM_INBOX_ITEMS,
    [inboxData?.teamInbox],
  );
  const threadInboxItems = useMemo(
    () =>
      inboxItems.filter(
        (inboxItem) => inboxItem.type.toLowerCase() === 'thread',
      ),
    [inboxItems],
  );
  const { data: savedMessagesData, refetch: refetchSavedMessages } =
    useQuery<GetTeamSavedMessagesQuery>(GET_TEAM_SAVED_MESSAGES, {
      fetchPolicy: 'cache-and-network',
      pollInterval: TEAM_COMMS_LIVE_POLL_INTERVAL_MS,
      skip: !isUsingApiChannels && !isUsingApiDirectMessages,
    });
  const savedMessages =
    savedMessagesData?.teamSavedMessages ?? EMPTY_TEAM_MESSAGES;
  const { data: filesData, refetch: refetchFiles } =
    useQuery<GetTeamFilesQuery>(GET_TEAM_FILES, {
      fetchPolicy: 'cache-and-network',
      pollInterval: TEAM_COMMS_LIVE_POLL_INTERVAL_MS,
      skip: !isUsingApiChannels && !isUsingApiDirectMessages,
    });
  const files = filesData?.teamFiles ?? EMPTY_TEAM_FILES;
  const { data: remindersData, refetch: refetchMessageReminders } =
    useQuery<GetTeamMessageRemindersQuery>(GET_TEAM_MESSAGE_REMINDERS, {
      fetchPolicy: 'cache-and-network',
      pollInterval: TEAM_COMMS_LIVE_POLL_INTERVAL_MS,
      skip: !isUsingApiChannels && !isUsingApiDirectMessages,
    });
  const reminders = useMemo(
    () => remindersData?.teamMessageReminders ?? EMPTY_TEAM_MESSAGE_REMINDERS,
    [remindersData?.teamMessageReminders],
  );
  const { data: presenceData } = useQuery<GetTeamPresenceQuery>(
    GET_TEAM_PRESENCE,
    {
      fetchPolicy: 'cache-and-network',
      pollInterval: TEAM_PRESENCE_POLL_INTERVAL_MS,
      skip: !isUsingApiChannels && !isUsingApiDirectMessages,
    },
  );
  const presence = useMemo(
    () => presenceData?.teamPresence ?? EMPTY_TEAM_PRESENCE,
    [presenceData?.teamPresence],
  );
  const presenceByUserWorkspaceId = useMemo(
    () =>
      new Map(
        presence.map((presenceItem) => [
          presenceItem.userWorkspaceId,
          presenceItem,
        ]),
      ),
    [presence],
  );
  const directMessageByParticipantUserWorkspaceId = useMemo(
    () =>
      new Map(
        directMessages.map((directMessage) => [
          directMessage.participantUserWorkspaceId,
          directMessage,
        ]),
      ),
    [directMessages],
  );
  const selectedChannel = channels.find(
    (channel) => channel.id === selectedChannelId,
  );
  const selectedDirectMessage = directMessages.find(
    (directMessage) => directMessage.id === selectedDirectMessageId,
  );
  const isDirectMessageSelected = selectedDirectMessage !== undefined;
  const effectiveSelectedChannelId = isTeamPanelFocused
    ? undefined
    : (selectedChannel?.id ?? selectableJoinedChannels[0]?.id);
  const effectiveSelectedDirectMessageId = selectedDirectMessage?.id;
  const liveMessageEventSubscriptionTargets = useMemo<
    TeamMessageEventSubscriptionTarget[]
  >(() => {
    if (isDirectMessageSelected && effectiveSelectedDirectMessageId) {
      return [{ directMessageThreadId: effectiveSelectedDirectMessageId }];
    }

    if (!isDirectMessageSelected && effectiveSelectedChannelId) {
      return [{ channelId: effectiveSelectedChannelId }];
    }

    return [];
  }, [
    effectiveSelectedChannelId,
    effectiveSelectedDirectMessageId,
    isDirectMessageSelected,
  ]);
  const selectedConversationStarKey =
    isDirectMessageSelected && effectiveSelectedDirectMessageId
      ? getTeamStarredConversationKey({
          conversationId: effectiveSelectedDirectMessageId,
          conversationType: 'direct-message',
        })
      : !isDirectMessageSelected && effectiveSelectedChannelId
        ? getTeamStarredConversationKey({
            conversationId: effectiveSelectedChannelId,
            conversationType: 'channel',
          })
        : null;
  const isSelectedConversationStarred =
    selectedConversationStarKey !== null &&
    starredConversationKeys.has(selectedConversationStarKey);
  const draftStorageKey = getTeamDraftStorageKey({
    conversationId: isDirectMessageSelected
      ? effectiveSelectedDirectMessageId
      : effectiveSelectedChannelId,
    conversationType: isDirectMessageSelected ? 'direct-message' : 'channel',
  });
  const threadDraftStorageKey = selectedThreadParentMessageId
    ? getTeamDraftStorageKey({
        conversationId: isDirectMessageSelected
          ? effectiveSelectedDirectMessageId
          : effectiveSelectedChannelId,
        conversationType: isDirectMessageSelected
          ? 'direct-message-thread'
          : 'channel-thread',
        parentMessageId: selectedThreadParentMessageId,
      })
    : null;
  const typingIndicatorVariables = {
    channelId: isDirectMessageSelected ? null : effectiveSelectedChannelId,
    directMessageThreadId: isDirectMessageSelected
      ? effectiveSelectedDirectMessageId
      : null,
    parentMessageId: null,
  };
  const threadTypingIndicatorVariables = {
    channelId: isDirectMessageSelected ? null : effectiveSelectedChannelId,
    directMessageThreadId: isDirectMessageSelected
      ? effectiveSelectedDirectMessageId
      : null,
    parentMessageId: selectedThreadParentMessageId,
  };
  const shouldQueryGlobalPinnedMessages = focusedTeamPanel === 'pinned';
  const pinnedMessageVariables = shouldQueryGlobalPinnedMessages
    ? {
        channelId: null,
        directMessageThreadId: null,
      }
    : {
        channelId: isDirectMessageSelected ? null : effectiveSelectedChannelId,
        directMessageThreadId: isDirectMessageSelected
          ? effectiveSelectedDirectMessageId
          : null,
      };
  const { data: typingIndicatorsData, refetch: refetchTypingIndicators } =
    useQuery<GetTeamTypingIndicatorsQuery>(GET_TEAM_TYPING_INDICATORS, {
      fetchPolicy: 'cache-and-network',
      pollInterval: TEAM_TYPING_POLL_INTERVAL_MS,
      skip:
        (!isUsingApiChannels && !isUsingApiDirectMessages) ||
        (isDirectMessageSelected
          ? !effectiveSelectedDirectMessageId
          : !effectiveSelectedChannelId),
      variables: typingIndicatorVariables,
    });
  const mainTypingIndicators =
    typingIndicatorsData?.teamTypingIndicators.filter(
      (indicator) => new Date(indicator.expiresAt).getTime() > Date.now(),
    ) ?? EMPTY_TEAM_TYPING_INDICATORS;
  const {
    data: threadTypingIndicatorsData,
    refetch: refetchThreadTypingIndicators,
  } = useQuery<GetTeamTypingIndicatorsQuery>(GET_TEAM_TYPING_INDICATORS, {
    fetchPolicy: 'cache-and-network',
    pollInterval: TEAM_TYPING_POLL_INTERVAL_MS,
    skip:
      (!isUsingApiChannels && !isUsingApiDirectMessages) ||
      !selectedThreadParentMessageId ||
      (isDirectMessageSelected
        ? !effectiveSelectedDirectMessageId
        : !effectiveSelectedChannelId),
    variables: threadTypingIndicatorVariables,
  });
  const threadTypingIndicators =
    threadTypingIndicatorsData?.teamTypingIndicators.filter(
      (indicator) => new Date(indicator.expiresAt).getTime() > Date.now(),
    ) ?? EMPTY_TEAM_TYPING_INDICATORS;

  const {
    data: channelMessagesData,
    fetchMore: fetchMoreChannelMessages,
    refetch: refetchChannelMessages,
  } = useQuery<GetTeamMessagesQuery>(GET_TEAM_MESSAGES, {
    skip:
      isDirectMessageSelected ||
      !isUsingApiChannels ||
      !effectiveSelectedChannelId,
    pollInterval: sseClient ? undefined : TEAM_COMMS_LIVE_POLL_INTERVAL_MS,
    variables: { before: null, channelId: effectiveSelectedChannelId },
  });
  const { data: channelMembersData } = useQuery<GetTeamChannelMembersQuery>(
    GET_TEAM_CHANNEL_MEMBERS,
    {
      skip:
        isDirectMessageSelected ||
        !isUsingApiChannels ||
        !effectiveSelectedChannelId,
      pollInterval: TEAM_COMMS_LIVE_POLL_INTERVAL_MS,
      variables: { channelId: effectiveSelectedChannelId },
    },
  );
  const {
    data: directMessageMessagesData,
    fetchMore: fetchMoreDirectMessageMessages,
    refetch: refetchDirectMessageMessages,
  } = useQuery<GetTeamDirectMessageMessagesQuery>(
    GET_TEAM_DIRECT_MESSAGE_MESSAGES,
    {
      skip:
        !isDirectMessageSelected ||
        !isUsingApiDirectMessages ||
        !effectiveSelectedDirectMessageId,
      pollInterval: sseClient ? undefined : TEAM_COMMS_LIVE_POLL_INTERVAL_MS,
      variables: {
        before: null,
        directMessageThreadId: effectiveSelectedDirectMessageId,
      },
    },
  );
  const { data: pinnedMessagesData, refetch: refetchPinnedMessages } =
    useQuery<GetTeamPinnedMessagesQuery>(GET_TEAM_PINNED_MESSAGES, {
      fetchPolicy: 'cache-and-network',
      pollInterval: TEAM_COMMS_LIVE_POLL_INTERVAL_MS,
      skip:
        (!isUsingApiChannels && !isUsingApiDirectMessages) ||
        (!shouldQueryGlobalPinnedMessages &&
          (isDirectMessageSelected
            ? !effectiveSelectedDirectMessageId
            : !effectiveSelectedChannelId)),
      variables: pinnedMessageVariables,
    });
  const {
    data: threadMessagesData,
    fetchMore: fetchMoreThreadMessages,
    refetch: refetchThreadMessages,
  } = useQuery<GetTeamMessageThreadQuery>(GET_TEAM_MESSAGE_THREAD, {
    skip:
      (!isUsingApiChannels && !isUsingApiDirectMessages) ||
      !selectedThreadParentMessageId,
    pollInterval: sseClient ? undefined : TEAM_COMMS_LIVE_POLL_INTERVAL_MS,
    variables: {
      before: null,
      parentMessageId: selectedThreadParentMessageId,
    },
  });

  const messages = useMemo<TeamMessage[]>(() => {
    if (
      isDirectMessageSelected &&
      isUsingApiDirectMessages &&
      directMessageMessagesData?.teamDirectMessageMessages
    ) {
      return directMessageMessagesData.teamDirectMessageMessages;
    }

    if (isUsingApiChannels && channelMessagesData?.teamMessages) {
      return channelMessagesData.teamMessages;
    }

    return EMPTY_TEAM_MESSAGES;
  }, [
    channelMessagesData?.teamMessages,
    directMessageMessagesData?.teamDirectMessageMessages,
    isDirectMessageSelected,
    isUsingApiChannels,
    isUsingApiDirectMessages,
  ]);

  const effectiveSelectedChannel = isTeamPanelFocused
    ? undefined
    : (selectedChannel ?? selectableJoinedChannels[0]);
  const channelMembers = useMemo(
    () => channelMembersData?.teamChannelMembers ?? EMPTY_TEAM_CHANNEL_MEMBERS,
    [channelMembersData?.teamChannelMembers],
  );
  const sortedChannelMembers = useMemo(
    () => sortTeamChannelMembers(channelMembers),
    [channelMembers],
  );
  const currentUserPresence = presence.find(
    (presenceItem) => presenceItem.isCurrentUser,
  );
  const currentUserWorkspaceId = currentUserPresence?.userWorkspaceId;
  const onlineTeammates = useMemo(
    () =>
      getTeamOnlineTeammates({
        currentUserWorkspaceId,
        presence,
      }),
    [currentUserWorkspaceId, presence],
  );
  const currentTeamNotificationPreference =
    (currentUserPresence?.notificationPreference?.toUpperCase() ??
      'ALL') as TeamNotificationPreference;
  const currentTeamNotificationQuietHours = useMemo<TeamNotificationQuietHours>(
    () => ({
      end: currentUserPresence?.notificationQuietHoursEnd ?? null,
      start: currentUserPresence?.notificationQuietHoursStart ?? null,
    }),
    [
      currentUserPresence?.notificationQuietHoursEnd,
      currentUserPresence?.notificationQuietHoursStart,
    ],
  );
  const teamUnreadBadgeCount = useMemo(
    () =>
      !isUsingApiChannels && !isUsingApiDirectMessages
        ? 0
        : getTeamUnreadBadgeCount({
            inboxItems,
            now: teamNotificationNow,
            preference: currentTeamNotificationPreference,
            reminders,
          }),
    [
      currentTeamNotificationPreference,
      inboxItems,
      isUsingApiChannels,
      isUsingApiDirectMessages,
      reminders,
      teamNotificationNow,
    ],
  );
  const teamNotificationCandidates = useMemo(
    () =>
      !isUsingApiChannels && !isUsingApiDirectMessages
        ? EMPTY_TEAM_NOTIFICATION_CANDIDATES
        : getDueTeamNotificationCandidates({
            inboxItems,
            now: teamNotificationNow,
            preference: currentTeamNotificationPreference,
            quietHours: currentTeamNotificationQuietHours,
            reminders,
          }),
    [
      currentTeamNotificationQuietHours,
      currentTeamNotificationPreference,
      inboxItems,
      isUsingApiChannels,
      isUsingApiDirectMessages,
      reminders,
      teamNotificationNow,
    ],
  );
  const teamNotificationButtonLabel =
    teamNotificationPermission === 'granted'
      ? t`Notifications on`
      : teamNotificationPermission === 'denied'
        ? t`Notifications blocked`
        : teamNotificationPermission === 'unsupported'
          ? t`Notifications unavailable`
          : t`Enable notifications`;
  const channelMemberUserWorkspaceIds = useMemo(
    () => new Set(channelMembers.map((member) => member.userWorkspaceId)),
    [channelMembers],
  );
  const inviteCandidates = useMemo(
    () =>
      getTeamInviteCandidates({
        channelMemberUserWorkspaceIds,
        presence,
        searchQuery: normalizedInviteMemberSearchQuery,
        searchedTeamMembers: searchedInviteTeamMembers,
      }),
    [
      channelMemberUserWorkspaceIds,
      normalizedInviteMemberSearchQuery,
      presence,
      searchedInviteTeamMembers,
    ],
  );
  const directMessageCandidates = useMemo(() => {
    if (normalizedNewDirectMessageSearchQuery.length >= 2) {
      return searchedTeamMembers;
    }

    return presence.filter(
      (presenceItem) => presenceItem.userWorkspaceId !== currentUserWorkspaceId,
    );
  }, [
    currentUserWorkspaceId,
    normalizedNewDirectMessageSearchQuery.length,
    presence,
    searchedTeamMembers,
  ]);
  const currentUserChannelMember = channelMembers.find(
    (member) => member.isCurrentUser,
  );
  const canManageSelectedChannel =
    !isDirectMessageSelected &&
    (currentUserChannelMember?.role === 'OWNER' ||
      currentUserChannelMember?.role === 'owner');

  useEffect(() => {
    if (effectiveSelectedChannel === undefined || isDirectMessageSelected) {
      return;
    }

    setChannelDetailsName(effectiveSelectedChannel.name);
    setChannelDetailsDescription(effectiveSelectedChannel.description ?? '');
    setChannelDetailsVisibility(
      effectiveSelectedChannel.visibility ?? 'PUBLIC',
    );
  }, [effectiveSelectedChannel, isDirectMessageSelected]);

  useEffect(() => {
    setMarkedUnreadMessageId(null);
    setIsLoadingEarlierMessages(false);
    setHasLoadedAllEarlierMessages(false);
  }, [effectiveSelectedChannelId, effectiveSelectedDirectMessageId]);

  useEffect(() => {
    setIsLoadingEarlierThreadMessages(false);
    setHasLoadedAllEarlierThreadMessages(false);
  }, [
    effectiveSelectedChannelId,
    effectiveSelectedDirectMessageId,
    selectedThreadParentMessageId,
  ]);

  const threadMessages = useMemo(
    () => threadMessagesData?.teamMessageThread ?? EMPTY_TEAM_MESSAGES,
    [threadMessagesData?.teamMessageThread],
  );
  const selectedThreadParentMessage = messages.find(
    (message) => message.id === selectedThreadParentMessageId,
  );
  const visibleThreadMessages = useMemo(
    () =>
      threadMessages.length > 0
        ? threadMessages
        : selectedThreadParentMessage
          ? [selectedThreadParentMessage]
          : [],
    [selectedThreadParentMessage, threadMessages],
  );
  const firstVisibleThreadReply = visibleThreadMessages.find(
    (message) => message.parentMessageId !== null,
  );
  const mainUnreadDividerMessageId = useMemo(
    () =>
      getTeamUnreadDividerMessageId({
        markedUnreadMessageId,
        messages,
      }),
    [markedUnreadMessageId, messages],
  );
  const threadUnreadDividerMessageId = useMemo(
    () =>
      getTeamUnreadDividerMessageId({
        markedUnreadMessageId,
        messages: visibleThreadMessages,
      }),
    [markedUnreadMessageId, visibleThreadMessages],
  );
  const mainHighlightedMessageId = useMemo(
    () =>
      getTeamHighlightedMessageId({
        messages,
        requestedMessageId: selectedMessageId,
      }),
    [messages, selectedMessageId],
  );
  const threadHighlightedMessageId = useMemo(
    () =>
      getTeamHighlightedMessageId({
        messages: visibleThreadMessages,
        requestedMessageId: selectedMessageId,
      }),
    [selectedMessageId, visibleThreadMessages],
  );
  const messageScrollTarget = useMemo(
    () =>
      getTeamMessageScrollTarget({
        mainHighlightedMessageId,
        threadHighlightedMessageId,
      }),
    [mainHighlightedMessageId, threadHighlightedMessageId],
  );
  const latestMainMessageId = messages[messages.length - 1]?.id ?? null;
  const latestThreadMessageId =
    visibleThreadMessages[visibleThreadMessages.length - 1]?.id ?? null;
  const pinnedMessages = useMemo(
    () =>
      pinnedMessagesData?.teamPinnedMessages ??
      messages
        .filter(
          (message) => message.isPinned && message.parentMessageId === null,
        )
        .sort(
          (firstMessage, secondMessage) =>
            new Date(
              secondMessage.pinnedAt ?? secondMessage.updatedAt ?? 0,
            ).getTime() -
            new Date(
              firstMessage.pinnedAt ?? firstMessage.updatedAt ?? 0,
            ).getTime(),
        ),
    [messages, pinnedMessagesData?.teamPinnedMessages],
  );
  const effectiveConversationName = isDirectMessageSelected
    ? selectedDirectMessage?.participantName
    : effectiveSelectedChannel?.name;
  const hasSelectedConversation =
    !isTeamPanelFocused &&
    (isDirectMessageSelected || effectiveSelectedChannel !== undefined);
  const isSelectedChannelMember =
    isDirectMessageSelected ||
    (effectiveSelectedChannel !== undefined &&
      effectiveSelectedChannel.isMember !== false);
  const selectedConversationNotificationLevel = isDirectMessageSelected
    ? selectedDirectMessage?.notificationLevel
    : currentUserChannelMember?.notificationLevel;
  const isUpdatingSelectedConversationNotificationLevel =
    isDirectMessageSelected
      ? isUpdatingDirectMessageNotificationLevel
      : isUpdatingChannelNotificationLevel;
  const canToggleSelectedConversationMute =
    hasSelectedConversation &&
    (isDirectMessageSelected
      ? selectedDirectMessage !== undefined
      : currentUserChannelMember !== undefined);
  const isSelectedConversationMuted = isTeamConversationMuted(
    selectedConversationNotificationLevel,
  );
  const isComposerEnabled = isDirectMessageSelected
    ? isUsingApiDirectMessages
    : isUsingApiChannels && isSelectedChannelMember;
  const mainMentionQuery = getActiveTeamMentionQuery(draftMessage);
  const threadMentionQuery = getActiveTeamMentionQuery(threadDraftMessage);
  const { data: mainMentionTeamMembersData } = useQuery<GetTeamMembersQuery>(
    GET_TEAM_MEMBERS,
    {
      skip:
        !isComposerEnabled ||
        mainMentionQuery === null ||
        mainMentionQuery.trim().length < 2,
      variables: { query: mainMentionQuery ?? '' },
    },
  );
  const { data: threadMentionTeamMembersData } = useQuery<GetTeamMembersQuery>(
    GET_TEAM_MEMBERS,
    {
      skip:
        !isComposerEnabled ||
        threadMentionQuery === null ||
        threadMentionQuery.trim().length < 2,
      variables: { query: threadMentionQuery ?? '' },
    },
  );
  const mainMentionCandidates = useMemo(
    () =>
      mainMentionQuery === null
        ? EMPTY_TEAM_MEMBERS
        : getTeamMentionCandidates({
            includeBroadMentions: !isDirectMessageSelected,
            presence,
            searchQuery: mainMentionQuery,
            searchedTeamMembers:
              mainMentionTeamMembersData?.teamMembers ?? EMPTY_TEAM_MEMBERS,
          }),
    [
      isDirectMessageSelected,
      mainMentionQuery,
      mainMentionTeamMembersData?.teamMembers,
      presence,
    ],
  );
  const threadMentionCandidates = useMemo(
    () =>
      threadMentionQuery === null
        ? EMPTY_TEAM_MEMBERS
        : getTeamMentionCandidates({
            includeBroadMentions: !isDirectMessageSelected,
            presence,
            searchQuery: threadMentionQuery,
            searchedTeamMembers:
              threadMentionTeamMembersData?.teamMembers ?? EMPTY_TEAM_MEMBERS,
          }),
    [
      isDirectMessageSelected,
      presence,
      threadMentionQuery,
      threadMentionTeamMembersData?.teamMembers,
    ],
  );
  const mainCommandSuggestions = useMemo(
    () => getTeamComposerCommandSuggestions(draftMessage),
    [draftMessage],
  );
  const threadCommandSuggestions = useMemo(
    () => getTeamComposerCommandSuggestions(threadDraftMessage),
    [threadDraftMessage],
  );
  const mainEmojiShortcodeSuggestions = useMemo(
    () => getTeamEmojiShortcodeSuggestions(draftMessage),
    [draftMessage],
  );
  const threadEmojiShortcodeSuggestions = useMemo(
    () => getTeamEmojiShortcodeSuggestions(threadDraftMessage),
    [threadDraftMessage],
  );
  const isMainComposerSuggestionDismissed =
    dismissedMainComposerSuggestionDraft === draftMessage;
  const isThreadComposerSuggestionDismissed =
    dismissedThreadComposerSuggestionDraft === threadDraftMessage;
  const visibleMainMentionCandidates = isMainComposerSuggestionDismissed
    ? EMPTY_TEAM_MEMBERS
    : mainMentionCandidates;
  const visibleThreadMentionCandidates = isThreadComposerSuggestionDismissed
    ? EMPTY_TEAM_MEMBERS
    : threadMentionCandidates;
  const visibleMainCommandSuggestions = isMainComposerSuggestionDismissed
    ? EMPTY_TEAM_COMPOSER_COMMAND_SUGGESTIONS
    : mainCommandSuggestions;
  const visibleThreadCommandSuggestions = isThreadComposerSuggestionDismissed
    ? EMPTY_TEAM_COMPOSER_COMMAND_SUGGESTIONS
    : threadCommandSuggestions;
  const visibleMainEmojiShortcodeSuggestions = isMainComposerSuggestionDismissed
    ? EMPTY_TEAM_EMOJI_SHORTCODE_SUGGESTIONS
    : mainEmojiShortcodeSuggestions;
  const visibleThreadEmojiShortcodeSuggestions =
    isThreadComposerSuggestionDismissed
      ? EMPTY_TEAM_EMOJI_SHORTCODE_SUGGESTIONS
      : threadEmojiShortcodeSuggestions;
  const customReactionDraft =
    activeCustomReactionMessageId === null
      ? ''
      : (customReactionByMessageId[activeCustomReactionMessageId] ?? '');
  const customReactionEmojiShortcodeSuggestions =
    getTeamEmojiShortcodeSuggestions(customReactionDraft);

  useEffect(() => {
    setActiveMainMentionSuggestionIndex((currentIndex) =>
      visibleMainMentionCandidates.length === 0
        ? 0
        : Math.min(currentIndex, visibleMainMentionCandidates.length - 1),
    );
  }, [visibleMainMentionCandidates.length]);

  useEffect(() => {
    setActiveThreadMentionSuggestionIndex((currentIndex) =>
      visibleThreadMentionCandidates.length === 0
        ? 0
        : Math.min(currentIndex, visibleThreadMentionCandidates.length - 1),
    );
  }, [visibleThreadMentionCandidates.length]);

  useEffect(() => {
    setActiveMainCommandSuggestionIndex((currentIndex) =>
      visibleMainCommandSuggestions.length === 0
        ? 0
        : Math.min(currentIndex, visibleMainCommandSuggestions.length - 1),
    );
  }, [visibleMainCommandSuggestions.length]);

  useEffect(() => {
    setActiveThreadCommandSuggestionIndex((currentIndex) =>
      visibleThreadCommandSuggestions.length === 0
        ? 0
        : Math.min(currentIndex, visibleThreadCommandSuggestions.length - 1),
    );
  }, [visibleThreadCommandSuggestions.length]);

  useEffect(() => {
    setActiveMainEmojiShortcodeSuggestionIndex((currentIndex) =>
      visibleMainEmojiShortcodeSuggestions.length === 0
        ? 0
        : Math.min(
            currentIndex,
            visibleMainEmojiShortcodeSuggestions.length - 1,
          ),
    );
  }, [visibleMainEmojiShortcodeSuggestions.length]);

  useEffect(() => {
    setActiveThreadEmojiShortcodeSuggestionIndex((currentIndex) =>
      visibleThreadEmojiShortcodeSuggestions.length === 0
        ? 0
        : Math.min(
            currentIndex,
            visibleThreadEmojiShortcodeSuggestions.length - 1,
          ),
    );
  }, [visibleThreadEmojiShortcodeSuggestions.length]);

  useEffect(() => {
    setActiveCustomReactionEmojiShortcodeSuggestionIndex((currentIndex) =>
      customReactionEmojiShortcodeSuggestions.length === 0
        ? 0
        : Math.min(
            currentIndex,
            customReactionEmojiShortcodeSuggestions.length - 1,
          ),
    );
  }, [customReactionEmojiShortcodeSuggestions.length]);

  const canLoadEarlierMessages =
    isComposerEnabled &&
    !hasLoadedAllEarlierMessages &&
    messages.length >= TEAM_MESSAGE_PAGE_SIZE &&
    typeof messages[0]?.createdAt === 'string' &&
    messages[0].createdAt.length > 0;
  const canLoadEarlierThreadMessages =
    isComposerEnabled &&
    selectedThreadParentMessageId !== null &&
    !hasLoadedAllEarlierThreadMessages &&
    visibleThreadMessages.filter((message) => message.parentMessageId !== null)
      .length >= TEAM_MESSAGE_PAGE_SIZE &&
    typeof firstVisibleThreadReply?.createdAt === 'string' &&
    firstVisibleThreadReply.createdAt.length > 0;

  const [uploadTeamMessageAttachment] =
    useMutation<UploadTeamMessageAttachmentMutation>(
      UPLOAD_TEAM_MESSAGE_ATTACHMENT,
      {},
    );
  const [sendTeamMessage] =
    useMutation<SendTeamMessageMutation>(SEND_TEAM_MESSAGE);
  const [sendTeamDirectMessage] = useMutation<SendTeamDirectMessageMutation>(
    SEND_TEAM_DIRECT_MESSAGE,
  );
  const [createTeamDirectMessage] =
    useMutation<CreateTeamDirectMessageMutation>(CREATE_TEAM_DIRECT_MESSAGE, {
      refetchQueries: [{ query: GET_TEAM_DIRECT_MESSAGES }],
    });
  const [markTeamChannelRead] = useMutation<MarkTeamChannelReadMutation>(
    MARK_TEAM_CHANNEL_READ,
    {
      refetchQueries: [
        { query: GET_TEAM_CHANNELS },
        { query: GET_TEAM_INBOX },
        { query: GET_TEAM_MENTIONS },
      ],
    },
  );
  const [markTeamDirectMessageRead] =
    useMutation<MarkTeamDirectMessageReadMutation>(
      MARK_TEAM_DIRECT_MESSAGE_READ,
      {
        refetchQueries: [
          { query: GET_TEAM_DIRECT_MESSAGES },
          { query: GET_TEAM_INBOX },
          { query: GET_TEAM_MENTIONS },
        ],
      },
    );
  const [markTeamMessageThreadRead] =
    useMutation<MarkTeamMessageThreadReadMutation>(
      MARK_TEAM_MESSAGE_THREAD_READ,
      {
        refetchQueries: [
          { query: GET_TEAM_INBOX },
          { query: GET_TEAM_MENTIONS },
        ],
      },
    );
  const [markTeamInboxRead] = useMutation<MarkTeamInboxReadMutation>(
    MARK_TEAM_INBOX_READ,
    {
      refetchQueries: [
        { query: GET_TEAM_CHANNELS },
        { query: GET_TEAM_DIRECT_MESSAGES },
        { query: GET_TEAM_INBOX },
        { query: GET_TEAM_MENTIONS },
      ],
    },
  );
  const [markTeamMessageUnread] = useMutation<MarkTeamMessageUnreadMutation>(
    MARK_TEAM_MESSAGE_UNREAD,
    {
      refetchQueries: [
        { query: GET_TEAM_CHANNELS },
        { query: GET_TEAM_DIRECT_MESSAGES },
        { query: GET_TEAM_INBOX },
        { query: GET_TEAM_MENTIONS },
      ],
    },
  );
  const [markTeamMentionRead] = useMutation<MarkTeamMentionReadMutation>(
    MARK_TEAM_MENTION_READ,
    {
      refetchQueries: [{ query: GET_TEAM_INBOX }, { query: GET_TEAM_MENTIONS }],
    },
  );
  const [heartbeatTeamPresence] = useMutation<HeartbeatTeamPresenceMutation>(
    HEARTBEAT_TEAM_PRESENCE,
    {
      refetchQueries: [{ query: GET_TEAM_PRESENCE }],
    },
  );
  const [updateTeamPresenceStatus] =
    useMutation<UpdateTeamPresenceStatusMutation>(UPDATE_TEAM_PRESENCE_STATUS, {
      refetchQueries: [{ query: GET_TEAM_PRESENCE }],
    });
  const [heartbeatTeamTyping] = useMutation<HeartbeatTeamTypingMutation>(
    HEARTBEAT_TEAM_TYPING,
    {},
  );
  const [createTeamChannel] = useMutation<CreateTeamChannelMutation>(
    CREATE_TEAM_CHANNEL,
    {
      refetchQueries: [{ query: GET_TEAM_CHANNELS }],
    },
  );
  const [updateTeamChannel] = useMutation<UpdateTeamChannelMutation>(
    UPDATE_TEAM_CHANNEL,
    {
      refetchQueries:
        effectiveSelectedChannelId !== undefined
          ? [
              { query: GET_TEAM_CHANNELS },
              {
                query: GET_TEAM_CHANNEL_MEMBERS,
                variables: { channelId: effectiveSelectedChannelId },
              },
            ]
          : [{ query: GET_TEAM_CHANNELS }],
    },
  );
  const [joinTeamChannel] = useMutation<JoinTeamChannelMutation>(
    JOIN_TEAM_CHANNEL,
    {
      refetchQueries:
        effectiveSelectedChannelId !== undefined
          ? [
              { query: GET_TEAM_CHANNELS },
              {
                query: GET_TEAM_MESSAGES,
                variables: { channelId: effectiveSelectedChannelId },
              },
            ]
          : [{ query: GET_TEAM_CHANNELS }],
    },
  );
  const [inviteTeamChannelMember] =
    useMutation<InviteTeamChannelMemberMutation>(INVITE_TEAM_CHANNEL_MEMBER, {
      refetchQueries:
        effectiveSelectedChannelId !== undefined
          ? [
              {
                query: GET_TEAM_CHANNEL_MEMBERS,
                variables: { channelId: effectiveSelectedChannelId },
              },
              { query: GET_TEAM_CHANNELS },
            ]
          : [{ query: GET_TEAM_CHANNELS }],
    });
  const [removeTeamChannelMember] =
    useMutation<RemoveTeamChannelMemberMutation>(REMOVE_TEAM_CHANNEL_MEMBER, {
      refetchQueries:
        effectiveSelectedChannelId !== undefined
          ? [
              {
                query: GET_TEAM_CHANNEL_MEMBERS,
                variables: { channelId: effectiveSelectedChannelId },
              },
              { query: GET_TEAM_CHANNELS },
            ]
          : [{ query: GET_TEAM_CHANNELS }],
    });
  const [updateTeamChannelMemberRole] =
    useMutation<UpdateTeamChannelMemberRoleMutation>(
      UPDATE_TEAM_CHANNEL_MEMBER_ROLE,
      {
        refetchQueries:
          effectiveSelectedChannelId !== undefined
            ? [
                {
                  query: GET_TEAM_CHANNEL_MEMBERS,
                  variables: { channelId: effectiveSelectedChannelId },
                },
                { query: GET_TEAM_CHANNELS },
              ]
            : [{ query: GET_TEAM_CHANNELS }],
      },
    );
  const [leaveTeamChannel] = useMutation<LeaveTeamChannelMutation>(
    LEAVE_TEAM_CHANNEL,
    {
      refetchQueries:
        effectiveSelectedChannelId !== undefined
          ? [
              { query: GET_TEAM_CHANNELS },
              {
                query: GET_TEAM_CHANNEL_MEMBERS,
                variables: { channelId: effectiveSelectedChannelId },
              },
              { query: GET_TEAM_INBOX },
              { query: GET_TEAM_MENTIONS },
              { query: GET_TEAM_SAVED_MESSAGES },
              { query: GET_TEAM_FILES },
              { query: GET_TEAM_MESSAGE_REMINDERS },
              {
                query: GET_TEAM_PINNED_MESSAGES,
                variables: {
                  channelId: effectiveSelectedChannelId,
                  directMessageThreadId: null,
                },
              },
            ]
          : [
              { query: GET_TEAM_CHANNELS },
              { query: GET_TEAM_INBOX },
              { query: GET_TEAM_MENTIONS },
              { query: GET_TEAM_SAVED_MESSAGES },
              { query: GET_TEAM_FILES },
              { query: GET_TEAM_MESSAGE_REMINDERS },
            ],
    },
  );
  const [archiveTeamChannel] = useMutation<ArchiveTeamChannelMutation>(
    ARCHIVE_TEAM_CHANNEL,
    {
      refetchQueries:
        effectiveSelectedChannelId !== undefined
          ? [
              { query: GET_TEAM_CHANNELS },
              { query: GET_TEAM_INBOX },
              { query: GET_TEAM_MENTIONS },
              { query: GET_TEAM_SAVED_MESSAGES },
              { query: GET_TEAM_FILES },
              { query: GET_TEAM_MESSAGE_REMINDERS },
              {
                query: GET_TEAM_PINNED_MESSAGES,
                variables: {
                  channelId: effectiveSelectedChannelId,
                  directMessageThreadId: null,
                },
              },
            ]
          : [
              { query: GET_TEAM_CHANNELS },
              { query: GET_TEAM_INBOX },
              { query: GET_TEAM_MENTIONS },
              { query: GET_TEAM_SAVED_MESSAGES },
              { query: GET_TEAM_FILES },
              { query: GET_TEAM_MESSAGE_REMINDERS },
            ],
    },
  );
  const [updateTeamChannelNotificationLevel] =
    useMutation<UpdateTeamChannelNotificationLevelMutation>(
      UPDATE_TEAM_CHANNEL_NOTIFICATION_LEVEL,
      {
        refetchQueries:
          effectiveSelectedChannelId !== undefined
            ? [
                {
                  query: GET_TEAM_CHANNEL_MEMBERS,
                  variables: { channelId: effectiveSelectedChannelId },
                },
                { query: GET_TEAM_CHANNELS },
                { query: GET_TEAM_INBOX },
              ]
            : [{ query: GET_TEAM_CHANNELS }, { query: GET_TEAM_INBOX }],
      },
    );
  const [updateTeamDirectMessageNotificationLevel] =
    useMutation<UpdateTeamDirectMessageNotificationLevelMutation>(
      UPDATE_TEAM_DIRECT_MESSAGE_NOTIFICATION_LEVEL,
      {
        refetchQueries: [
          { query: GET_TEAM_DIRECT_MESSAGES },
          { query: GET_TEAM_INBOX },
        ],
      },
    );
  const [toggleTeamMessageReaction] =
    useMutation<ToggleTeamMessageReactionMutation>(
      TOGGLE_TEAM_MESSAGE_REACTION,
      {
        refetchQueries: isDirectMessageSelected
          ? effectiveSelectedDirectMessageId
            ? [
                {
                  query: GET_TEAM_DIRECT_MESSAGE_MESSAGES,
                  variables: {
                    directMessageThreadId: effectiveSelectedDirectMessageId,
                  },
                },
                ...(selectedThreadParentMessageId
                  ? [
                      {
                        query: GET_TEAM_MESSAGE_THREAD,
                        variables: {
                          parentMessageId: selectedThreadParentMessageId,
                        },
                      },
                    ]
                  : []),
              ]
            : []
          : effectiveSelectedChannelId
            ? [
                {
                  query: GET_TEAM_MESSAGES,
                  variables: { channelId: effectiveSelectedChannelId },
                },
                ...(selectedThreadParentMessageId
                  ? [
                      {
                        query: GET_TEAM_MESSAGE_THREAD,
                        variables: {
                          parentMessageId: selectedThreadParentMessageId,
                        },
                      },
                    ]
                  : []),
              ]
            : [],
      },
    );
  const [toggleTeamMessagePin] = useMutation<ToggleTeamMessagePinMutation>(
    TOGGLE_TEAM_MESSAGE_PIN,
    {
      refetchQueries: isDirectMessageSelected
        ? effectiveSelectedDirectMessageId
          ? [
              {
                query: GET_TEAM_DIRECT_MESSAGE_MESSAGES,
                variables: {
                  directMessageThreadId: effectiveSelectedDirectMessageId,
                },
              },
              {
                query: GET_TEAM_PINNED_MESSAGES,
                variables: {
                  channelId: null,
                  directMessageThreadId: effectiveSelectedDirectMessageId,
                },
              },
              ...(selectedThreadParentMessageId
                ? [
                    {
                      query: GET_TEAM_MESSAGE_THREAD,
                      variables: {
                        parentMessageId: selectedThreadParentMessageId,
                      },
                    },
                  ]
                : []),
            ]
          : []
        : effectiveSelectedChannelId
          ? [
              {
                query: GET_TEAM_MESSAGES,
                variables: { channelId: effectiveSelectedChannelId },
              },
              {
                query: GET_TEAM_PINNED_MESSAGES,
                variables: {
                  channelId: effectiveSelectedChannelId,
                  directMessageThreadId: null,
                },
              },
              ...(selectedThreadParentMessageId
                ? [
                    {
                      query: GET_TEAM_MESSAGE_THREAD,
                      variables: {
                        parentMessageId: selectedThreadParentMessageId,
                      },
                    },
                  ]
                : []),
            ]
          : [],
    },
  );
  const [toggleTeamMessageBookmark] =
    useMutation<ToggleTeamMessageBookmarkMutation>(
      TOGGLE_TEAM_MESSAGE_BOOKMARK,
      {
        refetchQueries: isDirectMessageSelected
          ? effectiveSelectedDirectMessageId
            ? [
                {
                  query: GET_TEAM_DIRECT_MESSAGE_MESSAGES,
                  variables: {
                    directMessageThreadId: effectiveSelectedDirectMessageId,
                  },
                },
                { query: GET_TEAM_SAVED_MESSAGES },
                ...(selectedThreadParentMessageId
                  ? [
                      {
                        query: GET_TEAM_MESSAGE_THREAD,
                        variables: {
                          parentMessageId: selectedThreadParentMessageId,
                        },
                      },
                    ]
                  : []),
              ]
            : [{ query: GET_TEAM_SAVED_MESSAGES }]
          : effectiveSelectedChannelId
            ? [
                {
                  query: GET_TEAM_MESSAGES,
                  variables: { channelId: effectiveSelectedChannelId },
                },
                { query: GET_TEAM_SAVED_MESSAGES },
                ...(selectedThreadParentMessageId
                  ? [
                      {
                        query: GET_TEAM_MESSAGE_THREAD,
                        variables: {
                          parentMessageId: selectedThreadParentMessageId,
                        },
                      },
                    ]
                  : []),
              ]
            : [{ query: GET_TEAM_SAVED_MESSAGES }],
      },
    );
  const [setTeamMessageReminder] = useMutation<SetTeamMessageReminderMutation>(
    SET_TEAM_MESSAGE_REMINDER,
    {
      refetchQueries: [{ query: GET_TEAM_MESSAGE_REMINDERS }],
    },
  );
  const [dismissTeamMessageReminder] =
    useMutation<DismissTeamMessageReminderMutation>(
      DISMISS_TEAM_MESSAGE_REMINDER,
      {
        refetchQueries: [{ query: GET_TEAM_MESSAGE_REMINDERS }],
      },
    );
  const [updateTeamNotificationPreference] =
    useMutation<UpdateTeamNotificationPreferenceMutation>(
      UPDATE_TEAM_NOTIFICATION_PREFERENCE,
      {
        refetchQueries: [{ query: GET_TEAM_PRESENCE }],
      },
    );
  const [updateTeamNotificationQuietHours] =
    useMutation<UpdateTeamNotificationQuietHoursMutation>(
      UPDATE_TEAM_NOTIFICATION_QUIET_HOURS,
      {
        refetchQueries: [{ query: GET_TEAM_PRESENCE }],
      },
    );
  const [updateTeamMessage] = useMutation<UpdateTeamMessageMutation>(
    UPDATE_TEAM_MESSAGE,
    {
      refetchQueries: isDirectMessageSelected
        ? effectiveSelectedDirectMessageId
          ? [
              {
                query: GET_TEAM_DIRECT_MESSAGE_MESSAGES,
                variables: {
                  directMessageThreadId: effectiveSelectedDirectMessageId,
                },
              },
              { query: GET_TEAM_INBOX },
              { query: GET_TEAM_MENTIONS },
              ...(selectedThreadParentMessageId
                ? [
                    {
                      query: GET_TEAM_MESSAGE_THREAD,
                      variables: {
                        parentMessageId: selectedThreadParentMessageId,
                      },
                    },
                  ]
                : []),
            ]
          : []
        : effectiveSelectedChannelId
          ? [
              {
                query: GET_TEAM_MESSAGES,
                variables: { channelId: effectiveSelectedChannelId },
              },
              { query: GET_TEAM_INBOX },
              { query: GET_TEAM_MENTIONS },
              ...(selectedThreadParentMessageId
                ? [
                    {
                      query: GET_TEAM_MESSAGE_THREAD,
                      variables: {
                        parentMessageId: selectedThreadParentMessageId,
                      },
                    },
                  ]
                : []),
            ]
          : [],
    },
  );
  const [deleteTeamMessage] = useMutation<DeleteTeamMessageMutation>(
    DELETE_TEAM_MESSAGE,
    {
      refetchQueries: isDirectMessageSelected
        ? effectiveSelectedDirectMessageId
          ? [
              {
                query: GET_TEAM_DIRECT_MESSAGE_MESSAGES,
                variables: {
                  directMessageThreadId: effectiveSelectedDirectMessageId,
                },
              },
              {
                query: GET_TEAM_PINNED_MESSAGES,
                variables: {
                  channelId: null,
                  directMessageThreadId: effectiveSelectedDirectMessageId,
                },
              },
              { query: GET_TEAM_INBOX },
              { query: GET_TEAM_MENTIONS },
              { query: GET_TEAM_SAVED_MESSAGES },
              { query: GET_TEAM_FILES },
              { query: GET_TEAM_MESSAGE_REMINDERS },
              ...(selectedThreadParentMessageId
                ? [
                    {
                      query: GET_TEAM_MESSAGE_THREAD,
                      variables: {
                        parentMessageId: selectedThreadParentMessageId,
                      },
                    },
                  ]
                : []),
            ]
          : []
        : effectiveSelectedChannelId
          ? [
              {
                query: GET_TEAM_MESSAGES,
                variables: { channelId: effectiveSelectedChannelId },
              },
              {
                query: GET_TEAM_PINNED_MESSAGES,
                variables: {
                  channelId: effectiveSelectedChannelId,
                  directMessageThreadId: null,
                },
              },
              { query: GET_TEAM_INBOX },
              { query: GET_TEAM_MENTIONS },
              { query: GET_TEAM_SAVED_MESSAGES },
              { query: GET_TEAM_FILES },
              { query: GET_TEAM_MESSAGE_REMINDERS },
              ...(selectedThreadParentMessageId
                ? [
                    {
                      query: GET_TEAM_MESSAGE_THREAD,
                      variables: {
                        parentMessageId: selectedThreadParentMessageId,
                      },
                    },
                  ]
                : []),
            ]
          : [],
    },
  );

  useEffect(() => {
    setNavigationDrawerActiveTab(NAVIGATION_DRAWER_TABS.TEAM_COMMS);
  }, [setNavigationDrawerActiveTab]);

  useEffect(() => {
    setStarredConversationKeys(
      loadTeamStarredConversationKeys({ workspaceId: currentWorkspaceId }),
    );
    setLoadedStarredConversationWorkspaceId(currentWorkspaceId);
  }, [currentWorkspaceId]);

  useEffect(() => {
    if (loadedStarredConversationWorkspaceId !== currentWorkspaceId) {
      return;
    }

    saveTeamStarredConversationKeys(starredConversationKeys, {
      workspaceId: currentWorkspaceId,
    });
  }, [
    currentWorkspaceId,
    loadedStarredConversationWorkspaceId,
    starredConversationKeys,
  ]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setTeamNotificationNow(Date.now());
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const previousTitle = document.title;

    document.title = getTeamNotificationTitle({
      baseTitle: t`Team Comms`,
      count: teamUnreadBadgeCount,
    });

    return () => {
      document.title = previousTitle;
    };
  }, [teamUnreadBadgeCount]);

  useEffect(() => {
    const currentCandidateIds = new Set(
      teamNotificationCandidates.map((candidate) => candidate.id),
    );

    if (
      teamNotificationPermission !== 'granted' ||
      (!isUsingApiChannels && !isUsingApiDirectMessages)
    ) {
      setNotifiedTeamNotificationIds(currentCandidateIds);
      setHasInitializedTeamNotifications(false);

      return;
    }

    if (!hasInitializedTeamNotifications) {
      setNotifiedTeamNotificationIds(currentCandidateIds);
      setHasInitializedTeamNotifications(true);

      return;
    }

    setNotifiedTeamNotificationIds((seenCandidateIds) => {
      const newCandidates = getNewTeamNotificationCandidates({
        candidates: teamNotificationCandidates,
        seenCandidateIds,
      });

      if (newCandidates.length === 0) {
        return seenCandidateIds;
      }

      newCandidates.slice(0, 3).forEach((candidate) => {
        try {
          new window.Notification(candidate.title, {
            body: candidate.body,
            tag: candidate.id,
          });
        } catch {
          // Browser notification creation can still fail after permission checks.
        }
      });

      return new Set([
        ...seenCandidateIds,
        ...newCandidates.map((candidate) => candidate.id),
      ]);
    });
  }, [
    hasInitializedTeamNotifications,
    isUsingApiChannels,
    isUsingApiDirectMessages,
    teamNotificationCandidates,
    teamNotificationPermission,
  ]);

  useEffect(() => {
    setStatusText(currentUserPresence?.statusText ?? '');
    setStatusEmoji(currentUserPresence?.statusEmoji ?? '');
    setNotificationQuietHoursStart(
      currentUserPresence?.notificationQuietHoursStart ?? '',
    );
    setNotificationQuietHoursEnd(
      currentUserPresence?.notificationQuietHoursEnd ?? '',
    );
  }, [
    currentUserPresence?.notificationQuietHoursEnd,
    currentUserPresence?.notificationQuietHoursStart,
    currentUserPresence?.statusEmoji,
    currentUserPresence?.statusText,
  ]);

  useEffect(() => {
    if (!isUsingApiChannels && !isUsingApiDirectMessages) {
      return;
    }

    const heartbeatTeamPresenceSafely = () => {
      void heartbeatTeamPresence().catch(() => {});
    };

    heartbeatTeamPresenceSafely();
    const intervalId = window.setInterval(() => {
      heartbeatTeamPresenceSafely();
    }, TEAM_PRESENCE_HEARTBEAT_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [heartbeatTeamPresence, isUsingApiChannels, isUsingApiDirectMessages]);

  useEffect(() => {
    const activeDraftMessage = selectedThreadParentMessageId
      ? threadDraftMessage
      : draftMessage;

    if (!isComposerEnabled || activeDraftMessage.trim().length === 0) {
      return;
    }

    const variables = isDirectMessageSelected
      ? effectiveSelectedDirectMessageId
        ? {
            channelId: null,
            directMessageThreadId: effectiveSelectedDirectMessageId,
            parentMessageId: selectedThreadParentMessageId,
          }
        : null
      : effectiveSelectedChannelId
        ? {
            channelId: effectiveSelectedChannelId,
            directMessageThreadId: null,
            parentMessageId: selectedThreadParentMessageId,
          }
        : null;

    if (variables === null) {
      return;
    }

    const typingHeartbeatKey = isDirectMessageSelected
      ? `direct-message:${effectiveSelectedDirectMessageId ?? ''}:${
          selectedThreadParentMessageId ?? 'main'
        }`
      : `channel:${effectiveSelectedChannelId ?? ''}:${
          selectedThreadParentMessageId ?? 'main'
        }`;
    const now = Date.now();

    if (
      lastTypingHeartbeatKey === typingHeartbeatKey &&
      now - lastTypingHeartbeatAt < TEAM_TYPING_HEARTBEAT_INTERVAL_MS
    ) {
      return;
    }

    setLastTypingHeartbeatAt(now);
    setLastTypingHeartbeatKey(typingHeartbeatKey);
    void heartbeatTeamTyping({ variables })
      .then(() => {
        if (selectedThreadParentMessageId) {
          refetchTeamDataSafely(refetchThreadTypingIndicators);

          return;
        }

        refetchTeamDataSafely(refetchTypingIndicators);
      })
      .catch(() => {});
  }, [
    draftMessage,
    effectiveSelectedChannelId,
    effectiveSelectedDirectMessageId,
    heartbeatTeamTyping,
    isComposerEnabled,
    isDirectMessageSelected,
    lastTypingHeartbeatAt,
    lastTypingHeartbeatKey,
    refetchTypingIndicators,
    refetchThreadTypingIndicators,
    selectedThreadParentMessageId,
    threadDraftMessage,
  ]);

  useEffect(() => {
    setDraftMessage(loadTeamDraft(draftStorageKey));
    setPendingAttachments([]);
    setLoadedDraftStorageKey(draftStorageKey);
  }, [draftStorageKey]);

  useEffect(() => {
    if (loadedDraftStorageKey !== draftStorageKey) {
      return;
    }

    saveTeamDraft({ key: draftStorageKey, value: draftMessage });
  }, [draftMessage, draftStorageKey, loadedDraftStorageKey]);

  useEffect(() => {
    if (!threadDraftStorageKey) {
      setThreadDraftMessage('');
      setPendingThreadAttachments([]);
      setLoadedThreadDraftStorageKey(null);

      return;
    }

    setThreadDraftMessage(loadTeamDraft(threadDraftStorageKey));
    setPendingThreadAttachments([]);
    setLoadedThreadDraftStorageKey(threadDraftStorageKey);
  }, [threadDraftStorageKey]);

  useEffect(() => {
    if (
      !threadDraftStorageKey ||
      loadedThreadDraftStorageKey !== threadDraftStorageKey
    ) {
      return;
    }

    saveTeamDraft({ key: threadDraftStorageKey, value: threadDraftMessage });
  }, [loadedThreadDraftStorageKey, threadDraftMessage, threadDraftStorageKey]);

  useEffect(() => {
    if (searchParams.has('teamThreadParentMessageId')) {
      return;
    }

    setSelectedThreadParentMessageId(null);
  }, [searchParams, selectedChannelId, selectedDirectMessageId]);

  useEffect(() => {
    if (!sseClient || liveMessageEventSubscriptionTargets.length === 0) {
      return;
    }

    const disposers = liveMessageEventSubscriptionTargets.map((target) =>
      sseClient.subscribe<OnTeamMessageEventSubscription>(
        {
          query: print(ON_TEAM_MESSAGE_EVENT),
          variables: target,
        },
        {
          next: (value: ExecutionResult<OnTeamMessageEventSubscription>) => {
            const event = value.data?.onTeamMessageEvent;

            if (!event) {
              return;
            }

            if (event.channelId) {
              refetchTeamDataSafely(refetchChannels);
            }

            if (event.directMessageThreadId) {
              refetchTeamDataSafely(refetchDirectMessages);
            }

            const isSelectedConversationEvent =
              (target.channelId === event.channelId &&
                event.channelId === effectiveSelectedChannelId) ||
              (target.directMessageThreadId === event.directMessageThreadId &&
                event.directMessageThreadId ===
                  effectiveSelectedDirectMessageId);

            if (isSelectedConversationEvent) {
              if (event.directMessageThreadId) {
                refetchTeamDataSafely(refetchDirectMessageMessages);
              } else {
                refetchTeamDataSafely(refetchChannelMessages);
              }
            }

            refetchTeamDataSafely(refetchInbox);
            refetchTeamDataSafely(refetchMentions);
            refetchTeamDataSafely(refetchSavedMessages);
            refetchTeamDataSafely(refetchFiles);
            refetchTeamDataSafely(refetchMessageReminders);
            refetchTeamDataSafely(refetchPinnedMessages);

            if (
              selectedThreadParentMessageId &&
              (event.parentMessageId === selectedThreadParentMessageId ||
                event.messageId === selectedThreadParentMessageId)
            ) {
              refetchTeamDataSafely(refetchThreadMessages);
            }

            if (
              selectedThreadParentMessageId &&
              event.type === 'DELETED' &&
              event.messageId === selectedThreadParentMessageId
            ) {
              setSelectedThreadParentMessageId(null);
            }

            if (
              selectedMessageId &&
              event.type === 'DELETED' &&
              event.messageId === selectedMessageId
            ) {
              setSelectedMessageId(null);
            }

            const eventChannel = event.channelId
              ? channels.find((channel) => channel.id === event.channelId)
              : null;
            const eventDirectMessage = event.directMessageThreadId
              ? directMessages.find(
                  (directMessage) =>
                    directMessage.id === event.directMessageThreadId,
                )
              : null;

            if (
              currentUserPresence &&
              shouldShowTeamLiveMessageNotification({
                conversationNotificationLevel:
                  eventDirectMessage?.notificationLevel ??
                  eventChannel?.notificationLevel ??
                  (eventChannel?.isMember ? 'ALL' : 'MUTED'),
                currentUser: {
                  email: currentUserPresence.email,
                  name: currentUserPresence.name,
                  userWorkspaceId: currentUserPresence.userWorkspaceId,
                },
                event,
                now: Date.now(),
                preference: currentTeamNotificationPreference,
                quietHours: currentTeamNotificationQuietHours,
              })
            ) {
              enqueueInfoSnackBar({
                message: t`${event.authorName}: ${getTeamLiveMessageNotificationBody(event.body)}`,
                options: {
                  dedupeKey: `team-message-event-${event.messageId}`,
                },
              });
            }
          },
          error: () => {
            // graphql-sse reconnects automatically; polling remains as fallback.
          },
          complete: () => {},
        },
      ),
    );

    return () => {
      disposers.forEach((dispose) => dispose());
    };
  }, [
    channels,
    currentTeamNotificationPreference,
    currentTeamNotificationQuietHours,
    currentUserPresence,
    directMessages,
    effectiveSelectedChannelId,
    effectiveSelectedDirectMessageId,
    enqueueInfoSnackBar,
    refetchChannelMessages,
    refetchChannels,
    refetchDirectMessages,
    refetchDirectMessageMessages,
    refetchFiles,
    refetchInbox,
    refetchMessageReminders,
    refetchMentions,
    refetchPinnedMessages,
    refetchSavedMessages,
    refetchThreadMessages,
    selectedMessageId,
    selectedThreadParentMessageId,
    liveMessageEventSubscriptionTargets,
    sseClient,
  ]);

  useEffect(() => {
    const requestedDirectMessageId = searchParams.get('teamDirectMessageId');
    const requestedChannelId = searchParams.get('teamChannelId');

    if (isTeamPanelFocused) {
      setSelectedChannelId(null);
      setSelectedDirectMessageId(null);

      return;
    }

    if (
      requestedDirectMessageId &&
      directMessages.some(
        (directMessage) => directMessage.id === requestedDirectMessageId,
      )
    ) {
      setSelectedDirectMessageId(requestedDirectMessageId);
      setSelectedChannelId(null);

      return;
    }

    if (
      requestedChannelId &&
      channels.some((channel) => channel.id === requestedChannelId)
    ) {
      setSelectedChannelId(requestedChannelId);
      setSelectedDirectMessageId(null);

      return;
    }

    if (selectedDirectMessageId !== null) {
      if (
        directMessages.some(
          (directMessage) => directMessage.id === selectedDirectMessageId,
        )
      ) {
        return;
      }

      setSelectedDirectMessageId(null);
    }

    if (
      selectableJoinedChannels[0]?.id &&
      (!selectedChannelId ||
        !channels.some((channel) => channel.id === selectedChannelId))
    ) {
      setSelectedChannelId(selectableJoinedChannels[0].id);
      setSelectedDirectMessageId(null);
    }
  }, [
    channels,
    directMessages,
    isTeamPanelFocused,
    searchParams,
    selectableJoinedChannels,
    selectedChannelId,
    selectedDirectMessageId,
  ]);

  useEffect(() => {
    const requestedThreadParentMessageId = searchParams.get(
      'teamThreadParentMessageId',
    );

    if (!requestedThreadParentMessageId) {
      setSelectedThreadParentMessageId(null);

      return;
    }

    setSelectedThreadParentMessageId(requestedThreadParentMessageId);
  }, [searchParams]);

  useEffect(() => {
    const requestedMessageId = searchParams.get('teamMessageId');

    if (!requestedMessageId) {
      setSelectedMessageId(null);

      return;
    }

    setSelectedMessageId(requestedMessageId);
  }, [searchParams]);

  useEffect(() => {
    if (messageScrollTarget === null) {
      return;
    }

    const messageElement = document.getElementById(
      getTeamMessageElementId(messageScrollTarget),
    );

    messageElement?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }, [messageScrollTarget]);

  useEffect(() => {
    if (
      isDirectMessageSelected ||
      !isUsingApiChannels ||
      !effectiveSelectedChannelId ||
      !channelMessagesData?.teamMessages
    ) {
      return;
    }

    const lastMessageId =
      channelMessagesData.teamMessages[
        channelMessagesData.teamMessages.length - 1
      ]?.id ?? 'empty';
    const markReadKey = `channel:${effectiveSelectedChannelId}:${lastMessageId}`;

    if (lastMarkedReadKey === markReadKey) {
      return;
    }

    const previousMarkedReadKey = lastMarkedReadKey;

    setLastMarkedReadKey(markReadKey);
    void markTeamChannelRead({
      variables: { channelId: effectiveSelectedChannelId },
    }).catch(() => {
      setLastMarkedReadKey((previousLastMarkedReadKey) =>
        previousLastMarkedReadKey === markReadKey
          ? previousMarkedReadKey
          : previousLastMarkedReadKey,
      );
      enqueueErrorSnackBar({ message: t`Failed to mark channel read.` });
    });
  }, [
    channelMessagesData?.teamMessages,
    effectiveSelectedChannelId,
    enqueueErrorSnackBar,
    isDirectMessageSelected,
    isUsingApiChannels,
    lastMarkedReadKey,
    markTeamChannelRead,
  ]);

  useEffect(() => {
    if (
      !isDirectMessageSelected ||
      !isUsingApiDirectMessages ||
      !effectiveSelectedDirectMessageId ||
      !directMessageMessagesData?.teamDirectMessageMessages
    ) {
      return;
    }

    const lastMessageId =
      directMessageMessagesData.teamDirectMessageMessages[
        directMessageMessagesData.teamDirectMessageMessages.length - 1
      ]?.id ?? 'empty';
    const markReadKey = `direct-message:${effectiveSelectedDirectMessageId}:${lastMessageId}`;

    if (lastMarkedReadKey === markReadKey) {
      return;
    }

    const previousMarkedReadKey = lastMarkedReadKey;

    setLastMarkedReadKey(markReadKey);
    void markTeamDirectMessageRead({
      variables: { directMessageThreadId: effectiveSelectedDirectMessageId },
    }).catch(() => {
      setLastMarkedReadKey((previousLastMarkedReadKey) =>
        previousLastMarkedReadKey === markReadKey
          ? previousMarkedReadKey
          : previousLastMarkedReadKey,
      );
      enqueueErrorSnackBar({
        message: t`Failed to mark direct message read.`,
      });
    });
  }, [
    directMessageMessagesData?.teamDirectMessageMessages,
    effectiveSelectedDirectMessageId,
    enqueueErrorSnackBar,
    isDirectMessageSelected,
    isUsingApiDirectMessages,
    lastMarkedReadKey,
    markTeamDirectMessageRead,
  ]);

  useEffect(() => {
    if (
      !selectedThreadParentMessageId ||
      !threadMessagesData?.teamMessageThread
    ) {
      return;
    }

    const lastThreadMessageId =
      threadMessagesData.teamMessageThread[
        threadMessagesData.teamMessageThread.length - 1
      ]?.id ?? selectedThreadParentMessageId;
    const markReadKey = `thread:${selectedThreadParentMessageId}:${lastThreadMessageId}`;

    if (lastMarkedReadKey === markReadKey) {
      return;
    }

    const previousMarkedReadKey = lastMarkedReadKey;

    setLastMarkedReadKey(markReadKey);
    void markTeamMessageThreadRead({
      variables: { parentMessageId: selectedThreadParentMessageId },
    }).catch(() => {
      setLastMarkedReadKey((previousLastMarkedReadKey) =>
        previousLastMarkedReadKey === markReadKey
          ? previousMarkedReadKey
          : previousLastMarkedReadKey,
      );
      enqueueErrorSnackBar({ message: t`Failed to mark thread read.` });
    });
  }, [
    enqueueErrorSnackBar,
    lastMarkedReadKey,
    markTeamMessageThreadRead,
    selectedThreadParentMessageId,
    threadMessagesData?.teamMessageThread,
  ]);

  const handleSendMessage = async (draftMessageOverride?: string) => {
    if (!isComposerEnabled || isSendingMessage) {
      return;
    }

    const currentDraftMessage =
      draftMessageOverride ?? draftMessageInputElement?.value ?? draftMessage;
    const trimmedDraftMessage = currentDraftMessage.trim();
    const normalizedDraftMessage =
      applyTeamComposerCommand(trimmedDraftMessage);
    const attachments = pendingAttachments;

    if (
      isDirectMessageSelected &&
      isUsingApiDirectMessages &&
      effectiveSelectedDirectMessageId &&
      (trimmedDraftMessage.length > 0 || attachments.length > 0)
    ) {
      setIsSendingMessage(true);

      try {
        await sendTeamDirectMessage({
          variables: {
            attachments,
            body: normalizedDraftMessage,
            directMessageThreadId: effectiveSelectedDirectMessageId,
          },
        });
        clearTeamDraft(draftStorageKey);
        setDraftMessage('');
        if (draftMessageInputElement !== null) {
          draftMessageInputElement.value = '';
        }
        setPendingAttachments([]);
        refetchTeamDataSafely(refetchDirectMessageMessages);
        refetchTeamDataSafely(refetchDirectMessages);
        refetchTeamDataSafely(refetchFiles);
      } catch {
        setDraftMessage(currentDraftMessage);
        setPendingAttachments(attachments);
        enqueueErrorSnackBar({ message: t`Failed to send message.` });
      } finally {
        setIsSendingMessage(false);
      }

      return;
    }

    if (
      !isUsingApiChannels ||
      !effectiveSelectedChannelId ||
      (trimmedDraftMessage.length === 0 && attachments.length === 0)
    ) {
      return;
    }

    if (
      shouldConfirmTeamBroadMention({
        isChannelConversation: true,
        messageBody: normalizedDraftMessage,
      }) &&
      !window.confirm(t`Send this broadcast mention to the channel?`)
    ) {
      return;
    }

    setIsSendingMessage(true);

    try {
      await sendTeamMessage({
        variables: {
          attachments,
          body: normalizedDraftMessage,
          channelId: effectiveSelectedChannelId,
        },
      });
      clearTeamDraft(draftStorageKey);
      setDraftMessage('');
      if (draftMessageInputElement !== null) {
        draftMessageInputElement.value = '';
      }
      setPendingAttachments([]);
      refetchTeamDataSafely(refetchChannelMessages);
      refetchTeamDataSafely(refetchChannels);
      refetchTeamDataSafely(refetchFiles);
    } catch {
      setDraftMessage(currentDraftMessage);
      setPendingAttachments(attachments);
      enqueueErrorSnackBar({ message: t`Failed to send message.` });
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleRequestTeamNotifications = async () => {
    if (isRequestingTeamNotifications) {
      return;
    }

    if (!('Notification' in window)) {
      setTeamNotificationPermission('unsupported');
      enqueueErrorSnackBar({ message: t`Notifications are not supported.` });

      return;
    }

    setIsRequestingTeamNotifications(true);

    try {
      const permission = await window.Notification.requestPermission();

      setNotifiedTeamNotificationIds(
        new Set(teamNotificationCandidates.map((candidate) => candidate.id)),
      );
      setHasInitializedTeamNotifications(permission === 'granted');
      setTeamNotificationPermission(permission);

      if (permission === 'granted') {
        enqueueInfoSnackBar({ message: t`Team notifications enabled.` });
      }
    } catch {
      enqueueErrorSnackBar({ message: t`Failed to enable notifications.` });
    } finally {
      setIsRequestingTeamNotifications(false);
    }
  };

  const handleUpdateTeamNotificationPreference = async (
    notificationPreference: TeamPresence['notificationPreference'],
  ) => {
    if (isUpdatingNotificationPreference) {
      return;
    }

    setIsUpdatingNotificationPreference(true);

    try {
      await updateTeamNotificationPreference({
        variables: {
          notificationPreference: notificationPreference.toUpperCase(),
        },
      });
      enqueueInfoSnackBar({ message: t`Notification preference updated.` });
    } catch {
      enqueueErrorSnackBar({
        message: t`Failed to update notification preference.`,
      });
    } finally {
      setIsUpdatingNotificationPreference(false);
    }
  };

  const handleUpdateTeamNotificationQuietHours = async () => {
    if (isUpdatingNotificationQuietHours) {
      return;
    }

    const trimmedNotificationQuietHoursStart =
      notificationQuietHoursStart.trim();
    const trimmedNotificationQuietHoursEnd = notificationQuietHoursEnd.trim();

    setIsUpdatingNotificationQuietHours(true);

    try {
      await updateTeamNotificationQuietHours({
        variables: {
          notificationQuietHoursEnd:
            trimmedNotificationQuietHoursEnd.length > 0
              ? trimmedNotificationQuietHoursEnd
              : null,
          notificationQuietHoursStart:
            trimmedNotificationQuietHoursStart.length > 0
              ? trimmedNotificationQuietHoursStart
              : null,
        },
      });
      enqueueInfoSnackBar({ message: t`Notification quiet hours updated.` });
    } catch {
      enqueueErrorSnackBar({
        message: t`Failed to update notification quiet hours.`,
      });
    } finally {
      setIsUpdatingNotificationQuietHours(false);
    }
  };

  const handleSendThreadReply = async (threadDraftMessageOverride?: string) => {
    if (!isComposerEnabled || isSendingThreadReply) {
      return;
    }

    const currentThreadDraftMessage =
      threadDraftMessageOverride ??
      threadDraftMessageInputElement?.value ??
      threadDraftMessage;
    const trimmedThreadDraftMessage = currentThreadDraftMessage.trim();
    const normalizedThreadDraftMessage = applyTeamComposerCommand(
      trimmedThreadDraftMessage,
    );
    const attachments = pendingThreadAttachments;

    if (
      !selectedThreadParentMessageId ||
      (trimmedThreadDraftMessage.length === 0 && attachments.length === 0)
    ) {
      return;
    }

    if (
      isDirectMessageSelected &&
      isUsingApiDirectMessages &&
      effectiveSelectedDirectMessageId
    ) {
      setIsSendingThreadReply(true);

      try {
        await sendTeamDirectMessage({
          variables: {
            attachments,
            body: normalizedThreadDraftMessage,
            directMessageThreadId: effectiveSelectedDirectMessageId,
            parentMessageId: selectedThreadParentMessageId,
          },
        });
        if (threadDraftStorageKey) {
          clearTeamDraft(threadDraftStorageKey);
        }
        setThreadDraftMessage('');
        if (threadDraftMessageInputElement !== null) {
          threadDraftMessageInputElement.value = '';
        }
        setPendingThreadAttachments([]);
        refetchTeamDataSafely(refetchDirectMessageMessages);
        refetchTeamDataSafely(refetchThreadMessages);
        refetchTeamDataSafely(refetchDirectMessages);
        refetchTeamDataSafely(refetchFiles);
      } catch {
        setThreadDraftMessage(currentThreadDraftMessage);
        setPendingThreadAttachments(attachments);
        enqueueErrorSnackBar({ message: t`Failed to send reply.` });
      } finally {
        setIsSendingThreadReply(false);
      }

      return;
    }

    if (!isUsingApiChannels || !effectiveSelectedChannelId) {
      return;
    }

    if (
      shouldConfirmTeamBroadMention({
        isChannelConversation: true,
        messageBody: normalizedThreadDraftMessage,
      }) &&
      !window.confirm(t`Send this broadcast mention to the channel?`)
    ) {
      return;
    }

    setIsSendingThreadReply(true);

    try {
      await sendTeamMessage({
        variables: {
          attachments,
          body: normalizedThreadDraftMessage,
          channelId: effectiveSelectedChannelId,
          parentMessageId: selectedThreadParentMessageId,
        },
      });
      if (threadDraftStorageKey) {
        clearTeamDraft(threadDraftStorageKey);
      }
      setThreadDraftMessage('');
      if (threadDraftMessageInputElement !== null) {
        threadDraftMessageInputElement.value = '';
      }
      setPendingThreadAttachments([]);
      refetchTeamDataSafely(refetchChannelMessages);
      refetchTeamDataSafely(refetchThreadMessages);
      refetchTeamDataSafely(refetchChannels);
      refetchTeamDataSafely(refetchFiles);
    } catch {
      setThreadDraftMessage(currentThreadDraftMessage);
      setPendingThreadAttachments(attachments);
      enqueueErrorSnackBar({ message: t`Failed to send reply.` });
    } finally {
      setIsSendingThreadReply(false);
    }
  };

  const handleDiscardDraftMessage = () => {
    clearTeamDraft(draftStorageKey);
    setDraftMessage('');
    setPendingAttachments([]);

    if (draftMessageInputElement !== null) {
      draftMessageInputElement.value = '';
      requestAnimationFrame(() => draftMessageInputElement.focus());
    }
  };

  const handleDiscardThreadDraftMessage = () => {
    if (!threadDraftStorageKey) {
      return;
    }

    clearTeamDraft(threadDraftStorageKey);
    setThreadDraftMessage('');
    setPendingThreadAttachments([]);

    if (threadDraftMessageInputElement !== null) {
      threadDraftMessageInputElement.value = '';
      requestAnimationFrame(() => threadDraftMessageInputElement.focus());
    }
  };

  const handleSelectChannel = (channel: TeamChannel) => {
    setSelectedChannelId(channel.id);
    setSuppressedAutoSelectedChannelId(null);
    setSelectedDirectMessageId(null);
    setSelectedMessageId(null);
    setSelectedThreadParentMessageId(null);
    navigateToTeamConversation({ channelId: channel.id });
    focusTeamComposerInput(draftMessageInputElement);

    if (isUsingApiChannels && channel.unreadCount > 0) {
      void markTeamChannelRead({
        variables: { channelId: channel.id },
      }).catch(() => {
        enqueueErrorSnackBar({ message: t`Failed to mark channel read.` });
      });
    }
  };

  const handleSelectDirectMessage = (directMessage: TeamDirectMessage) => {
    setSelectedDirectMessageId(directMessage.id);
    setSelectedChannelId(null);
    setSelectedMessageId(null);
    setSelectedThreadParentMessageId(null);
    navigateToTeamConversation({ directMessageThreadId: directMessage.id });
    focusTeamComposerInput(draftMessageInputElement);

    if (isUsingApiDirectMessages && directMessage.unreadCount > 0) {
      void markTeamDirectMessageRead({
        variables: { directMessageThreadId: directMessage.id },
      }).catch(() => {
        enqueueErrorSnackBar({
          message: t`Failed to mark direct message read.`,
        });
      });
    }
  };

  const handleCreateChannel = async () => {
    const trimmedChannelName = newChannelName.trim();
    const trimmedChannelDescription = newChannelDescription.trim();

    if (
      !isUsingApiChannels ||
      trimmedChannelName.length === 0 ||
      isCreatingChannel
    ) {
      return;
    }

    setIsCreatingChannel(true);

    try {
      const { data } = await createTeamChannel({
        variables: {
          description:
            trimmedChannelDescription.length > 0
              ? trimmedChannelDescription
              : null,
          name: trimmedChannelName,
          visibility: newChannelIsPrivate ? 'PRIVATE' : 'PUBLIC',
        },
      });

      if (!data?.createTeamChannel) {
        enqueueErrorSnackBar({ message: t`Failed to create channel.` });

        return;
      }

      handleSelectChannel(data.createTeamChannel);
      enqueueInfoSnackBar({ message: t`Channel created.` });
      setNewChannelName('');
      setNewChannelDescription('');
      setNewChannelIsPrivate(false);
    } catch {
      enqueueErrorSnackBar({ message: t`Failed to create channel.` });
    } finally {
      setIsCreatingChannel(false);
    }
  };

  const handleCreateDirectMessage = async () => {
    if (
      !isUsingApiDirectMessages ||
      selectedNewDirectMessageUserWorkspaceId.length === 0 ||
      isCreatingDirectMessage
    ) {
      return;
    }

    const existingDirectMessage = directMessageByParticipantUserWorkspaceId.get(
      selectedNewDirectMessageUserWorkspaceId,
    );

    if (existingDirectMessage) {
      handleSelectDirectMessage(existingDirectMessage);
      setSelectedNewDirectMessageUserWorkspaceId('');
      setNewDirectMessageSearchQuery('');

      return;
    }

    setIsCreatingDirectMessage(true);

    try {
      const { data } = await createTeamDirectMessage({
        variables: {
          participantUserWorkspaceId: selectedNewDirectMessageUserWorkspaceId,
        },
      });

      if (!data?.createTeamDirectMessage) {
        enqueueErrorSnackBar({ message: t`Failed to start direct message.` });

        return;
      }

      handleSelectDirectMessage(data.createTeamDirectMessage);
      enqueueInfoSnackBar({ message: t`Direct message started.` });
      setSelectedNewDirectMessageUserWorkspaceId('');
      setNewDirectMessageSearchQuery('');
    } catch {
      enqueueErrorSnackBar({ message: t`Failed to start direct message.` });
    } finally {
      setIsCreatingDirectMessage(false);
    }
  };

  const handleOpenDirectMessageWithTeammate = async (
    participantUserWorkspaceId: string,
  ) => {
    if (
      !isUsingApiDirectMessages ||
      openingDirectMessageUserWorkspaceId === participantUserWorkspaceId
    ) {
      return;
    }

    const existingDirectMessage = directMessageByParticipantUserWorkspaceId.get(
      participantUserWorkspaceId,
    );

    if (existingDirectMessage) {
      handleSelectDirectMessage(existingDirectMessage);
      setSelectedInviteUserWorkspaceId('');
      setInviteMemberSearchQuery('');

      return;
    }

    setOpeningDirectMessageUserWorkspaceId(participantUserWorkspaceId);

    try {
      const { data } = await createTeamDirectMessage({
        variables: { participantUserWorkspaceId },
      });

      if (!data?.createTeamDirectMessage) {
        enqueueErrorSnackBar({ message: t`Failed to start direct message.` });

        return;
      }

      handleSelectDirectMessage(data.createTeamDirectMessage);
      setSelectedInviteUserWorkspaceId('');
      setInviteMemberSearchQuery('');
      enqueueInfoSnackBar({ message: t`Direct message started.` });
    } catch {
      enqueueErrorSnackBar({ message: t`Failed to start direct message.` });
    } finally {
      setOpeningDirectMessageUserWorkspaceId(null);
    }
  };

  const handleUpdateChannelDetails = async () => {
    const trimmedChannelName = channelDetailsName.trim();
    const trimmedChannelDescription = channelDetailsDescription.trim();

    if (
      !canManageSelectedChannel ||
      !effectiveSelectedChannelId ||
      trimmedChannelName.length === 0 ||
      isUpdatingChannelDetails
    ) {
      return;
    }

    setIsUpdatingChannelDetails(true);

    try {
      await updateTeamChannel({
        variables: {
          channelId: effectiveSelectedChannelId,
          description:
            trimmedChannelDescription.length > 0
              ? trimmedChannelDescription
              : null,
          name: trimmedChannelName,
          visibility: (channelDetailsVisibility ?? 'PUBLIC').toUpperCase(),
        },
      });
      enqueueInfoSnackBar({ message: t`Channel updated.` });
    } catch {
      enqueueErrorSnackBar({ message: t`Failed to update channel.` });
    } finally {
      setIsUpdatingChannelDetails(false);
    }
  };

  const handleJoinChannel = async (channelId = effectiveSelectedChannelId) => {
    if (!channelId || joiningChannelId === channelId) {
      return;
    }

    setJoiningChannelId(channelId);

    try {
      const { data } = await joinTeamChannel({
        variables: { channelId },
      });

      if (!data?.joinTeamChannel) {
        enqueueErrorSnackBar({ message: t`Failed to join channel.` });

        return;
      }

      handleSelectChannel(data.joinTeamChannel);
      setBrowsePublicChannelsQuery('');
      enqueueInfoSnackBar({ message: t`Channel joined.` });
    } catch {
      enqueueErrorSnackBar({ message: t`Failed to join channel.` });
    } finally {
      setJoiningChannelId(null);
    }
  };

  const handleInviteChannelMember = async () => {
    if (
      !effectiveSelectedChannelId ||
      !selectedInviteUserWorkspaceId ||
      isInvitingChannelMember
    ) {
      return;
    }

    setIsInvitingChannelMember(true);

    try {
      await inviteTeamChannelMember({
        variables: {
          channelId: effectiveSelectedChannelId,
          userWorkspaceId: selectedInviteUserWorkspaceId,
        },
      });
    } catch {
      enqueueErrorSnackBar({ message: t`Failed to invite member.` });

      return;
    } finally {
      setIsInvitingChannelMember(false);
    }

    setSelectedInviteUserWorkspaceId('');
    setInviteMemberSearchQuery('');
    enqueueInfoSnackBar({ message: t`Member invited.` });
  };

  const handleRemoveChannelMember = async (userWorkspaceId: string) => {
    if (
      !effectiveSelectedChannelId ||
      removingChannelMemberUserWorkspaceId === userWorkspaceId
    ) {
      return;
    }

    if (!window.confirm(t`Remove this member from the channel?`)) {
      return;
    }

    setRemovingChannelMemberUserWorkspaceId(userWorkspaceId);

    try {
      await removeTeamChannelMember({
        variables: {
          channelId: effectiveSelectedChannelId,
          userWorkspaceId,
        },
      });
      enqueueInfoSnackBar({ message: t`Member removed.` });
    } catch {
      enqueueErrorSnackBar({ message: t`Failed to remove member.` });
    } finally {
      setRemovingChannelMemberUserWorkspaceId(null);
    }
  };

  const handleUpdateChannelMemberRole = async (
    userWorkspaceId: string,
    role: TeamChannelMember['role'],
  ) => {
    if (
      !effectiveSelectedChannelId ||
      updatingChannelMemberRoleUserWorkspaceId === userWorkspaceId
    ) {
      return;
    }

    setUpdatingChannelMemberRoleUserWorkspaceId(userWorkspaceId);

    try {
      await updateTeamChannelMemberRole({
        variables: {
          channelId: effectiveSelectedChannelId,
          role: role.toUpperCase(),
          userWorkspaceId,
        },
      });
      enqueueInfoSnackBar({ message: t`Member role updated.` });
    } catch {
      enqueueErrorSnackBar({ message: t`Failed to update member role.` });
    } finally {
      setUpdatingChannelMemberRoleUserWorkspaceId(null);
    }
  };

  const handleLeaveChannel = async () => {
    if (!effectiveSelectedChannelId || isLeavingChannel) {
      return;
    }

    if (!window.confirm(t`Leave this channel?`)) {
      return;
    }

    const channelIdToLeave = effectiveSelectedChannelId;

    setIsLeavingChannel(true);

    try {
      await leaveTeamChannel({
        variables: {
          channelId: channelIdToLeave,
        },
      });
    } catch {
      enqueueErrorSnackBar({ message: t`Failed to leave channel.` });

      return;
    } finally {
      setIsLeavingChannel(false);
    }

    setSelectedChannelId(null);
    setSuppressedAutoSelectedChannelId(channelIdToLeave);
    setSelectedThreadParentMessageId(null);
    navigateToTeamConversation({});
    enqueueInfoSnackBar({ message: t`Channel left.` });
  };

  const handleArchiveChannel = async () => {
    if (
      !canManageSelectedChannel ||
      !effectiveSelectedChannelId ||
      isArchivingChannel
    ) {
      return;
    }

    if (!window.confirm(t`Archive this channel?`)) {
      return;
    }

    const channelIdToArchive = effectiveSelectedChannelId;

    setIsArchivingChannel(true);

    try {
      await archiveTeamChannel({
        variables: {
          channelId: channelIdToArchive,
        },
      });
    } catch {
      enqueueErrorSnackBar({ message: t`Failed to archive channel.` });

      return;
    } finally {
      setIsArchivingChannel(false);
    }

    setSelectedChannelId(null);
    setSuppressedAutoSelectedChannelId(channelIdToArchive);
    setSelectedThreadParentMessageId(null);
    navigateToTeamConversation({});
    enqueueInfoSnackBar({ message: t`Channel archived.` });
  };

  const handleUpdateChannelNotificationLevel = async (
    notificationLevel: TeamChannelMember['notificationLevel'],
    successMessage = t`Notification setting updated.`,
  ) => {
    if (!effectiveSelectedChannelId || isUpdatingChannelNotificationLevel) {
      return;
    }

    setIsUpdatingChannelNotificationLevel(true);

    try {
      await updateTeamChannelNotificationLevel({
        variables: {
          channelId: effectiveSelectedChannelId,
          notificationLevel: notificationLevel.toUpperCase(),
        },
      });
      enqueueInfoSnackBar({ message: successMessage });
    } catch {
      enqueueErrorSnackBar({
        message: t`Failed to update notification setting.`,
      });
    } finally {
      setIsUpdatingChannelNotificationLevel(false);
    }
  };

  const handleUpdateDirectMessageNotificationLevel = async (
    notificationLevel: TeamDirectMessage['notificationLevel'],
    successMessage = t`Notification setting updated.`,
  ) => {
    if (
      !effectiveSelectedDirectMessageId ||
      isUpdatingDirectMessageNotificationLevel
    ) {
      return;
    }

    setIsUpdatingDirectMessageNotificationLevel(true);

    try {
      await updateTeamDirectMessageNotificationLevel({
        variables: {
          directMessageThreadId: effectiveSelectedDirectMessageId,
          notificationLevel: notificationLevel.toUpperCase(),
        },
      });
      enqueueInfoSnackBar({ message: successMessage });
    } catch {
      enqueueErrorSnackBar({
        message: t`Failed to update notification setting.`,
      });
    } finally {
      setIsUpdatingDirectMessageNotificationLevel(false);
    }
  };

  const handleUpdatePresenceStatus = async () => {
    if (isUpdatingPresenceStatus) {
      return;
    }

    setIsUpdatingPresenceStatus(true);

    try {
      await updateTeamPresenceStatus({
        variables: {
          statusEmoji:
            statusEmoji.trim().length > 0 ? statusEmoji.trim() : null,
          statusText: statusText.trim().length > 0 ? statusText.trim() : null,
        },
      });
      enqueueInfoSnackBar({ message: t`Status updated.` });
    } catch {
      enqueueErrorSnackBar({ message: t`Failed to update status.` });
    } finally {
      setIsUpdatingPresenceStatus(false);
    }
  };

  const handleClearPresenceStatus = async () => {
    if (isUpdatingPresenceStatus) {
      return;
    }

    setIsUpdatingPresenceStatus(true);

    try {
      await updateTeamPresenceStatus({
        variables: {
          statusEmoji: null,
          statusText: null,
        },
      });
      setStatusEmoji('');
      setStatusText('');
      enqueueInfoSnackBar({ message: t`Status cleared.` });
    } catch {
      enqueueErrorSnackBar({ message: t`Failed to clear status.` });
    } finally {
      setIsUpdatingPresenceStatus(false);
    }
  };

  const handleInsertDraftMention = (candidate: TeamMentionCandidate) => {
    const nextDraftMessage = insertTeamMention({
      candidate,
      draftMessage,
    });

    setDraftMessage(nextDraftMessage);

    if (draftMessageInputElement !== null) {
      draftMessageInputElement.value = nextDraftMessage;
      requestAnimationFrame(() => draftMessageInputElement.focus());
    }
  };

  const handleInsertDraftCommand = (
    suggestion: TeamComposerCommandSuggestion,
  ) => {
    const nextDraftMessage = insertTeamComposerCommandSuggestion({
      command: suggestion.command,
      draftMessage,
    });

    setDraftMessage(nextDraftMessage);

    if (draftMessageInputElement !== null) {
      draftMessageInputElement.value = nextDraftMessage;
      requestAnimationFrame(() => draftMessageInputElement.focus());
    }
  };

  const handleInsertDraftEmojiShortcode = (
    suggestion: TeamEmojiShortcodeSuggestion,
  ) => {
    const nextDraftMessage = insertTeamEmojiShortcodeSuggestion({
      draftMessage,
      suggestion,
    });

    setDraftMessage(nextDraftMessage);

    if (draftMessageInputElement !== null) {
      draftMessageInputElement.value = nextDraftMessage;
      requestAnimationFrame(() => draftMessageInputElement.focus());
    }
  };

  const handleInsertThreadDraftMention = (candidate: TeamMentionCandidate) => {
    const nextThreadDraftMessage = insertTeamMention({
      candidate,
      draftMessage: threadDraftMessage,
    });

    setThreadDraftMessage(nextThreadDraftMessage);

    if (threadDraftMessageInputElement !== null) {
      threadDraftMessageInputElement.value = nextThreadDraftMessage;
      requestAnimationFrame(() => threadDraftMessageInputElement.focus());
    }
  };

  const handleInsertThreadDraftCommand = (
    suggestion: TeamComposerCommandSuggestion,
  ) => {
    const nextThreadDraftMessage = insertTeamComposerCommandSuggestion({
      command: suggestion.command,
      draftMessage: threadDraftMessage,
    });

    setThreadDraftMessage(nextThreadDraftMessage);

    if (threadDraftMessageInputElement !== null) {
      threadDraftMessageInputElement.value = nextThreadDraftMessage;
      requestAnimationFrame(() => threadDraftMessageInputElement.focus());
    }
  };

  const handleInsertThreadDraftEmojiShortcode = (
    suggestion: TeamEmojiShortcodeSuggestion,
  ) => {
    const nextThreadDraftMessage = insertTeamEmojiShortcodeSuggestion({
      draftMessage: threadDraftMessage,
      suggestion,
    });

    setThreadDraftMessage(nextThreadDraftMessage);

    if (threadDraftMessageInputElement !== null) {
      threadDraftMessageInputElement.value = nextThreadDraftMessage;
      requestAnimationFrame(() => threadDraftMessageInputElement.focus());
    }
  };

  const handleApplyComposerFormatShortcut = ({
    event,
    setComposerDraft,
  }: {
    event: KeyboardEvent<HTMLTextAreaElement>;
    setComposerDraft: (draft: string) => void;
  }) => {
    const formatShortcut = getTeamComposerFormatShortcut({
      ctrlKey: event.ctrlKey,
      isComposing: event.nativeEvent.isComposing,
      key: event.key,
      metaKey: event.metaKey,
      shiftKey: event.shiftKey,
    });

    if (formatShortcut === null) {
      return false;
    }

    event.preventDefault();

    const inputElement = event.currentTarget;
    const nextFormattedDraft = applyTeamComposerFormatShortcut({
      draft: inputElement.value,
      format: formatShortcut,
      selectionEnd: inputElement.selectionEnd,
      selectionStart: inputElement.selectionStart,
    });

    setComposerDraft(nextFormattedDraft.draft);
    inputElement.value = nextFormattedDraft.draft;
    requestAnimationFrame(() =>
      inputElement.setSelectionRange(
        nextFormattedDraft.selectionStart,
        nextFormattedDraft.selectionEnd,
      ),
    );

    return true;
  };

  const handleSelectTeamConversationTarget = (
    input: TeamConversationTargetInput,
  ) => {
    const target = getTeamConversationTarget(input);

    if (target.channelId) {
      setSelectedChannelId(target.channelId);
      setSelectedDirectMessageId(null);
    }

    if (target.directMessageThreadId) {
      setSelectedDirectMessageId(target.directMessageThreadId);
      setSelectedChannelId(null);
    }

    setSelectedMessageId(target.messageId);
    setSelectedThreadParentMessageId(target.threadParentMessageId);
    navigateToTeamConversation(target);

    if (target.threadParentMessageId !== null) {
      focusTeamComposerInput(threadDraftMessageInputElement);

      return;
    }

    focusTeamComposerInput(draftMessageInputElement);
  };

  const handleOpenTeamMessageThreadTarget = (
    input: TeamConversationTargetInput,
  ) => {
    const target = getTeamConversationTarget(input);
    const threadParentMessageId =
      target.threadParentMessageId ?? target.messageId;

    if (threadParentMessageId === null) {
      return;
    }

    handleSelectTeamConversationTarget({
      ...target,
      threadParentMessageId,
    });
    focusTeamComposerInput(threadDraftMessageInputElement);
  };

  const handleSelectSearchResult = (result: TeamMessageSearchResult) => {
    handleSelectTeamConversationTarget({
      channelId: result.channelId,
      directMessageThreadId: result.directMessageThreadId,
      messageId: result.id,
      parentMessageId: result.parentMessageId,
    });
    setMessageSearchQuery('');
  };

  const handleSelectMention = (mention: TeamMention) => {
    handleSelectTeamConversationTarget(mention);

    void handleMarkMentionRead(mention.id);
  };

  const handleSelectInboxItem = (item: TeamInboxItem) => {
    handleSelectTeamConversationTarget(item);

    if (item.mentionId) {
      void markTeamMentionRead({
        variables: { mentionId: item.mentionId },
      }).catch(() => {
        enqueueErrorSnackBar({ message: t`Failed to mark mention read.` });
      });
    }
  };

  const handleMarkInboxItemRead = async (
    item: TeamInboxItem,
    options: { showSuccess: boolean } = { showSuccess: true },
  ): Promise<boolean> => {
    try {
      if (item.mentionId) {
        await markTeamMentionRead({
          variables: { mentionId: item.mentionId },
        });
        if (options.showSuccess) {
          enqueueInfoSnackBar({ message: t`Inbox item marked read.` });
        }

        return true;
      }

      if (item.parentMessageId) {
        await markTeamMessageThreadRead({
          variables: { parentMessageId: item.parentMessageId },
        });
        if (options.showSuccess) {
          enqueueInfoSnackBar({ message: t`Inbox item marked read.` });
        }

        return true;
      }

      if (item.directMessageThreadId) {
        await markTeamDirectMessageRead({
          variables: { directMessageThreadId: item.directMessageThreadId },
        });
        if (options.showSuccess) {
          enqueueInfoSnackBar({ message: t`Inbox item marked read.` });
        }

        return true;
      }

      if (item.channelId) {
        await markTeamChannelRead({
          variables: { channelId: item.channelId },
        });
        if (options.showSuccess) {
          enqueueInfoSnackBar({ message: t`Inbox item marked read.` });
        }

        return true;
      }

      return false;
    } catch {
      enqueueErrorSnackBar({ message: t`Failed to mark inbox item read.` });

      return false;
    }
  };

  const handleMarkAllThreadsRead = async () => {
    if (isMarkingThreadsRead || threadInboxItems.length === 0) {
      return;
    }

    setIsMarkingThreadsRead(true);

    try {
      const didMarkAllThreadsRead = (
        await Promise.all(
          threadInboxItems.map((item) =>
            handleMarkInboxItemRead(item, { showSuccess: false }),
          ),
        )
      ).every(Boolean);

      if (didMarkAllThreadsRead) {
        enqueueInfoSnackBar({ message: t`Threads marked read.` });
      }
    } finally {
      setIsMarkingThreadsRead(false);
    }
  };

  const handleMarkMentionRead = async (mentionId: string) => {
    try {
      await markTeamMentionRead({
        variables: { mentionId },
      });
      enqueueInfoSnackBar({ message: t`Mention marked read.` });
    } catch {
      enqueueErrorSnackBar({ message: t`Failed to mark mention read.` });
    }
  };

  const handleMarkAllMentionsRead = async () => {
    if (isMarkingMentionsRead) {
      return;
    }

    const unreadMentions = mentions.filter(
      (mention) => mention.readAt === null,
    );

    if (unreadMentions.length === 0) {
      return;
    }

    setIsMarkingMentionsRead(true);

    try {
      await Promise.all(
        unreadMentions.map((mention) =>
          markTeamMentionRead({
            variables: { mentionId: mention.id },
          }),
        ),
      );
      enqueueInfoSnackBar({ message: t`Mentions marked read.` });
    } catch {
      enqueueErrorSnackBar({ message: t`Failed to mark mentions read.` });
    } finally {
      setIsMarkingMentionsRead(false);
    }
  };

  const handleMarkInboxRead = async () => {
    if (isMarkingInboxRead) {
      return;
    }

    setIsMarkingInboxRead(true);

    try {
      await markTeamInboxRead();
      enqueueInfoSnackBar({ message: t`Inbox marked read.` });
    } catch {
      enqueueErrorSnackBar({ message: t`Failed to mark inbox read.` });
    } finally {
      setIsMarkingInboxRead(false);
    }
  };

  const handleSelectSavedMessage = (message: TeamMessage) => {
    handleSelectTeamConversationTarget(message);
  };

  const handleSelectFile = (file: TeamFile) => {
    handleSelectTeamConversationTarget(file);
  };

  const handleCopyTeamResource = async ({
    copyKey,
    errorMessage,
    successMessage,
    value,
  }: TeamCopyResourceInput) => {
    if (copyingTeamResourceKey === copyKey) {
      return;
    }

    setCopyingTeamResourceKey(copyKey);

    try {
      if (navigator.clipboard?.writeText === undefined) {
        throw new Error('Clipboard API is unavailable.');
      }

      await navigator.clipboard.writeText(value);
      enqueueInfoSnackBar({ message: successMessage });
    } catch {
      enqueueErrorSnackBar({ message: errorMessage });
    } finally {
      setCopyingTeamResourceKey(null);
    }
  };

  const handleCopyFileLink = async (file: TeamFile) =>
    handleCopyTeamResource({
      copyKey: `file-link:${file.id}`,
      errorMessage: t`Failed to copy file link.`,
      successMessage: t`File link copied.`,
      value: file.url,
    });

  const handleSelectReminder = (reminder: TeamMessageReminder) => {
    handleSelectTeamConversationTarget(reminder);
  };

  const clearMessageReminderOption = (messageId: string) => {
    setReminderOptionByMessageId((previousReminderOptionByMessageId) => {
      const nextReminderOptionByMessageId = {
        ...previousReminderOptionByMessageId,
      };

      delete nextReminderOptionByMessageId[messageId];

      return nextReminderOptionByMessageId;
    });
  };

  const handleSetMessageReminder = async (messageId: string) => {
    if (settingReminderMessageId === messageId) {
      return;
    }

    const reminderOptionValue =
      reminderOptionByMessageId[messageId] ??
      DEFAULT_TEAM_MESSAGE_REMINDER_OPTION_VALUE;

    setSettingReminderMessageId(messageId);

    try {
      await setTeamMessageReminder({
        variables: {
          messageId,
          remindAt: getTeamMessageReminderDate({
            now: new Date(),
            optionValue: reminderOptionValue,
          }).toISOString(),
        },
      });
      clearMessageReminderOption(messageId);
      enqueueInfoSnackBar({ message: t`Reminder set.` });
    } catch {
      enqueueErrorSnackBar({ message: t`Failed to set reminder.` });
    } finally {
      setSettingReminderMessageId(null);
    }
  };

  const handleChangeMessageReminderOption = (
    messageId: string,
    optionValue: string,
  ) => {
    setReminderOptionByMessageId((previousReminderOptionByMessageId) => ({
      ...previousReminderOptionByMessageId,
      [messageId]: optionValue,
    }));
  };

  const handleDismissMessageReminder = async (messageId: string) => {
    if (dismissingReminderMessageId === messageId) {
      return;
    }

    setDismissingReminderMessageId(messageId);

    try {
      await dismissTeamMessageReminder({
        variables: {
          messageId,
        },
      });
      clearMessageReminderOption(messageId);
      enqueueInfoSnackBar({ message: t`Reminder dismissed.` });
    } catch {
      enqueueErrorSnackBar({ message: t`Failed to dismiss reminder.` });
    } finally {
      setDismissingReminderMessageId(null);
    }
  };

  const handleDismissAllMessageReminders = async () => {
    if (isDismissingAllReminders || reminders.length === 0) {
      return;
    }

    setIsDismissingAllReminders(true);

    try {
      await Promise.all(
        reminders.map((reminder) =>
          dismissTeamMessageReminder({
            variables: {
              messageId: reminder.messageId,
            },
          }),
        ),
      );
      reminders.forEach((reminder) => {
        clearMessageReminderOption(reminder.messageId);
      });
      enqueueInfoSnackBar({ message: t`Reminders dismissed.` });
    } catch {
      enqueueErrorSnackBar({ message: t`Failed to dismiss reminders.` });
    } finally {
      setIsDismissingAllReminders(false);
    }
  };

  const handleSnoozeMessageReminder = async (messageId: string) => {
    if (snoozingReminderMessageId === messageId) {
      return;
    }

    setSnoozingReminderMessageId(messageId);

    try {
      await setTeamMessageReminder({
        variables: {
          messageId,
          remindAt: getTeamMessageReminderDate({
            now: new Date(),
            optionValue: DEFAULT_TEAM_MESSAGE_REMINDER_OPTION_VALUE,
          }).toISOString(),
        },
      });
      clearMessageReminderOption(messageId);
      enqueueInfoSnackBar({ message: t`Reminder snoozed.` });
    } catch {
      enqueueErrorSnackBar({ message: t`Failed to snooze reminder.` });
    } finally {
      setSnoozingReminderMessageId(null);
    }
  };

  const handleLoadEarlierMessages = async () => {
    const before = messages[0]?.createdAt;

    if (!canLoadEarlierMessages || !before || isLoadingEarlierMessages) {
      return;
    }

    setIsLoadingEarlierMessages(true);

    try {
      if (isDirectMessageSelected && effectiveSelectedDirectMessageId) {
        let hasLoadedAllEarlierDirectMessages = false;

        await fetchMoreDirectMessageMessages({
          updateQuery: (previousResult, { fetchMoreResult }) => {
            const olderMessages =
              fetchMoreResult?.teamDirectMessageMessages ?? [];
            const mergedMessages = mergeEarlierTeamMessages({
              existingMessages: previousResult.teamDirectMessageMessages,
              olderMessages,
              pageSize: TEAM_MESSAGE_PAGE_SIZE,
            });

            hasLoadedAllEarlierDirectMessages =
              mergedMessages.hasLoadedAllEarlierMessages;

            return {
              teamDirectMessageMessages: mergedMessages.messages,
            };
          },
          variables: {
            before,
            directMessageThreadId: effectiveSelectedDirectMessageId,
          },
        });
        setHasLoadedAllEarlierMessages(hasLoadedAllEarlierDirectMessages);

        return;
      }

      if (effectiveSelectedChannelId) {
        let hasLoadedAllEarlierChannelMessages = false;

        await fetchMoreChannelMessages({
          updateQuery: (previousResult, { fetchMoreResult }) => {
            const olderMessages = fetchMoreResult?.teamMessages ?? [];
            const mergedMessages = mergeEarlierTeamMessages({
              existingMessages: previousResult.teamMessages,
              olderMessages,
              pageSize: TEAM_MESSAGE_PAGE_SIZE,
            });

            hasLoadedAllEarlierChannelMessages =
              mergedMessages.hasLoadedAllEarlierMessages;

            return {
              teamMessages: mergedMessages.messages,
            };
          },
          variables: {
            before,
            channelId: effectiveSelectedChannelId,
          },
        });
        setHasLoadedAllEarlierMessages(hasLoadedAllEarlierChannelMessages);
      }
    } catch {
      enqueueErrorSnackBar({ message: t`Failed to load earlier messages.` });
    } finally {
      setIsLoadingEarlierMessages(false);
    }
  };

  const handleLoadEarlierThreadMessages = async () => {
    const before = firstVisibleThreadReply?.createdAt;

    if (
      !canLoadEarlierThreadMessages ||
      !before ||
      !selectedThreadParentMessageId ||
      isLoadingEarlierThreadMessages
    ) {
      return;
    }

    setIsLoadingEarlierThreadMessages(true);

    try {
      let hasLoadedAllEarlierThreadReplies = false;

      await fetchMoreThreadMessages({
        updateQuery: (previousResult, { fetchMoreResult }) => {
          const olderThreadMessages =
            fetchMoreResult?.teamMessageThread.filter(
              (message) => message.id !== selectedThreadParentMessageId,
            ) ?? [];
          const mergedMessages = mergeEarlierTeamMessages({
            existingMessages: previousResult.teamMessageThread,
            olderMessages: olderThreadMessages,
            pageSize: TEAM_MESSAGE_PAGE_SIZE,
          });

          hasLoadedAllEarlierThreadReplies =
            mergedMessages.hasLoadedAllEarlierMessages;

          return {
            teamMessageThread: mergedMessages.messages,
          };
        },
        variables: {
          before,
          parentMessageId: selectedThreadParentMessageId,
        },
      });

      setHasLoadedAllEarlierThreadMessages(hasLoadedAllEarlierThreadReplies);
    } catch {
      enqueueErrorSnackBar({ message: t`Failed to load earlier messages.` });
    } finally {
      setIsLoadingEarlierThreadMessages(false);
    }
  };

  const handleJumpToTeamMessage = ({
    messageId,
    scope,
  }: {
    messageId: string | null;
    scope: 'main' | 'thread';
  }) => {
    if (messageId === null) {
      return;
    }

    document
      .getElementById(getTeamMessageElementId({ messageId, scope }))
      ?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
  };

  const handleJumpToMainConversationActivity = () => {
    handleJumpToTeamMessage({
      messageId: mainUnreadDividerMessageId ?? latestMainMessageId,
      scope: 'main',
    });
  };

  const handleJumpToThreadActivity = () => {
    handleJumpToTeamMessage({
      messageId: threadUnreadDividerMessageId ?? latestThreadMessageId,
      scope: 'thread',
    });
  };

  const handleMarkMessageUnread = async (messageId: string) => {
    if (markingUnreadMessageId === messageId) {
      return;
    }

    setMarkingUnreadMessageId(messageId);

    try {
      await markTeamMessageUnread({
        variables: {
          messageId,
        },
      });
    } catch {
      enqueueErrorSnackBar({ message: t`Failed to mark message unread.` });

      return;
    } finally {
      setMarkingUnreadMessageId(null);
    }

    setMarkedUnreadMessageId(messageId);
    enqueueInfoSnackBar({ message: t`Message marked unread.` });
  };

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    if (!isComposerEnabled || togglingReactionMessageId === messageId) {
      return false;
    }

    setTogglingReactionMessageId(messageId);

    try {
      await toggleTeamMessageReaction({
        variables: {
          emoji,
          messageId,
        },
      });

      return true;
    } catch {
      enqueueErrorSnackBar({ message: t`Failed to update reaction.` });

      return false;
    } finally {
      setTogglingReactionMessageId(null);
    }
  };

  const handleCustomReactionChange = (messageId: string, value: string) => {
    setActiveCustomReactionMessageId(messageId);
    setCustomReactionByMessageId((previousCustomReactionByMessageId) => ({
      ...previousCustomReactionByMessageId,
      [messageId]: value,
    }));
  };

  const handleInsertCustomReactionEmojiShortcode = ({
    messageId,
    suggestion,
  }: {
    messageId: string;
    suggestion: TeamEmojiShortcodeSuggestion;
  }) => {
    const nextCustomReaction = insertTeamEmojiShortcodeSuggestion({
      draftMessage: customReactionByMessageId[messageId] ?? '',
      suggestion,
    }).trim();

    setActiveCustomReactionMessageId(messageId);
    setCustomReactionByMessageId((previousCustomReactionByMessageId) => ({
      ...previousCustomReactionByMessageId,
      [messageId]: nextCustomReaction,
    }));
  };

  const handleSendCustomReaction = async (messageId: string) => {
    if (!isComposerEnabled || togglingReactionMessageId === messageId) {
      return;
    }

    const reaction = normalizeTeamReactionInput(
      customReactionByMessageId[messageId] ?? '',
    );

    if (reaction === null) {
      enqueueErrorSnackBar({ message: t`Enter an emoji reaction.` });

      return;
    }

    const didToggleReaction = await handleToggleReaction(messageId, reaction);

    if (!didToggleReaction) {
      return;
    }

    setCustomReactionByMessageId((previousCustomReactionByMessageId) => {
      const nextCustomReactionByMessageId = {
        ...previousCustomReactionByMessageId,
      };

      delete nextCustomReactionByMessageId[messageId];

      return nextCustomReactionByMessageId;
    });
  };

  const handleToggleMessagePin = async (
    messageId: string,
    isCurrentlyPinned: boolean,
  ) => {
    if (
      togglingPinnedMessageId === messageId ||
      (!isComposerEnabled && !isTeamPanelFocused)
    ) {
      return;
    }

    setTogglingPinnedMessageId(messageId);

    try {
      await toggleTeamMessagePin({
        variables: {
          messageId,
        },
      });
      enqueueInfoSnackBar({
        message: isCurrentlyPinned ? t`Message unpinned.` : t`Message pinned.`,
      });
    } catch {
      enqueueErrorSnackBar({ message: t`Failed to pin message.` });
    } finally {
      setTogglingPinnedMessageId(null);
    }
  };

  const handleToggleMessageBookmark = async (
    messageId: string,
    isCurrentlySaved: boolean,
  ) => {
    if (
      togglingSavedMessageId === messageId ||
      (!isComposerEnabled && !isTeamPanelFocused)
    ) {
      return;
    }

    setTogglingSavedMessageId(messageId);

    try {
      await toggleTeamMessageBookmark({
        variables: {
          messageId,
        },
      });
      enqueueInfoSnackBar({
        message: isCurrentlySaved ? t`Message unsaved.` : t`Message saved.`,
      });
    } catch {
      enqueueErrorSnackBar({ message: t`Failed to update saved message.` });
    } finally {
      setTogglingSavedMessageId(null);
    }
  };

  const handleStartEditingMessage = (message: TeamMessage) => {
    setEditingMessageId(message.id);
    setEditingMessageBody(message.body);
  };

  const handleStartEditingLastMainMessage = () => {
    const lastEditableMessage = getLastEditableTeamMessage(messages);

    if (lastEditableMessage === null) {
      return;
    }

    handleStartEditingMessage(lastEditableMessage);
  };

  const handleStartEditingLastThreadMessage = () => {
    const lastEditableMessage = getLastEditableTeamMessage(
      visibleThreadMessages,
    );

    if (lastEditableMessage === null) {
      return;
    }

    handleStartEditingMessage(lastEditableMessage);
  };

  const handleCancelEditingMessage = () => {
    setEditingMessageId(null);
    setEditingMessageBody('');
  };

  const handleSaveEditingMessage = async () => {
    const trimmedEditingMessageBody = editingMessageBody.trim();

    if (
      !editingMessageId ||
      trimmedEditingMessageBody.length === 0 ||
      isSavingMessageEdit
    ) {
      return;
    }

    setIsSavingMessageEdit(true);

    try {
      await updateTeamMessage({
        variables: {
          body: trimmedEditingMessageBody,
          messageId: editingMessageId,
        },
      });
      handleCancelEditingMessage();
      enqueueInfoSnackBar({ message: t`Message updated.` });
    } catch {
      enqueueErrorSnackBar({ message: t`Failed to update message.` });
    } finally {
      setIsSavingMessageEdit(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (deletingMessageId === messageId) {
      return;
    }

    if (!window.confirm(t`Delete this message?`)) {
      return;
    }

    setDeletingMessageId(messageId);

    try {
      await deleteTeamMessage({
        variables: { messageId },
      });
    } catch {
      enqueueErrorSnackBar({ message: t`Failed to delete message.` });

      return;
    } finally {
      setDeletingMessageId(null);
    }

    if (selectedThreadParentMessageId === messageId) {
      setSelectedThreadParentMessageId(null);
    }

    if (selectedMessageId === messageId) {
      setSelectedMessageId(null);
    }

    if (editingMessageId === messageId) {
      handleCancelEditingMessage();
    }

    enqueueInfoSnackBar({ message: t`Message deleted.` });
  };

  const handleOpenThread = (messageId: string) => {
    setSelectedThreadParentMessageId(messageId);
    navigateToTeamConversation({
      channelId: isDirectMessageSelected ? null : effectiveSelectedChannelId,
      directMessageThreadId: isDirectMessageSelected
        ? effectiveSelectedDirectMessageId
        : null,
      messageId,
      threadParentMessageId: messageId,
    });
    focusTeamComposerInput(threadDraftMessageInputElement);
  };

  const handleCloseThread = useCallback(() => {
    setSelectedThreadParentMessageId(null);
    setSelectedMessageId(null);
    navigateToTeamConversation({
      channelId: isDirectMessageSelected ? null : effectiveSelectedChannelId,
      directMessageThreadId: isDirectMessageSelected
        ? effectiveSelectedDirectMessageId
        : null,
    });
  }, [
    effectiveSelectedChannelId,
    effectiveSelectedDirectMessageId,
    isDirectMessageSelected,
    navigateToTeamConversation,
  ]);

  useEffect(() => {
    const handleTeamThreadCloseShortcut = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        !shouldCloseTeamThread({
          hasOpenThread: selectedThreadParentMessageId !== null,
          isComposing: event.isComposing,
          isEditingMessage: editingMessageId !== null,
          key: event.key,
        })
      ) {
        return;
      }

      event.preventDefault();
      handleCloseThread();
    };

    window.addEventListener('keydown', handleTeamThreadCloseShortcut);

    return () =>
      window.removeEventListener('keydown', handleTeamThreadCloseShortcut);
  }, [
    editingMessageId,
    effectiveSelectedChannelId,
    effectiveSelectedDirectMessageId,
    handleCloseThread,
    isDirectMessageSelected,
    selectedThreadParentMessageId,
  ]);

  const renderTeamMessageAuthorStatus = (message: TeamMessage) => {
    const authorPresence = presenceByUserWorkspaceId.get(
      message.authorUserWorkspaceId,
    );

    if (!authorPresence?.statusText) {
      return null;
    }

    return (
      <StyledAuthorStatus>
        {authorPresence?.statusEmoji ? `${authorPresence.statusEmoji} ` : ''}
        {authorPresence.statusText}
      </StyledAuthorStatus>
    );
  };

  const renderTeamMessageTextSegments = (text: string) =>
    formatTeamMessageTextSegments(text).map((segment, segmentIndex) => {
      if (segment.type === 'bold') {
        return (
          <StyledMessageBodyBold key={`${segment.type}-${segmentIndex}`}>
            {segment.text}
          </StyledMessageBodyBold>
        );
      }

      if (segment.type === 'italic') {
        return (
          <StyledMessageBodyItalic key={`${segment.type}-${segmentIndex}`}>
            {segment.text}
          </StyledMessageBodyItalic>
        );
      }

      if (segment.type === 'strikethrough') {
        return (
          <StyledMessageBodyStrikethrough
            key={`${segment.type}-${segmentIndex}`}
          >
            {segment.text}
          </StyledMessageBodyStrikethrough>
        );
      }

      if (segment.type === 'code') {
        return (
          <StyledMessageBodyCode key={`${segment.type}-${segmentIndex}`}>
            {segment.text}
          </StyledMessageBodyCode>
        );
      }

      if (segment.type === 'mention') {
        return (
          <StyledMessageBodyMention key={`${segment.type}-${segmentIndex}`}>
            {segment.text}
          </StyledMessageBodyMention>
        );
      }

      return segment.type === 'link' ? (
        <StyledMessageBodyLink
          key={`${segment.type}-${segmentIndex}`}
          href={segment.href}
          rel="noreferrer"
          target="_blank"
        >
          {segment.text}
        </StyledMessageBodyLink>
      ) : (
        <StyledMessageBodyText key={`${segment.type}-${segmentIndex}`}>
          {segment.text}
        </StyledMessageBodyText>
      );
    });

  const renderTeamMessageBody = (messageBody: string) => (
    <StyledMessageBody>
      {formatTeamMessageBody(messageBody).map((block, blockIndex) => {
        if (block.type === 'code-block') {
          return (
            <StyledMessageBodyCodeBlock key={`${block.type}-${blockIndex}`}>
              {block.text}
            </StyledMessageBodyCodeBlock>
          );
        }

        return block.type === 'quote' ? (
          <StyledMessageBodyQuote key={`${block.type}-${blockIndex}`}>
            {renderTeamMessageTextSegments(block.text)}
          </StyledMessageBodyQuote>
        ) : (
          <StyledMessageBodyText key={`${block.type}-${blockIndex}`}>
            {renderTeamMessageTextSegments(block.text)}
          </StyledMessageBodyText>
        );
      })}
    </StyledMessageBody>
  );

  const renderTeamMentionSuggestions = ({
    activeIndex,
    candidates,
    onSelect,
  }: {
    activeIndex: number;
    candidates: TeamMentionCandidate[];
    onSelect: (candidate: TeamMentionCandidate) => void;
  }) =>
    candidates.length > 0 ? (
      <StyledMentionSuggestions>
        {candidates.map((candidate, candidateIndex) => (
          <StyledMentionSuggestionButton
            key={candidate.userWorkspaceId}
            active={candidateIndex === activeIndex}
            type="button"
            onClick={() => onSelect(candidate)}
            onMouseDown={(event) => event.preventDefault()}
          >
            <StyledMentionSuggestionName>
              {candidate.name}
            </StyledMentionSuggestionName>
            {candidate.email ? (
              <StyledMentionSuggestionEmail>
                @{candidate.email.split('@')[0]}
              </StyledMentionSuggestionEmail>
            ) : null}
            {candidate.statusText ? (
              <StyledMentionSuggestionEmail>
                {candidate.statusEmoji ? `${candidate.statusEmoji} ` : ''}
                {candidate.statusText}
              </StyledMentionSuggestionEmail>
            ) : null}
          </StyledMentionSuggestionButton>
        ))}
      </StyledMentionSuggestions>
    ) : null;

  const renderTeamCommandSuggestions = ({
    activeIndex,
    onSelect,
    suggestions,
  }: {
    activeIndex: number;
    onSelect: (suggestion: TeamComposerCommandSuggestion) => void;
    suggestions: TeamComposerCommandSuggestion[];
  }) =>
    suggestions.length > 0 ? (
      <StyledMentionSuggestions>
        {suggestions.map((suggestion, suggestionIndex) => (
          <StyledMentionSuggestionButton
            key={suggestion.command}
            active={suggestionIndex === activeIndex}
            type="button"
            onClick={() => onSelect(suggestion)}
            onMouseDown={(event) => event.preventDefault()}
          >
            <StyledMentionSuggestionName>
              {suggestion.usage}
            </StyledMentionSuggestionName>
            <StyledMentionSuggestionEmail>
              {suggestion.description}
            </StyledMentionSuggestionEmail>
          </StyledMentionSuggestionButton>
        ))}
      </StyledMentionSuggestions>
    ) : null;

  const renderTeamEmojiShortcodeSuggestions = ({
    activeIndex,
    onSelect,
    suggestions,
  }: {
    activeIndex: number;
    onSelect: (suggestion: TeamEmojiShortcodeSuggestion) => void;
    suggestions: TeamEmojiShortcodeSuggestion[];
  }) =>
    suggestions.length > 0 ? (
      <StyledMentionSuggestions>
        {suggestions.map((suggestion, suggestionIndex) => (
          <StyledMentionSuggestionButton
            key={suggestion.shortcode}
            active={suggestionIndex === activeIndex}
            type="button"
            onClick={() => onSelect(suggestion)}
            onMouseDown={(event) => event.preventDefault()}
          >
            <StyledMentionSuggestionName>
              {suggestion.emoji} {suggestion.shortcode}
            </StyledMentionSuggestionName>
            <StyledMentionSuggestionEmail>
              {suggestion.name}
            </StyledMentionSuggestionEmail>
          </StyledMentionSuggestionButton>
        ))}
      </StyledMentionSuggestions>
    ) : null;

  const handleToggleSelectedConversationStar = () => {
    if (
      selectedConversationStarKey === null ||
      isTogglingSelectedConversationStar
    ) {
      return;
    }

    setIsTogglingSelectedConversationStar(true);

    try {
      setStarredConversationKeys((currentKeys) =>
        toggleTeamStarredConversationKey({
          conversationKey: selectedConversationStarKey,
          currentKeys,
        }),
      );
      enqueueInfoSnackBar({
        message: isSelectedConversationStarred
          ? t`Conversation unstarred.`
          : t`Conversation starred.`,
      });
    } finally {
      setIsTogglingSelectedConversationStar(false);
    }
  };

  const handleToggleSelectedConversationMute = () => {
    const nextNotificationLevel = getNextTeamConversationMuteLevel(
      selectedConversationNotificationLevel,
    );
    const successMessage =
      nextNotificationLevel === 'MUTED'
        ? t`Conversation muted.`
        : t`Conversation unmuted.`;

    if (isDirectMessageSelected) {
      void handleUpdateDirectMessageNotificationLevel(
        nextNotificationLevel as TeamDirectMessage['notificationLevel'],
        successMessage,
      );

      return;
    }

    void handleUpdateChannelNotificationLevel(
      nextNotificationLevel as TeamChannelMember['notificationLevel'],
      successMessage,
    );
  };

  const handleQuoteMessage = (
    message: TeamMessage,
    targetComposer: 'main' | 'thread',
  ) => {
    const quoteDraft = buildTeamQuoteDraft({
      authorName: message.authorName,
      body: message.body,
      fallbackBody: t`Attachment message`,
    });

    if (targetComposer === 'thread') {
      setThreadDraftMessage((currentDraft) =>
        appendTeamQuoteDraft({ currentDraft, quoteDraft }),
      );
      requestAnimationFrame(() => threadDraftMessageInputElement?.focus());

      return;
    }

    setDraftMessage((currentDraft) =>
      appendTeamQuoteDraft({ currentDraft, quoteDraft }),
    );
    requestAnimationFrame(() => draftMessageInputElement?.focus());
  };

  const handleCopyThreadLink = async () => {
    if (!selectedThreadParentMessageId) {
      return;
    }

    const threadLink = buildTeamMessageLink({
      channelId: isDirectMessageSelected ? null : effectiveSelectedChannelId,
      directMessageThreadId: isDirectMessageSelected
        ? effectiveSelectedDirectMessageId
        : null,
      messageId: selectedThreadParentMessageId,
      origin: window.location.origin,
      parentMessageId: selectedThreadParentMessageId,
      pathname: '/team',
    });

    await handleCopyTeamResource({
      copyKey: `thread-link:${selectedThreadParentMessageId}`,
      errorMessage: t`Failed to copy thread link.`,
      successMessage: t`Thread link copied.`,
      value: threadLink,
    });
  };

  const handleCopyConversationLink = async () => {
    if (!effectiveSelectedDirectMessageId && !effectiveSelectedChannelId) {
      return;
    }

    const conversationUrl = new URL('/team', window.location.origin);

    if (isDirectMessageSelected && effectiveSelectedDirectMessageId) {
      conversationUrl.searchParams.set(
        'teamDirectMessageId',
        effectiveSelectedDirectMessageId,
      );
    } else if (effectiveSelectedChannelId) {
      conversationUrl.searchParams.set(
        'teamChannelId',
        effectiveSelectedChannelId,
      );
    }

    await handleCopyTeamResource({
      copyKey: `conversation-link:${
        isDirectMessageSelected
          ? effectiveSelectedDirectMessageId
          : effectiveSelectedChannelId
      }`,
      errorMessage: t`Failed to copy conversation link.`,
      successMessage: t`Conversation link copied.`,
      value: conversationUrl.toString(),
    });
  };

  const handleCopyMessageLink = async (message: {
    channelId?: string | null;
    directMessageThreadId?: string | null;
    id: string;
    messageId?: string | null;
    parentMessageId?: string | null;
  }) => {
    const messageId = message.messageId ?? message.id;
    const messageLink = buildTeamMessageLink({
      channelId: message.channelId,
      directMessageThreadId: message.directMessageThreadId,
      messageId,
      origin: window.location.origin,
      parentMessageId: message.parentMessageId,
      pathname: '/team',
    });

    await handleCopyTeamResource({
      copyKey: `message-link:${messageId}`,
      errorMessage: t`Failed to copy message link.`,
      successMessage: t`Message link copied.`,
      value: messageLink,
    });
  };

  const handleCopyMessageText = async (message: {
    body: string;
    id?: string;
    messageId?: string | null;
  }) => {
    const messageText = getTeamMessageCopyText({
      body: message.body,
      fallbackBody: t`Attachment message`,
    });

    await handleCopyTeamResource({
      copyKey: `message-text:${message.messageId ?? message.id ?? message.body}`,
      errorMessage: t`Failed to copy message text.`,
      successMessage: t`Message text copied.`,
      value: messageText,
    });
  };

  const handleCopyAttachmentLink = async (attachment: { url: string }) =>
    handleCopyTeamResource({
      copyKey: `attachment-link:${attachment.url}`,
      errorMessage: t`Failed to copy attachment link.`,
      successMessage: t`Attachment link copied.`,
      value: attachment.url,
    });

  const handleSelectAttachments = async (
    files: File[],
    pendingAttachmentCount: number,
    appendAttachments: (attachments: TeamMessageAttachment[]) => void,
  ) => {
    const availableSlotCount =
      TEAM_PENDING_ATTACHMENT_LIMIT - pendingAttachmentCount;
    const selectedFiles = files.slice(0, Math.max(availableSlotCount, 0));

    if (availableSlotCount <= 0) {
      enqueueErrorSnackBar({
        message: t`Attachment limit reached.`,
      });

      return;
    }

    if (files.length > availableSlotCount) {
      enqueueErrorSnackBar({
        message: t`Only 5 attachments can be added to one message.`,
      });
    }

    if (selectedFiles.length === 0) {
      return;
    }

    const uploadedAttachments: TeamMessageAttachment[] = [];

    for (const file of selectedFiles) {
      if (file.size > TEAM_ATTACHMENT_MAX_SIZE_BYTES) {
        enqueueErrorSnackBar({
          message: t`Attachment is too large.`,
        });

        continue;
      }

      try {
        const result = await uploadTeamMessageAttachment({
          variables: {
            channelId: isDirectMessageSelected
              ? null
              : effectiveSelectedChannelId,
            directMessageThreadId: isDirectMessageSelected
              ? effectiveSelectedDirectMessageId
              : null,
            file,
          },
        });
        const uploadedAttachment = result.data?.uploadTeamMessageAttachment;

        if (uploadedAttachment === undefined) {
          throw new Error('Upload failed.');
        }

        uploadedAttachments.push({
          mimeType: file.type || null,
          name: file.name,
          size: uploadedAttachment.size ?? file.size,
          url: uploadedAttachment.url,
        });
      } catch {
        enqueueErrorSnackBar({
          message: t`Failed to upload attachment.`,
        });
      }
    }

    if (uploadedAttachments.length > 0) {
      appendAttachments(uploadedAttachments);
    }
  };

  const handleAttachmentInputChange = async (
    files: FileList | null,
    pendingAttachmentCount: number,
    appendAttachments: (attachments: TeamMessageAttachment[]) => void,
    resetInput: () => void,
  ) => {
    try {
      await handleSelectAttachments(
        Array.from(files ?? []),
        pendingAttachmentCount,
        appendAttachments,
      );
    } finally {
      resetInput();
    }
  };

  const hasDraggedFiles = (event: DragEvent<HTMLElement>) =>
    Array.from(event.dataTransfer.types).includes('Files');

  const handleAttachmentDragEnter = ({
    event,
    setDragActive,
  }: {
    event: DragEvent<HTMLElement>;
    setDragActive: (dragActive: boolean) => void;
  }) => {
    if (!isComposerEnabled || !hasDraggedFiles(event)) {
      return;
    }

    event.preventDefault();
    setDragActive(true);
  };

  const handleAttachmentDragOver = (event: DragEvent<HTMLElement>) => {
    if (!isComposerEnabled || !hasDraggedFiles(event)) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };

  const handleAttachmentDragLeave = ({
    event,
    setDragActive,
  }: {
    event: DragEvent<HTMLElement>;
    setDragActive: (dragActive: boolean) => void;
  }) => {
    const nextTarget = event.relatedTarget;

    if (
      nextTarget instanceof Node &&
      event.currentTarget.contains(nextTarget)
    ) {
      return;
    }

    setDragActive(false);
  };

  const handleAttachmentDrop = async ({
    appendAttachments,
    event,
    pendingAttachmentCount,
    setDragActive,
  }: {
    appendAttachments: (attachments: TeamMessageAttachment[]) => void;
    event: DragEvent<HTMLElement>;
    pendingAttachmentCount: number;
    setDragActive: (dragActive: boolean) => void;
  }) => {
    setDragActive(false);

    if (!isComposerEnabled || !hasDraggedFiles(event)) {
      return;
    }

    event.preventDefault();
    await handleSelectAttachments(
      Array.from(event.dataTransfer.files),
      pendingAttachmentCount,
      appendAttachments,
    );
  };

  const handleAttachmentPaste = async ({
    appendAttachments,
    event,
    pendingAttachmentCount,
  }: {
    appendAttachments: (attachments: TeamMessageAttachment[]) => void;
    event: ClipboardEvent<HTMLTextAreaElement>;
    pendingAttachmentCount: number;
  }) => {
    if (!isComposerEnabled || event.clipboardData.files.length === 0) {
      return;
    }

    event.preventDefault();
    await handleSelectAttachments(
      Array.from(event.clipboardData.files),
      pendingAttachmentCount,
      appendAttachments,
    );
  };

  const mainTypingIndicatorText =
    formatTeamTypingIndicatorText(mainTypingIndicators);
  const threadTypingIndicatorText = formatTeamTypingIndicatorText(
    threadTypingIndicators,
  );

  const renderTeamInboxItem = (item: TeamInboxItem) => (
    <StyledInboxResult key={item.id}>
      <StyledInboxResultButton
        type="button"
        onClick={() => handleSelectInboxItem(item)}
      >
        <StyledSearchResultMeta>
          {item.title} · {item.unreadCount}
        </StyledSearchResultMeta>
        {item.subtitle != null ? (
          <StyledSearchResultBody>
            {getTeamLiveMessageNotificationBody(item.subtitle ?? '')}
          </StyledSearchResultBody>
        ) : null}
      </StyledInboxResultButton>
      <StyledInlineActionButton
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          void handleMarkInboxItemRead(item);
        }}
      >
        {t`Read`}
      </StyledInlineActionButton>
      {item.subtitle != null ? (
        <StyledInlineActionButton
          type="button"
          disabled={copyingTeamResourceKey === `message-text:${item.id}`}
          onClick={(event) => {
            event.stopPropagation();
            void handleCopyMessageText({
              body: item.subtitle ?? '',
              id: item.id,
            });
          }}
        >
          {t`Copy text`}
        </StyledInlineActionButton>
      ) : null}
      {item.messageId != null ? (
        <StyledInlineActionButton
          type="button"
          disabled={copyingTeamResourceKey === `message-link:${item.messageId}`}
          onClick={(event) => {
            event.stopPropagation();
            void handleCopyMessageLink(item);
          }}
        >
          {t`Copy link`}
        </StyledInlineActionButton>
      ) : null}
      {item.messageId != null ? (
        <StyledInlineActionButton
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            handleOpenTeamMessageThreadTarget(item);
          }}
        >
          {t`Open thread`}
        </StyledInlineActionButton>
      ) : null}
    </StyledInboxResult>
  );

  const renderTeamSavedMessage = (message: TeamMessage) => (
    <StyledInboxResult key={message.id}>
      <StyledInboxResultButton
        type="button"
        onClick={() => handleSelectSavedMessage(message)}
      >
        <StyledSearchResultMeta>
          {message.channelId ? '#' : ''}
          {message.conversationName ?? message.authorName ?? t`Message`}
        </StyledSearchResultMeta>
        <StyledSearchResultBody>
          {message.body.length > 0 ? message.body : t`Attachment message`}
        </StyledSearchResultBody>
      </StyledInboxResultButton>
      <StyledInlineActionButton
        type="button"
        disabled={togglingSavedMessageId === message.id}
        onClick={(event) => {
          event.stopPropagation();
          void handleToggleMessageBookmark(message.id, true);
        }}
      >
        {t`Unsave`}
      </StyledInlineActionButton>
      <StyledInlineActionButton
        type="button"
        disabled={copyingTeamResourceKey === `message-text:${message.id}`}
        onClick={(event) => {
          event.stopPropagation();
          void handleCopyMessageText(message);
        }}
      >
        {t`Copy text`}
      </StyledInlineActionButton>
      <StyledInlineActionButton
        type="button"
        disabled={copyingTeamResourceKey === `message-link:${message.id}`}
        onClick={(event) => {
          event.stopPropagation();
          void handleCopyMessageLink(message);
        }}
      >
        {t`Copy link`}
      </StyledInlineActionButton>
      <StyledInlineActionButton
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          handleOpenTeamMessageThreadTarget(message);
        }}
      >
        {t`Open thread`}
      </StyledInlineActionButton>
    </StyledInboxResult>
  );

  const renderTeamPinnedMessage = (message: TeamMessage) => (
    <StyledInboxResult key={message.id}>
      <StyledInboxResultButton
        type="button"
        onClick={() => handleSelectTeamConversationTarget(message)}
      >
        <StyledSearchResultMeta>
          {message.channelId ? '#' : ''}
          {message.conversationName ?? message.authorName ?? t`Message`} ·{' '}
          {message.authorName}
        </StyledSearchResultMeta>
        <StyledSearchResultBody>
          {message.body.length > 0 ? message.body : t`Attachment message`}
        </StyledSearchResultBody>
      </StyledInboxResultButton>
      <StyledInlineActionButton
        type="button"
        disabled={togglingPinnedMessageId === message.id}
        onClick={(event) => {
          event.stopPropagation();
          void handleToggleMessagePin(message.id, true);
        }}
      >
        {t`Unpin`}
      </StyledInlineActionButton>
      <StyledInlineActionButton
        type="button"
        disabled={copyingTeamResourceKey === `message-text:${message.id}`}
        onClick={(event) => {
          event.stopPropagation();
          void handleCopyMessageText(message);
        }}
      >
        {t`Copy text`}
      </StyledInlineActionButton>
      <StyledInlineActionButton
        type="button"
        disabled={copyingTeamResourceKey === `message-link:${message.id}`}
        onClick={(event) => {
          event.stopPropagation();
          void handleCopyMessageLink(message);
        }}
      >
        {t`Copy link`}
      </StyledInlineActionButton>
      <StyledInlineActionButton
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          handleOpenTeamMessageThreadTarget(message);
        }}
      >
        {t`Open thread`}
      </StyledInlineActionButton>
    </StyledInboxResult>
  );

  const renderTeamFile = (file: TeamFile) => (
    <StyledFileResult key={file.id}>
      <StyledFileResultButton
        type="button"
        onClick={() => handleSelectFile(file)}
      >
        <StyledSearchResultMeta>
          {file.conversationType === 'channel' ? '#' : ''}{' '}
          {file.conversationName} · {file.authorName}
        </StyledSearchResultMeta>
        {file.size !== undefined && file.size !== null ? (
          <StyledSearchResultMeta>
            {formatFileSize(file.size)}
          </StyledSearchResultMeta>
        ) : null}
        {file.createdAt ? (
          <StyledSearchResultMeta>
            {new Intl.DateTimeFormat(undefined, {
              hour: '2-digit',
              minute: '2-digit',
            }).format(new Date(file.createdAt))}
          </StyledSearchResultMeta>
        ) : null}
        <StyledSearchResultBody>{file.name}</StyledSearchResultBody>
      </StyledFileResultButton>
      <StyledFileOpenLink href={file.url} rel="noreferrer" target="_blank">
        {t`Open file`}
      </StyledFileOpenLink>
      <StyledInlineActionButton
        type="button"
        disabled={copyingTeamResourceKey === `file-link:${file.id}`}
        onClick={(event) => {
          event.stopPropagation();
          void handleCopyFileLink(file);
        }}
      >
        {t`Copy file link`}
      </StyledInlineActionButton>
      <StyledInlineActionButton
        type="button"
        disabled={copyingTeamResourceKey === `message-link:${file.messageId}`}
        onClick={(event) => {
          event.stopPropagation();
          void handleCopyMessageLink(file);
        }}
      >
        {t`Copy message link`}
      </StyledInlineActionButton>
      <StyledInlineActionButton
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          handleOpenTeamMessageThreadTarget(file);
        }}
      >
        {t`Open thread`}
      </StyledInlineActionButton>
    </StyledFileResult>
  );

  const renderTeamReminder = (reminder: TeamMessageReminder) => (
    <StyledReminderResult
      key={reminder.id}
      role="button"
      tabIndex={0}
      onClick={() => handleSelectReminder(reminder)}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        handleSelectReminder(reminder);
      }}
    >
      <StyledSearchResultMeta>
        {reminder.conversationType === 'channel' ? '#' : ''}{' '}
        {reminder.conversationName} ·{' '}
        {new Intl.DateTimeFormat(undefined, {
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date(reminder.remindAt))}
      </StyledSearchResultMeta>
      <StyledSearchResultBody>
        {reminder.body.length > 0 ? reminder.body : t`Attachment message`}
      </StyledSearchResultBody>
      <StyledInlineActionButton
        type="button"
        disabled={snoozingReminderMessageId === reminder.messageId}
        onClick={(event) => {
          event.stopPropagation();
          void handleSnoozeMessageReminder(reminder.messageId);
        }}
      >
        {t`Snooze`}
      </StyledInlineActionButton>
      <StyledInlineActionButton
        type="button"
        disabled={dismissingReminderMessageId === reminder.messageId}
        onClick={(event) => {
          event.stopPropagation();
          void handleDismissMessageReminder(reminder.messageId);
        }}
      >
        {t`Dismiss`}
      </StyledInlineActionButton>
      <StyledInlineActionButton
        type="button"
        disabled={
          copyingTeamResourceKey === `message-text:${reminder.messageId}`
        }
        onClick={(event) => {
          event.stopPropagation();
          void handleCopyMessageText(reminder);
        }}
      >
        {t`Copy text`}
      </StyledInlineActionButton>
      <StyledInlineActionButton
        type="button"
        disabled={
          copyingTeamResourceKey === `message-link:${reminder.messageId}`
        }
        onClick={(event) => {
          event.stopPropagation();
          void handleCopyMessageLink(reminder);
        }}
      >
        {t`Copy link`}
      </StyledInlineActionButton>
      <StyledInlineActionButton
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          handleOpenTeamMessageThreadTarget(reminder);
        }}
      >
        {t`Open thread`}
      </StyledInlineActionButton>
    </StyledReminderResult>
  );

  const renderTeamMessageSearchResults = () =>
    normalizedMessageSearchQuery.length >= 2 ? (
      <StyledSearchResults>
        {isMessageSearchLoading ? (
          <StyledInboxResult>
            <StyledSearchResultMeta>
              {t`Searching team messages...`}
            </StyledSearchResultMeta>
          </StyledInboxResult>
        ) : messageSearchResults.length > 0 ? (
          messageSearchResults.map((result) => (
            <StyledInboxResult
              key={`${result.id}-${result.matchType}-${result.attachmentName ?? ''}`}
            >
              <StyledInboxResultButton
                type="button"
                onClick={() => handleSelectSearchResult(result)}
              >
                <StyledSearchResultMeta>
                  {result.conversationType === 'channel' ? '#' : ''}{' '}
                  {result.conversationName} · {result.authorName}
                  {result.matchType === 'attachment' ? t` · file` : null}
                </StyledSearchResultMeta>
                {result.matchType === 'attachment' && result.attachmentName ? (
                  <StyledSearchResultBody>
                    <IconPaperclip size={12} /> {result.attachmentName}
                  </StyledSearchResultBody>
                ) : null}
                <StyledSearchResultBody>
                  {getTeamLiveMessageNotificationBody(result.body)}
                </StyledSearchResultBody>
              </StyledInboxResultButton>
              {result.attachmentUrl ? (
                <StyledFileOpenLink
                  href={result.attachmentUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {t`Open file`}
                </StyledFileOpenLink>
              ) : null}
              {result.attachmentUrl ? (
                <StyledInlineActionButton
                  type="button"
                  disabled={
                    copyingTeamResourceKey ===
                    `attachment-link:${result.attachmentUrl}`
                  }
                  onClick={(event) => {
                    event.stopPropagation();
                    void handleCopyAttachmentLink({
                      url: result.attachmentUrl,
                    });
                  }}
                >
                  {t`Copy file link`}
                </StyledInlineActionButton>
              ) : null}
              <StyledInlineActionButton
                type="button"
                disabled={
                  copyingTeamResourceKey === `message-text:${result.id}`
                }
                onClick={(event) => {
                  event.stopPropagation();
                  void handleCopyMessageText(result);
                }}
              >
                {t`Copy text`}
              </StyledInlineActionButton>
              <StyledInlineActionButton
                type="button"
                disabled={
                  copyingTeamResourceKey === `message-link:${result.id}`
                }
                onClick={(event) => {
                  event.stopPropagation();
                  void handleCopyMessageLink(result);
                }}
              >
                {t`Copy link`}
              </StyledInlineActionButton>
              <StyledInlineActionButton
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  handleOpenTeamMessageThreadTarget(result);
                }}
              >
                {t`Open thread`}
              </StyledInlineActionButton>
            </StyledInboxResult>
          ))
        ) : (
          <StyledInboxResult>
            <StyledSearchResultMeta>
              {t`No matching team messages.`}
            </StyledSearchResultMeta>
          </StyledInboxResult>
        )}
      </StyledSearchResults>
    ) : normalizedMessageSearchQuery.length > 0 ? (
      <StyledSearchResults>
        <StyledInboxResult>
          <StyledSearchResultMeta>
            {t`Keep typing to search team messages.`}
          </StyledSearchResultMeta>
        </StyledInboxResult>
      </StyledSearchResults>
    ) : null;

  const renderTeamMessageSearchBox = () => (
    <StyledSearchBox>
      <StyledSearchInputWrapper>
        <IconSearch size={16} />
        <StyledSearchInput
          aria-label={t`Search team messages`}
          ref={setMessageSearchInputElement}
          placeholder={t`Search messages`}
          value={messageSearchQuery}
          onChange={(event) => setMessageSearchQuery(event.target.value)}
        />
        {messageSearchQuery.length > 0 ? (
          <StyledIconButton
            aria-label={t`Clear message search`}
            type="button"
            onClick={() => {
              setMessageSearchQuery('');
              messageSearchInputElement?.focus();
            }}
          >
            <IconX size={14} />
          </StyledIconButton>
        ) : null}
      </StyledSearchInputWrapper>
      {renderTeamMessageSearchResults()}
    </StyledSearchBox>
  );

  const renderTeamMention = (mention: TeamMention) => (
    <StyledInboxResult key={mention.id}>
      <StyledInboxResultButton
        type="button"
        onClick={() => handleSelectMention(mention)}
      >
        <StyledSearchResultMeta>
          {mention.conversationType === 'channel' ? '#' : ''}{' '}
          {mention.conversationName} · {mention.authorName}
        </StyledSearchResultMeta>
        <StyledSearchResultBody>
          {getTeamLiveMessageNotificationBody(mention.body ?? '')}
        </StyledSearchResultBody>
      </StyledInboxResultButton>
      {mention.readAt === null ? (
        <StyledInlineActionButton
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            void handleMarkMentionRead(mention.id);
          }}
        >
          {t`Read`}
        </StyledInlineActionButton>
      ) : null}
      <StyledInlineActionButton
        type="button"
        disabled={
          copyingTeamResourceKey === `message-text:${mention.messageId}`
        }
        onClick={(event) => {
          event.stopPropagation();
          void handleCopyMessageText(mention);
        }}
      >
        {t`Copy text`}
      </StyledInlineActionButton>
      <StyledInlineActionButton
        type="button"
        disabled={
          copyingTeamResourceKey === `message-link:${mention.messageId}`
        }
        onClick={(event) => {
          event.stopPropagation();
          void handleCopyMessageLink(mention);
        }}
      >
        {t`Copy link`}
      </StyledInlineActionButton>
      <StyledInlineActionButton
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          handleOpenTeamMessageThreadTarget(mention);
        }}
      >
        {t`Open thread`}
      </StyledInlineActionButton>
    </StyledInboxResult>
  );

  const renderTeamCustomReactionInput = (message: TeamMessage) => {
    const visibleCustomReactionEmojiShortcodeSuggestions =
      activeCustomReactionMessageId === message.id
        ? customReactionEmojiShortcodeSuggestions
        : EMPTY_TEAM_EMOJI_SHORTCODE_SUGGESTIONS;

    return (
      <StyledCustomReactionInputWrapper>
        <StyledCustomReactionInput
          aria-label={t`Custom reaction`}
          disabled={
            !isComposerEnabled || togglingReactionMessageId === message.id
          }
          maxLength={32}
          placeholder={t`+ emoji`}
          value={customReactionByMessageId[message.id] ?? ''}
          onChange={(event) =>
            handleCustomReactionChange(message.id, event.target.value)
          }
          onFocus={() => setActiveCustomReactionMessageId(message.id)}
          onKeyDown={(event) => {
            const nextEmojiShortcodeSuggestionIndex =
              getNextTeamMentionSuggestionIndex({
                candidateCount:
                  visibleCustomReactionEmojiShortcodeSuggestions.length,
                currentIndex: activeCustomReactionEmojiShortcodeSuggestionIndex,
                key: event.key,
              });

            if (nextEmojiShortcodeSuggestionIndex !== null) {
              event.preventDefault();
              setActiveCustomReactionEmojiShortcodeSuggestionIndex(
                nextEmojiShortcodeSuggestionIndex,
              );

              return;
            }

            if (
              shouldSelectTeamMentionSuggestion({
                candidateCount:
                  visibleCustomReactionEmojiShortcodeSuggestions.length,
                ctrlKey: event.ctrlKey,
                isComposing: event.nativeEvent.isComposing,
                key: event.key,
                metaKey: event.metaKey,
                shiftKey: event.shiftKey,
              })
            ) {
              const selectedEmojiShortcodeSuggestion =
                visibleCustomReactionEmojiShortcodeSuggestions[
                  activeCustomReactionEmojiShortcodeSuggestionIndex
                ] ?? visibleCustomReactionEmojiShortcodeSuggestions[0];

              event.preventDefault();

              if (isDefined(selectedEmojiShortcodeSuggestion)) {
                handleInsertCustomReactionEmojiShortcode({
                  messageId: message.id,
                  suggestion: selectedEmojiShortcodeSuggestion,
                });
              }

              return;
            }

            if (event.key === 'Enter') {
              void handleSendCustomReaction(message.id);
            }
          }}
        />
        {renderTeamEmojiShortcodeSuggestions({
          activeIndex: activeCustomReactionEmojiShortcodeSuggestionIndex,
          onSelect: (suggestion) =>
            handleInsertCustomReactionEmojiShortcode({
              messageId: message.id,
              suggestion,
            }),
          suggestions: visibleCustomReactionEmojiShortcodeSuggestions,
        })}
      </StyledCustomReactionInputWrapper>
    );
  };

  const renderTeamMessageReactionActions = (message: TeamMessage) => {
    const existingReactionEmojis = new Set(
      message.reactions?.map((reaction) => reaction.emoji) ?? [],
    );
    const reactionOptions = [
      ...(message.reactions ?? []),
      ...QUICK_REACTIONS.filter(
        (emoji) => !existingReactionEmojis.has(emoji),
      ).map((emoji) => ({
        count: 0,
        emoji,
        hasReacted: false,
      })),
    ];

    return reactionOptions.map((reaction) => (
      <StyledReactionButton
        key={reaction.emoji}
        active={reaction.hasReacted}
        aria-label={t`React with ${reaction.emoji}`}
        disabled={
          !isComposerEnabled || togglingReactionMessageId === message.id
        }
        onClick={() => void handleToggleReaction(message.id, reaction.emoji)}
      >
        <span>{reaction.emoji}</span>
        {reaction.count > 0 ? <span>{reaction.count}</span> : null}
      </StyledReactionButton>
    ));
  };

  const focusedTeamPanelTitle =
    focusedTeamPanel === 'files'
      ? t`Files`
      : focusedTeamPanel === 'inbox'
        ? t`Team Inbox`
        : focusedTeamPanel === 'mentions'
          ? t`Mentions`
          : focusedTeamPanel === 'threads'
            ? t`Threads`
            : focusedTeamPanel === 'reminders'
              ? t`Reminders`
              : focusedTeamPanel === 'search'
                ? t`Search`
                : focusedTeamPanel === 'pinned'
                  ? t`Pinned`
                  : focusedTeamPanel === 'saved'
                    ? t`Saved`
                    : t`Team Comms`;

  const renderFocusedTeamPanel = () => {
    if (focusedTeamPanel === 'inbox') {
      return inboxItems.length > 0 ? (
        <StyledInboxFocusList>
          {inboxItems.map((item) => renderTeamInboxItem(item))}
        </StyledInboxFocusList>
      ) : (
        <StyledConversationPlaceholder>
          {t`No unread team messages.`}
        </StyledConversationPlaceholder>
      );
    }

    if (focusedTeamPanel === 'mentions') {
      return mentions.length > 0 ? (
        <StyledInboxFocusList>
          {mentions.map((mention) => renderTeamMention(mention))}
        </StyledInboxFocusList>
      ) : (
        <StyledConversationPlaceholder>
          {t`No team mentions.`}
        </StyledConversationPlaceholder>
      );
    }

    if (focusedTeamPanel === 'search') {
      return renderTeamMessageSearchBox();
    }

    if (focusedTeamPanel === 'threads') {
      return threadInboxItems.length > 0 ? (
        <StyledInboxFocusList>
          {threadInboxItems.map((item) => renderTeamInboxItem(item))}
        </StyledInboxFocusList>
      ) : (
        <StyledConversationPlaceholder>
          {t`No unread team threads.`}
        </StyledConversationPlaceholder>
      );
    }

    if (focusedTeamPanel === 'saved') {
      return savedMessages.length > 0 ? (
        <StyledInboxFocusList>
          {savedMessages.map((message) => renderTeamSavedMessage(message))}
        </StyledInboxFocusList>
      ) : (
        <StyledConversationPlaceholder>
          {t`No saved team messages.`}
        </StyledConversationPlaceholder>
      );
    }

    if (focusedTeamPanel === 'pinned') {
      return pinnedMessages.length > 0 ? (
        <StyledInboxFocusList>
          {pinnedMessages.map((message) => renderTeamPinnedMessage(message))}
        </StyledInboxFocusList>
      ) : (
        <StyledConversationPlaceholder>
          {t`No pinned team messages.`}
        </StyledConversationPlaceholder>
      );
    }

    if (focusedTeamPanel === 'files') {
      return files.length > 0 ? (
        <StyledInboxFocusList>
          {files.map((file) => renderTeamFile(file))}
        </StyledInboxFocusList>
      ) : (
        <StyledConversationPlaceholder>
          {t`No team files.`}
        </StyledConversationPlaceholder>
      );
    }

    if (focusedTeamPanel === 'reminders') {
      return reminders.length > 0 ? (
        <StyledInboxFocusList>
          {reminders.map((reminder) => renderTeamReminder(reminder))}
        </StyledInboxFocusList>
      ) : (
        <StyledConversationPlaceholder>
          {t`No team reminders.`}
        </StyledConversationPlaceholder>
      );
    }

    return null;
  };

  return (
    <PageContainer>
      <PageTitle title={t`Team Comms`} />
      <PageHeader title={t`Team Comms`} />
      <PageBody>
        <StyledContent hasThread={selectedThreadParentMessageId !== null}>
          <StyledSidebarPanel>
            {renderTeamMessageSearchBox()}
            <StyledStatusForm
              onSubmit={(event) => {
                event.preventDefault();
                void handleUpdatePresenceStatus();
              }}
            >
              <StyledStatusRow>
                <StyledStatusInput
                  aria-label={t`Status emoji`}
                  disabled={isUpdatingPresenceStatus}
                  maxLength={32}
                  placeholder={t`Emoji`}
                  value={statusEmoji}
                  onChange={(event) => setStatusEmoji(event.target.value)}
                />
                <StyledStatusInput
                  aria-label={t`Status`}
                  disabled={isUpdatingPresenceStatus}
                  maxLength={80}
                  placeholder={t`Set status`}
                  value={statusText}
                  onChange={(event) => setStatusText(event.target.value)}
                />
                <StyledStatusSaveButton
                  disabled={isUpdatingPresenceStatus}
                  type="submit"
                >
                  {t`Save status`}
                </StyledStatusSaveButton>
                {statusEmoji.trim().length > 0 ||
                statusText.trim().length > 0 ? (
                  <StyledStatusSaveButton
                    disabled={isUpdatingPresenceStatus}
                    type="button"
                    onClick={() => void handleClearPresenceStatus()}
                  >
                    {t`Clear`}
                  </StyledStatusSaveButton>
                ) : null}
              </StyledStatusRow>
              <StyledNotificationPermissionButton
                disabled={
                  teamNotificationPermission !== 'default' ||
                  isRequestingTeamNotifications
                }
                type="button"
                onClick={() => void handleRequestTeamNotifications()}
              >
                {teamNotificationButtonLabel}
              </StyledNotificationPermissionButton>
              <StyledSelect
                aria-label={t`Team notification preference`}
                disabled={isUpdatingNotificationPreference}
                value={currentTeamNotificationPreference}
                onChange={(event) =>
                  void handleUpdateTeamNotificationPreference(
                    event.target
                      .value as TeamPresence['notificationPreference'],
                  )
                }
              >
                <option value="ALL">{t`All activity`}</option>
                <option value="MENTIONS">{t`Mentions and reminders`}</option>
                <option value="MUTED">{t`Muted`}</option>
              </StyledSelect>
              <StyledStatusRow>
                <StyledStatusInput
                  aria-label={t`Quiet hours start`}
                  disabled={isUpdatingNotificationQuietHours}
                  type="time"
                  value={notificationQuietHoursStart}
                  onChange={(event) =>
                    setNotificationQuietHoursStart(event.target.value)
                  }
                />
                <StyledStatusInput
                  aria-label={t`Quiet hours end`}
                  disabled={isUpdatingNotificationQuietHours}
                  type="time"
                  value={notificationQuietHoursEnd}
                  onChange={(event) =>
                    setNotificationQuietHoursEnd(event.target.value)
                  }
                />
                <StyledStatusSaveButton
                  disabled={isUpdatingNotificationQuietHours}
                  type="button"
                  onClick={() => void handleUpdateTeamNotificationQuietHours()}
                >
                  {t`Save quiet`}
                </StyledStatusSaveButton>
              </StyledStatusRow>
            </StyledStatusForm>
            {inboxItems.length > 0 ? (
              <>
                <StyledPanelHeader>
                  <IconMail size={16} />
                  <StyledPanelTitle>{t`Inbox`}</StyledPanelTitle>
                  <StyledPanelHeaderSpacer />
                  <StyledReplyButton
                    type="button"
                    disabled={isMarkingInboxRead}
                    onClick={() => void handleMarkInboxRead()}
                  >
                    {t`Mark all read`}
                  </StyledReplyButton>
                </StyledPanelHeader>
                <StyledSearchResults>
                  {inboxItems.map((item) => renderTeamInboxItem(item))}
                </StyledSearchResults>
              </>
            ) : null}
            {onlineTeammates.length > 0 ? (
              <>
                <StyledPanelHeader>
                  <IconMessage size={16} />
                  <StyledPanelTitle>{t`Online`}</StyledPanelTitle>
                </StyledPanelHeader>
                <StyledList>
                  {onlineTeammates.map((presenceItem) => (
                    <StyledListItem
                      disabled={
                        openingDirectMessageUserWorkspaceId ===
                        presenceItem.userWorkspaceId
                      }
                      key={presenceItem.userWorkspaceId}
                      onClick={() =>
                        void handleOpenDirectMessageWithTeammate(
                          presenceItem.userWorkspaceId,
                        )
                      }
                    >
                      <StyledPresenceDot online />
                      {presenceItem.name}
                      {presenceItem.statusText ? (
                        <StyledSearchResultMeta>
                          {presenceItem.statusEmoji
                            ? `${presenceItem.statusEmoji} `
                            : ''}
                          {presenceItem.statusText}
                        </StyledSearchResultMeta>
                      ) : null}
                    </StyledListItem>
                  ))}
                </StyledList>
              </>
            ) : null}
            <StyledPanelHeader>
              <IconNumber size={16} />
              <StyledPanelTitle>{t`Channels`}</StyledPanelTitle>
            </StyledPanelHeader>
            <StyledCreateChannelForm
              onSubmit={(event) => {
                event.preventDefault();
                void handleCreateChannel();
              }}
            >
              <StyledCreateChannelRow>
                <StyledCreateChannelInput
                  disabled={!isUsingApiChannels || isCreatingChannel}
                  placeholder={t`New channel`}
                  value={newChannelName}
                  onChange={(event) => setNewChannelName(event.target.value)}
                />
                <StyledIconButton
                  aria-label={t`Create channel`}
                  disabled={
                    !isUsingApiChannels ||
                    newChannelName.trim().length === 0 ||
                    isCreatingChannel
                  }
                  type="submit"
                >
                  <IconPlus size={16} />
                </StyledIconButton>
              </StyledCreateChannelRow>
              <StyledCreateChannelInput
                aria-label={t`New channel description`}
                disabled={!isUsingApiChannels || isCreatingChannel}
                placeholder={t`Channel topic`}
                value={newChannelDescription}
                onChange={(event) =>
                  setNewChannelDescription(event.target.value)
                }
              />
              <StyledCreateChannelToggle>
                <input
                  checked={newChannelIsPrivate}
                  disabled={!isUsingApiChannels || isCreatingChannel}
                  type="checkbox"
                  onChange={(event) =>
                    setNewChannelIsPrivate(event.target.checked)
                  }
                />
                <IconLock size={14} />
                {t`Private`}
              </StyledCreateChannelToggle>
            </StyledCreateChannelForm>
            <StyledList>
              {sortedJoinedChannels.map((channel) => (
                <StyledListItem
                  key={channel.id}
                  active={
                    !isDirectMessageSelected &&
                    channel.id === effectiveSelectedChannelId
                  }
                  onClick={() => handleSelectChannel(channel)}
                >
                  {channel.visibility === 'PRIVATE' ||
                  channel.visibility === 'private' ? (
                    <IconLock size={16} />
                  ) : (
                    <IconNumber size={16} />
                  )}
                  <StyledListItemTextStack>
                    <StyledListItemPrimaryText>
                      {channel.name}
                    </StyledListItemPrimaryText>
                    {channel.description ? (
                      <StyledListItemSecondaryText>
                        {channel.description}
                      </StyledListItemSecondaryText>
                    ) : null}
                  </StyledListItemTextStack>
                  {starredConversationKeys.has(
                    getTeamStarredConversationKey({
                      conversationId: channel.id,
                      conversationType: 'channel',
                    }),
                  ) ? (
                    <StyledStarredConversationMarker>
                      <IconStar size={14} />
                    </StyledStarredConversationMarker>
                  ) : null}
                  {isTeamConversationMuted(channel.notificationLevel) ? (
                    <StyledMutedConversationMarker
                      aria-label={t`Muted conversation`}
                      title={t`Muted conversation`}
                    >
                      <IconBellOff size={14} />
                    </StyledMutedConversationMarker>
                  ) : null}
                  {channel.unreadCount > 0 ? (
                    <StyledUnreadCount>{channel.unreadCount}</StyledUnreadCount>
                  ) : null}
                </StyledListItem>
              ))}
            </StyledList>
            {sortedDiscoverablePublicChannels.length > 0 ? (
              <>
                <StyledPanelHeader>
                  <IconSearch size={16} />
                  <StyledPanelTitle>{t`Browse public channels`}</StyledPanelTitle>
                </StyledPanelHeader>
                <StyledCreateChannelForm>
                  <StyledCreateChannelRow>
                    <StyledCreateChannelInput
                      aria-label={t`Search public channels`}
                      placeholder={t`Search public channels`}
                      value={browsePublicChannelsQuery}
                      onChange={(event) =>
                        setBrowsePublicChannelsQuery(event.target.value)
                      }
                    />
                    {browsePublicChannelsQuery.length > 0 ? (
                      <StyledIconButton
                        aria-label={t`Clear public channel search`}
                        type="button"
                        onClick={() => setBrowsePublicChannelsQuery('')}
                      >
                        <IconX size={14} />
                      </StyledIconButton>
                    ) : null}
                  </StyledCreateChannelRow>
                </StyledCreateChannelForm>
                <StyledSearchResults>
                  {visibleDiscoverablePublicChannels.length > 0 ? (
                    visibleDiscoverablePublicChannels.map((channel) => (
                      <StyledInboxResult key={channel.id}>
                        <StyledInboxResultButton
                          type="button"
                          onClick={() => handleSelectChannel(channel)}
                        >
                          <StyledSearchResultMeta>
                            <IconNumber size={12} /> #{channel.name}
                          </StyledSearchResultMeta>
                          <StyledSearchResultBody>
                            {channel.description ?? t`Public channel`}
                          </StyledSearchResultBody>
                        </StyledInboxResultButton>
                        <StyledJoinButton
                          disabled={joiningChannelId === channel.id}
                          type="button"
                          onClick={() => void handleJoinChannel(channel.id)}
                        >
                          <IconPlus size={14} />
                          {t`Join`}
                        </StyledJoinButton>
                      </StyledInboxResult>
                    ))
                  ) : (
                    <StyledSearchResultBody>
                      {t`No public channels match.`}
                    </StyledSearchResultBody>
                  )}
                </StyledSearchResults>
              </>
            ) : null}
            <StyledPanelHeader>
              <IconMessage size={16} />
              <StyledPanelTitle>{t`Direct Messages`}</StyledPanelTitle>
            </StyledPanelHeader>
            <StyledCreateChannelForm
              onSubmit={(event) => {
                event.preventDefault();
                void handleCreateDirectMessage();
              }}
            >
              <StyledCreateChannelRow>
                <StyledCreateChannelInput
                  disabled={
                    !isUsingApiDirectMessages || isCreatingDirectMessage
                  }
                  placeholder={t`Find teammate`}
                  value={newDirectMessageSearchQuery}
                  onChange={(event) => {
                    setNewDirectMessageSearchQuery(event.target.value);
                    setSelectedNewDirectMessageUserWorkspaceId('');
                  }}
                />
                {newDirectMessageSearchQuery.length > 0 ? (
                  <StyledIconButton
                    aria-label={t`Clear direct message search`}
                    disabled={isCreatingDirectMessage}
                    type="button"
                    onClick={() => {
                      setNewDirectMessageSearchQuery('');
                      setSelectedNewDirectMessageUserWorkspaceId('');
                    }}
                  >
                    <IconX size={14} />
                  </StyledIconButton>
                ) : null}
              </StyledCreateChannelRow>
              <StyledCreateChannelRow>
                <StyledSelect
                  disabled={
                    !isUsingApiDirectMessages || isCreatingDirectMessage
                  }
                  value={selectedNewDirectMessageUserWorkspaceId}
                  onChange={(event) =>
                    setSelectedNewDirectMessageUserWorkspaceId(
                      event.target.value,
                    )
                  }
                >
                  <option value="">{t`Start a direct message`}</option>
                  {directMessageCandidates.map((candidate) => {
                    const candidatePresence = presenceByUserWorkspaceId.get(
                      candidate.userWorkspaceId,
                    );
                    const candidateStatus = candidatePresence?.statusText
                      ? ` · ${candidatePresence?.statusEmoji ? `${candidatePresence.statusEmoji} ` : ''}${candidatePresence.statusText}`
                      : '';

                    return (
                      <option
                        key={candidate.userWorkspaceId}
                        value={candidate.userWorkspaceId}
                      >
                        {candidate.name} ·{' '}
                        {candidatePresence?.isOnline ? t`online` : t`offline`}
                        {candidateStatus}
                      </option>
                    );
                  })}
                </StyledSelect>
                <StyledIconButton
                  aria-label={t`Start direct message`}
                  disabled={
                    !isUsingApiDirectMessages ||
                    selectedNewDirectMessageUserWorkspaceId.length === 0 ||
                    isCreatingDirectMessage
                  }
                  type="submit"
                >
                  <IconPlus size={16} />
                </StyledIconButton>
              </StyledCreateChannelRow>
            </StyledCreateChannelForm>
            <StyledList>
              {sortedDirectMessages.map((directMessage) => {
                const participantPresence = presenceByUserWorkspaceId.get(
                  directMessage.participantUserWorkspaceId,
                );

                return (
                  <StyledListItem
                    key={directMessage.id}
                    active={directMessage.id === selectedDirectMessageId}
                    onClick={() => handleSelectDirectMessage(directMessage)}
                  >
                    <IconMessage size={16} />
                    <StyledListItemTextStack>
                      <StyledListItemPrimaryText>
                        {directMessage.participantName}
                      </StyledListItemPrimaryText>
                      {participantPresence?.statusText ? (
                        <StyledListItemSecondaryText>
                          {participantPresence?.statusEmoji
                            ? `${participantPresence.statusEmoji} `
                            : ''}
                          {participantPresence.statusText}
                        </StyledListItemSecondaryText>
                      ) : directMessage.lastMessageBody ? (
                        <StyledListItemSecondaryText>
                          {getTeamMessagePreviewBody({
                            body: directMessage.lastMessageBody,
                          })}
                        </StyledListItemSecondaryText>
                      ) : null}
                    </StyledListItemTextStack>
                    {starredConversationKeys.has(
                      getTeamStarredConversationKey({
                        conversationId: directMessage.id,
                        conversationType: 'direct-message',
                      }),
                    ) ? (
                      <StyledStarredConversationMarker>
                        <IconStar size={14} />
                      </StyledStarredConversationMarker>
                    ) : null}
                    {isTeamConversationMuted(
                      directMessage.notificationLevel,
                    ) ? (
                      <StyledMutedConversationMarker
                        aria-label={t`Muted conversation`}
                        title={t`Muted conversation`}
                      >
                        <IconBellOff size={14} />
                      </StyledMutedConversationMarker>
                    ) : null}
                    {directMessage.unreadCount > 0 ? (
                      <StyledUnreadCount>
                        {directMessage.unreadCount}
                      </StyledUnreadCount>
                    ) : participantPresence ? (
                      <StyledPresenceDot
                        online={participantPresence.isOnline ?? false}
                      />
                    ) : null}
                  </StyledListItem>
                );
              })}
            </StyledList>
          </StyledSidebarPanel>

          <StyledPanel>
            <StyledPanelHeader>
              {focusedTeamPanel === 'inbox' ||
              focusedTeamPanel === 'mentions' ? (
                <IconMail size={16} />
              ) : focusedTeamPanel === 'threads' ? (
                <IconMessage size={16} />
              ) : focusedTeamPanel === 'saved' ? (
                <IconStar size={16} />
              ) : focusedTeamPanel === 'pinned' ? (
                <IconPinned size={16} />
              ) : focusedTeamPanel === 'files' ? (
                <IconPaperclip size={16} />
              ) : focusedTeamPanel === 'reminders' ? (
                <IconClock size={16} />
              ) : focusedTeamPanel === 'search' ? (
                <IconSearch size={16} />
              ) : isDirectMessageSelected ? (
                <IconMessage size={16} />
              ) : (
                <IconNumber size={16} />
              )}
              <StyledPanelTitleStack>
                <StyledPanelTitle>
                  {focusedTeamPanelTitle ??
                    effectiveConversationName ??
                    t`Team Comms`}
                </StyledPanelTitle>
                {!isTeamPanelFocused &&
                !isDirectMessageSelected &&
                effectiveSelectedChannel?.description ? (
                  <StyledPanelSubtitle>
                    {effectiveSelectedChannel.description}
                  </StyledPanelSubtitle>
                ) : null}
              </StyledPanelTitleStack>
              <StyledPanelHeaderSpacer />
              {focusedTeamPanel === 'inbox' && inboxItems.length > 0 ? (
                <StyledReplyButton
                  type="button"
                  disabled={isMarkingInboxRead}
                  onClick={() => void handleMarkInboxRead()}
                >
                  {t`Mark all read`}
                </StyledReplyButton>
              ) : null}
              {focusedTeamPanel === 'mentions' &&
              mentions.some((mention) => mention.readAt === null) ? (
                <StyledReplyButton
                  type="button"
                  disabled={isMarkingMentionsRead}
                  onClick={() => void handleMarkAllMentionsRead()}
                >
                  {t`Mark all read`}
                </StyledReplyButton>
              ) : null}
              {focusedTeamPanel === 'threads' && threadInboxItems.length > 0 ? (
                <StyledReplyButton
                  type="button"
                  disabled={isMarkingThreadsRead}
                  onClick={() => void handleMarkAllThreadsRead()}
                >
                  {t`Mark all read`}
                </StyledReplyButton>
              ) : null}
              {focusedTeamPanel === 'reminders' && reminders.length > 0 ? (
                <StyledReplyButton
                  type="button"
                  disabled={isDismissingAllReminders}
                  onClick={() => void handleDismissAllMessageReminders()}
                >
                  {t`Dismiss all`}
                </StyledReplyButton>
              ) : null}
              {hasSelectedConversation && messages.length > 0 ? (
                <StyledReplyButton
                  type="button"
                  onClick={handleJumpToMainConversationActivity}
                >
                  {mainUnreadDividerMessageId !== null
                    ? t`Jump to new`
                    : t`Jump to latest`}
                </StyledReplyButton>
              ) : null}
              {hasSelectedConversation && !isTeamPanelFocused ? (
                <StyledReplyButton
                  type="button"
                  disabled={
                    copyingTeamResourceKey ===
                    `conversation-link:${
                      isDirectMessageSelected
                        ? effectiveSelectedDirectMessageId
                        : effectiveSelectedChannelId
                    }`
                  }
                  onClick={() => void handleCopyConversationLink()}
                >
                  {t`Copy link`}
                </StyledReplyButton>
              ) : null}
              {!isTeamPanelFocused ? (
                <StyledIconButton
                  aria-label={
                    isSelectedConversationStarred
                      ? t`Unstar conversation`
                      : t`Star conversation`
                  }
                  active={isSelectedConversationStarred}
                  disabled={
                    selectedConversationStarKey === null ||
                    isTogglingSelectedConversationStar
                  }
                  onClick={handleToggleSelectedConversationStar}
                >
                  <IconStar size={16} />
                </StyledIconButton>
              ) : null}
              {canToggleSelectedConversationMute ? (
                <StyledReplyButton
                  type="button"
                  disabled={isUpdatingSelectedConversationNotificationLevel}
                  onClick={handleToggleSelectedConversationMute}
                >
                  <IconBellOff size={14} />
                  {isSelectedConversationMuted ? t`Unmute` : t`Mute`}
                </StyledReplyButton>
              ) : null}
              {isDirectMessageSelected &&
              selectedDirectMessage !== undefined &&
              !isTeamPanelFocused ? (
                <StyledInlineSelect
                  aria-label={t`Direct message notifications`}
                  disabled={isUpdatingDirectMessageNotificationLevel}
                  value={selectedDirectMessage.notificationLevel.toUpperCase()}
                  onChange={(event) =>
                    void handleUpdateDirectMessageNotificationLevel(
                      event.target
                        .value as TeamDirectMessage['notificationLevel'],
                    )
                  }
                >
                  <option value="ALL">{t`All messages`}</option>
                  <option value="MENTIONS">{t`Mentions only`}</option>
                  <option value="MUTED">{t`Muted`}</option>
                </StyledInlineSelect>
              ) : null}
              {!isDirectMessageSelected &&
              !isTeamPanelFocused &&
              isUsingApiChannels &&
              effectiveSelectedChannel?.isMember === false ? (
                <StyledJoinButton
                  disabled={joiningChannelId === effectiveSelectedChannel.id}
                  onClick={() => void handleJoinChannel()}
                >
                  <IconPlus size={14} />
                  {t`Join`}
                </StyledJoinButton>
              ) : null}
            </StyledPanelHeader>
            {!isDirectMessageSelected &&
            !isTeamPanelFocused &&
            effectiveSelectedChannel !== undefined &&
            isSelectedChannelMember ? (
              <>
                {canManageSelectedChannel ? (
                  <StyledChannelDetailsForm
                    onSubmit={(event) => {
                      event.preventDefault();
                      void handleUpdateChannelDetails();
                    }}
                  >
                    <StyledCreateChannelRow>
                      <StyledPanelTitle>{t`Channel details`}</StyledPanelTitle>
                      <StyledPanelHeaderSpacer />
                      <StyledIconButton
                        aria-label={t`Save channel details`}
                        disabled={
                          channelDetailsName.trim().length === 0 ||
                          isUpdatingChannelDetails
                        }
                        type="submit"
                      >
                        <IconSend size={14} />
                      </StyledIconButton>
                    </StyledCreateChannelRow>
                    <StyledCreateChannelInput
                      aria-label={t`Channel name`}
                      disabled={isUpdatingChannelDetails}
                      value={channelDetailsName}
                      onChange={(event) =>
                        setChannelDetailsName(event.target.value)
                      }
                    />
                    <StyledCreateChannelInput
                      aria-label={t`Channel topic`}
                      disabled={isUpdatingChannelDetails}
                      placeholder={t`Channel topic`}
                      value={channelDetailsDescription}
                      onChange={(event) =>
                        setChannelDetailsDescription(event.target.value)
                      }
                    />
                    <StyledSelect
                      aria-label={t`Channel visibility`}
                      disabled={isUpdatingChannelDetails}
                      value={(
                        channelDetailsVisibility ?? 'PUBLIC'
                      ).toUpperCase()}
                      onChange={(event) =>
                        setChannelDetailsVisibility(
                          event.target.value as TeamChannel['visibility'],
                        )
                      }
                    >
                      <option value="PUBLIC">{t`Public`}</option>
                      <option value="PRIVATE">{t`Private`}</option>
                    </StyledSelect>
                  </StyledChannelDetailsForm>
                ) : effectiveSelectedChannel?.description ? (
                  <StyledPinnedList>
                    <StyledPinnedHeader>{t`Channel topic`}</StyledPinnedHeader>
                    <StyledPinnedMessageBody>
                      {effectiveSelectedChannel.description}
                    </StyledPinnedMessageBody>
                  </StyledPinnedList>
                ) : null}
                <StyledCreateChannelForm
                  onSubmit={(event) => {
                    event.preventDefault();
                    void handleInviteChannelMember();
                  }}
                >
                  <StyledCreateChannelRow>
                    <StyledPanelTitle>{t`Members`}</StyledPanelTitle>
                    <StyledPanelHeaderSpacer />
                    <StyledSearchResultMeta>
                      {channelMembers.length}
                    </StyledSearchResultMeta>
                  </StyledCreateChannelRow>
                  {currentUserChannelMember ? (
                    <StyledCreateChannelRow>
                      <StyledSearchResultMeta>
                        {t`Notifications`}
                      </StyledSearchResultMeta>
                      <StyledSelect
                        disabled={isUpdatingChannelNotificationLevel}
                        value={currentUserChannelMember.notificationLevel.toUpperCase()}
                        onChange={(event) =>
                          void handleUpdateChannelNotificationLevel(
                            event.target
                              .value as TeamChannelMember['notificationLevel'],
                          )
                        }
                      >
                        <option value="ALL">{t`All messages`}</option>
                        <option value="MENTIONS">{t`Mentions only`}</option>
                        <option value="MUTED">{t`Muted`}</option>
                      </StyledSelect>
                    </StyledCreateChannelRow>
                  ) : null}
                  {currentUserChannelMember ? (
                    <StyledCreateChannelRow>
                      <StyledSearchResultMeta>
                        {t`Membership`}
                      </StyledSearchResultMeta>
                      <StyledJoinButton
                        disabled={isLeavingChannel}
                        type="button"
                        onClick={() => void handleLeaveChannel()}
                      >
                        {t`Leave channel`}
                      </StyledJoinButton>
                    </StyledCreateChannelRow>
                  ) : null}
                  {canManageSelectedChannel ? (
                    <StyledCreateChannelRow>
                      <StyledSearchResultMeta>
                        {t`Channel admin`}
                      </StyledSearchResultMeta>
                      <StyledJoinButton
                        disabled={isArchivingChannel}
                        type="button"
                        onClick={() => void handleArchiveChannel()}
                      >
                        {t`Archive channel`}
                      </StyledJoinButton>
                    </StyledCreateChannelRow>
                  ) : null}
                  {canManageSelectedChannel ? (
                    <>
                      <StyledCreateChannelRow>
                        <StyledCreateChannelInput
                          disabled={isInvitingChannelMember}
                          placeholder={t`Find teammate`}
                          value={inviteMemberSearchQuery}
                          onChange={(event) => {
                            setInviteMemberSearchQuery(event.target.value);
                            setSelectedInviteUserWorkspaceId('');
                          }}
                        />
                        {inviteMemberSearchQuery.length > 0 ? (
                          <StyledIconButton
                            aria-label={t`Clear member invite search`}
                            disabled={isInvitingChannelMember}
                            type="button"
                            onClick={() => {
                              setInviteMemberSearchQuery('');
                              setSelectedInviteUserWorkspaceId('');
                            }}
                          >
                            <IconX size={14} />
                          </StyledIconButton>
                        ) : null}
                      </StyledCreateChannelRow>
                      <StyledCreateChannelRow>
                        <StyledSelect
                          disabled={isInvitingChannelMember}
                          value={selectedInviteUserWorkspaceId}
                          onChange={(event) =>
                            setSelectedInviteUserWorkspaceId(event.target.value)
                          }
                        >
                          <option value="">{t`Invite teammate`}</option>
                          {inviteCandidates.map((candidate) => {
                            const inviteCandidatePresence =
                              presenceByUserWorkspaceId.get(
                                candidate.userWorkspaceId,
                              );
                            const inviteCandidateStatus =
                              inviteCandidatePresence?.statusText
                                ? ` · ${inviteCandidatePresence?.statusEmoji ? `${inviteCandidatePresence.statusEmoji} ` : ''}${inviteCandidatePresence.statusText}`
                                : '';

                            return (
                              <option
                                key={candidate.userWorkspaceId}
                                value={candidate.userWorkspaceId}
                              >
                                {candidate.name} ·{' '}
                                {inviteCandidatePresence?.isOnline
                                  ? t`online`
                                  : t`offline`}
                                {inviteCandidateStatus}
                              </option>
                            );
                          })}
                        </StyledSelect>
                        <StyledIconButton
                          aria-label={t`Invite member`}
                          disabled={
                            !selectedInviteUserWorkspaceId ||
                            isInvitingChannelMember
                          }
                          type="submit"
                        >
                          <IconPlus size={16} />
                        </StyledIconButton>
                      </StyledCreateChannelRow>
                      {normalizedInviteMemberSearchQuery.length >= 2 &&
                      inviteCandidates.length === 0 ? (
                        <StyledCreateChannelRow>
                          <StyledSearchResultMeta>
                            {t`No teammates match this search.`}
                          </StyledSearchResultMeta>
                        </StyledCreateChannelRow>
                      ) : null}
                    </>
                  ) : null}
                  <StyledList>
                    {sortedChannelMembers.map((member) => {
                      const memberPresence = presenceByUserWorkspaceId.get(
                        member.userWorkspaceId,
                      );

                      return (
                        <StyledMemberRow key={member.id}>
                          <StyledPresenceDot
                            online={memberPresence?.isOnline ?? false}
                          />
                          <StyledListItemTextStack>
                            <StyledListItemPrimaryText>
                              {member.name}
                            </StyledListItemPrimaryText>
                            {memberPresence?.statusText ? (
                              <StyledListItemSecondaryText>
                                {memberPresence?.statusEmoji
                                  ? `${memberPresence.statusEmoji} `
                                  : ''}
                                {memberPresence.statusText}
                              </StyledListItemSecondaryText>
                            ) : null}
                          </StyledListItemTextStack>
                          {canManageSelectedChannel ? (
                            <StyledSelect
                              aria-label={t`${member.name} role`}
                              disabled={
                                updatingChannelMemberRoleUserWorkspaceId ===
                                member.userWorkspaceId
                              }
                              value={member.role.toUpperCase()}
                              onChange={(event) =>
                                void handleUpdateChannelMemberRole(
                                  member.userWorkspaceId,
                                  event.target
                                    .value as TeamChannelMember['role'],
                                )
                              }
                            >
                              <option value="MEMBER">{t`Member`}</option>
                              <option value="OWNER">{t`Owner`}</option>
                            </StyledSelect>
                          ) : (
                            <StyledSearchResultMeta>
                              {member.role}
                            </StyledSearchResultMeta>
                          )}
                          {!member.isCurrentUser ? (
                            <StyledInlineActionButton
                              disabled={
                                openingDirectMessageUserWorkspaceId ===
                                member.userWorkspaceId
                              }
                              type="button"
                              onClick={() =>
                                void handleOpenDirectMessageWithTeammate(
                                  member.userWorkspaceId,
                                )
                              }
                            >
                              {t`Message`}
                            </StyledInlineActionButton>
                          ) : null}
                          {canManageSelectedChannel &&
                          member.role !== 'OWNER' &&
                          member.role !== 'owner' &&
                          !member.isCurrentUser ? (
                            <StyledIconButton
                              aria-label={t`Remove member`}
                              disabled={
                                removingChannelMemberUserWorkspaceId ===
                                member.userWorkspaceId
                              }
                              onClick={() =>
                                void handleRemoveChannelMember(
                                  member.userWorkspaceId,
                                )
                              }
                            >
                              <IconX size={14} />
                            </StyledIconButton>
                          ) : null}
                        </StyledMemberRow>
                      );
                    })}
                  </StyledList>
                </StyledCreateChannelForm>
              </>
            ) : null}
            {pinnedMessages.length > 0 && !isTeamPanelFocused ? (
              <StyledPinnedList>
                <StyledPinnedHeader>
                  <IconPinned size={14} />
                  {t`Pinned`}
                </StyledPinnedHeader>
                {pinnedMessages.map((message) => (
                  <StyledPinnedMessageButton
                    key={message.id}
                    onClick={() => handleSelectTeamConversationTarget(message)}
                  >
                    <StyledPinnedBadge>
                      {message.authorName} ·{' '}
                      {new Intl.DateTimeFormat(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                      }).format(new Date(message.createdAt ?? Date.now()))}
                    </StyledPinnedBadge>
                    <StyledPinnedMessageBody>
                      {message.body.length > 0
                        ? message.body
                        : t`Attachment message`}
                    </StyledPinnedMessageBody>
                  </StyledPinnedMessageButton>
                ))}
              </StyledPinnedList>
            ) : null}
            {isTeamPanelFocused ? renderFocusedTeamPanel() : null}
            {!hasSelectedConversation && !isTeamPanelFocused ? (
              <StyledConversationPlaceholder>
                {isUsingApiChannels
                  ? t`Create or select a channel to start messaging.`
                  : t`Team conversations are unavailable.`}
              </StyledConversationPlaceholder>
            ) : null}
            {hasSelectedConversation ? (
              <StyledMessageList>
                {canLoadEarlierMessages ? (
                  <StyledLoadEarlierButton
                    disabled={isLoadingEarlierMessages}
                    onClick={() => void handleLoadEarlierMessages()}
                  >
                    {isLoadingEarlierMessages
                      ? t`Loading messages...`
                      : t`Load earlier messages`}
                  </StyledLoadEarlierButton>
                ) : null}
                {messages.map((message, messageIndex) => (
                  <Fragment key={message.id}>
                    {shouldShowTeamMessageDateDivider({
                      createdAt: message.createdAt,
                      previousCreatedAt: messages[messageIndex - 1]?.createdAt,
                    }) ? (
                      <StyledDateDivider>
                        <span>
                          {formatTeamMessageDateDividerLabel(message.createdAt)}
                        </span>
                      </StyledDateDivider>
                    ) : null}
                    {mainUnreadDividerMessageId === message.id ? (
                      <StyledUnreadDivider>
                        <span>{t`New`}</span>
                      </StyledUnreadDivider>
                    ) : null}
                    <StyledMessage
                      highlighted={mainHighlightedMessageId === message.id}
                      id={getTeamMessageElementId({
                        messageId: message.id,
                        scope: 'main',
                      })}
                    >
                      <StyledMessageMeta>
                        <StyledAuthor>{message.authorName}</StyledAuthor>
                        {renderTeamMessageAuthorStatus(message)}
                        <StyledMessageTime
                          title={formatTeamMessageTimestampTitle(
                            message.createdAt,
                          )}
                        >
                          {message.isPinned ? (
                            <>
                              <StyledPinnedBadge>
                                <IconPinned size={12} />
                                {t`Pinned`}
                              </StyledPinnedBadge>{' '}
                              ·{' '}
                            </>
                          ) : null}
                          #
                          {message.conversationName ??
                            effectiveConversationName ??
                            'general'}{' '}
                          ·{' '}
                          {message.time ??
                            new Intl.DateTimeFormat(undefined, {
                              hour: '2-digit',
                              minute: '2-digit',
                            }).format(
                              new Date(message.createdAt ?? Date.now()),
                            )}
                          {isTeamMessageEdited({
                            createdAt: message.createdAt,
                            updatedAt: message.updatedAt,
                          })
                            ? t` · edited`
                            : null}
                        </StyledMessageTime>
                      </StyledMessageMeta>
                      {editingMessageId === message.id ? (
                        <StyledMessageEditForm>
                          <StyledMessageEditInput
                            autoFocus
                            value={editingMessageBody}
                            onChange={(event) =>
                              setEditingMessageBody(event.target.value)
                            }
                            onKeyDown={(event) => {
                              if (
                                shouldSaveTeamMessageEdit({
                                  ctrlKey: event.ctrlKey,
                                  isComposing: event.nativeEvent.isComposing,
                                  key: event.key,
                                  metaKey: event.metaKey,
                                  shiftKey: event.shiftKey,
                                })
                              ) {
                                event.preventDefault();
                                void handleSaveEditingMessage();
                              }

                              if (
                                shouldCancelTeamMessageEdit({
                                  ctrlKey: event.ctrlKey,
                                  isComposing: event.nativeEvent.isComposing,
                                  key: event.key,
                                  metaKey: event.metaKey,
                                  shiftKey: event.shiftKey,
                                })
                              ) {
                                event.preventDefault();
                                handleCancelEditingMessage();
                              }
                            }}
                          />
                          <StyledReplyButton
                            type="button"
                            disabled={isSavingMessageEdit}
                            onClick={() => void handleSaveEditingMessage()}
                          >
                            {t`Save`}
                          </StyledReplyButton>
                          <StyledReplyButton
                            type="button"
                            onClick={handleCancelEditingMessage}
                          >
                            {t`Cancel`}
                          </StyledReplyButton>
                        </StyledMessageEditForm>
                      ) : (
                        renderTeamMessageBody(message.body)
                      )}
                      {message.attachments.length > 0 ? (
                        <StyledAttachmentList>
                          {message.attachments.map((attachment) => (
                            <Fragment key={attachment.id ?? attachment.name}>
                              <StyledAttachmentLink
                                href={attachment.url}
                                rel="noreferrer"
                                target="_blank"
                              >
                                <IconPaperclip size={14} />
                                {attachment.name}
                              </StyledAttachmentLink>
                              {attachment.size !== undefined &&
                              attachment.size !== null ? (
                                <StyledSearchResultMeta>
                                  {formatFileSize(attachment.size)}
                                </StyledSearchResultMeta>
                              ) : null}
                              <StyledInlineActionButton
                                disabled={
                                  copyingTeamResourceKey ===
                                  `attachment-link:${attachment.url}`
                                }
                                type="button"
                                onClick={() =>
                                  void handleCopyAttachmentLink(attachment)
                                }
                              >
                                {t`Copy link`}
                              </StyledInlineActionButton>
                            </Fragment>
                          ))}
                        </StyledAttachmentList>
                      ) : null}
                      <StyledMessageActions>
                        <StyledReplyButton
                          type="button"
                          onClick={() => handleOpenThread(message.id)}
                        >
                          {message.replyCount > 0
                            ? t`${message.replyCount} replies`
                            : t`Reply`}
                        </StyledReplyButton>
                        <StyledReplyButton
                          type="button"
                          disabled={
                            !isComposerEnabled ||
                            togglingPinnedMessageId === message.id
                          }
                          onClick={() =>
                            void handleToggleMessagePin(
                              message.id,
                              message.isPinned,
                            )
                          }
                        >
                          {message.isPinned ? t`Unpin` : t`Pin`}
                        </StyledReplyButton>
                        <StyledReplyButton
                          type="button"
                          disabled={
                            !isComposerEnabled ||
                            togglingSavedMessageId === message.id
                          }
                          onClick={() =>
                            void handleToggleMessageBookmark(
                              message.id,
                              message.isSaved,
                            )
                          }
                        >
                          {message.isSaved ? t`Unsave` : t`Save`}
                        </StyledReplyButton>
                        <StyledReplyButton
                          type="button"
                          disabled={
                            !isComposerEnabled ||
                            settingReminderMessageId === message.id
                          }
                          onClick={() =>
                            void handleSetMessageReminder(message.id)
                          }
                        >
                          {t`Remind`}
                        </StyledReplyButton>
                        <StyledInlineSelect
                          aria-label={t`Reminder delay`}
                          disabled={
                            !isComposerEnabled ||
                            settingReminderMessageId === message.id
                          }
                          value={
                            reminderOptionByMessageId[message.id] ??
                            DEFAULT_TEAM_MESSAGE_REMINDER_OPTION_VALUE
                          }
                          onChange={(event) =>
                            handleChangeMessageReminderOption(
                              message.id,
                              event.target.value,
                            )
                          }
                        >
                          {TEAM_MESSAGE_REMINDER_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </StyledInlineSelect>
                        <StyledReplyButton
                          type="button"
                          disabled={markingUnreadMessageId === message.id}
                          onClick={() =>
                            void handleMarkMessageUnread(message.id)
                          }
                        >
                          {t`Mark unread`}
                        </StyledReplyButton>
                        <StyledReplyButton
                          type="button"
                          disabled={
                            copyingTeamResourceKey ===
                            `message-link:${message.id}`
                          }
                          onClick={() => void handleCopyMessageLink(message)}
                        >
                          {t`Copy link`}
                        </StyledReplyButton>
                        <StyledReplyButton
                          type="button"
                          disabled={
                            copyingTeamResourceKey ===
                            `message-text:${message.id}`
                          }
                          onClick={() => void handleCopyMessageText(message)}
                        >
                          {t`Copy text`}
                        </StyledReplyButton>
                        <StyledReplyButton
                          type="button"
                          disabled={!isComposerEnabled}
                          onClick={() => handleQuoteMessage(message, 'main')}
                        >
                          {t`Quote`}
                        </StyledReplyButton>
                        {message.canEdit ? (
                          <StyledReplyButton
                            type="button"
                            onClick={() => handleStartEditingMessage(message)}
                          >
                            {t`Edit`}
                          </StyledReplyButton>
                        ) : null}
                        {message.canDelete ? (
                          <StyledReplyButton
                            type="button"
                            disabled={deletingMessageId === message.id}
                            onClick={() => void handleDeleteMessage(message.id)}
                          >
                            {t`Delete`}
                          </StyledReplyButton>
                        ) : null}
                        {renderTeamMessageReactionActions(message)}
                        {renderTeamCustomReactionInput(message)}
                      </StyledMessageActions>
                    </StyledMessage>
                  </Fragment>
                ))}
              </StyledMessageList>
            ) : null}
            {mainTypingIndicatorText !== null ? (
              <StyledTypingIndicator>
                {mainTypingIndicatorText}
              </StyledTypingIndicator>
            ) : null}
            <StyledComposerStack
              dragActive={isMainComposerDragActive}
              onDragEnter={(event) =>
                handleAttachmentDragEnter({
                  event,
                  setDragActive: setIsMainComposerDragActive,
                })
              }
              onDragLeave={(event) =>
                handleAttachmentDragLeave({
                  event,
                  setDragActive: setIsMainComposerDragActive,
                })
              }
              onDragOver={handleAttachmentDragOver}
              onDrop={(event) =>
                void handleAttachmentDrop({
                  appendAttachments: (nextAttachments) =>
                    setPendingAttachments((attachments) =>
                      appendTeamPendingAttachments({
                        attachments,
                        nextAttachments,
                      }),
                    ),
                  event,
                  pendingAttachmentCount: pendingAttachments.length,
                  setDragActive: setIsMainComposerDragActive,
                })
              }
            >
              {pendingAttachments.map((attachment, attachmentIndex) => (
                <StyledPendingAttachment
                  key={`${attachment.url}-${attachmentIndex}`}
                >
                  <IconPaperclip size={14} />
                  <StyledPendingAttachmentLink
                    href={attachment.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {attachment.name}
                  </StyledPendingAttachmentLink>
                  <StyledSearchResultMeta>
                    {formatFileSize(attachment.size)}
                  </StyledSearchResultMeta>
                  <StyledPanelHeaderSpacer />
                  <StyledIconButton
                    aria-label={t`Remove attachment`}
                    onClick={() =>
                      setPendingAttachments((attachments) =>
                        removeTeamPendingAttachmentAtIndex({
                          attachments,
                          index: attachmentIndex,
                        }),
                      )
                    }
                  >
                    <IconX size={14} />
                  </StyledIconButton>
                </StyledPendingAttachment>
              ))}
              <StyledComposer
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleSendMessage(
                    event.currentTarget.querySelector('textarea')?.value,
                  );
                }}
              >
                <StyledComposerField>
                  <StyledComposerInput>
                    <StyledComposerTextInput
                      ref={setDraftMessageInputElement}
                      disabled={!isComposerEnabled}
                      placeholder={
                        effectiveConversationName
                          ? t`Message #${effectiveConversationName}`
                          : t`Select a conversation`
                      }
                      value={draftMessage}
                      onChange={(event) => setDraftMessage(event.target.value)}
                      onInput={(event) =>
                        setDraftMessage(event.currentTarget.value)
                      }
                      onPaste={(event) =>
                        void handleAttachmentPaste({
                          appendAttachments: (nextAttachments) =>
                            setPendingAttachments((attachments) =>
                              appendTeamPendingAttachments({
                                attachments,
                                nextAttachments,
                              }),
                            ),
                          event,
                          pendingAttachmentCount: pendingAttachments.length,
                        })
                      }
                      onKeyDown={(event) => {
                        if (
                          event.key === 'Escape' &&
                          (visibleMainCommandSuggestions.length > 0 ||
                            visibleMainMentionCandidates.length > 0 ||
                            visibleMainEmojiShortcodeSuggestions.length > 0)
                        ) {
                          event.preventDefault();
                          setDismissedMainComposerSuggestionDraft(draftMessage);

                          return;
                        }

                        if (
                          handleApplyComposerFormatShortcut({
                            event,
                            setComposerDraft: setDraftMessage,
                          })
                        ) {
                          return;
                        }

                        const nextCommandSuggestionIndex =
                          getNextTeamMentionSuggestionIndex({
                            candidateCount:
                              visibleMainCommandSuggestions.length,
                            currentIndex: activeMainCommandSuggestionIndex,
                            key: event.key,
                          });

                        if (nextCommandSuggestionIndex !== null) {
                          event.preventDefault();
                          setActiveMainCommandSuggestionIndex(
                            nextCommandSuggestionIndex,
                          );

                          return;
                        }

                        if (
                          shouldSelectTeamMentionSuggestion({
                            candidateCount:
                              visibleMainCommandSuggestions.length,
                            ctrlKey: event.ctrlKey,
                            isComposing: event.nativeEvent.isComposing,
                            key: event.key,
                            metaKey: event.metaKey,
                            shiftKey: event.shiftKey,
                          })
                        ) {
                          const selectedCommandSuggestion =
                            visibleMainCommandSuggestions[
                              activeMainCommandSuggestionIndex
                            ] ?? visibleMainCommandSuggestions[0];

                          event.preventDefault();

                          if (isDefined(selectedCommandSuggestion)) {
                            handleInsertDraftCommand(selectedCommandSuggestion);
                          }

                          return;
                        }

                        const nextMentionSuggestionIndex =
                          getNextTeamMentionSuggestionIndex({
                            candidateCount: visibleMainMentionCandidates.length,
                            currentIndex: activeMainMentionSuggestionIndex,
                            key: event.key,
                          });

                        if (nextMentionSuggestionIndex !== null) {
                          event.preventDefault();
                          setActiveMainMentionSuggestionIndex(
                            nextMentionSuggestionIndex,
                          );

                          return;
                        }

                        if (
                          shouldSelectTeamMentionSuggestion({
                            candidateCount: visibleMainMentionCandidates.length,
                            ctrlKey: event.ctrlKey,
                            isComposing: event.nativeEvent.isComposing,
                            key: event.key,
                            metaKey: event.metaKey,
                            shiftKey: event.shiftKey,
                          })
                        ) {
                          const selectedMentionCandidate =
                            visibleMainMentionCandidates[
                              activeMainMentionSuggestionIndex
                            ] ?? visibleMainMentionCandidates[0];

                          event.preventDefault();

                          if (isDefined(selectedMentionCandidate)) {
                            handleInsertDraftMention(selectedMentionCandidate);
                          }

                          return;
                        }

                        const nextEmojiShortcodeSuggestionIndex =
                          getNextTeamMentionSuggestionIndex({
                            candidateCount:
                              visibleMainEmojiShortcodeSuggestions.length,
                            currentIndex:
                              activeMainEmojiShortcodeSuggestionIndex,
                            key: event.key,
                          });

                        if (nextEmojiShortcodeSuggestionIndex !== null) {
                          event.preventDefault();
                          setActiveMainEmojiShortcodeSuggestionIndex(
                            nextEmojiShortcodeSuggestionIndex,
                          );

                          return;
                        }

                        if (
                          shouldSelectTeamMentionSuggestion({
                            candidateCount:
                              visibleMainEmojiShortcodeSuggestions.length,
                            ctrlKey: event.ctrlKey,
                            isComposing: event.nativeEvent.isComposing,
                            key: event.key,
                            metaKey: event.metaKey,
                            shiftKey: event.shiftKey,
                          })
                        ) {
                          const selectedEmojiShortcodeSuggestion =
                            visibleMainEmojiShortcodeSuggestions[
                              activeMainEmojiShortcodeSuggestionIndex
                            ] ?? visibleMainEmojiShortcodeSuggestions[0];

                          event.preventDefault();

                          if (isDefined(selectedEmojiShortcodeSuggestion)) {
                            handleInsertDraftEmojiShortcode(
                              selectedEmojiShortcodeSuggestion,
                            );
                          }

                          return;
                        }

                        if (
                          shouldStartEditingLastTeamMessage({
                            ctrlKey: event.ctrlKey,
                            draft: event.currentTarget.value,
                            isComposing: event.nativeEvent.isComposing,
                            key: event.key,
                            metaKey: event.metaKey,
                            shiftKey: event.shiftKey,
                          })
                        ) {
                          event.preventDefault();
                          handleStartEditingLastMainMessage();

                          return;
                        }

                        if (
                          shouldSendTeamComposerMessage({
                            ctrlKey: event.ctrlKey,
                            isComposing: event.nativeEvent.isComposing,
                            key: event.key,
                            metaKey: event.metaKey,
                            shiftKey: event.shiftKey,
                          })
                        ) {
                          event.preventDefault();
                          void handleSendMessage(event.currentTarget.value);
                        }
                      }}
                    />
                  </StyledComposerInput>
                  {renderTeamMentionSuggestions({
                    activeIndex: activeMainMentionSuggestionIndex,
                    candidates: visibleMainMentionCandidates,
                    onSelect: handleInsertDraftMention,
                  })}
                  {renderTeamCommandSuggestions({
                    activeIndex: activeMainCommandSuggestionIndex,
                    onSelect: handleInsertDraftCommand,
                    suggestions: visibleMainCommandSuggestions,
                  })}
                  {renderTeamEmojiShortcodeSuggestions({
                    activeIndex: activeMainEmojiShortcodeSuggestionIndex,
                    onSelect: handleInsertDraftEmojiShortcode,
                    suggestions: visibleMainEmojiShortcodeSuggestions,
                  })}
                </StyledComposerField>
                {draftMessage.trim().length > 0 ||
                pendingAttachments.length > 0 ? (
                  <StyledReplyButton
                    type="button"
                    onClick={handleDiscardDraftMessage}
                  >
                    {t`Discard draft`}
                  </StyledReplyButton>
                ) : null}
                <StyledIconButtonLabel
                  aria-label={t`Attach file`}
                  disabled={!isComposerEnabled}
                >
                  <IconPaperclip size={16} />
                  <StyledHiddenFileInput
                    disabled={!isComposerEnabled}
                    multiple
                    type="file"
                    onChange={(event) =>
                      void handleAttachmentInputChange(
                        event.target.files,
                        pendingAttachments.length,
                        (nextAttachments) =>
                          setPendingAttachments((attachments) =>
                            appendTeamPendingAttachments({
                              attachments,
                              nextAttachments,
                            }),
                          ),
                        () => {
                          event.target.value = '';
                        },
                      )
                    }
                  />
                </StyledIconButtonLabel>
                <StyledIconButton
                  aria-label={t`Send message`}
                  disabled={!isComposerEnabled || isSendingMessage}
                  type="button"
                  onClick={(event) =>
                    void handleSendMessage(
                      getTeamComposerFormDraftValue(event.currentTarget),
                    )
                  }
                >
                  <IconSend size={16} />
                </StyledIconButton>
              </StyledComposer>
            </StyledComposerStack>
          </StyledPanel>
          {selectedThreadParentMessageId ? (
            <StyledPanel>
              <StyledPanelHeader>
                <IconMessage size={16} />
                <StyledPanelTitleStack>
                  <StyledPanelTitle>{t`Thread`}</StyledPanelTitle>
                  {selectedThreadParentMessage ? (
                    <StyledPanelSubtitle>
                      {selectedThreadParentMessage.authorName}:{' '}
                      {selectedThreadParentMessage.body.length > 0
                        ? selectedThreadParentMessage.body
                        : t`Attachment message`}
                    </StyledPanelSubtitle>
                  ) : null}
                </StyledPanelTitleStack>
                <StyledPanelHeaderSpacer />
                {visibleThreadMessages.length > 0 ? (
                  <StyledReplyButton
                    type="button"
                    onClick={handleJumpToThreadActivity}
                  >
                    {threadUnreadDividerMessageId !== null
                      ? t`Jump to new`
                      : t`Jump to latest`}
                  </StyledReplyButton>
                ) : null}
                <StyledReplyButton
                  type="button"
                  disabled={
                    copyingTeamResourceKey ===
                    `thread-link:${selectedThreadParentMessageId}`
                  }
                  onClick={() => void handleCopyThreadLink()}
                >
                  {t`Copy link`}
                </StyledReplyButton>
                <StyledIconButton
                  aria-label={t`Close thread`}
                  onClick={handleCloseThread}
                >
                  <IconX size={16} />
                </StyledIconButton>
              </StyledPanelHeader>
              <StyledMessageList>
                {canLoadEarlierThreadMessages ? (
                  <StyledLoadEarlierButton
                    disabled={isLoadingEarlierThreadMessages}
                    onClick={() => void handleLoadEarlierThreadMessages()}
                  >
                    {isLoadingEarlierThreadMessages
                      ? t`Loading replies...`
                      : t`Load earlier replies`}
                  </StyledLoadEarlierButton>
                ) : null}
                {visibleThreadMessages.map((message, messageIndex) => (
                  <Fragment key={message.id}>
                    {shouldShowTeamMessageDateDivider({
                      createdAt: message.createdAt,
                      previousCreatedAt:
                        visibleThreadMessages[messageIndex - 1]?.createdAt,
                    }) ? (
                      <StyledDateDivider>
                        <span>
                          {formatTeamMessageDateDividerLabel(message.createdAt)}
                        </span>
                      </StyledDateDivider>
                    ) : null}
                    {threadUnreadDividerMessageId === message.id ? (
                      <StyledUnreadDivider>
                        <span>{t`New`}</span>
                      </StyledUnreadDivider>
                    ) : null}
                    <StyledMessage
                      highlighted={threadHighlightedMessageId === message.id}
                      id={getTeamMessageElementId({
                        messageId: message.id,
                        scope: 'thread',
                      })}
                    >
                      <StyledMessageMeta>
                        <StyledAuthor>{message.authorName}</StyledAuthor>
                        {renderTeamMessageAuthorStatus(message)}
                        <StyledMessageTime
                          title={formatTeamMessageTimestampTitle(
                            message.createdAt,
                          )}
                        >
                          {message.isPinned ? (
                            <>
                              <StyledPinnedBadge>
                                <IconPinned size={12} />
                                {t`Pinned`}
                              </StyledPinnedBadge>{' '}
                              ·{' '}
                            </>
                          ) : null}
                          {message.parentMessageId === null
                            ? t`Original message`
                            : t`Reply`}{' '}
                          ·{' '}
                          {message.time ??
                            new Intl.DateTimeFormat(undefined, {
                              hour: '2-digit',
                              minute: '2-digit',
                            }).format(
                              new Date(message.createdAt ?? Date.now()),
                            )}
                          {isTeamMessageEdited({
                            createdAt: message.createdAt,
                            updatedAt: message.updatedAt,
                          })
                            ? t` · edited`
                            : null}
                        </StyledMessageTime>
                      </StyledMessageMeta>
                      {editingMessageId === message.id ? (
                        <StyledMessageEditForm>
                          <StyledMessageEditInput
                            autoFocus
                            value={editingMessageBody}
                            onChange={(event) =>
                              setEditingMessageBody(event.target.value)
                            }
                            onKeyDown={(event) => {
                              if (
                                shouldSaveTeamMessageEdit({
                                  ctrlKey: event.ctrlKey,
                                  isComposing: event.nativeEvent.isComposing,
                                  key: event.key,
                                  metaKey: event.metaKey,
                                  shiftKey: event.shiftKey,
                                })
                              ) {
                                event.preventDefault();
                                void handleSaveEditingMessage();
                              }

                              if (
                                shouldCancelTeamMessageEdit({
                                  ctrlKey: event.ctrlKey,
                                  isComposing: event.nativeEvent.isComposing,
                                  key: event.key,
                                  metaKey: event.metaKey,
                                  shiftKey: event.shiftKey,
                                })
                              ) {
                                event.preventDefault();
                                handleCancelEditingMessage();
                              }
                            }}
                          />
                          <StyledReplyButton
                            type="button"
                            disabled={isSavingMessageEdit}
                            onClick={() => void handleSaveEditingMessage()}
                          >
                            {t`Save`}
                          </StyledReplyButton>
                          <StyledReplyButton
                            type="button"
                            onClick={handleCancelEditingMessage}
                          >
                            {t`Cancel`}
                          </StyledReplyButton>
                        </StyledMessageEditForm>
                      ) : (
                        renderTeamMessageBody(message.body)
                      )}
                      {message.attachments.length > 0 ? (
                        <StyledAttachmentList>
                          {message.attachments.map((attachment) => (
                            <Fragment key={attachment.id ?? attachment.name}>
                              <StyledAttachmentLink
                                href={attachment.url}
                                rel="noreferrer"
                                target="_blank"
                              >
                                <IconPaperclip size={14} />
                                {attachment.name}
                              </StyledAttachmentLink>
                              {attachment.size !== undefined &&
                              attachment.size !== null ? (
                                <StyledSearchResultMeta>
                                  {formatFileSize(attachment.size)}
                                </StyledSearchResultMeta>
                              ) : null}
                              <StyledInlineActionButton
                                disabled={
                                  copyingTeamResourceKey ===
                                  `attachment-link:${attachment.url}`
                                }
                                type="button"
                                onClick={() =>
                                  void handleCopyAttachmentLink(attachment)
                                }
                              >
                                {t`Copy link`}
                              </StyledInlineActionButton>
                            </Fragment>
                          ))}
                        </StyledAttachmentList>
                      ) : null}
                      <StyledMessageActions>
                        <StyledReplyButton
                          type="button"
                          disabled={
                            !isComposerEnabled ||
                            togglingPinnedMessageId === message.id
                          }
                          onClick={() =>
                            void handleToggleMessagePin(
                              message.id,
                              message.isPinned,
                            )
                          }
                        >
                          {message.isPinned ? t`Unpin` : t`Pin`}
                        </StyledReplyButton>
                        <StyledReplyButton
                          type="button"
                          disabled={
                            !isComposerEnabled ||
                            togglingSavedMessageId === message.id
                          }
                          onClick={() =>
                            void handleToggleMessageBookmark(
                              message.id,
                              message.isSaved,
                            )
                          }
                        >
                          {message.isSaved ? t`Unsave` : t`Save`}
                        </StyledReplyButton>
                        <StyledReplyButton
                          type="button"
                          disabled={
                            !isComposerEnabled ||
                            settingReminderMessageId === message.id
                          }
                          onClick={() =>
                            void handleSetMessageReminder(message.id)
                          }
                        >
                          {t`Remind`}
                        </StyledReplyButton>
                        <StyledInlineSelect
                          aria-label={t`Reminder delay`}
                          disabled={
                            !isComposerEnabled ||
                            settingReminderMessageId === message.id
                          }
                          value={
                            reminderOptionByMessageId[message.id] ??
                            DEFAULT_TEAM_MESSAGE_REMINDER_OPTION_VALUE
                          }
                          onChange={(event) =>
                            handleChangeMessageReminderOption(
                              message.id,
                              event.target.value,
                            )
                          }
                        >
                          {TEAM_MESSAGE_REMINDER_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </StyledInlineSelect>
                        <StyledReplyButton
                          type="button"
                          disabled={markingUnreadMessageId === message.id}
                          onClick={() =>
                            void handleMarkMessageUnread(message.id)
                          }
                        >
                          {t`Mark unread`}
                        </StyledReplyButton>
                        <StyledReplyButton
                          type="button"
                          disabled={
                            copyingTeamResourceKey ===
                            `message-link:${message.id}`
                          }
                          onClick={() => void handleCopyMessageLink(message)}
                        >
                          {t`Copy link`}
                        </StyledReplyButton>
                        <StyledReplyButton
                          type="button"
                          disabled={
                            copyingTeamResourceKey ===
                            `message-text:${message.id}`
                          }
                          onClick={() => void handleCopyMessageText(message)}
                        >
                          {t`Copy text`}
                        </StyledReplyButton>
                        <StyledReplyButton
                          type="button"
                          disabled={!isComposerEnabled}
                          onClick={() => handleQuoteMessage(message, 'thread')}
                        >
                          {t`Quote`}
                        </StyledReplyButton>
                        {message.canEdit ? (
                          <StyledReplyButton
                            type="button"
                            onClick={() => handleStartEditingMessage(message)}
                          >
                            {t`Edit`}
                          </StyledReplyButton>
                        ) : null}
                        {message.canDelete ? (
                          <StyledReplyButton
                            type="button"
                            disabled={deletingMessageId === message.id}
                            onClick={() => void handleDeleteMessage(message.id)}
                          >
                            {t`Delete`}
                          </StyledReplyButton>
                        ) : null}
                        {renderTeamMessageReactionActions(message)}
                        {renderTeamCustomReactionInput(message)}
                      </StyledMessageActions>
                    </StyledMessage>
                  </Fragment>
                ))}
              </StyledMessageList>
              {threadTypingIndicatorText !== null ? (
                <StyledTypingIndicator>
                  {threadTypingIndicatorText}
                </StyledTypingIndicator>
              ) : null}
              <StyledComposerStack
                dragActive={isThreadComposerDragActive}
                onDragEnter={(event) =>
                  handleAttachmentDragEnter({
                    event,
                    setDragActive: setIsThreadComposerDragActive,
                  })
                }
                onDragLeave={(event) =>
                  handleAttachmentDragLeave({
                    event,
                    setDragActive: setIsThreadComposerDragActive,
                  })
                }
                onDragOver={handleAttachmentDragOver}
                onDrop={(event) =>
                  void handleAttachmentDrop({
                    appendAttachments: (nextAttachments) =>
                      setPendingThreadAttachments((attachments) =>
                        appendTeamPendingAttachments({
                          attachments,
                          nextAttachments,
                        }),
                      ),
                    event,
                    pendingAttachmentCount: pendingThreadAttachments.length,
                    setDragActive: setIsThreadComposerDragActive,
                  })
                }
              >
                {pendingThreadAttachments.map((attachment, attachmentIndex) => (
                  <StyledPendingAttachment
                    key={`${attachment.url}-${attachmentIndex}`}
                  >
                    <IconPaperclip size={14} />
                    <StyledPendingAttachmentLink
                      href={attachment.url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {attachment.name}
                    </StyledPendingAttachmentLink>
                    <StyledSearchResultMeta>
                      {formatFileSize(attachment.size)}
                    </StyledSearchResultMeta>
                    <StyledPanelHeaderSpacer />
                    <StyledIconButton
                      aria-label={t`Remove attachment`}
                      onClick={() =>
                        setPendingThreadAttachments((attachments) =>
                          removeTeamPendingAttachmentAtIndex({
                            attachments,
                            index: attachmentIndex,
                          }),
                        )
                      }
                    >
                      <IconX size={14} />
                    </StyledIconButton>
                  </StyledPendingAttachment>
                ))}
                <StyledComposer
                  onSubmit={(event) => {
                    event.preventDefault();
                    void handleSendThreadReply(
                      event.currentTarget.querySelector('textarea')?.value,
                    );
                  }}
                >
                  <StyledComposerField>
                    <StyledComposerInput>
                      <StyledComposerTextInput
                        ref={setThreadDraftMessageInputElement}
                        disabled={!isComposerEnabled}
                        placeholder={t`Reply to thread`}
                        value={threadDraftMessage}
                        onChange={(event) =>
                          setThreadDraftMessage(event.target.value)
                        }
                        onInput={(event) =>
                          setThreadDraftMessage(event.currentTarget.value)
                        }
                        onPaste={(event) =>
                          void handleAttachmentPaste({
                            appendAttachments: (nextAttachments) =>
                              setPendingThreadAttachments((attachments) =>
                                appendTeamPendingAttachments({
                                  attachments,
                                  nextAttachments,
                                }),
                              ),
                            event,
                            pendingAttachmentCount:
                              pendingThreadAttachments.length,
                          })
                        }
                        onKeyDown={(event) => {
                          if (
                            event.key === 'Escape' &&
                            (visibleThreadCommandSuggestions.length > 0 ||
                              visibleThreadMentionCandidates.length > 0 ||
                              visibleThreadEmojiShortcodeSuggestions.length > 0)
                          ) {
                            event.preventDefault();
                            setDismissedThreadComposerSuggestionDraft(
                              threadDraftMessage,
                            );

                            return;
                          }

                          if (
                            handleApplyComposerFormatShortcut({
                              event,
                              setComposerDraft: setThreadDraftMessage,
                            })
                          ) {
                            return;
                          }

                          const nextCommandSuggestionIndex =
                            getNextTeamMentionSuggestionIndex({
                              candidateCount:
                                visibleThreadCommandSuggestions.length,
                              currentIndex: activeThreadCommandSuggestionIndex,
                              key: event.key,
                            });

                          if (nextCommandSuggestionIndex !== null) {
                            event.preventDefault();
                            setActiveThreadCommandSuggestionIndex(
                              nextCommandSuggestionIndex,
                            );

                            return;
                          }

                          if (
                            shouldSelectTeamMentionSuggestion({
                              candidateCount:
                                visibleThreadCommandSuggestions.length,
                              ctrlKey: event.ctrlKey,
                              isComposing: event.nativeEvent.isComposing,
                              key: event.key,
                              metaKey: event.metaKey,
                              shiftKey: event.shiftKey,
                            })
                          ) {
                            const selectedCommandSuggestion =
                              visibleThreadCommandSuggestions[
                                activeThreadCommandSuggestionIndex
                              ] ?? visibleThreadCommandSuggestions[0];

                            event.preventDefault();

                            if (isDefined(selectedCommandSuggestion)) {
                              handleInsertThreadDraftCommand(
                                selectedCommandSuggestion,
                              );
                            }

                            return;
                          }

                          const nextMentionSuggestionIndex =
                            getNextTeamMentionSuggestionIndex({
                              candidateCount:
                                visibleThreadMentionCandidates.length,
                              currentIndex: activeThreadMentionSuggestionIndex,
                              key: event.key,
                            });

                          if (nextMentionSuggestionIndex !== null) {
                            event.preventDefault();
                            setActiveThreadMentionSuggestionIndex(
                              nextMentionSuggestionIndex,
                            );

                            return;
                          }

                          if (
                            shouldSelectTeamMentionSuggestion({
                              candidateCount:
                                visibleThreadMentionCandidates.length,
                              ctrlKey: event.ctrlKey,
                              isComposing: event.nativeEvent.isComposing,
                              key: event.key,
                              metaKey: event.metaKey,
                              shiftKey: event.shiftKey,
                            })
                          ) {
                            const selectedMentionCandidate =
                              visibleThreadMentionCandidates[
                                activeThreadMentionSuggestionIndex
                              ] ?? visibleThreadMentionCandidates[0];

                            event.preventDefault();

                            if (isDefined(selectedMentionCandidate)) {
                              handleInsertThreadDraftMention(
                                selectedMentionCandidate,
                              );
                            }

                            return;
                          }

                          const nextEmojiShortcodeSuggestionIndex =
                            getNextTeamMentionSuggestionIndex({
                              candidateCount:
                                visibleThreadEmojiShortcodeSuggestions.length,
                              currentIndex:
                                activeThreadEmojiShortcodeSuggestionIndex,
                              key: event.key,
                            });

                          if (nextEmojiShortcodeSuggestionIndex !== null) {
                            event.preventDefault();
                            setActiveThreadEmojiShortcodeSuggestionIndex(
                              nextEmojiShortcodeSuggestionIndex,
                            );

                            return;
                          }

                          if (
                            shouldSelectTeamMentionSuggestion({
                              candidateCount:
                                visibleThreadEmojiShortcodeSuggestions.length,
                              ctrlKey: event.ctrlKey,
                              isComposing: event.nativeEvent.isComposing,
                              key: event.key,
                              metaKey: event.metaKey,
                              shiftKey: event.shiftKey,
                            })
                          ) {
                            const selectedEmojiShortcodeSuggestion =
                              visibleThreadEmojiShortcodeSuggestions[
                                activeThreadEmojiShortcodeSuggestionIndex
                              ] ?? visibleThreadEmojiShortcodeSuggestions[0];

                            event.preventDefault();

                            if (isDefined(selectedEmojiShortcodeSuggestion)) {
                              handleInsertThreadDraftEmojiShortcode(
                                selectedEmojiShortcodeSuggestion,
                              );
                            }

                            return;
                          }

                          if (
                            shouldStartEditingLastTeamMessage({
                              ctrlKey: event.ctrlKey,
                              draft: event.currentTarget.value,
                              isComposing: event.nativeEvent.isComposing,
                              key: event.key,
                              metaKey: event.metaKey,
                              shiftKey: event.shiftKey,
                            })
                          ) {
                            event.preventDefault();
                            handleStartEditingLastThreadMessage();

                            return;
                          }

                          if (
                            shouldSendTeamComposerMessage({
                              ctrlKey: event.ctrlKey,
                              isComposing: event.nativeEvent.isComposing,
                              key: event.key,
                              metaKey: event.metaKey,
                              shiftKey: event.shiftKey,
                            })
                          ) {
                            event.preventDefault();
                            void handleSendThreadReply(
                              event.currentTarget.value,
                            );
                          }
                        }}
                      />
                    </StyledComposerInput>
                    {renderTeamMentionSuggestions({
                      activeIndex: activeThreadMentionSuggestionIndex,
                      candidates: visibleThreadMentionCandidates,
                      onSelect: handleInsertThreadDraftMention,
                    })}
                    {renderTeamCommandSuggestions({
                      activeIndex: activeThreadCommandSuggestionIndex,
                      onSelect: handleInsertThreadDraftCommand,
                      suggestions: visibleThreadCommandSuggestions,
                    })}
                    {renderTeamEmojiShortcodeSuggestions({
                      activeIndex: activeThreadEmojiShortcodeSuggestionIndex,
                      onSelect: handleInsertThreadDraftEmojiShortcode,
                      suggestions: visibleThreadEmojiShortcodeSuggestions,
                    })}
                  </StyledComposerField>
                  {threadDraftMessage.trim().length > 0 ||
                  pendingThreadAttachments.length > 0 ? (
                    <StyledReplyButton
                      type="button"
                      onClick={handleDiscardThreadDraftMessage}
                    >
                      {t`Discard draft`}
                    </StyledReplyButton>
                  ) : null}
                  <StyledIconButtonLabel
                    aria-label={t`Attach file`}
                    disabled={!isComposerEnabled}
                  >
                    <IconPaperclip size={16} />
                    <StyledHiddenFileInput
                      disabled={!isComposerEnabled}
                      multiple
                      type="file"
                      onChange={(event) =>
                        void handleAttachmentInputChange(
                          event.target.files,
                          pendingThreadAttachments.length,
                          (nextAttachments) =>
                            setPendingThreadAttachments((attachments) =>
                              appendTeamPendingAttachments({
                                attachments,
                                nextAttachments,
                              }),
                            ),
                          () => {
                            event.target.value = '';
                          },
                        )
                      }
                    />
                  </StyledIconButtonLabel>
                  <StyledIconButton
                    aria-label={t`Send reply`}
                    disabled={!isComposerEnabled || isSendingThreadReply}
                    type="button"
                    onClick={(event) =>
                      void handleSendThreadReply(
                        getTeamComposerFormDraftValue(event.currentTarget),
                      )
                    }
                  >
                    <IconSend size={16} />
                  </StyledIconButton>
                </StyledComposer>
              </StyledComposerStack>
            </StyledPanel>
          ) : null}
        </StyledContent>
      </PageBody>
    </PageContainer>
  );
};
