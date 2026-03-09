import { vi } from 'vitest';
import { createDownloadHtml } from './exportHtml';

describe('createDownloadHtml', () => {
  const baseHtml = `<!doctype html>
  <html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <title>KanTan Marp</title>
    <link rel="stylesheet" href="/assets/index.css" />
  </head>
  <body>
    <div id="root"><div>runtime-markup</div></div>
    <script id="kantan-default-markdown" type="text/plain">default</script>
    <script type="module" src="/assets/index.js"></script>
  </body>
  </html>`;

  const createResponse = (body: string): Response =>
    new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
    });

  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/dist/index.html')) {
        return createResponse(baseHtml);
      }
      if (url.endsWith('/assets/index.css')) {
        return createResponse('body { margin: 0; }');
      }
      if (url.endsWith('/assets/index.js')) {
        return createResponse('console.log("runtime");');
      }

      return new Response('', { status: 404 });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exports minified standalone html without debug attributes', async () => {
    const html = await createDownloadHtml({
      title: 'Deck',
      markdown: '# Slide 1',
      userCss: 'section { font-size: 32px; }',
      defaultUserCss: '',
    });

    expect(html).toContain('<!doctype html>');
    expect(html).not.toContain('data-inline-from');
    expect(html).not.toContain('/assets/index.js');
    expect(html).toContain('id="kantan-initial-state"');
    expect(html).not.toContain('kantan-default-markdown');
    expect(html).not.toContain('runtime-markup');
    expect(html).not.toContain('>\n<');
  });

  it('keeps export html overhead under size budget', async () => {
    const html = await createDownloadHtml({
      title: 'Size Budget',
      markdown: '# Slide 1',
      userCss: 'section { font-size: 30px; }',
      defaultUserCss: '',
    });

    const bytes = new TextEncoder().encode(html).length;
    expect(bytes).toBeLessThan(10 * 1024);
  });
});
