import { getLastEditableTeamMessage } from '@/team/utils/teamEditableMessages';

describe('team editable messages', () => {
  it('returns the newest editable message from a timeline', () => {
    expect(
      getLastEditableTeamMessage([
        { canEdit: true, id: 'older' },
        { canEdit: false, id: 'newest' },
        { canEdit: true, id: 'newer' },
      ]),
    ).toEqual({ canEdit: true, id: 'newer' });
  });

  it('returns null when no message can be edited', () => {
    expect(
      getLastEditableTeamMessage([
        { canEdit: false, id: 'older' },
        { canEdit: false, id: 'newer' },
      ]),
    ).toBeNull();
  });
});
