export type ExportVariant = 'lite' | 'secure';

export const EXPORT_FILE_NAME: Record<ExportVariant, string> = {
  lite: 'kantan-marp-lite.html',
  secure: 'kantan-marp-secure.html',
};

export const EXPORT_LABEL: Record<ExportVariant, string> = {
  lite: '軽量版を保存',
  secure: 'セキュア版を保存',
};
