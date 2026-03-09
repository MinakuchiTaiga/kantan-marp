const DEFAULT_EXPORT_BASENAME = 'kantan-marp';
const INVALID_FILE_NAME_CHARS = /[<>:"/\\|?*\u0000-\u001f]/g;
const TRAILING_DOTS_OR_SPACES = /[. ]+$/g;
const MULTIPLE_WHITESPACES = /\s+/g;

const sanitizeFileBasename = (title: string): string => {
  const normalized = title
    .trim()
    .replaceAll(INVALID_FILE_NAME_CHARS, ' ')
    .replaceAll('.', '_')
    .replaceAll(MULTIPLE_WHITESPACES, '_')
    .replaceAll(TRAILING_DOTS_OR_SPACES, '')
    .slice(0, 120)
    .trim();

  return normalized || DEFAULT_EXPORT_BASENAME;
};

export const createExportFileName = (title: string): string =>
  `${sanitizeFileBasename(title)}.html`;
