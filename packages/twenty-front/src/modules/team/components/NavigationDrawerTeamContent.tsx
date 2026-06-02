import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import {
  IconClock,
  IconLock,
  IconMail,
  IconMessage,
  IconNumber,
  IconPaperclip,
  IconPinned,
  IconSearch,
  IconStar,
  IconUsers,
} from 'twenty-ui/display';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import {
  GET_TEAM_CHANNELS,
  GET_TEAM_DIRECT_MESSAGES,
  GET_TEAM_INBOX,
  GET_TEAM_MENTIONS,
  GET_TEAM_FILES,
  GET_TEAM_MESSAGE_REMINDERS,
  GET_TEAM_PINNED_MESSAGES,
  GET_TEAM_SAVED_MESSAGES,
} from '@/team/graphql/teamCommsOperations';
import { NavigationDrawerAnimatedCollapseWrapper } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerAnimatedCollapseWrapper';
import { NavigationDrawerItem } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerItem';
import { NavigationDrawerSectionTitle } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerSectionTitle';
import { useNavigationSection } from '@/ui/navigation/navigation-drawer/hooks/useNavigationSection';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: ${themeCssVariables.spacing[2]} 0;
  width: calc(100% - ${themeCssVariables.spacing[2]});
`;

const StyledSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing['0.5']};
`;

const StyledUnreadBadge = styled.span`
  align-items: center;
  background: ${themeCssVariables.color.blue};
  border-radius: ${themeCssVariables.border.radius.pill};
  color: ${themeCssVariables.font.color.inverted};
  display: inline-flex;
  font-size: ${themeCssVariables.font.size.xs};
  height: ${themeCssVariables.spacing[4]};
  justify-content: center;
  min-width: ${themeCssVariables.spacing[4]};
  padding: 0 ${themeCssVariables.spacing[1]};
`;

const StyledSections = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

const TEAM_DRAWER_REFRESH_INTERVAL_MS = 30000;

type TeamChannel = {
  id: string;
  name: string;
  visibility?: 'PUBLIC' | 'PRIVATE' | 'public' | 'private';
  unreadCount: number;
};

type TeamDirectMessage = {
  id: string;
  participantName: string;
  unreadCount: number;
};

type TeamInboxItem = {
  id: string;
  type?: string;
  unreadCount: number;
};

type TeamMention = {
  id: string;
  readAt?: string | null;
};

type TeamMessageReminder = {
  id: string;
};

type TeamPinnedMessage = {
  id: string;
};

type TeamSavedMessage = {
  id: string;
};

type TeamFile = {
  id: string;
};

type GetTeamChannelsQuery = {
  teamChannels: TeamChannel[];
};

type GetTeamDirectMessagesQuery = {
  teamDirectMessages: TeamDirectMessage[];
};

type GetTeamInboxQuery = {
  teamInbox: TeamInboxItem[];
};

type GetTeamMentionsQuery = {
  teamMentions: TeamMention[];
};

type GetTeamMessageRemindersQuery = {
  teamMessageReminders: TeamMessageReminder[];
};

type GetTeamPinnedMessagesQuery = {
  teamPinnedMessages: TeamPinnedMessage[];
};

type GetTeamSavedMessagesQuery = {
  teamSavedMessages: TeamSavedMessage[];
};

type GetTeamFilesQuery = {
  teamFiles: TeamFile[];
};

