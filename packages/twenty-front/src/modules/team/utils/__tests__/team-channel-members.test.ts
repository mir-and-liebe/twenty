import { sortTeamChannelMembers } from '@/team/utils/teamChannelMembers';

describe('team channel members', () => {
  it('sorts owners first and then members by name without mutating input', () => {
    const members = [
      {
        id: 'member-zed',
        isCurrentUser: false,
        name: 'Zed',
        role: 'MEMBER',
      },
      {
        id: 'owner-zoe',
        isCurrentUser: false,
        name: 'Zoe',
        role: 'OWNER',
      },
      {
        id: 'member-amy',
        isCurrentUser: true,
        name: 'Amy',
        role: 'MEMBER',
      },
      {
        id: 'owner-ana',
        isCurrentUser: false,
        name: 'Ana',
        role: 'owner',
      },
    ];

    expect(sortTeamChannelMembers(members).map((member) => member.id)).toEqual([
      'owner-ana',
      'owner-zoe',
      'member-amy',
      'member-zed',
    ]);
    expect(members.map((member) => member.id)).toEqual([
      'member-zed',
      'owner-zoe',
      'member-amy',
      'owner-ana',
    ]);
  });
});
