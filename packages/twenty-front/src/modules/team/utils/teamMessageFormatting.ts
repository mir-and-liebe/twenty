import { expandTeamEmojiShortcodes } from '@/team/utils/teamEmojiShortcodes';

export type TeamMessageBodyBlock = {
  text: string;
  type: 'code-block' | 'quote' | 'text';
};

export type TeamMessageTextSegment =
  | {
      text: string;
      type: 'text';
    }
  | {
      text: string;
      type: 'bold';
    }
  | {
      text: string;
      type: 'italic';
    }
  | {
      text: string;
      type: 'strikethrough';
    }
  | {
      text: string;
      type: 'code';
    }
  | {
      href: string;
      text: string;
      type: 'link';
    }
  | {
      text: string;
      type: 'mention';
    };

const TEAM_MESSAGE_URL_PATTERN = /https?:\/\/[^\s]+/g;
const TEAM_MESSAGE_TRAILING_PUNCTUATION_PATTERN = /[),.:;!?]+$/;
const TEAM_MESSAGE_INLINE_CODE_PATTERN = /`([^`\n]+)`/g;
const TEAM_MESSAGE_EMPHASIS_PATTERN =
  /(\*\*([^*\n]+)\*\*|_([^_\n]+)_|~([^~\n]+)~)/g;
const TEAM_MESSAGE_MENTION_PATTERN = /@([a-zA-Z0-9._-]+)/g;

const appendBlock = ({
  blocks,
  lines,
  type,
}: {
  blocks: TeamMessageBodyBlock[];
  lines: string[];
  type: TeamMessageBodyBlock['type'] | null;
}) => {
  const text =
    type === 'code-block'
      ? lines.join('\n').replace(/^\n+|\n+$/g, '')
      : lines.join('\n').trim();

  if (type === null || text.length === 0) {
    return;
  }

  blocks.push({ text, type });
};

export const formatTeamMessageBody = (messageBody: string) => {
  const blocks: TeamMessageBodyBlock[] = [];
  let currentType: TeamMessageBodyBlock['type'] | null = null;
  let currentLines: string[] = [];
  let isInsideCodeBlock = false;
  let codeBlockLines: string[] = [];

  messageBody.split('\n').forEach((line) => {
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith('```')) {
      if (isInsideCodeBlock) {
        appendBlock({ blocks, lines: codeBlockLines, type: 'code-block' });
        codeBlockLines = [];
        isInsideCodeBlock = false;

        return;
      }

      appendBlock({ blocks, lines: currentLines, type: currentType });
      currentLines = [];
      currentType = null;
      isInsideCodeBlock = true;

      return;
    }

    if (isInsideCodeBlock) {
      codeBlockLines.push(line);

      return;
    }

    if (trimmedLine.length === 0) {
      appendBlock({ blocks, lines: currentLines, type: currentType });
      currentLines = [];
      currentType = null;

      return;
    }

    const nextType = trimmedLine.startsWith('>') ? 'quote' : 'text';
    const nextLine =
      nextType === 'quote' ? trimmedLine.replace(/^>\s?/, '') : line;

    if (currentType !== null && currentType !== nextType) {
      appendBlock({ blocks, lines: currentLines, type: currentType });
      currentLines = [];
    }

    currentType = nextType;
    currentLines.push(nextLine);
  });

  appendBlock({ blocks, lines: currentLines, type: currentType });
  appendBlock({
    blocks,
    lines: codeBlockLines,
    type: isInsideCodeBlock ? 'code-block' : null,
  });

  return blocks;
};

export const isTeamMessageEdited = ({
  createdAt,
  updatedAt,
}: {
  createdAt?: string | null;
  updatedAt?: string | null;
}) => {
  if (!createdAt || !updatedAt) {
    return false;
  }

  return new Date(updatedAt).getTime() > new Date(createdAt).getTime();
};

export const getTeamMessageDateDividerKey = (createdAt?: string | null) => {
  if (!createdAt) {
    return null;
  }

  const createdDate = new Date(createdAt);

  if (Number.isNaN(createdDate.getTime())) {
    return null;
  }

  return createdDate.toISOString().slice(0, 10);
};

export const shouldShowTeamMessageDateDivider = ({
  createdAt,
  previousCreatedAt,
}: {
  createdAt?: string | null;
  previousCreatedAt?: string | null;
}) => {
  const messageDateKey = getTeamMessageDateDividerKey(createdAt);

  return (
    messageDateKey !== null &&
    messageDateKey !== getTeamMessageDateDividerKey(previousCreatedAt)
  );
};

export const formatTeamMessageDateDividerLabel = (
  createdAt?: string | null,
) => {
  if (!createdAt) {
    return '';
  }

  const createdDate = new Date(createdAt);

  if (Number.isNaN(createdDate.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    weekday: 'short',
    year: 'numeric',
  }).format(createdDate);
};

