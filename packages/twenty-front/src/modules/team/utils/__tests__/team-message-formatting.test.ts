import {
  formatTeamMessageDateDividerLabel,
  formatTeamMessageTimestampTitle,
  formatTeamMessageBody,
  formatTeamMessageTextSegments,
  getTeamMessageCopyText,
  getTeamMessageDateDividerKey,
  isTeamMessageEdited,
  shouldShowTeamMessageDateDivider,
} from '@/team/utils/teamMessageFormatting';

describe('team message formatting', () => {
  it('keeps multiline text together for safe chat rendering', () => {
    expect(formatTeamMessageBody('First line\nSecond line')).toEqual([
      {
        text: 'First line\nSecond line',
        type: 'text',
      },
    ]);
  });

  it('extracts quoted lines from quote drafts', () => {
    expect(formatTeamMessageBody('> Ada: Shipped it\n\nLGTM')).toEqual([
      {
        text: 'Ada: Shipped it',
        type: 'quote',
      },
      {
        text: 'LGTM',
        type: 'text',
      },
    ]);
  });

  it('groups adjacent quote lines and ignores extra blank lines', () => {
    expect(
      formatTeamMessageBody('\n> Ada: First\n> Ada: Second\n\n\nNext'),
    ).toEqual([
      {
        text: 'Ada: First\nAda: Second',
        type: 'quote',
      },
      {
        text: 'Next',
        type: 'text',
      },
    ]);
  });

  it('extracts fenced code blocks without parsing their contents as text', () => {
    expect(
      formatTeamMessageBody(
        'Before\n```ts\nconst url = "https://example.com";\n```\nAfter',
      ),
    ).toEqual([
      {
        text: 'Before',
        type: 'text',
      },
      {
        text: 'const url = "https://example.com";',
        type: 'code-block',
      },
      {
        text: 'After',
        type: 'text',
      },
    ]);
  });

  it('keeps an unclosed fenced code block literal through the end', () => {
    expect(formatTeamMessageBody('```bash\nyarn start')).toEqual([
      {
        text: 'yarn start',
        type: 'code-block',
      },
    ]);
  });

  it('detects edited messages from created and updated timestamps', () => {
    expect(
      isTeamMessageEdited({
        createdAt: '2026-06-01T12:00:00.000Z',
        updatedAt: '2026-06-01T12:05:00.000Z',
      }),
    ).toBe(true);
    expect(
      isTeamMessageEdited({
        createdAt: '2026-06-01T12:00:00.000Z',
        updatedAt: '2026-06-01T12:00:00.000Z',
      }),
    ).toBe(false);
    expect(
      isTeamMessageEdited({
        createdAt: '2026-06-01T12:00:00.000Z',
        updatedAt: null,
      }),
    ).toBe(false);
  });

  it('builds stable date divider keys from message timestamps', () => {
    expect(getTeamMessageDateDividerKey('2026-06-01T23:59:00.000Z')).toBe(
      '2026-06-01',
    );
    expect(getTeamMessageDateDividerKey(null)).toBeNull();
    expect(getTeamMessageDateDividerKey('not-a-date')).toBeNull();
  });

  it('shows date dividers only when a timeline day starts', () => {
    expect(
      shouldShowTeamMessageDateDivider({
        createdAt: '2026-06-01T12:00:00.000Z',
        previousCreatedAt: null,
      }),
    ).toBe(true);
    expect(
      shouldShowTeamMessageDateDivider({
        createdAt: '2026-06-01T13:00:00.000Z',
        previousCreatedAt: '2026-06-01T12:00:00.000Z',
      }),
    ).toBe(false);
    expect(
      shouldShowTeamMessageDateDivider({
        createdAt: '2026-06-02T09:00:00.000Z',
        previousCreatedAt: '2026-06-01T12:00:00.000Z',
      }),
    ).toBe(true);
  });

  it('formats readable date divider labels', () => {
    expect(
      formatTeamMessageDateDividerLabel('2026-06-01T12:00:00.000Z'),
    ).toContain('2026');
    expect(formatTeamMessageDateDividerLabel(null)).toBe('');
    expect(formatTeamMessageDateDividerLabel('not-a-date')).toBe('');
  });

  it('formats full timestamp titles for message hover context', () => {
    const timestampTitle = formatTeamMessageTimestampTitle(
      '2026-06-01T12:00:00.000Z',
    );

    expect(timestampTitle).toContain('2026');
    expect(timestampTitle.length).toBeGreaterThan(8);
    expect(formatTeamMessageTimestampTitle(null)).toBe('');
    expect(formatTeamMessageTimestampTitle('not-a-date')).toBe('');
  });

  it('builds copyable message text with an attachment fallback', () => {
    expect(
      getTeamMessageCopyText({
        body: '  Keep the original spacing\n',
        fallbackBody: 'Attachment message',
      }),
    ).toBe('  Keep the original spacing\n');
    expect(
      getTeamMessageCopyText({
        body: '   ',
        fallbackBody: 'Attachment message',
      }),
    ).toBe('Attachment message');
  });

  it('segments http links without treating surrounding text as a link', () => {
    expect(
      formatTeamMessageTextSegments(
        'See https://example.com/docs and http://twenty.com',
      ),
    ).toEqual([
      {
        text: 'See ',
        type: 'text',
      },
      {
        href: 'https://example.com/docs',
        text: 'https://example.com/docs',
        type: 'link',
      },
      {
        text: ' and ',
        type: 'text',
      },
      {
        href: 'http://twenty.com',
        text: 'http://twenty.com',
        type: 'link',
      },
    ]);
  });

  it('expands Slack-style emoji shortcodes in rendered text segments', () => {
    expect(
      formatTeamMessageTextSegments('Deploy :rocket: :white_check_mark:'),
    ).toEqual([
      {
        text: 'Deploy 🚀 ✅',
        type: 'text',
      },
    ]);
  });

  it('keeps trailing punctuation outside link segments', () => {
    expect(
      formatTeamMessageTextSegments('Open https://example.com/docs.'),
    ).toEqual([
      {
        text: 'Open ',
        type: 'text',
      },
      {
        href: 'https://example.com/docs',
        text: 'https://example.com/docs',
        type: 'link',
      },
      {
        text: '.',
        type: 'text',
      },
    ]);
  });

  it('segments inline code spans', () => {
    expect(formatTeamMessageTextSegments('Run `yarn start` now')).toEqual([
      {
        text: 'Run ',
        type: 'text',
      },
      {
        text: 'yarn start',
        type: 'code',
      },
      {
        text: ' now',
        type: 'text',
      },
    ]);
  });

  it('segments personal and broad mentions for readable chat rendering', () => {
    expect(
      formatTeamMessageTextSegments('@ada please check @channel and @here'),
    ).toEqual([
      {
        text: '@ada',
        type: 'mention',
      },
      {
        text: ' please check ',
        type: 'text',
      },
      {
        text: '@channel',
        type: 'mention',
      },
      {
        text: ' and ',
        type: 'text',
      },
      {
        text: '@here',
        type: 'mention',
      },
    ]);
  });

  it('does not linkify urls inside inline code spans', () => {
    expect(
      formatTeamMessageTextSegments(
        'Use `https://example.com` then open https://twenty.com',
      ),
    ).toEqual([
      {
        text: 'Use ',
        type: 'text',
      },
      {
        text: 'https://example.com',
        type: 'code',
      },
      {
        text: ' then open ',
        type: 'text',
      },
      {
        href: 'https://twenty.com',
        text: 'https://twenty.com',
        type: 'link',
      },
    ]);
  });

  it('does not segment mentions inside inline code urls or email addresses', () => {
    expect(
      formatTeamMessageTextSegments(
        'Use `@channel` then email ada@example.com and mention @everyone',
      ),
    ).toEqual([
      {
        text: 'Use ',
        type: 'text',
      },
      {
        text: '@channel',
        type: 'code',
      },
      {
        text: ' then email ada@example.com and mention ',
        type: 'text',
      },
      {
        text: '@everyone',
        type: 'mention',
      },
    ]);
  });

  it('segments bold, italic, and strikethrough spans', () => {
    expect(
      formatTeamMessageTextSegments('Ship **today**, _carefully_, not ~later~'),
    ).toEqual([
      {
        text: 'Ship ',
        type: 'text',
      },
      {
        text: 'today',
        type: 'bold',
      },
      {
        text: ', ',
        type: 'text',
      },
      {
        text: 'carefully',
        type: 'italic',
      },
      {
        text: ', not ',
        type: 'text',
      },
      {
        text: 'later',
        type: 'strikethrough',
      },
    ]);
  });

  it('does not parse emphasis markers inside inline code spans', () => {
    expect(
      formatTeamMessageTextSegments('Use `**literal** ~nope~` then **ship**'),
    ).toEqual([
      {
        text: 'Use ',
        type: 'text',
      },
      {
        text: '**literal** ~nope~',
        type: 'code',
      },
      {
        text: ' then ',
        type: 'text',
      },
      {
        text: 'ship',
        type: 'bold',
      },
    ]);
  });

  it('does not expand emoji shortcodes inside inline code spans', () => {
    expect(
      formatTeamMessageTextSegments('Use `:rocket:` then :rocket:'),
    ).toEqual([
      {
        text: 'Use ',
        type: 'text',
      },
      {
        text: ':rocket:',
        type: 'code',
      },
      {
        text: ' then 🚀',
        type: 'text',
      },
    ]);
  });
});
