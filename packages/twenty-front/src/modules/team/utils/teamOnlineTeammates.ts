type TeamOnlinePresence = {
  isCurrentUser?: boolean;
  isOnline: boolean;
  userWorkspaceId: string;
};

type GetTeamOnlineTeammatesArgs<TPresence extends TeamOnlinePresence> = {
  currentUserWorkspaceId: string | undefined;
  presence: TPresence[];
};

export const getTeamOnlineTeammates = <TPresence extends TeamOnlinePresence>({
  currentUserWorkspaceId,
  presence,
}: GetTeamOnlineTeammatesArgs<TPresence>) =>
  presence.filter(
    (presenceItem) =>
      presenceItem.isOnline &&
      !presenceItem.isCurrentUser &&
      presenceItem.userWorkspaceId !== currentUserWorkspaceId,
  );
