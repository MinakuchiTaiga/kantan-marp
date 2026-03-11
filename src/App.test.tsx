import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { vi } from 'vitest';
import App from './App';

const { createDownloadHtmlMock } = vi.hoisted(() => ({
  createDownloadHtmlMock:
    vi.fn<
      (params: {
        title: string;
        markdown: string;
        userCss: string;
        defaultUserCss: string;
        attachments: Array<{ id: string; name: string; dataUrl: string }>;
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
        html: [
          '<section><h1>Mock Slide 1</h1></section>',
          '<section><h1>Mock Slide 2</h1></section>',
        ],
        css: 'section { color: #000; }',
      };
    }
  }

  return { Marpit: MockMarpit, default: MockMarpit };
});

describe('App', () => {
  const requestFullscreenMock = vi.fn<() => Promise<void>>();
  let fullscreenElementMock: Element | null = null;

  beforeEach(() => {
    createDownloadHtmlMock.mockReset();
    createDownloadHtmlMock.mockResolvedValue('<!doctype html><html></html>');
    requestFullscreenMock.mockReset();
    requestFullscreenMock.mockResolvedValue();

    Object.defineProperty(Element.prototype, 'requestFullscreen', {
      configurable: true,
      writable: true,
      value: requestFullscreenMock,
    });

    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => fullscreenElementMock,
    });

    fullscreenElementMock = null;
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

    expect(
      await screen.findByRole('heading', { name: /KanTan Marp Editor/i }),
    ).toBeInTheDocument();
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

  it('toggles fullscreen by F in presentation mode', async () => {
    render(<App />);
    fireEvent.keyDown(window, { key: 'f' });

    await waitFor(() => {
      expect(requestFullscreenMock).toHaveBeenCalledTimes(1);
    });
  });

  it('does not toggle fullscreen by F in editor mode', async () => {
    render(<App />);
    fireEvent.keyDown(window, { key: 'Escape' });
    fireEvent.keyDown(window, { key: 'f' });

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /KanTan Marp Editor/i }),
      ).toBeInTheDocument();
    });
    expect(requestFullscreenMock).not.toHaveBeenCalled();
  });

  it('moves slides by wheel scroll in presentation mode', async () => {
    render(<App />);
    expect(screen.getByText('1 / 2')).toBeInTheDocument();

    fireEvent.wheel(window, { deltaY: 120 });
    await waitFor(() => {
      expect(screen.getByText('2 / 2')).toBeInTheDocument();
    });

    fireEvent.wheel(window, { deltaY: -120 });
    await waitFor(() => {
      expect(screen.getByText('1 / 2')).toBeInTheDocument();
    });
  });

  it('disables previous/next controls at slide boundaries', async () => {
    render(<App />);

    const prevButtonsAtStart = screen.getAllByRole('button', {
      name: '前のスライドへ移動',
    });
    const nextButtonsAtStart = screen.getAllByRole('button', {
      name: '次のスライドへ移動',
    });
    expect(prevButtonsAtStart).toHaveLength(2);
    expect(nextButtonsAtStart).toHaveLength(2);
    prevButtonsAtStart.forEach((button) => expect(button).toBeDisabled());
    nextButtonsAtStart.forEach((button) => expect(button).toBeEnabled());

    fireEvent.wheel(window, { deltaY: 120 });
    await waitFor(() => {
      expect(screen.getByText('2 / 2')).toBeInTheDocument();
    });

    const prevButtonsAtEnd = screen.getAllByRole('button', {
      name: '前のスライドへ移動',
    });
    const nextButtonsAtEnd = screen.getAllByRole('button', {
      name: '次のスライドへ移動',
    });
    prevButtonsAtEnd.forEach((button) => expect(button).toBeEnabled());
    nextButtonsAtEnd.forEach((button) => expect(button).toBeDisabled());
  });

  it('zooms slide by Ctrl+wheel in fullscreen mode', async () => {
    render(<App />);

    fullscreenElementMock = document.documentElement;
    fireEvent(document, new Event('fullscreenchange'));

    const slideHost = screen.getByTestId('slide-host');
    vi.spyOn(slideHost, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 200,
      bottom: 100,
      width: 200,
      height: 100,
      toJSON: () => ({}),
    });

    fireEvent.wheel(window, {
      ctrlKey: true,
      deltaY: -120,
      clientX: 50,
      clientY: 25,
    });

    await waitFor(() => {
      expect(slideHost).toHaveStyle({ transform: 'scale(1.15)' });
      expect(slideHost).toHaveStyle({ transformOrigin: '25% 25%' });
    });
  });

  it('inserts pasted image into markdown once from attachment form', async () => {
    render(<App />);
    fireEvent.keyDown(window, { key: 'Escape' });
    fireEvent.click(
      await screen.findByRole('button', { name: '画像添付フォームを表示' }),
    );

    const pasteZone = screen.getByDisplayValue(
      'ここをフォーカスして Ctrl+V で画像を貼り付け',
    );
    const markdownTextarea = document.querySelector<HTMLTextAreaElement>(
      'textarea.editor-main-textarea',
    );

    expect(markdownTextarea).not.toBeNull();
    if (!markdownTextarea) return;

    const imageFile = new File(['x'], 'sample.png', { type: 'image/png' });
    const clipboardData = {
      items: [
        {
          kind: 'file',
          type: 'image/png',
          getAsFile: () => imageFile,
        },
      ],
    };

    fireEvent.paste(pasteZone, { clipboardData });

    await waitFor(() => {
      expect(markdownTextarea.value).toContain('![sample.png](attachment:img_');
      expect(
        markdownTextarea.value.match(/!\[sample\.png\]\(attachment:img_\d+\)/g),
      ).toHaveLength(1);
    });
  });
});