export const formatTeamMessageTimestampTitle = (createdAt?: string | null) => {
  if (!createdAt) {
    return '';
  }

  const createdDate = new Date(createdAt);

  if (Number.isNaN(createdDate.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(createdDate);
};

export const getTeamMessageCopyText = ({
  body,
  fallbackBody,
}: {
  body: string;
  fallbackBody: string;
}) => {
  const trimmedBody = body.trim();

  return trimmedBody.length > 0 ? body : fallbackBody;
};

const formatTeamMessageLinkSegments = (text: string) => {
  const segments: TeamMessageTextSegment[] = [];
  let lastIndex = 0;

  text.replace(TEAM_MESSAGE_URL_PATTERN, (rawUrl, index) => {
    if (index > lastIndex) {
      segments.push({
        text: text.slice(lastIndex, index),
        type: 'text',
      });
    }

    const trailingPunctuation =
      rawUrl.match(TEAM_MESSAGE_TRAILING_PUNCTUATION_PATTERN)?.[0] ?? '';
    const url = trailingPunctuation
      ? rawUrl.slice(0, -trailingPunctuation.length)
      : rawUrl;

    segments.push({
      href: url,
      text: url,
      type: 'link',
    });

    if (trailingPunctuation.length > 0) {
      segments.push({
        text: trailingPunctuation,
        type: 'text',
      });
    }

    lastIndex = index + rawUrl.length;

    return rawUrl;
  });

  if (lastIndex < text.length) {
    segments.push({
      text: text.slice(lastIndex),
      type: 'text',
    });
  }

  return segments.length > 0 ? segments : [{ text, type: 'text' as const }];
};

const formatTeamMessageMentionSegments = (text: string) => {
  const segments: TeamMessageTextSegment[] = [];
  let lastIndex = 0;

  text.replace(TEAM_MESSAGE_MENTION_PATTERN, (rawMention, _alias, index) => {
    const previousCharacter = index > 0 ? text[index - 1] : '';

    if (/[a-zA-Z0-9._-]/.test(previousCharacter)) {
      return rawMention;
    }

    if (index > lastIndex) {
      segments.push({
        text: text.slice(lastIndex, index),
        type: 'text',
      });
    }

    segments.push({
      text: rawMention,
      type: 'mention',
    });

    lastIndex = index + rawMention.length;

    return rawMention;
  });

  if (lastIndex < text.length) {
    segments.push({
      text: text.slice(lastIndex),
      type: 'text',
    });
  }

  return segments.length > 0 ? segments : [{ text, type: 'text' as const }];
};

const formatTeamMessageLinkAndMentionSegments = (text: string) =>
  formatTeamMessageLinkSegments(text).flatMap((segment) =>
    segment.type === 'text'
      ? formatTeamMessageMentionSegments(segment.text)
      : [segment],
  );

const formatTeamMessageEmphasisSegments = (text: string) => {
  const expandedText = expandTeamEmojiShortcodes(text);
  const segments: TeamMessageTextSegment[] = [];
  let lastIndex = 0;

  expandedText.replace(
    TEAM_MESSAGE_EMPHASIS_PATTERN,
    (rawMatch, _fullMatch, boldText, italicText, strikethroughText, index) => {
      if (index > lastIndex) {
        segments.push(
          ...formatTeamMessageLinkAndMentionSegments(
            expandedText.slice(lastIndex, index),
          ),
        );
      }

      const segmentType = boldText
        ? 'bold'
        : italicText
          ? 'italic'
          : 'strikethrough';

      segments.push({
        text: boldText ?? italicText ?? strikethroughText,
        type: segmentType,
      });

      lastIndex = index + rawMatch.length;

      return rawMatch;
    },
  );

  if (lastIndex < expandedText.length) {
    segments.push(
      ...formatTeamMessageLinkAndMentionSegments(expandedText.slice(lastIndex)),
    );
  }

  return segments.length > 0 ? segments : [{ text, type: 'text' as const }];
};

export const formatTeamMessageTextSegments = (text: string) => {
  const segments: TeamMessageTextSegment[] = [];
  let lastIndex = 0;

  text.replace(TEAM_MESSAGE_INLINE_CODE_PATTERN, (rawCodeSpan, code, index) => {
    if (index > lastIndex) {
      segments.push(
        ...formatTeamMessageEmphasisSegments(text.slice(lastIndex, index)),
      );
    }

    segments.push({
      text: code,
      type: 'code',
    });

    lastIndex = index + rawCodeSpan.length;

    return rawCodeSpan;
  });

  if (lastIndex < text.length) {
    segments.push(...formatTeamMessageEmphasisSegments(text.slice(lastIndex)));
  }

  return segments.length > 0 ? segments : [{ text, type: 'text' as const }];
};
