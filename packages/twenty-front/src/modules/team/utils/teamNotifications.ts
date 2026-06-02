import {
  formatTeamMessageBody,
  formatTeamMessageTextSegments,
} from '@/team/utils/teamMessageFormatting';
import { getTeamMessagePreviewBody } from '@/team/utils/teamMessagePreviews';

export type TeamNotificationInboxItem = {
  id: string;
  title: string;
  subtitle?: string | null;
  type?: string;
  unreadCount: number;
};

export type TeamNotificationReminder = {
  id: string;
  body: string;
  conversationName: string;
  remindAt: string;
};

export type TeamNotificationCandidate = {
  id: string;
  title: string;
  body: string;
};

export type TeamNotificationPreference = 'ALL' | 'MENTIONS' | 'MUTED';

export type TeamConversationNotificationLevel =
  | 'ALL'
  | 'MENTIONS'
  | 'MUTED'
  | 'all'
  | 'mentions'
  | 'muted';

export type TeamNotificationQuietHours = {
  end: string | null;
  start: string | null;
};

export type TeamLiveMessageNotificationEvent = {
  authorUserWorkspaceId: string;
  body: string;
  channelId?: string | null;
  directMessageThreadId?: string | null;
  isNewMessage?: boolean;
  parentMessageId?: string | null;
  type: string;
};

export type TeamLiveMessageNotificationCurrentUser = {
  email?: string | null;
  name?: string | null;
  userWorkspaceId: string;
};

const getTimeStringMinutes = (timeString: string | null) => {
  if (!timeString) {
    return null;
  }

  const [hours, minutes] = timeString.split(':').map(Number);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
};

const isWithinQuietHours = ({
  now,
  quietHours,
}: {
  now: number;
  quietHours?: TeamNotificationQuietHours | null;
}) => {
  const startMinutes = getTimeStringMinutes(quietHours?.start ?? null);
  const endMinutes = getTimeStringMinutes(quietHours?.end ?? null);

  if (startMinutes === null || endMinutes === null) {
    return false;
  }

  if (startMinutes === endMinutes) {
    return false;
  }

  const currentDate = new Date(now);
  const currentMinutes = currentDate.getHours() * 60 + currentDate.getMinutes();

  return startMinutes < endMinutes
    ? currentMinutes >= startMinutes && currentMinutes < endMinutes
    : currentMinutes >= startMinutes || currentMinutes < endMinutes;
};

const getPreferenceFilteredInboxItems = ({
  inboxItems,
  preference,
}: {
  inboxItems: TeamNotificationInboxItem[];
  preference: TeamNotificationPreference;
}) => {
  if (preference === 'MUTED') {
    return [];
  }

  if (preference === 'MENTIONS') {
    return inboxItems.filter((item) => {
      const normalizedItemType = item.type?.toLowerCase();

      return (
        normalizedItemType === 'mention' ||
        normalizedItemType === 'directmessage' ||
        normalizedItemType === 'thread'
      );
    });
  }

  return inboxItems;
};

const normalizeTeamNotificationLevel = <
  TLevel extends TeamNotificationPreference,
>(
  value: TLevel | Lowercase<TLevel> | null | undefined,
  fallback: TLevel,
): TLevel => {
  const normalizedValue = value?.toUpperCase();

  return normalizedValue === 'ALL' ||
    normalizedValue === 'MENTIONS' ||
    normalizedValue === 'MUTED'
    ? (normalizedValue as TLevel)
    : fallback;
};

const normalizeTeamMentionAlias = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]/g, '');

const BROAD_TEAM_MENTION_ALIASES = new Set(['channel', 'everyone', 'here']);

const getCurrentUserMentionAliases = ({
  email,
  name,
}: TeamLiveMessageNotificationCurrentUser) => {
  const emailLocalPart = email?.split('@')[0] ?? '';
  const nameParts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  const firstName = nameParts[0] ?? '';
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
  const candidates = [
    emailLocalPart,
    name ?? '',
    firstName,
    lastName,
    `${firstName}${lastName}`,
    `${firstName}.${lastName}`,
  ];

  return new Set(
    candidates.map(normalizeTeamMentionAlias).filter((alias) => alias.length),
  );
};

const isCurrentUserMentioned = ({
  body,
  isChannelMessage = false,
  currentUser,
}: {
  body: string;
  isChannelMessage?: boolean;
  currentUser: TeamLiveMessageNotificationCurrentUser;
}) => {
  const mentionAliases = formatTeamMessageBody(body)
    .filter((block) => block.type !== 'code-block')
    .flatMap((block) => formatTeamMessageTextSegments(block.text))
    .filter((segment) => segment.type === 'mention')
    .map((segment) => normalizeTeamMentionAlias(segment.text.slice(1)));
  const currentUserMentionAliases = getCurrentUserMentionAliases(currentUser);

  return mentionAliases.some(
    (alias) =>
      (isChannelMessage && BROAD_TEAM_MENTION_ALIASES.has(alias)) ||
      currentUserMentionAliases.has(alias),
  );
};

