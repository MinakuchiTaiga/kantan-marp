const SUPPORTED_IMAGE_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
]);

export const pickSupportedImageFiles = (fileList: FileList | File[]): File[] =>
  Array.from(fileList).filter((file) => SUPPORTED_IMAGE_TYPES.has(file.type));

export const extractImageFilesFromClipboard = (
  items: DataTransferItemList,
): File[] =>
  Array.from(items)
    .filter((item) => item.kind === 'file')
    .map((item) => item.getAsFile())
    .filter((file): file is File => file !== null)
    .filter((file) => SUPPORTED_IMAGE_TYPES.has(file.type));
