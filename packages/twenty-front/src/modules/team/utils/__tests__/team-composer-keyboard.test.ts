import { shouldSendTeamComposerMessage } from '@/team/utils/teamComposerKeyboard';

describe('team composer keyboard', () => {
  it('sends on Enter when the user is not composing text', () => {
    expect(
      shouldSendTeamComposerMessage({
        ctrlKey: false,
        isComposing: false,
        key: 'Enter',
        metaKey: false,
        shiftKey: false,
      }),
    ).toBe(true);
  });

  it('keeps multiline and modified Enter keypresses in the composer', () => {
    expect(
      shouldSendTeamComposerMessage({
        ctrlKey: false,
        isComposing: false,
        key: 'Enter',
        metaKey: false,
        shiftKey: true,
      }),
    ).toBe(false);

    expect(
      shouldSendTeamComposerMessage({
        ctrlKey: false,
        isComposing: false,
        key: 'Enter',
        metaKey: true,
        shiftKey: false,
      }),
    ).toBe(false);

    expect(
      shouldSendTeamComposerMessage({
        ctrlKey: true,
        isComposing: false,
        key: 'Enter',
        metaKey: false,
        shiftKey: false,
      }),
    ).toBe(false);
  });

  it('does not send while an input method editor is composing text', () => {
    expect(
      shouldSendTeamComposerMessage({
        ctrlKey: false,
        isComposing: true,
        key: 'Enter',
        metaKey: false,
        shiftKey: false,
      }),
    ).toBe(false);
  });
});
