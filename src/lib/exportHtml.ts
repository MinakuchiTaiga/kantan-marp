import { minifyCss } from './minifyCss';
import type { MarkdownAttachment } from './attachmentReference';

type ExportHtmlParams = {
  title: string;
  markdown: string;
  userCss: string;
  defaultUserCss: string;
  attachments: MarkdownAttachment[];
};

type ExportBootState = {
  markdown: string;
  userCss?: string;
  attachments?: MarkdownAttachment[];
};

const BOOT_STATE_ID = 'kantan-initial-state';
const DEFAULT_MARKDOWN_ID = 'kantan-default-markdown';

const scriptSafeText = (value: string): string =>
  value.replaceAll('</script', '<\\/script');

const isDevScriptSource = (value: string): boolean =>
  value.includes('/@vite/client') ||
  value.includes('/@react-refresh') ||
  value.includes('/src/') ||
  value.includes('vite/dist/client');

const isProductionHtml = (html: string): boolean => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const scriptSources = Array.from(
    doc.querySelectorAll<HTMLScriptElement>('script[src]'),
  )
    .map((script) => script.getAttribute('src') ?? '')
    .filter(Boolean);
  const stylesheetLinks = Array.from(
    doc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"][href]'),
  );

  if (scriptSources.some(isDevScriptSource)) return false;
  if (scriptSources.some((src) => src.includes('/assets/'))) return true;

  return scriptSources.length === 0 && stylesheetLinks.length === 0;
};

const fetchText = async (url: string): Promise<string> => {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to fetch asset: ${url}`);
  }
  return response.text();
};

const resolveBaseHtml = async (): Promise<{ html: string; baseUrl: string }> => {
  const currentUrl = window.location.href;
  try {
    const currentResponse = await fetch(currentUrl, { cache: 'no-store' });
    if (currentResponse.ok) {
      const fetchedHtml = await currentResponse.text();
      if (isProductionHtml(fetchedHtml)) {
        return {
          html: fetchedHtml,
          baseUrl: currentUrl,
        };
      }
    }
  } catch {
    // Fall back to current DOM for standalone / file:// cases.
  }

  const currentHtml = document.documentElement.outerHTML;
  if (isProductionHtml(currentHtml)) {
    return {
      html: currentHtml,
      baseUrl: currentUrl,
    };
  }

  const distUrl = new URL('/dist/index.html', window.location.href).href;
  const distResponse = await fetch(distUrl, { cache: 'no-store' });
  if (distResponse.ok) {
    const distHtml = await distResponse.text();
    if (!isProductionHtml(distHtml)) {
      throw new Error('dist/index.html is not a production build output.');
    }

    return {
      html: distHtml,
      baseUrl: distUrl,
    };
  }

  throw new Error(
    'Standalone HTML export requires production assets. Open built dist/index.html and retry.',
  );
};

const minifyExportHtml = (html: string): string =>
  html.replace(/>\s+</g, '><').trim();

export const createDownloadHtml = async ({
  title,
  markdown,
  userCss,
  defaultUserCss,
  attachments,
}: ExportHtmlParams): Promise<string> => {
  const { html: baseHtml, baseUrl } = await resolveBaseHtml();
  const parser = new DOMParser();
  const doc = parser.parseFromString(baseHtml, 'text/html');

  const minifiedUserCss = minifyCss(userCss);
  const minifiedDefaultUserCss = minifyCss(defaultUserCss);

  const state: ExportBootState = {
    markdown,
    userCss:
      minifiedUserCss === minifiedDefaultUserCss ? undefined : minifiedUserCss,
    attachments: attachments.length > 0 ? attachments : undefined,
  };
  const stateJson = JSON.stringify(state).replaceAll('<', '\\u003c');

  const stylesheetLinks = Array.from(
    doc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"][href]'),
  );

  for (const link of stylesheetLinks) {
    const href = link.getAttribute('href');
    if (!href) continue;
    const cssUrl = new URL(href, baseUrl).href;
    const css = await fetchText(cssUrl);
    const style = doc.createElement('style');
    style.textContent = css.trim();
    link.replaceWith(style);
  }

  doc.querySelectorAll('link[rel="modulepreload"]').forEach((element) => {
    element.remove();
  });

  const externalScripts = Array.from(
    doc.querySelectorAll<HTMLScriptElement>('script[src]'),
  );
  for (const script of externalScripts) {
    const src = script.getAttribute('src');
    if (!src) continue;
    if (isDevScriptSource(src)) {
      throw new Error(`Development script cannot be exported: ${src}`);
    }
    const scriptUrl = new URL(src, baseUrl).href;
    const scriptContent = await fetchText(scriptUrl);
    const inlineScript = doc.createElement('script');
    const type = script.getAttribute('type');
    if (type) inlineScript.setAttribute('type', type);
    inlineScript.textContent = scriptSafeText(scriptContent);
    script.replaceWith(inlineScript);
  }

  const head = doc.head ?? doc.createElement('head');
  if (!doc.head) {
    doc.documentElement.insertBefore(head, doc.body ?? null);
  }

  const root = doc.getElementById('root');
  if (root) {
    root.innerHTML = '';
  }

  const defaultMarkdown = doc.getElementById(DEFAULT_MARKDOWN_ID);
  if (defaultMarkdown) {
    defaultMarkdown.remove();
  }

  let robotsMeta = head.querySelector('meta[name="robots"]');
  if (!robotsMeta) {
    robotsMeta = doc.createElement('meta');
    robotsMeta.setAttribute('name', 'robots');
    head.append(robotsMeta);
  }
  robotsMeta.setAttribute('content', 'noindex, nofollow');

  let referrerMeta = head.querySelector('meta[name="referrer"]');
  if (!referrerMeta) {
    referrerMeta = doc.createElement('meta');
    referrerMeta.setAttribute('name', 'referrer');
    head.append(referrerMeta);
  }
  referrerMeta.setAttribute('content', 'no-referrer');

  doc.title = title.trim() || 'KanTan Marp';

  const existingState = doc.getElementById(BOOT_STATE_ID);
  if (existingState) existingState.remove();

  const stateScript = doc.createElement('script');
  stateScript.id = BOOT_STATE_ID;
  stateScript.type = 'application/json';
  stateScript.textContent = stateJson;
  const firstHeadScript = head.querySelector('script');
  if (firstHeadScript) {
    head.insertBefore(stateScript, firstHeadScript);
  } else {
    head.append(stateScript);
  }

  return minifyExportHtml(`<!doctype html>\n${doc.documentElement.outerHTML}`);
};
