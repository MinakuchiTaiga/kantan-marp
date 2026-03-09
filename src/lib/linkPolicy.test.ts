import { applyLinkPolicy } from './linkPolicy';

describe('applyLinkPolicy', () => {
  it('adds target and secure rel for non-fragment links', () => {
    const html = '<p><a href="https://example.com">x</a></p>';
    const result = applyLinkPolicy(html);

    expect(result).toContain('target="_blank"');
    expect(result).toContain('rel="noopener noreferrer"');
  });

  it('keeps fragment links unchanged', () => {
    const html = '<p><a href="#page-2">jump</a></p>';
    const result = applyLinkPolicy(html);

    expect(result).not.toContain('target="_blank"');
    expect(result).not.toContain('rel=');
  });

  it('preserves existing rel and merges secure tokens', () => {
    const html = '<p><a href="https://example.com" rel="external">x</a></p>';
    const result = applyLinkPolicy(html);

    expect(result).toContain('rel="external noopener noreferrer"');
  });
});
