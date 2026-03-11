export type MarkdownAttachment = {
  id: string;
  name: string;
  dataUrl: string;
};

const ATTACHMENT_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

export const createAttachmentReference = (id: string): string =>
  `attachment:${id}`;

export const createMarkdownImageText = (
  name: string,
  attachmentId: string,
): string => `\n![${name}](${createAttachmentReference(attachmentId)})\n`;

export const isValidAttachmentId = (value: string): boolean =>
  ATTACHMENT_ID_PATTERN.test(value);

export const resolveAttachmentReferences = (
  markdown: string,
  attachments: MarkdownAttachment[],
): string => {
  if (attachments.length === 0) return markdown;

  const attachmentMap = new Map(
    attachments.map((attachment) => [attachment.id, attachment.dataUrl]),
  );

  return markdown.replace(/\(attachment:([a-zA-Z0-9_-]+)\)/g, (match, id) => {
    const dataUrl = attachmentMap.get(id);
    if (!dataUrl) return match;
    return `(${dataUrl})`;
  });
};