export const NavigationDrawerTeamContent = () => {
  const location = useLocation();
  const channelsSection = useNavigationSection('TeamCommsChannels');
  const directMessagesSection = useNavigationSection('TeamCommsDirectMessages');
  const { data: channelsData, error: channelsError } =
    useQuery<GetTeamChannelsQuery>(GET_TEAM_CHANNELS, {
      pollInterval: TEAM_DRAWER_REFRESH_INTERVAL_MS,
    });
  const { data: directMessagesData, error: directMessagesError } =
    useQuery<GetTeamDirectMessagesQuery>(GET_TEAM_DIRECT_MESSAGES, {
      pollInterval: TEAM_DRAWER_REFRESH_INTERVAL_MS,
    });
  const { data: inboxData, error: inboxError } = useQuery<GetTeamInboxQuery>(
    GET_TEAM_INBOX,
    {
      pollInterval: TEAM_DRAWER_REFRESH_INTERVAL_MS,
    },
  );
  const { data: mentionsData, error: mentionsError } =
    useQuery<GetTeamMentionsQuery>(GET_TEAM_MENTIONS, {
      pollInterval: TEAM_DRAWER_REFRESH_INTERVAL_MS,
    });
  const { data: remindersData, error: remindersError } =
    useQuery<GetTeamMessageRemindersQuery>(GET_TEAM_MESSAGE_REMINDERS, {
      pollInterval: TEAM_DRAWER_REFRESH_INTERVAL_MS,
    });
  const { data: pinnedMessagesData, error: pinnedMessagesError } =
    useQuery<GetTeamPinnedMessagesQuery>(GET_TEAM_PINNED_MESSAGES, {
      pollInterval: TEAM_DRAWER_REFRESH_INTERVAL_MS,
    });
  const { data: savedMessagesData, error: savedMessagesError } =
    useQuery<GetTeamSavedMessagesQuery>(GET_TEAM_SAVED_MESSAGES, {
      pollInterval: TEAM_DRAWER_REFRESH_INTERVAL_MS,
    });
  const { data: filesData, error: filesError } = useQuery<GetTeamFilesQuery>(
    GET_TEAM_FILES,
    {
      pollInterval: TEAM_DRAWER_REFRESH_INTERVAL_MS,
    },
  );
  const apiChannels = channelsData?.teamChannels ?? [];
  const channels = !channelsError ? apiChannels : [];
  const apiDirectMessages = directMessagesData?.teamDirectMessages ?? [];
  const directMessages = !directMessagesError ? apiDirectMessages : [];
  const inboxItems = !inboxError ? (inboxData?.teamInbox ?? []) : [];
  const mentions = !mentionsError ? (mentionsData?.teamMentions ?? []) : [];
  const reminders = !remindersError
    ? (remindersData?.teamMessageReminders ?? [])
    : [];
  const pinnedMessages = !pinnedMessagesError
    ? (pinnedMessagesData?.teamPinnedMessages ?? [])
    : [];
  const savedMessages = !savedMessagesError
    ? (savedMessagesData?.teamSavedMessages ?? [])
    : [];
  const files = !filesError ? (filesData?.teamFiles ?? []) : [];
  const inboxCount = inboxItems.reduce(
    (totalUnreadCount, inboxItem) => totalUnreadCount + inboxItem.unreadCount,
    0,
  );
  const threadInboxCount = inboxItems
    .filter((inboxItem) => inboxItem.type?.toLowerCase() === 'thread')
    .reduce(
      (totalUnreadCount, inboxItem) => totalUnreadCount + inboxItem.unreadCount,
      0,
    );
  const unreadMentionCount = mentions.filter(
    (mention) => mention.readAt === null,
  ).length;
  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const activeChannelId = searchParams.get('teamChannelId');
  const activeDirectMessageId = searchParams.get('teamDirectMessageId');
  const activeTeamPanel = searchParams.get('teamPanel');
  const isInboxActive = activeTeamPanel === 'inbox';

  return (
    <StyledContainer>
      <StyledSections>
        <StyledSection>
          <NavigationDrawerAnimatedCollapseWrapper>
            <NavigationDrawerItem
              label={t`Team Inbox`}
              Icon={IconUsers}
              active={isInboxActive}
              to="/team?teamPanel=inbox"
              rightOptions={
                inboxCount > 0 ? (
                  <StyledUnreadBadge>{inboxCount}</StyledUnreadBadge>
                ) : undefined
              }
            />
          </NavigationDrawerAnimatedCollapseWrapper>
          <NavigationDrawerAnimatedCollapseWrapper>
            <NavigationDrawerItem
              label={t`Mentions`}
              Icon={IconMail}
              active={activeTeamPanel === 'mentions'}
              to="/team?teamPanel=mentions"
              rightOptions={
                unreadMentionCount > 0 ? (
                  <StyledUnreadBadge>{unreadMentionCount}</StyledUnreadBadge>
                ) : undefined
              }
            />
          </NavigationDrawerAnimatedCollapseWrapper>
          <NavigationDrawerAnimatedCollapseWrapper>
            <NavigationDrawerItem
              label={t`Threads`}
              Icon={IconMessage}
              active={activeTeamPanel === 'threads'}
              to="/team?teamPanel=threads"
              rightOptions={
                threadInboxCount > 0 ? (
                  <StyledUnreadBadge>{threadInboxCount}</StyledUnreadBadge>
                ) : undefined
              }
            />
          </NavigationDrawerAnimatedCollapseWrapper>
          <NavigationDrawerAnimatedCollapseWrapper>
            <NavigationDrawerItem
              label={t`Search`}
              Icon={IconSearch}
              active={activeTeamPanel === 'search'}
              to="/team?teamPanel=search"
            />
          </NavigationDrawerAnimatedCollapseWrapper>
          <NavigationDrawerAnimatedCollapseWrapper>
            <NavigationDrawerItem
              label={t`Saved`}
              Icon={IconStar}
              active={activeTeamPanel === 'saved'}
              to="/team?teamPanel=saved"
              rightOptions={
                savedMessages.length > 0 ? (
                  <StyledUnreadBadge>{savedMessages.length}</StyledUnreadBadge>
                ) : undefined
              }
            />
          </NavigationDrawerAnimatedCollapseWrapper>
          <NavigationDrawerAnimatedCollapseWrapper>
            <NavigationDrawerItem
              label={t`Pinned`}
              Icon={IconPinned}
              active={activeTeamPanel === 'pinned'}
              to="/team?teamPanel=pinned"
              rightOptions={
                pinnedMessages.length > 0 ? (
                  <StyledUnreadBadge>{pinnedMessages.length}</StyledUnreadBadge>
                ) : undefined
              }
            />
          </NavigationDrawerAnimatedCollapseWrapper>
          <NavigationDrawerAnimatedCollapseWrapper>
            <NavigationDrawerItem
              label={t`Files`}
              Icon={IconPaperclip}
              active={activeTeamPanel === 'files'}
              to="/team?teamPanel=files"
              rightOptions={
                files.length > 0 ? (
                  <StyledUnreadBadge>{files.length}</StyledUnreadBadge>
                ) : undefined
              }
            />
          </NavigationDrawerAnimatedCollapseWrapper>
          <NavigationDrawerAnimatedCollapseWrapper>
            <NavigationDrawerItem
              label={t`Reminders`}
              Icon={IconClock}
              active={activeTeamPanel === 'reminders'}
              to="/team?teamPanel=reminders"
              rightOptions={
                reminders.length > 0 ? (
                  <StyledUnreadBadge>{reminders.length}</StyledUnreadBadge>
                ) : undefined
              }
            />
          </NavigationDrawerAnimatedCollapseWrapper>
        </StyledSection>

        <StyledSection>
          <NavigationDrawerAnimatedCollapseWrapper>
            <NavigationDrawerSectionTitle
              label={t`Channels`}
              onClick={channelsSection.toggleNavigationSection}
              isOpen={channelsSection.isNavigationSectionOpen}
            />
          </NavigationDrawerAnimatedCollapseWrapper>
          {channelsSection.isNavigationSectionOpen
            ? channels.map((channel) => (
                <NavigationDrawerItem
                  key={channel.id}
                  label={channel.name}
                  Icon={
                    channel.visibility === 'PRIVATE' ||
                    channel.visibility === 'private'
                      ? IconLock
                      : IconNumber
                  }
                  indentationLevel={2}
                  active={channel.id === activeChannelId}
                  to={`/team?teamChannelId=${channel.id}`}
                  rightOptions={
                    channel.unreadCount > 0 ? (
                      <StyledUnreadBadge>
                        {channel.unreadCount}
                      </StyledUnreadBadge>
                    ) : undefined
                  }
                />
              ))
            : null}
        </StyledSection>

        <StyledSection>
          <NavigationDrawerAnimatedCollapseWrapper>
            <NavigationDrawerSectionTitle
              label={t`Direct Messages`}
              onClick={directMessagesSection.toggleNavigationSection}
              isOpen={directMessagesSection.isNavigationSectionOpen}
            />
          </NavigationDrawerAnimatedCollapseWrapper>
          {directMessagesSection.isNavigationSectionOpen
            ? directMessages.map((directMessage) => (
                <NavigationDrawerItem
                  key={directMessage.id}
                  label={directMessage.participantName}
                  Icon={IconMessage}
                  indentationLevel={2}
                  active={directMessage.id === activeDirectMessageId}
                  to={`/team?teamDirectMessageId=${directMessage.id}`}
                  rightOptions={
                    directMessage.unreadCount > 0 ? (
                      <StyledUnreadBadge>
                        {directMessage.unreadCount}
                      </StyledUnreadBadge>
                    ) : undefined
                  }
                />
              ))
            : null}
        </StyledSection>
      </StyledSections>
    </StyledContainer>
  );
};
