export type TeamMentionCandidate = {
  email?: string | null;
  isCurrentUser?: boolean;
  name: string;
  statusEmoji?: string | null;
  statusText?: string | null;
  userWorkspaceId: string;
};

const BROAD_TEAM_MENTION_CANDIDATES: TeamMentionCandidate[] = [
  {
    name: 'channel',
    userWorkspaceId: 'team-broad-mention-channel',
  },
  {
    name: 'here',
    userWorkspaceId: 'team-broad-mention-here',
  },
  {
    name: 'everyone',
    userWorkspaceId: 'team-broad-mention-everyone',
  },
];

type ShouldSelectTeamMentionSuggestionArgs = {
  candidateCount: number;
  ctrlKey: boolean;
  isComposing: boolean;
  key: string;
  metaKey: boolean;
  shiftKey: boolean;
};

type GetNextTeamMentionSuggestionIndexArgs = {
  candidateCount: number;
  currentIndex: number;
  key: string;
};

const ACTIVE_TEAM_MENTION_PATTERN = /(^|\s)@([a-zA-Z0-9._-]*)$/;

const normalizeTeamMentionAlias = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9.]/g, '');

const getTeamMentionAlias = (candidate: TeamMentionCandidate) => {
  const emailLocalPart = candidate.email?.split('@')[0];

  if (emailLocalPart && emailLocalPart.trim().length > 0) {
    return normalizeTeamMentionAlias(emailLocalPart);
  }

  return normalizeTeamMentionAlias(candidate.name.trim().replace(/\s+/g, '.'));
};

const matchesTeamMentionQuery = ({
  candidate,
  query,
}: {
  candidate: TeamMentionCandidate;
  query: string;
}) => {
  const normalizedQuery = normalizeTeamMentionAlias(query);

  if (normalizedQuery.length === 0) {
    return true;
  }

  return [candidate.name, candidate.email ?? '', getTeamMentionAlias(candidate)]
    .map((value) => normalizeTeamMentionAlias(value))
    .some((value) => value.includes(normalizedQuery));
};

export const getActiveTeamMentionQuery = (draftMessage: string) => {
  const match = draftMessage.match(ACTIVE_TEAM_MENTION_PATTERN);

  return match?.[2] ?? null;
};

export const getTeamMentionCandidates = ({
  includeBroadMentions = true,
  presence,
  searchQuery,
  searchedTeamMembers,
}: {
  includeBroadMentions?: boolean;
  presence: TeamMentionCandidate[];
  searchQuery: string;
  searchedTeamMembers: TeamMentionCandidate[];
}) => {
  const sourceCandidates =
    searchQuery.trim().length >= 2 ? searchedTeamMembers : presence;
  const candidates = includeBroadMentions
    ? [...BROAD_TEAM_MENTION_CANDIDATES, ...sourceCandidates]
    : sourceCandidates;
  const seenUserWorkspaceIds = new Set<string>();

  return candidates
    .filter((candidate) => !candidate.isCurrentUser)
    .filter((candidate) =>
      matchesTeamMentionQuery({ candidate, query: searchQuery }),
    )
    .filter((candidate) => {
      if (seenUserWorkspaceIds.has(candidate.userWorkspaceId)) {
        return false;
      }

      seenUserWorkspaceIds.add(candidate.userWorkspaceId);

      return true;
    })
    .slice(0, 5);
};

export const insertTeamMention = ({
  candidate,
  draftMessage,
}: {
  candidate: TeamMentionCandidate;
  draftMessage: string;
}) =>
  draftMessage.replace(
    ACTIVE_TEAM_MENTION_PATTERN,
    (_match, leadingWhitespace) =>
      `${leadingWhitespace}@${getTeamMentionAlias(candidate)} `,
  );

export const shouldSelectTeamMentionSuggestion = ({
  candidateCount,
  ctrlKey,
  isComposing,
  key,
  metaKey,
  shiftKey,
}: ShouldSelectTeamMentionSuggestionArgs) =>
  candidateCount > 0 &&
  !ctrlKey &&
  !isComposing &&
  !metaKey &&
  !shiftKey &&
  (key === 'Enter' || key === 'Tab');

export const getNextTeamMentionSuggestionIndex = ({
  candidateCount,
  currentIndex,
  key,
}: GetNextTeamMentionSuggestionIndexArgs) => {
  if (candidateCount === 0) {
    return null;
  }

  if (key === 'ArrowDown') {
    return (currentIndex + 1) % candidateCount;
  }

  if (key === 'ArrowUp') {
    return (currentIndex - 1 + candidateCount) % candidateCount;
  }

  return null;
};
