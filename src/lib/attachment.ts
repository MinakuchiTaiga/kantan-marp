export type TextInsertionResult = {
  nextText: string;
  cursor: number;
};

export const toDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }

      reject(new Error('Failed to read file as data URL'));
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

export const insertAtSelection = (
  source: string,
  selectionStart: number,
  selectionEnd: number,
  textToInsert: string,
): TextInsertionResult => {
  const head = source.slice(0, selectionStart);
  const tail = source.slice(selectionEnd);
  const nextText = `${head}${textToInsert}${tail}`;

  return {
    nextText,
    cursor: selectionStart + textToInsert.length,
  };
};
