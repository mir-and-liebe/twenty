export const TEAM_PENDING_ATTACHMENT_LIMIT = 5;

export const appendTeamPendingAttachment = <TAttachment>({
  attachment,
  attachments,
  limit = TEAM_PENDING_ATTACHMENT_LIMIT,
}: {
  attachment: TAttachment;
  attachments: TAttachment[];
  limit?: number;
}) => {
  if (attachments.length >= limit) {
    return attachments;
  }

  return [...attachments, attachment];
};

export const appendTeamPendingAttachments = <TAttachment>({
  attachments,
  nextAttachments,
  limit = TEAM_PENDING_ATTACHMENT_LIMIT,
}: {
  attachments: TAttachment[];
  nextAttachments: TAttachment[];
  limit?: number;
}) => [
  ...attachments,
  ...nextAttachments.slice(0, Math.max(limit - attachments.length, 0)),
];

export const removeTeamPendingAttachmentAtIndex = <TAttachment>({
  attachments,
  index,
}: {
  attachments: TAttachment[];
  index: number;
}) =>
  attachments.filter(
    (_attachment, attachmentIndex) => attachmentIndex !== index,
  );
