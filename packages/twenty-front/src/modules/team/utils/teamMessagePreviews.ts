import {
  formatTeamMessageBody,
  formatTeamMessageTextSegments,
} from '@/team/utils/teamMessageFormatting';

const DEFAULT_TEAM_MESSAGE_PREVIEW_MAX_LENGTH = 120;

export const getTeamMessagePreviewBody = ({
  body,
  fallback = 'Attachment message',
  maxLength = DEFAULT_TEAM_MESSAGE_PREVIEW_MAX_LENGTH,
}: {
  body: string;
  fallback?: string;
  maxLength?: number;
}) => {
  const previewText = formatTeamMessageBody(body)
    .flatMap((block) => formatTeamMessageTextSegments(block.text))
    .map((segment) => segment.text)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (previewText.length === 0) {
    return fallback;
  }

  if (previewText.length <= maxLength) {
    return previewText;
  }

  return `${previewText.slice(0, Math.max(maxLength - 1, 0)).trimEnd()}…`;
};
