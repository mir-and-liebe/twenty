import {
  appendTeamPendingAttachment,
  appendTeamPendingAttachments,
  removeTeamPendingAttachmentAtIndex,
  TEAM_PENDING_ATTACHMENT_LIMIT,
} from '@/team/utils/teamPendingAttachments';

describe('teamPendingAttachments', () => {
  const attachment = { name: 'brief.pdf', url: '/files/brief.pdf' };

  it('appends an attachment without mutating the existing list', () => {
    const existingAttachments = [
      { name: 'scope.pdf', url: '/files/scope.pdf' },
    ];

    const nextAttachments = appendTeamPendingAttachment({
      attachment,
      attachments: existingAttachments,
    });

    expect(nextAttachments).toEqual([...existingAttachments, attachment]);
    expect(nextAttachments).not.toBe(existingAttachments);
    expect(existingAttachments).toEqual([
      { name: 'scope.pdf', url: '/files/scope.pdf' },
    ]);
  });

  it('does not append beyond the pending attachment limit', () => {
    const existingAttachments = Array.from(
      { length: TEAM_PENDING_ATTACHMENT_LIMIT },
      (_, index) => ({
        name: `attachment-${index}.pdf`,
        url: `/files/attachment-${index}.pdf`,
      }),
    );

    const nextAttachments = appendTeamPendingAttachment({
      attachment,
      attachments: existingAttachments,
    });

    expect(nextAttachments).toBe(existingAttachments);
  });

  it('appends multiple attachments up to the pending attachment limit', () => {
    const existingAttachments = Array.from(
      { length: TEAM_PENDING_ATTACHMENT_LIMIT - 1 },
      (_, index) => ({
        name: `attachment-${index}.pdf`,
        url: `/files/attachment-${index}.pdf`,
      }),
    );

    expect(
      appendTeamPendingAttachments({
        attachments: existingAttachments,
        nextAttachments: [
          { name: 'first.pdf', url: '/files/first.pdf' },
          { name: 'second.pdf', url: '/files/second.pdf' },
        ],
      }),
    ).toEqual([
      ...existingAttachments,
      { name: 'first.pdf', url: '/files/first.pdf' },
    ]);
  });

  it('removes an attachment by index', () => {
    expect(
      removeTeamPendingAttachmentAtIndex({
        attachments: [
          { name: 'one.pdf', url: '/files/one.pdf' },
          { name: 'two.pdf', url: '/files/two.pdf' },
          { name: 'three.pdf', url: '/files/three.pdf' },
        ],
        index: 1,
      }),
    ).toEqual([
      { name: 'one.pdf', url: '/files/one.pdf' },
      { name: 'three.pdf', url: '/files/three.pdf' },
    ]);
  });

  it('ignores out-of-range remove indexes', () => {
    const existingAttachments = [{ name: 'one.pdf', url: '/files/one.pdf' }];

    expect(
      removeTeamPendingAttachmentAtIndex({
        attachments: existingAttachments,
        index: 10,
      }),
    ).toEqual(existingAttachments);
  });
});
