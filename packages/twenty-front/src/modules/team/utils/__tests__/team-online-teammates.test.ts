import { getTeamOnlineTeammates } from '@/team/utils/teamOnlineTeammates';

describe('getTeamOnlineTeammates', () => {
  it('keeps online teammates and excludes the current user', () => {
    expect(
      getTeamOnlineTeammates({
        currentUserWorkspaceId: 'user-1',
        presence: [
          { isOnline: true, name: 'Current User', userWorkspaceId: 'user-1' },
          { isOnline: true, name: 'Ada', userWorkspaceId: 'user-2' },
          { isOnline: false, name: 'Grace', userWorkspaceId: 'user-3' },
        ],
      }),
    ).toEqual([{ isOnline: true, name: 'Ada', userWorkspaceId: 'user-2' }]);
  });

  it('still excludes rows marked as the current user when the id is missing', () => {
    expect(
      getTeamOnlineTeammates({
        currentUserWorkspaceId: undefined,
        presence: [
          {
            isCurrentUser: true,
            isOnline: true,
            name: 'Current User',
            userWorkspaceId: 'user-1',
          },
          { isOnline: true, name: 'Ada', userWorkspaceId: 'user-2' },
        ],
      }),
    ).toEqual([{ isOnline: true, name: 'Ada', userWorkspaceId: 'user-2' }]);
  });
});
