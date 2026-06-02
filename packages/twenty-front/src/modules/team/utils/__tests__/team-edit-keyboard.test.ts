import {
  shouldCancelTeamMessageEdit,
  shouldCloseTeamThread,
  shouldSaveTeamMessageEdit,
  shouldStartEditingLastTeamMessage,
} from '@/team/utils/teamEditKeyboard';

const baseKeyboardEvent = {
  ctrlKey: false,
  isComposing: false,
  key: 'Enter',
  metaKey: false,
  shiftKey: false,
};

describe('team edit keyboard', () => {
  it('saves edits on plain Enter', () => {
    expect(shouldSaveTeamMessageEdit(baseKeyboardEvent)).toBe(true);
  });

  it('keeps multiline and modified Enter keypresses in the edit field', () => {
    expect(
      shouldSaveTeamMessageEdit({
        ...baseKeyboardEvent,
        shiftKey: true,
      }),
    ).toBe(false);
    expect(
      shouldSaveTeamMessageEdit({
        ...baseKeyboardEvent,
        metaKey: true,
      }),
    ).toBe(false);
    expect(
      shouldSaveTeamMessageEdit({
        ...baseKeyboardEvent,
        ctrlKey: true,
      }),
    ).toBe(false);
    expect(
      shouldSaveTeamMessageEdit({
        ...baseKeyboardEvent,
        isComposing: true,
      }),
    ).toBe(false);
  });

  it('cancels edits on Escape outside composition', () => {
    expect(
      shouldCancelTeamMessageEdit({
        ...baseKeyboardEvent,
        key: 'Escape',
      }),
    ).toBe(true);
    expect(
      shouldCancelTeamMessageEdit({
        ...baseKeyboardEvent,
        isComposing: true,
        key: 'Escape',
      }),
    ).toBe(false);
  });

  it('starts editing the last message with Arrow Up from an empty composer', () => {
    expect(
      shouldStartEditingLastTeamMessage({
        ...baseKeyboardEvent,
        draft: '',
        key: 'ArrowUp',
      }),
    ).toBe(true);
  });

  it('keeps Arrow Up available for non-empty or modified composer input', () => {
    expect(
      shouldStartEditingLastTeamMessage({
        ...baseKeyboardEvent,
        draft: 'draft',
        key: 'ArrowUp',
      }),
    ).toBe(false);
    expect(
      shouldStartEditingLastTeamMessage({
        ...baseKeyboardEvent,
        draft: '',
        key: 'ArrowUp',
        shiftKey: true,
      }),
    ).toBe(false);
    expect(
      shouldStartEditingLastTeamMessage({
        ...baseKeyboardEvent,
        draft: '',
        isComposing: true,
        key: 'ArrowUp',
      }),
    ).toBe(false);
  });

  it('closes an open thread on Escape when editing is not active', () => {
    expect(
      shouldCloseTeamThread({
        hasOpenThread: true,
        isComposing: false,
        isEditingMessage: false,
        key: 'Escape',
      }),
    ).toBe(true);
  });

  it('does not close the thread while editing, composing, closed, or pressing another key', () => {
    expect(
      shouldCloseTeamThread({
        hasOpenThread: true,
        isComposing: false,
        isEditingMessage: true,
        key: 'Escape',
      }),
    ).toBe(false);
    expect(
      shouldCloseTeamThread({
        hasOpenThread: true,
        isComposing: true,
        isEditingMessage: false,
        key: 'Escape',
      }),
    ).toBe(false);
    expect(
      shouldCloseTeamThread({
        hasOpenThread: false,
        isComposing: false,
        isEditingMessage: false,
        key: 'Escape',
      }),
    ).toBe(false);
    expect(
      shouldCloseTeamThread({
        hasOpenThread: true,
        isComposing: false,
        isEditingMessage: false,
        key: 'Enter',
      }),
    ).toBe(false);
  });
});
