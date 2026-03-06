import { css as cssLanguage } from '@codemirror/lang-css';
import { markdown as markdownLanguage } from '@codemirror/lang-markdown';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import type { EditorView } from '@codemirror/view';
import { tags } from '@lezer/highlight';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EditorMode } from './components/EditorMode';
import { PresentationMode } from './components/PresentationMode';
import { useMarpSlides } from './hooks/useMarpSlides';
import { usePresentationShortcuts } from './hooks/usePresentationShortcuts';
import { insertAtSelection, toDataUrl } from './lib/attachment';
import { createDownloadHtml } from './lib/exportHtml';
import { EXPORT_FILE_NAME, type ExportVariant } from './lib/exportVariant';
import {
  extractImageFilesFromClipboard,
  pickSupportedImageFiles,
} from './lib/imageAttachment';
import { extractFirstMarkdownH1 } from './lib/markdownTitle';
import type { EditorTab, Mode } from './types/presentation';

const DEFAULT_MARKDOWN = `---
marp: true
theme: default
paginate: true
---

# Markdown Samples
Esc で編集モードへ切り替え

---

## 1. 見出し・強調・インライン記法

これは **太字**、これは *斜体*、これは ~~取り消し~~。  
インラインコード: \`const answer = 42\`

---

## 2. リスト

- 箇条書き A
- 箇条書き B
  - ネスト B-1
  - ネスト B-2
- 箇条書き C

1. 番号付き 1
2. 番号付き 2
3. 番号付き 3

---

## 3. 引用・区切り・チェックリスト

> これは引用です。  
> 複数行の引用も確認できます。

- [x] チェック済み
- [ ] 未チェック

---

## 4. テーブル

| 項目 | 説明 | 値 |
| --- | --- | ---: |
| A | サンプル行 | 10 |
| B | 右寄せ列の確認 | 20 |
| C | 表の見た目チェック | 30 |

---

## 5. コードブロック

\`\`\`ts
type User = { id: number; name: string };

const users: User[] = [
  { id: 1, name: 'Aoi' },
  { id: 2, name: 'Ren' },
];

console.log(users.map((u) => u.name).join(', '));
\`\`\`

---

## 6. 画像

下の例はプレースホルダーです。  
編集モードの画像添付フォームから貼り付けると、\`data:\` URL がここに入ります。

![sample image](./images/sample.png)

---

## 7. 水平線と最終ページ

---

以上で主要な Markdown 記法サンプルは一通りです。
`;

const DEFAULT_USER_CSS = `/* Slide theme */
section {
  font-family: "Noto Sans JP", "Hiragino Sans", sans-serif;
}

section h1 {
  color: #0f172a;
}

section h2 {
  color: #0f172a;
}

.slide-host h1,
.preview-content h1,
.slide-host h2,
.preview-content h2 {
  color: var(--slide-heading-color, #0f172a) !important;
}

/* App UI (editor / presentation) */
:root {
  --app-background: #f8f8f8;
  --app-radius: 4px;
  --ui-border: #ccc;
  --slide-border: #ccc;
  --slide-shadow: 0 2px 4px #efefef;
  --progress-line-color: #009287;
  --slide-heading-color: #0f172a;
}

body {
  background: var(--app-background);
}

button {
  border: 1px solid var(--ui-border);
  border-radius: var(--app-radius);
}

textarea {
  border: 1px solid var(--ui-border);
  border-radius: var(--app-radius);
}

.presentation-root,
.editor-root {
  background: var(--app-background);
}

.slide-host {
  border: 1px solid var(--slide-border);
  border-radius: var(--app-radius);
  box-shadow: var(--slide-shadow);
}

.presentation-fullscreen-button {
  border-radius: var(--app-radius);
}

.presentation-progress-fill {
  background: var(--progress-line-color);
}

.panel,
.error-box,
.editor-main-textarea .cm-editor,
.preview-content,
.paste-zone {
  border-color: var(--ui-border);
  border-radius: var(--app-radius);
}
`;

const createMarkdownImageText = (name: string, dataUrl: string): string =>
  `\n![${name}](${dataUrl})\n`;

