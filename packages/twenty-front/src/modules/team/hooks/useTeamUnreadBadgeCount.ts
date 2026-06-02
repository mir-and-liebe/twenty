import { useQuery } from '@apollo/client/react';
import { useEffect, useMemo, useState } from 'react';

import {
  GET_TEAM_INBOX,
  GET_TEAM_MESSAGE_REMINDERS,
  GET_TEAM_PRESENCE,
} from '@/team/graphql/teamCommsOperations';
import {
  getTeamUnreadBadgeCount,
  type TeamNotificationPreference,
} from '@/team/utils/teamNotifications';

const TEAM_BADGE_REFRESH_INTERVAL_MS = 30000;

type TeamInboxItem = {
  id: string;
  subtitle?: string | null;
  title: string;
  type?: string;
  unreadCount: number;
};

type TeamMessageReminder = {
  id: string;
  body: string;
  conversationName: string;
  remindAt: string;
};

type TeamPresence = {
  isCurrentUser: boolean;
  notificationPreference?: string | null;
};

type GetTeamInboxQuery = {
  teamInbox: TeamInboxItem[];
};

type GetTeamMessageRemindersQuery = {
  teamMessageReminders: TeamMessageReminder[];
};

type GetTeamPresenceQuery = {
  teamPresence: TeamPresence[];
};

export const useTeamUnreadBadgeCount = () => {
  const [now, setNow] = useState(() => Date.now());
  const { data: inboxData } = useQuery<GetTeamInboxQuery>(GET_TEAM_INBOX, {
    fetchPolicy: 'cache-and-network',
    pollInterval: TEAM_BADGE_REFRESH_INTERVAL_MS,
  });
  const { data: remindersData } = useQuery<GetTeamMessageRemindersQuery>(
    GET_TEAM_MESSAGE_REMINDERS,
    {
      fetchPolicy: 'cache-and-network',
      pollInterval: TEAM_BADGE_REFRESH_INTERVAL_MS,
    },
  );
  const { data: presenceData } = useQuery<GetTeamPresenceQuery>(
    GET_TEAM_PRESENCE,
    {
      fetchPolicy: 'cache-and-network',
      pollInterval: TEAM_BADGE_REFRESH_INTERVAL_MS,
    },
  );

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, TEAM_BADGE_REFRESH_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  const currentUserPresence = presenceData?.teamPresence.find(
    (presence) => presence.isCurrentUser,
  );
  const notificationPreference =
    (currentUserPresence?.notificationPreference?.toUpperCase() ??
      'ALL') as TeamNotificationPreference;

  return useMemo(
    () =>
      getTeamUnreadBadgeCount({
        inboxItems: inboxData?.teamInbox ?? [],
        now,
        preference: notificationPreference,
        reminders: remindersData?.teamMessageReminders ?? [],
      }),
    [
      inboxData?.teamInbox,
      now,
      notificationPreference,
      remindersData?.teamMessageReminders,
    ],
  );
};
