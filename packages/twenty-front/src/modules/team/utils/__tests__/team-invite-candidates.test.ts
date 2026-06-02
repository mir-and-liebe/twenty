import { getTeamInviteCandidates } from '@/team/utils/teamInviteCandidates';

describe('getTeamInviteCandidates', () => {
  it('uses presence candidates when there is no teammate search', () => {
    expect(
      getTeamInviteCandidates({
        channelMemberUserWorkspaceIds: new Set(['member-1']),
        presence: [
          { name: 'Ada', userWorkspaceId: 'member-1' },
          { name: 'Grace', userWorkspaceId: 'member-2' },
        ],
        searchQuery: '',
        searchedTeamMembers: [
          { name: 'Katherine', userWorkspaceId: 'member-3' },
        ],
      }),
    ).toEqual([{ name: 'Grace', userWorkspaceId: 'member-2' }]);
  });

  it('uses searched teammates and excludes existing channel members', () => {
    expect(
      getTeamInviteCandidates({
        channelMemberUserWorkspaceIds: new Set(['member-1']),
        presence: [{ name: 'Grace', userWorkspaceId: 'member-2' }],
        searchQuery: 'ada',
        searchedTeamMembers: [
          { name: 'Ada', userWorkspaceId: 'member-1' },
          { name: 'Katherine', userWorkspaceId: 'member-3' },
        ],
      }),
    ).toEqual([{ name: 'Katherine', userWorkspaceId: 'member-3' }]);
  });

  it('keeps short searches on the local presence fallback', () => {
    expect(
      getTeamInviteCandidates({
        channelMemberUserWorkspaceIds: new Set(['member-1']),
        presence: [{ name: 'Grace', userWorkspaceId: 'member-2' }],
        searchQuery: 'a',
        searchedTeamMembers: [
          { name: 'Katherine', userWorkspaceId: 'member-3' },
        ],
      }),
    ).toEqual([{ name: 'Grace', userWorkspaceId: 'member-2' }]);
  });
});
