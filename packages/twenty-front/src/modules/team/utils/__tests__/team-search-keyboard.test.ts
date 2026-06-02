import { shouldFocusTeamMessageSearch } from '@/team/utils/teamSearchKeyboard';

const baseKeyboardEvent = {
  ctrlKey: false,
  isComposing: false,
  key: 'k',
  metaKey: true,
  shiftKey: false,
};

describe('team search keyboard', () => {
  it('opens message search with command or control k', () => {
    expect(shouldFocusTeamMessageSearch(baseKeyboardEvent)).toBe(true);
    expect(
      shouldFocusTeamMessageSearch({
        ...baseKeyboardEvent,
        ctrlKey: true,
        metaKey: false,
      }),
    ).toBe(true);
  });

  it('ignores unrelated, shifted, and composing keypresses', () => {
    expect(
      shouldFocusTeamMessageSearch({
        ...baseKeyboardEvent,
        key: 'j',
      }),
    ).toBe(false);
    expect(
      shouldFocusTeamMessageSearch({
        ...baseKeyboardEvent,
        shiftKey: true,
      }),
    ).toBe(false);
    expect(
      shouldFocusTeamMessageSearch({
        ...baseKeyboardEvent,
        isComposing: true,
      }),
    ).toBe(false);
    expect(
      shouldFocusTeamMessageSearch({
        ...baseKeyboardEvent,
        ctrlKey: false,
        metaKey: false,
      }),
    ).toBe(false);
  });
});
