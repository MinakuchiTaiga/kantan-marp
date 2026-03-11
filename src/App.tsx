import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import marpDefaultThemeCss from './assets/marp-default-theme.css?raw';
import { EditorMode } from './components/EditorMode';
import { PresentationMode } from './components/PresentationMode';
import { useMarpSlides } from './hooks/useMarpSlides';
import { usePresentationShortcuts } from './hooks/usePresentationShortcuts';
import { insertAtSelection, toDataUrl } from './lib/attachment';
import { createDownloadHtml } from './lib/exportHtml';
import { createExportFileName } from './lib/exportVariant';
import {
  extractImageFilesFromClipboard,
  pickSupportedImageFiles,
} from './lib/imageAttachment';
import { extractFirstMarkdownH1 } from './lib/markdownTitle';
import type { EditorTab, Mode } from './types/presentation';

const DEFAULT_MARKDOWN_ID = 'kantan-default-markdown';
const DEFAULT_MARKDOWN = '';
const SLIDE_ZOOM_MIN = 1;
const SLIDE_ZOOM_MAX = 4;
const SLIDE_ZOOM_STEP = 0.15;
const DEFAULT_USER_CSS = `${marpDefaultThemeCss}
:root{--app-background:#f8f8f8;--app-radius:4px;--ui-border:#ccc;--slide-border:#ccc;--slide-shadow:0 2px 4px #efefef;--progress-line-color:#009287}body{background:var(--app-background)}button,textarea{border:1px solid var(--ui-border);border-radius:var(--app-radius)}.presentation-root,.editor-root{background:var(--app-background)}.slide-host{border:1px solid var(--slide-border);border-radius:var(--app-radius);box-shadow:var(--slide-shadow)}.presentation-fullscreen-button{border-radius:var(--app-radius)}.presentation-progress-fill{background:var(--progress-line-color)}.panel,.error-box,.editor-main-textarea,.preview-content,.paste-zone{border-color:var(--ui-border);border-radius:var(--app-radius)}
`;

const createMarkdownImageText = (name: string, dataUrl: string): string =>
  `\n![${name}](${dataUrl})\n`;

type BootstrapState = {
  markdown?: string;
  userCss?: string;
};

const readBootstrapState = (): BootstrapState => {
  const stateElement = document.getElementById('kantan-initial-state');
  if (!stateElement?.textContent) return {};

  try {
    const parsed = JSON.parse(stateElement.textContent) as BootstrapState;
    return parsed ?? {};
  } catch {
    return {};
  }
};

const readDefaultMarkdown = (): string => {
  const defaultMarkdownElement = document.getElementById(DEFAULT_MARKDOWN_ID);
  if (!defaultMarkdownElement?.textContent) return DEFAULT_MARKDOWN;
  const markdown = defaultMarkdownElement.textContent;
  return markdown.replace(/^\s*(?=---(?:\r?\n|$))/, '');
};

