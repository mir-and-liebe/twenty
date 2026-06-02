import {
  getActiveTeamMentionQuery,
  getNextTeamMentionSuggestionIndex,
  getTeamMentionCandidates,
  insertTeamMention,
  shouldSelectTeamMentionSuggestion,
} from '@/team/utils/teamMentionSuggestions';

describe('team mention suggestions', () => {
  it('detects the active mention query at the end of a draft', () => {
    expect(getActiveTeamMentionQuery('@jo')).toBe('jo');
    expect(getActiveTeamMentionQuery('Please ask @jo')).toBe('jo');
    expect(getActiveTeamMentionQuery('Please ask @jo today')).toBeNull();
  });

  it('uses local presence for short mention queries and excludes the current user', () => {
    expect(
      getTeamMentionCandidates({
        includeBroadMentions: false,
        presence: [
          {
            email: 'tim@apple.dev',
            isCurrentUser: true,
            name: 'Tim Apple',
            userWorkspaceId: 'tim',
          },
          {
            email: 'jony.ive@apple.dev',
            name: 'Jony Ive',
            statusEmoji: '🎯',
            statusText: 'Deep work',
            userWorkspaceId: 'jony',
          },
        ],
        searchQuery: 'j',
        searchedTeamMembers: [],
      }),
    ).toEqual([
      {
        email: 'jony.ive@apple.dev',
        name: 'Jony Ive',
        statusEmoji: '🎯',
        statusText: 'Deep work',
        userWorkspaceId: 'jony',
      },
    ]);
  });

  it('uses searched teammates for longer mention queries', () => {
    expect(
      getTeamMentionCandidates({
        includeBroadMentions: false,
        presence: [
          {
            email: 'sara@example.com',
            name: 'Sara Local',
            userWorkspaceId: 'sara-local',
          },
        ],
        searchQuery: 'jo',
        searchedTeamMembers: [
          {
            email: 'jony.ive@apple.dev',
            name: 'Jony Ive',
            userWorkspaceId: 'jony',
          },
        ],
      }),
    ).toEqual([
      {
        email: 'jony.ive@apple.dev',
        name: 'Jony Ive',
        userWorkspaceId: 'jony',
      },
    ]);
  });

  it('offers channel broadcast mention aliases when enabled', () => {
    expect(
      getTeamMentionCandidates({
        presence: [],
        searchQuery: 'ch',
        searchedTeamMembers: [],
      }),
    ).toEqual([
      {
        name: 'channel',
        userWorkspaceId: 'team-broad-mention-channel',
      },
    ]);

    expect(
      getTeamMentionCandidates({
        includeBroadMentions: false,
        presence: [],
        searchQuery: 'ch',
        searchedTeamMembers: [],
      }),
    ).toEqual([]);
  });

  it('inserts backend-compatible mention aliases into drafts', () => {
    expect(
      insertTeamMention({
        candidate: {
          email: 'jony.ive@apple.dev',
          name: 'Jony Ive',
          userWorkspaceId: 'jony',
        },
        draftMessage: 'Can @jo',
      }),
    ).toBe('Can @jony.ive ');

    expect(
      insertTeamMention({
        candidate: {
          name: 'channel',
          userWorkspaceId: 'team-broad-mention-channel',
        },
        draftMessage: 'Heads up @ch',
      }),
    ).toBe('Heads up @channel ');
  });

  it('selects open mention suggestions with unmodified Enter or Tab', () => {
    expect(
      shouldSelectTeamMentionSuggestion({
        candidateCount: 1,
        ctrlKey: false,
        isComposing: false,
        key: 'Enter',
        metaKey: false,
        shiftKey: false,
      }),
    ).toBe(true);
    expect(
      shouldSelectTeamMentionSuggestion({
        candidateCount: 1,
        ctrlKey: false,
        isComposing: false,
        key: 'Tab',
        metaKey: false,
        shiftKey: false,
      }),
    ).toBe(true);
  });

  it('does not select suggestions for modified or composing keypresses', () => {
    expect(
      shouldSelectTeamMentionSuggestion({
        candidateCount: 0,
        ctrlKey: false,
        isComposing: false,
        key: 'Enter',
        metaKey: false,
        shiftKey: false,
      }),
    ).toBe(false);
    expect(
      shouldSelectTeamMentionSuggestion({
        candidateCount: 1,
        ctrlKey: false,
        isComposing: true,
        key: 'Enter',
        metaKey: false,
        shiftKey: false,
      }),
    ).toBe(false);
    expect(
      shouldSelectTeamMentionSuggestion({
        candidateCount: 1,
        ctrlKey: false,
        isComposing: false,
        key: 'Enter',
        metaKey: false,
        shiftKey: true,
      }),
    ).toBe(false);
  });

  it('moves through mention suggestions with arrow keys', () => {
    expect(
      getNextTeamMentionSuggestionIndex({
        candidateCount: 3,
        currentIndex: 0,
        key: 'ArrowDown',
      }),
    ).toBe(1);
    expect(
      getNextTeamMentionSuggestionIndex({
        candidateCount: 3,
        currentIndex: 0,
        key: 'ArrowUp',
      }),
    ).toBe(2);
    expect(
      getNextTeamMentionSuggestionIndex({
        candidateCount: 3,
        currentIndex: 2,
        key: 'ArrowDown',
      }),
    ).toBe(0);
    expect(
      getNextTeamMentionSuggestionIndex({
        candidateCount: 0,
        currentIndex: 0,
        key: 'ArrowDown',
      }),
    ).toBeNull();
  });
});
