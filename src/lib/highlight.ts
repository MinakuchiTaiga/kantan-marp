import hljs from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import css from 'highlight.js/lib/languages/css';
import diff from 'highlight.js/lib/languages/diff';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import markdown from 'highlight.js/lib/languages/markdown';
import php from 'highlight.js/lib/languages/php';
import python from 'highlight.js/lib/languages/python';
import sql from 'highlight.js/lib/languages/sql';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import yaml from 'highlight.js/lib/languages/yaml';

hljs.registerLanguage('bash', bash);
hljs.registerLanguage('css', css);
hljs.registerLanguage('diff', diff);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('json', json);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('php', php);
hljs.registerLanguage('python', python);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('yaml', yaml);

const languageAliasMap: Record<string, string> = {
  bash: 'bash',
  css: 'css',
  diff: 'diff',
  html: 'xml',
  javascript: 'javascript',
  js: 'javascript',
  json: 'json',
  markdown: 'markdown',
  md: 'markdown',
  php: 'php',
  py: 'python',
  python: 'python',
  sh: 'bash',
  sql: 'sql',
  ts: 'typescript',
  typescript: 'typescript',
  xml: 'xml',
  yaml: 'yaml',
  yml: 'yaml',
  zsh: 'bash',
};

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

export const highlightCode = (code: string, language?: string) => {
  const requested = language?.trim().toLowerCase() ?? '';
  const resolvedLanguage = languageAliasMap[requested];

  if (!resolvedLanguage) {
    return `<pre><code>${escapeHtml(code)}</code></pre>`;
  }

  const value = hljs.highlight(code, {
    language: resolvedLanguage,
    ignoreIllegals: true,
  }).value;

  return `<pre><code class="hljs language-${resolvedLanguage}">${value}</code></pre>`;
};

export const highlightMarkdown = (markdownText: string) => {
  return hljs.highlight(markdownText, {
    language: 'markdown',
    ignoreIllegals: true,
  }).value;
};

export const highlightCss = (cssText: string) => {
  return hljs.highlight(cssText, {
    language: 'css',
    ignoreIllegals: true,
  }).value;
};
