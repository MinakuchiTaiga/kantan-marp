const minifyWithCssom = (value: string): string | null => {
  if (typeof CSSStyleSheet === 'undefined') return null;

  try {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(value);
    return Array.from(sheet.cssRules, (rule) => rule.cssText).join('');
  } catch {
    return null;
  }
};

export const minifyCss = (value: string): string => {
  const input = value.trim();
  if (!input) return '';

  const minified = minifyWithCssom(input);
  if (minified !== null) return minified;

  return input;
};
