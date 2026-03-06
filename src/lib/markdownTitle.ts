const stripInlineMarkdown = (value: string): string =>
  value
    .replaceAll(/!\[[^\]]*]\([^)]*\)/g, '')
    .replaceAll(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replaceAll(/[`*_~]/g, '')
    .trim();

export const extractFirstMarkdownH1 = (markdown: string): string | null => {
  const lines = markdown.replaceAll('\r\n', '\n').split('\n');
  let inCodeFence = false;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();

    if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
      inCodeFence = !inCodeFence;
      continue;
    }

    if (inCodeFence) continue;

    if (index === 0 && trimmed === '---') {
      index += 1;
      while (index < lines.length && lines[index].trim() !== '---') {
        index += 1;
      }
      continue;
    }

    if (!trimmed.startsWith('# ')) continue;

    const heading = stripInlineMarkdown(trimmed.slice(2));
    if (heading) return heading;
  }

  return null;
};
