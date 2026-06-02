type TeamInviteCandidate = {
  name: string;
  userWorkspaceId: string;
};

type GetTeamInviteCandidatesArgs<TCandidate extends TeamInviteCandidate> = {
  channelMemberUserWorkspaceIds: ReadonlySet<string>;
  presence: TCandidate[];
  searchQuery: string;
  searchedTeamMembers: TCandidate[];
};

export const getTeamInviteCandidates = <
  TCandidate extends TeamInviteCandidate,
>({
  channelMemberUserWorkspaceIds,
  presence,
  searchQuery,
  searchedTeamMembers,
}: GetTeamInviteCandidatesArgs<TCandidate>) => {
  const sourceCandidates =
    searchQuery.trim().length >= 2 ? searchedTeamMembers : presence;

  return sourceCandidates.filter(
    (candidate) =>
      !channelMemberUserWorkspaceIds.has(candidate.userWorkspaceId),
  );
};
