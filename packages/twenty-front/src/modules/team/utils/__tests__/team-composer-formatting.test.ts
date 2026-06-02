import {
  applyTeamComposerFormatShortcut,
  getTeamComposerFormatShortcut,
} from '@/team/utils/teamComposerFormatting';

describe('team composer formatting', () => {
  it('detects Slack-style formatting shortcuts', () => {
    expect(
      getTeamComposerFormatShortcut({
        ctrlKey: false,
        isComposing: false,
        key: 'b',
        metaKey: true,
        shiftKey: false,
      }),
    ).toBe('bold');
    expect(
      getTeamComposerFormatShortcut({
        ctrlKey: true,
        isComposing: false,
        key: 'I',
        metaKey: false,
        shiftKey: false,
      }),
    ).toBe('italic');
    expect(
      getTeamComposerFormatShortcut({
        ctrlKey: false,
        isComposing: false,
        key: 'x',
        metaKey: true,
        shiftKey: true,
      }),
    ).toBe('strikethrough');
    expect(
      getTeamComposerFormatShortcut({
        ctrlKey: false,
        isComposing: false,
        key: 'c',
        metaKey: true,
        shiftKey: true,
      }),
    ).toBe('code');
  });

  it('ignores formatting shortcuts while composing text or without modifiers', () => {
    expect(
      getTeamComposerFormatShortcut({
        ctrlKey: false,
        isComposing: true,
        key: 'b',
        metaKey: true,
        shiftKey: false,
      }),
    ).toBeNull();
    expect(
      getTeamComposerFormatShortcut({
        ctrlKey: false,
        isComposing: false,
        key: 'b',
        metaKey: false,
        shiftKey: false,
      }),
    ).toBeNull();
    expect(
      getTeamComposerFormatShortcut({
        ctrlKey: false,
        isComposing: false,
        key: 'b',
        metaKey: true,
        shiftKey: true,
      }),
    ).toBeNull();
  });

  it('wraps selected composer text and keeps the cursor after the selection', () => {
    expect(
      applyTeamComposerFormatShortcut({
        draft: 'Ship this today',
        format: 'bold',
        selectionEnd: 9,
        selectionStart: 5,
      }),
    ).toEqual({
      draft: 'Ship **this** today',
      selectionEnd: 11,
      selectionStart: 11,
    });
  });

  it('inserts paired markers at the cursor when no text is selected', () => {
    expect(
      applyTeamComposerFormatShortcut({
        draft: 'Ship today',
        format: 'code',
        selectionEnd: 5,
        selectionStart: 5,
      }),
    ).toEqual({
      draft: 'Ship ``today',
      selectionEnd: 6,
      selectionStart: 6,
    });
  });

  it('clamps stale selection offsets before applying formatting', () => {
    expect(
      applyTeamComposerFormatShortcut({
        draft: 'Done',
        format: 'strikethrough',
        selectionEnd: 99,
        selectionStart: -5,
      }),
    ).toEqual({
      draft: '~Done~',
      selectionEnd: 5,
      selectionStart: 5,
    });
  });
});
