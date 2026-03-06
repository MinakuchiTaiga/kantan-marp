import { appScript } from './exportAppScript';
import type { ExportVariant } from './exportVariant';

type ExportHtmlParams = {
  variant: ExportVariant;
  title: string;
  markdown: string;
  marpCss: string;
  userCss: string;
  slides: string[];
};

type ExportState = {
  markdown: string;
  css: string;
  marpCss: string;
  slides: string[];
};

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const cspByVariant = (variant: ExportVariant): string => {
  if (variant === 'lite') {
    return [
      "default-src 'none'",
      'img-src data:',
      "style-src 'unsafe-inline' https://cdn.jsdelivr.net",
      "script-src 'unsafe-inline' blob:",
      'font-src data: https://cdn.jsdelivr.net',
      "connect-src 'self'",
      "base-uri 'none'",
      "form-action 'none'",
    ].join('; ');
  }

  return [
    "default-src 'none'",
    'img-src data:',
    "style-src 'unsafe-inline'",
    "script-src 'unsafe-inline' blob:",
    'font-src data:',
    "connect-src 'self'",
    "base-uri 'none'",
    "form-action 'none'",
  ].join('; ');
};

const headExtraByVariant = (variant: ExportVariant): string =>
  variant === 'lite'
    ? '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/modern-normalize@3.0.1/modern-normalize.min.css">'
    : '';

export const createDownloadHtml = ({
  variant,
  title,
  markdown,
  marpCss,
  userCss,
  slides,
}: ExportHtmlParams): string => {
  const safeTitle = escapeHtml(title.trim() || 'KanTan Marp');
  const csp = cspByVariant(variant);
  const state: ExportState = {
    markdown,
    css: userCss,
    marpCss,
    slides,
  };

  const stateJson = JSON.stringify(state).replaceAll('<', '\\u003c');

  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="${escapeHtml(csp)}">
  <title>${safeTitle}</title>
  ${headExtraByVariant(variant)}
  <style>
    :root {
      font-family: "Noto Sans JP", "Hiragino Sans", sans-serif;
      color-scheme: light;
      --app-background: #f8f8f8;
      --app-radius: 4px;
      --ui-border: #ccc;
      --slide-border: #ccc;
      --slide-shadow: 0 2px 4px #efefef;
      --progress-line-color: #009287;
    }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--app-background); color: #edf2f7; min-height: 100vh; }
    button { border: 1px solid var(--ui-border); border-radius: var(--app-radius); background: #ffffff; color: #334155; padding: 6px 10px; }
    #presentation { min-height: 100vh; display: grid; place-items: center; padding: 16px; }
    #slide-host { width: min(1280px, 100%); aspect-ratio: 16 / 9; background: #ffffff; overflow: hidden; border: 1px solid var(--slide-border); border-radius: var(--app-radius); box-shadow: var(--slide-shadow); }
    #slide-host > svg { width: 100%; height: 100%; display: block; }
    #hud { position: fixed; left: 0; right: 0; bottom: 10px; display: flex; justify-content: space-between; padding: 0 16px; font-size: 12px; color: #94a3b8; }
    #editor { background: var(--app-background); min-height: 100vh; padding: 20px; color: #334155; }
    #editor h1 { margin: 0 0 12px; font-size: 20px; }
    #editor p { margin: 0 0 12px; color: #94a3b8; }
    #css-editor { width: 100%; min-height: 44vh; resize: vertical; border: 1px solid var(--ui-border); background: #0f172a; color: #e2e8f0; padding: 12px; border-radius: 4px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  </style>
  <style id="marp-style">${marpCss}</style>
  <style id="user-style">${userCss}</style>
</head>
<body>
  <main id="presentation">
    <div id="slide-host" class="marpit"></div>
    <div id="hud">
      <span id="mode-hint">Esc: 編集モード</span>
      <span id="page-number">1 / 1</span>
    </div>
  </main>
  <section id="editor" hidden>
    <h1>${safeTitle}</h1>
    <p>保存ボタンを押すと、現在開いているこのHTMLファイルをそのままダウンロードします。</p>
    <p><button id="save-html" type="button">保存</button></p>
    <textarea id="css-editor" spellcheck="false"></textarea>
  </section>
  <script id="kantan-state" type="application/json">${stateJson}</script>
  <script>${appScript}</script>
</body>
</html>`;
};
