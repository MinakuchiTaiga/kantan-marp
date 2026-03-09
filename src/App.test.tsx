import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { vi } from 'vitest';
import App from './App';

const { createDownloadHtmlMock } = vi.hoisted(() => ({
  createDownloadHtmlMock: vi.fn<
    (params: {
      title: string;
      markdown: string;
      userCss: string;
      defaultUserCss: string;
    }) => Promise<string>
  >(),
}));

vi.mock('./lib/exportHtml', () => ({
  createDownloadHtml: createDownloadHtmlMock,
}));

vi.mock('@marp-team/marpit', () => {
  class MockMarpit {
    render() {
      return {
        html: ['<section><h1>Mock Slide</h1></section>'],
        css: 'section { color: #000; }',
      };
    }
  }

  return { Marpit: MockMarpit, default: MockMarpit };
});

describe('App', () => {
  beforeEach(() => {
    createDownloadHtmlMock.mockReset();
    createDownloadHtmlMock.mockResolvedValue('<!doctype html><html></html>');
  });

  it('starts in presentation mode', () => {
    render(<App />);
    expect(
      screen.getByRole('button', { name: /編集モード \(Esc\)/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('slide-host')).toBeInTheDocument();
  });

  it('toggles to editor mode by Escape', async () => {
    render(<App />);
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(await screen.findByRole('heading', { name: /KanTan Marp Editor/i }))
      .toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /保存 \(Ctrl\+S\)/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /セキュア版を保存/i }),
    ).not.toBeInTheDocument();
  });

  it('triggers export by Ctrl+S', async () => {
    render(<App />);
    fireEvent.keyDown(window, { key: 's', ctrlKey: true });

    await waitFor(() => {
      expect(createDownloadHtmlMock).toHaveBeenCalledTimes(1);
    });
  });
});
