import {
  appendTeamQuoteDraft,
  buildTeamQuoteDraft,
} from '@/team/utils/teamQuoteDrafts';

describe('team quote drafts', () => {
  it('formats a message quote for the composer', () => {
    expect(
      buildTeamQuoteDraft({
        authorName: 'Ada Lovelace',
        body: 'Shipped the workflow fix',
        fallbackBody: 'Attachment message',
      }),
    ).toBe('> Ada Lovelace: Shipped the workflow fix\n\n');
  });

  it('uses a fallback body for attachment-only messages', () => {
    expect(
      buildTeamQuoteDraft({
        authorName: 'Ada Lovelace',
        body: '   ',
        fallbackBody: 'Attachment message',
      }),
    ).toBe('> Ada Lovelace: Attachment message\n\n');
  });

  it('appends quotes without destroying an existing draft', () => {
    expect(
      appendTeamQuoteDraft({
        currentDraft: 'Existing draft',
        quoteDraft: '> Ada Lovelace: Update\n\n',
      }),
    ).toBe('Existing draft\n\n> Ada Lovelace: Update\n\n');
  });
});