export const getTeamUnreadBadgeCount = ({
  inboxItems,
  now,
  preference = 'ALL',
  reminders,
}: {
  inboxItems: TeamNotificationInboxItem[];
  now: number;
  preference?: TeamNotificationPreference;
  reminders: TeamNotificationReminder[];
}) => {
  if (preference === 'MUTED') {
    return 0;
  }

  const unreadInboxCount = getPreferenceFilteredInboxItems({
    inboxItems,
    preference,
  }).reduce((sum, item) => sum + item.unreadCount, 0);
  const dueReminderCount = reminders.filter(
    (reminder) => new Date(reminder.remindAt).getTime() <= now,
  ).length;

  return unreadInboxCount + dueReminderCount;
};

export const getTeamNotificationTitle = ({
  baseTitle,
  count,
}: {
  baseTitle: string;
  count: number;
}) => (count > 0 ? `(${count}) ${baseTitle}` : baseTitle);

export const getTeamLiveMessageNotificationBody = (body: string) => {
  return getTeamMessagePreviewBody({ body });
};

export const getDueTeamNotificationCandidates = ({
  inboxItems,
  now,
  preference = 'ALL',
  quietHours,
  reminders,
}: {
  inboxItems: TeamNotificationInboxItem[];
  now: number;
  preference?: TeamNotificationPreference;
  quietHours?: TeamNotificationQuietHours | null;
  reminders: TeamNotificationReminder[];
}): TeamNotificationCandidate[] => {
  if (isWithinQuietHours({ now, quietHours })) {
    return [];
  }

  return [
    ...getPreferenceFilteredInboxItems({ inboxItems, preference })
      .filter((item) => item.unreadCount > 0)
      .map((item) => ({
        body:
          item.subtitle != null
            ? getTeamLiveMessageNotificationBody(item.subtitle)
            : `${item.unreadCount} unread`,
        id: `inbox:${item.id}`,
        title: item.title,
      })),
    ...(preference === 'MUTED'
      ? []
      : reminders
          .filter((reminder) => new Date(reminder.remindAt).getTime() <= now)
          .map((reminder) => ({
            body: getTeamLiveMessageNotificationBody(reminder.body),
            id: `reminder:${reminder.id}`,
            title: `Reminder in ${reminder.conversationName}`,
          }))),
  ];
};

export const getNewTeamNotificationCandidates = ({
  candidates,
  seenCandidateIds,
}: {
  candidates: TeamNotificationCandidate[];
  seenCandidateIds: ReadonlySet<string>;
}) => candidates.filter((candidate) => !seenCandidateIds.has(candidate.id));

export const shouldShowTeamLiveMessageNotification = ({
  conversationNotificationLevel,
  currentUser,
  event,
  now,
  preference = 'ALL',
  quietHours,
}: {
  conversationNotificationLevel?: TeamConversationNotificationLevel | null;
  currentUser: TeamLiveMessageNotificationCurrentUser;
  event: TeamLiveMessageNotificationEvent;
  now: number;
  preference?:
    | TeamNotificationPreference
    | Lowercase<TeamNotificationPreference>;
  quietHours?: TeamNotificationQuietHours | null;
}) => {
  if (
    event.type !== 'UPSERTED' ||
    event.isNewMessage !== true ||
    event.authorUserWorkspaceId === currentUser.userWorkspaceId ||
    isWithinQuietHours({ now, quietHours })
  ) {
    return false;
  }

  const normalizedPreference = normalizeTeamNotificationLevel(
    preference,
    'ALL',
  );
  const normalizedConversationNotificationLevel =
    normalizeTeamNotificationLevel(conversationNotificationLevel, 'ALL');
  const isChannelMessage = typeof event.channelId === 'string';
  const isDirectMessage = typeof event.directMessageThreadId === 'string';

  if (
    normalizedPreference === 'MUTED' ||
    normalizedConversationNotificationLevel === 'MUTED'
  ) {
    return false;
  }

  if (event.parentMessageId != null) {
    if (isDirectMessage && normalizedConversationNotificationLevel === 'ALL') {
      return true;
    }

    return isCurrentUserMentioned({
      body: event.body,
      currentUser,
      isChannelMessage,
    });
  }

  if (isDirectMessage && normalizedConversationNotificationLevel === 'ALL') {
    return true;
  }

  if (
    normalizedPreference === 'MENTIONS' ||
    normalizedConversationNotificationLevel === 'MENTIONS'
  ) {
    return isCurrentUserMentioned({
      body: event.body,
      currentUser,
      isChannelMessage,
    });
  }

  return true;
};
