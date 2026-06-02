type TeamChannelMemberSortable = {
  name: string;
  role: string;
};

const getTeamChannelMemberRoleRank = (role: string) =>
  role.toUpperCase() === 'OWNER' ? 0 : 1;

export const sortTeamChannelMembers = <
  TMember extends TeamChannelMemberSortable,
>(
  members: TMember[],
) =>
  [...members].sort((firstMember, secondMember) => {
    const roleRankDiff =
      getTeamChannelMemberRoleRank(firstMember.role) -
      getTeamChannelMemberRoleRank(secondMember.role);

    if (roleRankDiff !== 0) {
      return roleRankDiff;
    }

    return firstMember.name.localeCompare(secondMember.name, undefined, {
      sensitivity: 'base',
    });
  });