const markdownHighlightStyle = HighlightStyle.define([
  {
    tag: [tags.heading],
    color: '#0b3ea8',
    fontWeight: '700',
  },
  { tag: [tags.strong], color: '#1e3a8a', fontWeight: '700' },
  { tag: [tags.emphasis], color: '#1d4ed8', fontStyle: 'italic' },
  { tag: [tags.link], color: '#0369a1', textDecoration: 'underline' },
  { tag: [tags.quote], color: '#475569', fontStyle: 'italic' },
  { tag: [tags.list], color: '#334155' },
  { tag: [tags.monospace, tags.literal], color: '#7c2d12' },
  { tag: [tags.string], color: '#166534' },
  { tag: [tags.keyword], color: '#7e22ce' },
]);

function App() {
  const [mode, setMode] = useState<Mode>('presentation');
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN);
  const [userCss, setUserCss] = useState(DEFAULT_USER_CSS);
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

  const markdownViewRef = useRef<EditorView | null>(null);
  const attachmentIdRef = useRef(0);
  const presentationRootRef = useRef<HTMLElement>(null);
  const slideHostRef = useRef<HTMLDivElement>(null);

  const markdownExtensions = useMemo(
    () => [markdownLanguage(), syntaxHighlighting(markdownHighlightStyle)],
    [],
  );
  const cssExtensions = useMemo(() => [cssLanguage()], []);

  const rendered = useMarpSlides(markdown);
  const presentationTitle = useMemo(
    () => extractFirstMarkdownH1(markdown) ?? 'KanTan Marp',
    [markdown],
  );
  const totalSlides = Math.max(rendered.slides.length, 1);

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

  usePresentationShortcuts({
    mode,
    onToggleMode: toggleMode,
    onNextSlide: nextSlide,
    onPreviousSlide: previousSlide,
    onFirstSlide: firstSlide,
    onLastSlide: lastSlide,
    onToggleLaser: toggleLaser,
  });

  const insertImageToMarkdown = useCallback(
    (altText: string, dataUrl: string) => {
      const insertText = createMarkdownImageText(altText, dataUrl);
      const editorView = markdownViewRef.current;

      if (!editorView) {
        setMarkdown((prev) => `${prev}${insertText}`);
        return;
      }

      const { from: selectionStart, to: selectionEnd } =
        editorView.state.selection.main;

      setMarkdown((prev) => {
        const result = insertAtSelection(
          prev,
          selectionStart,
          selectionEnd,
          insertText,
        );

        requestAnimationFrame(() => {
          editorView.dispatch({
            selection: { anchor: result.cursor },
            scrollIntoView: true,
          });
          editorView.focus();
        });

        return result.nextText;
      });
    },
    [],
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
      await handleAttachFiles(files);
    },
    [handleAttachFiles],
  );

  const downloadStandaloneHtml = useCallback(
    (variant: ExportVariant) => {
      const html = createDownloadHtml({
        variant,
        title: presentationTitle,
        markdown,
        marpCss: rendered.css,
        userCss,
        slides: rendered.slides,
      });

      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');

      anchor.href = objectUrl;
      anchor.download = EXPORT_FILE_NAME[variant];
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    },
    [markdown, presentationTitle, rendered.css, rendered.slides, userCss],
  );

  const toggleFullscreen = async () => {
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
  };

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
        isFullscreen={isFullscreen}
        slideIndex={slideIndex}
        totalSlides={totalSlides}
        title={presentationTitle}
        onToggleFullscreen={toggleFullscreen}
        onToggleMode={toggleMode}
        onToggleLaser={toggleLaser}
        onDownloadLite={() => downloadStandaloneHtml('lite')}
        onDownloadSecure={() => downloadStandaloneHtml('secure')}
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
      markdownExtensions={markdownExtensions}
      cssExtensions={cssExtensions}
      onBackToPresentation={() => setMode('presentation')}
      onDownloadLite={() => downloadStandaloneHtml('lite')}
      onDownloadSecure={() => downloadStandaloneHtml('secure')}
      onChangeMarkdown={setMarkdown}
      onChangeUserCss={setUserCss}
      onCreateMarkdownEditor={(view) => {
        markdownViewRef.current = view;
      }}
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
