const mergeRel = (value: string | null): string => {
  const tokens = (value ?? '')
    .split(/\s+/)
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
  const set = new Set(tokens);
  set.add('noopener');
  set.add('noreferrer');
  return Array.from(set).join(' ');
};

export const applyLinkPolicy = (html: string): string => {
  if (!html.trim()) return html;
  if (typeof DOMParser === 'undefined') return html;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const anchors = doc.querySelectorAll<HTMLAnchorElement>('a[href]');

  for (const anchor of anchors) {
    const href = (anchor.getAttribute('href') ?? '').trim();
    if (!href || href.startsWith('#')) continue;

    anchor.setAttribute('target', '_blank');
    anchor.setAttribute('rel', mergeRel(anchor.getAttribute('rel')));
  }

  return doc.body.innerHTML;
};
