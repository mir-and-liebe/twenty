type BuildTeamQuoteDraftInput = {
  authorName: string;
  body: string;
  fallbackBody: string;
};

type AppendTeamQuoteDraftInput = {
  currentDraft: string;
  quoteDraft: string;
};

export const buildTeamQuoteDraft = ({
  authorName,
  body,
  fallbackBody,
}: BuildTeamQuoteDraftInput) => {
  const trimmedBody = body.trim();
  const quotedBody = trimmedBody.length > 0 ? trimmedBody : fallbackBody;

  return `> ${authorName}: ${quotedBody}\n\n`;
};

export const appendTeamQuoteDraft = ({
  currentDraft,
  quoteDraft,
}: AppendTeamQuoteDraftInput) => {
  const trimmedCurrentDraft = currentDraft.trim();

  return trimmedCurrentDraft.length > 0
    ? `${trimmedCurrentDraft}\n\n${quoteDraft}`
    : quoteDraft;
};
