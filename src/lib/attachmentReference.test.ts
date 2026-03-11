import {
  createMarkdownImageText,
  resolveAttachmentReferences,
} from './attachmentReference';

describe('attachmentReference', () => {
  it('creates markdown image with attachment reference', () => {
    expect(createMarkdownImageText('logo.png', 'img_12')).toBe(
      '\n![logo.png](attachment:img_12)\n',
    );
  });

  it('resolves attachment references into data urls', () => {
    const markdown = '![logo](attachment:img_1)\n![keep](attachment:missing)';
    const resolved = resolveAttachmentReferences(markdown, [
      {
        id: 'img_1',
        name: 'logo.png',
        dataUrl: 'data:image/png;base64,AAAA',
      },
    ]);

    expect(resolved).toContain('![logo](data:image/png;base64,AAAA)');
    expect(resolved).toContain('![keep](attachment:missing)');
  });
});
