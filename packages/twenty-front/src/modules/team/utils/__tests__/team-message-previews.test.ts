import { getTeamMessagePreviewBody } from '@/team/utils/teamMessagePreviews';

describe('team message previews', () => {
  it('formats message previews as compact readable text', () => {
    expect(
      getTeamMessagePreviewBody({
        body: 'Ship **today**\n> Ada: _done_ :rocket:\nUse `yarn test`',
      }),
    ).toBe('Ship today Ada: done 🚀 Use yarn test');
  });

  it('uses a fallback for attachment-only messages', () => {
    expect(getTeamMessagePreviewBody({ body: '   ' })).toBe(
      'Attachment message',
    );
    expect(
      getTeamMessagePreviewBody({ body: '   ', fallback: 'File message' }),
    ).toBe('File message');
  });

  it('truncates long previews without growing the sidebar', () => {
    expect(
      getTeamMessagePreviewBody({
        body: 'A very long client handoff that should stay compact',
        maxLength: 18,
      }),
    ).toBe('A very long clien…');
  });
});