function App() {
  const bootstrapState = useMemo(readBootstrapState, []);
  const defaultMarkdown = useMemo(readDefaultMarkdown, []);

  const [mode, setMode] = useState<Mode>('presentation');
  const [markdown, setMarkdown] = useState(
    bootstrapState.markdown ?? defaultMarkdown,
  );
  const [userCss, setUserCss] = useState(
    bootstrapState.userCss ?? DEFAULT_USER_CSS,
  );
  const [slideIndex, setSlideIndex] = useState(0);
  const [editorTab, setEditorTab] = useState<EditorTab>('markdown');
  const [showAttachmentPane, setShowAttachmentPane] = useState(false);
  const [attachments, setAttachments] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [laserEnabled, setLaserEnabled] = useState(false);
  const [laserVisible, setLaserVisible] = useState(false);
  const [laserPoint, setLaserPoint] = useState({ x: 50, y: 50 });
  const [slideZoomScale, setSlideZoomScale] = useState(1);
  const [slideZoomOrigin, setSlideZoomOrigin] = useState({ x: 50, y: 50 });

  const markdownTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const attachmentIdRef = useRef(0);
  const presentationRootRef = useRef<HTMLElement>(null);
  const slideHostRef = useRef<HTMLDivElement>(null);

  const rendered = useMarpSlides(markdown);
  const presentationTitle = useMemo(
    () => extractFirstMarkdownH1(markdown) ?? 'KanTan Marp',
    [markdown],
  );
  const totalSlides = Math.max(rendered.slides.length, 1);
  const canPrevious = slideIndex > 0;
  const canNext = slideIndex < totalSlides - 1;

  useEffect(() => {
    if (slideIndex <= totalSlides - 1) return;
    setSlideIndex(totalSlides - 1);
  }, [slideIndex, totalSlides]);

  useEffect(() => {
    setErrorMessage(rendered.error);
  }, [rendered.error]);

  useEffect(() => {
    document.title = presentationTitle;
  }, [presentationTitle]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () =>
      document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === 'presentation' ? 'editor' : 'presentation'));
  }, []);

  const toggleLaser = useCallback(() => {
    setLaserEnabled((prev) => {
      const next = !prev;
      if (!next) setLaserVisible(false);
      return next;
    });
  }, []);

  const nextSlide = useCallback(() => {
    setSlideIndex((prev) => Math.min(prev + 1, totalSlides - 1));
  }, [totalSlides]);

  const previousSlide = useCallback(() => {
    setSlideIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const seekSlideByRatio = useCallback(
    (ratio: number) => {
      const normalized = Math.min(Math.max(ratio, 0), 1);
      const nextIndex = Math.floor(normalized * totalSlides);
      setSlideIndex(Math.min(nextIndex, totalSlides - 1));
    },
    [totalSlides],
  );

  const firstSlide = useCallback(() => {
    setSlideIndex(0);
  }, []);

  const lastSlide = useCallback(() => {
    setSlideIndex(totalSlides - 1);
  }, [totalSlides]);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }

      const target = presentationRootRef.current ?? document.documentElement;
      await target.requestFullscreen();
    } catch (_error) {
      // Ignore fullscreen API failures caused by browser policies.
    }
  }, []);

  usePresentationShortcuts({
    mode,
    onToggleMode: toggleMode,
    onToggleFullscreen: toggleFullscreen,
    onNextSlide: nextSlide,
    onPreviousSlide: previousSlide,
    onFirstSlide: firstSlide,
    onLastSlide: lastSlide,
    onToggleLaser: toggleLaser,
  });

  useEffect(() => {
    if (mode === 'presentation' && isFullscreen) return;
    setSlideZoomScale(1);
    setSlideZoomOrigin({ x: 50, y: 50 });
  }, [isFullscreen, mode]);

  useEffect(() => {
    const onWheelForZoom = (event: WheelEvent) => {
      if (mode !== 'presentation' || !isFullscreen || !event.ctrlKey) return;

      const target = slideHostRef.current;
      if (!target) return;

      const rect = target.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      event.preventDefault();

      const pointerX = ((event.clientX - rect.left) / rect.width) * 100;
      const pointerY = ((event.clientY - rect.top) / rect.height) * 100;

      setSlideZoomOrigin({
        x: Math.min(Math.max(pointerX, 0), 100),
        y: Math.min(Math.max(pointerY, 0), 100),
      });

      const direction = event.deltaY < 0 ? 1 : -1;
      setSlideZoomScale((prev) =>
        Math.min(
          SLIDE_ZOOM_MAX,
          Math.max(SLIDE_ZOOM_MIN, prev + direction * SLIDE_ZOOM_STEP),
        ),
      );
    };

    window.addEventListener('wheel', onWheelForZoom, { passive: false });
    return () => window.removeEventListener('wheel', onWheelForZoom);
  }, [isFullscreen, mode]);

  const insertImageToMarkdown = useCallback(
    (altText: string, dataUrl: string) => {
      const insertText = createMarkdownImageText(altText, dataUrl);
      const markdownTextarea = markdownTextareaRef.current;

      if (!markdownTextarea) {
        setMarkdown((prev) => `${prev}${insertText}`);
        return;
      }

      const selectionStart = markdownTextarea.selectionStart ?? markdown.length;
      const selectionEnd = markdownTextarea.selectionEnd ?? markdown.length;

      setMarkdown((prev) => {
        const result = insertAtSelection(
          prev,
          selectionStart,
          selectionEnd,
          insertText,
        );

        requestAnimationFrame(() => {
          const textarea = markdownTextareaRef.current;
          if (!textarea) return;
          textarea.focus();
          textarea.setSelectionRange(result.cursor, result.cursor);
        });

        return result.nextText;
      });
    },
    [markdown.length],
  );

  const handleAttachFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = pickSupportedImageFiles(fileList);
      if (files.length === 0) return;

      for (const file of files) {
        const dataUrl = await toDataUrl(file);
        insertImageToMarkdown(file.name, dataUrl);
        setAttachments((prev) =>
          [{ id: attachmentIdRef.current++, name: file.name }, ...prev].slice(
            0,
            10,
          ),
        );
      }
    },
    [insertImageToMarkdown],
  );

  const handlePasteImage = useCallback(
    async (event: React.ClipboardEvent<HTMLElement>) => {
      const files = extractImageFilesFromClipboard(event.clipboardData.items);
      if (files.length === 0) return;

      event.preventDefault();
      event.stopPropagation();
      await handleAttachFiles(files);
    },
    [handleAttachFiles],
  );

  const downloadStandaloneHtml = useCallback(async () => {
    const html = await createDownloadHtml({
      title: presentationTitle,
      markdown,
      userCss,
      defaultUserCss: DEFAULT_USER_CSS,
    });

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = objectUrl;
    anchor.download = createExportFileName(presentationTitle);
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  }, [markdown, presentationTitle, userCss]);

  const triggerDownloadStandaloneHtml = useCallback(() => {
    void downloadStandaloneHtml().catch(() => {
      setErrorMessage(
        '保存用HTMLの生成に失敗しました。pnpm run build 実行後、dist/index.html を開いて再試行してください。',
      );
    });
  }, [downloadStandaloneHtml]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      if (event.key.toLowerCase() !== 's') return;
      event.preventDefault();
      triggerDownloadStandaloneHtml();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [triggerDownloadStandaloneHtml]);

  const handleLaserMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!laserEnabled) return;
    const target = slideHostRef.current;
    if (!target) return;

    const rect = target.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    setLaserPoint({
      x: Math.min(Math.max(x, 0), 100),
      y: Math.min(Math.max(y, 0), 100),
    });
    setLaserVisible(true);
  };

  if (mode === 'presentation') {
    return (
      <PresentationMode
        renderedCss={rendered.css}
        userCss={userCss}
        slideHtml={rendered.slides[slideIndex] ?? ''}
        slideHostRef={slideHostRef}
        presentationRootRef={presentationRootRef}
        laserEnabled={laserEnabled}
        laserVisible={laserVisible}
        laserPoint={laserPoint}
        slideZoomScale={slideZoomScale}
        slideZoomOrigin={slideZoomOrigin}
        isFullscreen={isFullscreen}
        slideIndex={slideIndex}
        totalSlides={totalSlides}
        canPrevious={canPrevious}
        canNext={canNext}
        title={presentationTitle}
        onToggleFullscreen={toggleFullscreen}
        onToggleMode={toggleMode}
        onToggleLaser={toggleLaser}
        onDownloadLite={triggerDownloadStandaloneHtml}
        onNextSlide={nextSlide}
        onPreviousSlide={previousSlide}
        onSeekSlide={seekSlideByRatio}
        onLaserMove={handleLaserMove}
        onLaserLeave={() => setLaserVisible(false)}
      />
    );
  }

  return (
    <EditorMode
      renderedCss={rendered.css}
      userCss={userCss}
      markdown={markdown}
      editorTab={editorTab}
      showAttachmentPane={showAttachmentPane}
      attachments={attachments}
      errorMessage={errorMessage}
      markdownTextareaRef={markdownTextareaRef}
      onBackToPresentation={() => setMode('presentation')}
      onDownloadLite={triggerDownloadStandaloneHtml}
      onChangeMarkdown={setMarkdown}
      onChangeUserCss={setUserCss}
      onToggleAttachmentPane={() => setShowAttachmentPane((prev) => !prev)}
      onSelectEditorTab={setEditorTab}
      onAttachInputChange={async (event) => {
        if (event.target.files) {
          await handleAttachFiles(event.target.files);
        }
        event.target.value = '';
      }}
      onPasteImage={handlePasteImage}
      previewSlidesHtml={rendered.slides.join('')}
    />
  );
}

export default App;
