import { useMemo, useRef } from 'react';
import type { RefObject, UIEvent } from 'react';
import { highlightCss, highlightMarkdown } from '../lib/highlight';
import type { EditorTab } from '../types/presentation';
import { Button } from './ui/Button';
import styles from './EditorMode.module.css';

type AttachmentItem = {
  id: string;
  name: string;
};

type EditorModeProps = {
  renderedCss: string;
  userCss: string;
  markdown: string;
  previewSlidesHtml: string;
  editorTab: EditorTab;
  showAttachmentPane: boolean;
  attachments: AttachmentItem[];
  errorMessage: string | null;
  markdownTextareaRef: RefObject<HTMLTextAreaElement | null>;
  onBackToPresentation: () => void;
  onDownloadLite: () => void;
  onChangeMarkdown: (value: string) => void;
  onChangeUserCss: (value: string) => void;
  onToggleAttachmentPane: () => void;
  onSelectEditorTab: (tab: EditorTab) => void;
  onAttachInputChange: (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => Promise<void>;
  onPasteImage: (event: React.ClipboardEvent<HTMLElement>) => Promise<void>;
  onInsertAttachmentToMarkdown: (attachmentId: string) => void;
  onDownloadAttachment: (attachmentId: string) => void;
  onDeleteAttachment: (attachmentId: string) => void;
};

export const EditorMode = ({
  renderedCss,
  userCss,
  markdown,
  previewSlidesHtml,
  editorTab,
  showAttachmentPane,
  attachments,
  errorMessage,
  markdownTextareaRef,
  onBackToPresentation,
  onDownloadLite,
  onChangeMarkdown,
  onChangeUserCss,
  onToggleAttachmentPane,
  onSelectEditorTab,
  onAttachInputChange,
  onPasteImage,
  onInsertAttachmentToMarkdown,
  onDownloadAttachment,
  onDeleteAttachment,
}: EditorModeProps) => {
  const markdownHighlightContentRef = useRef<HTMLElement | null>(null);
  const cssHighlightContentRef = useRef<HTMLElement | null>(null);
  const highlightedMarkdown = useMemo(() => {
    const input = markdown.length === 0 ? ' ' : markdown;
    return highlightMarkdown(input);
  }, [markdown]);
  const highlightedCss = useMemo(() => {
    const input = userCss.length === 0 ? ' ' : userCss;
    return highlightCss(input);
  }, [userCss]);

  const handleMarkdownScroll = (event: UIEvent<HTMLTextAreaElement>) => {
    const content = markdownHighlightContentRef.current;
    if (!content) return;
    content.style.transform = `translate(${-event.currentTarget.scrollLeft}px, ${-event.currentTarget.scrollTop}px)`;
  };

  const handleCssScroll = (event: UIEvent<HTMLTextAreaElement>) => {
    const content = cssHighlightContentRef.current;
    if (!content) return;
    content.style.transform = `translate(${-event.currentTarget.scrollLeft}px, ${-event.currentTarget.scrollTop}px)`;
  };

  return (
    <main className={`${styles.editorRoot} editor-root`} onPaste={onPasteImage}>
      <style>{`${renderedCss}\n${userCss}`}</style>
      <header className={styles.editorHeader}>
        <h1 className={styles.editorBrand}>
          <svg
            width="128"
            height="128"
            viewBox="0 0 128 128"
            fill="none"
            aria-hidden="true"
          >
            <mask
              id="path-1-outside-1_4006_2"
              maskUnits="userSpaceOnUse"
              x="4.5"
              y="23"
              width="120"
              height="80"
              fill="black"
            >
              <rect fill="white" x="4.5" y="23" width="120" height="80" />
              <path d="M112.671 30.8924C114.558 28.9921 117.8 30.3278 117.8 33.0057V93.2264C117.8 94.8832 116.457 96.2263 114.8 96.2264H14.5058C11.8385 96.2262 10.4978 93.006 12.3769 91.1131L72.1708 30.8924C74.0576 28.9921 77.2997 30.3278 77.2997 33.0057V66.5154L112.671 30.8924Z" />
            </mask>
            <path d="M112.671 30.8924C114.558 28.9921 117.8 30.3278 117.8 33.0057V93.2264C117.8 94.8832 116.457 96.2263 114.8 96.2264H14.5058C11.8385 96.2262 10.4978 93.006 12.3769 91.1131L72.1708 30.8924C74.0576 28.9921 77.2997 30.3278 77.2997 33.0057V66.5154L112.671 30.8924Z" fill="#67B9E4" />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M112.671 30.8924L116.928 35.1199L116.929 35.1199L112.671 30.8924ZM117.8 33.0057H123.8V33.0056L117.8 33.0057ZM114.8 96.2264V102.226H114.8L114.8 96.2264ZM14.5058 96.2264L14.5055 102.226H14.5058V96.2264ZM12.3769 91.1131L8.11917 86.8855L8.11862 86.8861L12.3769 91.1131ZM72.1708 30.8924L76.4285 35.1199L76.4285 35.1199L72.1708 30.8924ZM77.2997 33.0057H83.2997V33.0056L77.2997 33.0057ZM77.2997 66.5154H71.2997V81.0737L81.5574 70.743L77.2997 66.5154ZM112.671 30.8924L116.929 35.1199C115.043 37.0187 111.8 35.6855 111.8 33.0057L117.8 33.0057L123.8 33.0056C123.8 24.9701 114.072 20.9655 108.413 26.6649L112.671 30.8924ZM117.8 33.0057H111.8V93.2264H117.8H123.8V33.0057H117.8ZM117.8 93.2264H111.8C111.8 91.5692 113.143 90.2264 114.799 90.2264L114.8 96.2264L114.8 102.226C119.77 102.226 123.8 98.1971 123.8 93.2264H117.8ZM114.8 96.2264V90.2264H14.5058V96.2264V102.226H114.8V96.2264ZM14.5058 96.2264L14.5061 90.2264C17.1735 90.2265 18.5142 93.4471 16.6351 95.34L12.3769 91.1131L8.11862 86.8861C2.48144 92.565 6.50342 102.226 14.5055 102.226L14.5058 96.2264ZM12.3769 91.1131L16.6346 95.3406L76.4285 35.1199L72.1708 30.8924L67.9131 26.6648L8.11917 86.8855L12.3769 91.1131ZM72.1708 30.8924L76.4285 35.1199C74.5431 37.0187 71.2998 35.6855 71.2997 33.0057L77.2997 33.0057L83.2997 33.0056C83.2996 24.9701 73.5721 20.9655 67.9131 26.6649L72.1708 30.8924ZM77.2997 33.0057H71.2997V66.5154H77.2997H83.2997V33.0057H77.2997ZM77.2997 66.5154L81.5574 70.743L116.928 35.1199L112.671 30.8924L108.413 26.6648L73.0421 62.2879L77.2997 66.5154Z"
              fill="#67B9E4"
              mask="url(#path-1-outside-1_4006_2)"
            />
            <mask
              id="path-3-outside-2_4006_2"
              maskUnits="userSpaceOnUse"
              x="0.200378"
              y="19"
              width="120"
              height="80"
              fill="black"
            >
              <rect fill="white" x="0.200378" y="19" width="120" height="80" />
              <path d="M108.371 26.8924C110.258 24.9921 113.5 26.3278 113.5 29.0057V89.2264C113.5 90.8832 112.157 92.2263 110.5 92.2264H10.2062C7.53884 92.2262 6.1982 89.006 8.07725 87.1131L67.8712 26.8924C69.758 24.9921 73.0001 26.3278 73.0001 29.0057V62.5154L108.371 26.8924Z" />
            </mask>
            <path d="M108.371 26.8924C110.258 24.9921 113.5 26.3278 113.5 29.0057V89.2264C113.5 90.8832 112.157 92.2263 110.5 92.2264H10.2062C7.53884 92.2262 6.1982 89.006 8.07725 87.1131L67.8712 26.8924C69.758 24.9921 73.0001 26.3278 73.0001 29.0057V62.5154L108.371 26.8924Z" fill="white" />
            <path
              d="M108.371 26.8924L112.629 31.1199L112.629 31.1199L108.371 26.8924ZM113.5 29.0057H119.5V29.0056L113.5 29.0057ZM110.5 92.2264V98.2264H110.5L110.5 92.2264ZM10.2062 92.2264L10.2059 98.2264H10.2062V92.2264ZM8.07725 87.1131L3.81955 82.8855L3.819 82.8861L8.07725 87.1131ZM67.8712 26.8924L72.1289 31.1199L72.1289 31.1199L67.8712 26.8924ZM73.0001 29.0057H79.0001V29.0056L73.0001 29.0057ZM73.0001 62.5154H67.0001V77.0737L77.2578 66.743L73.0001 62.5154ZM108.371 26.8924L112.629 31.1199C110.744 33.0187 107.5 31.6855 107.5 29.0057L113.5 29.0057L119.5 29.0056C119.5 20.9701 109.772 16.9655 104.113 22.6649L108.371 26.8924ZM113.5 29.0057H107.5V89.2264H113.5H119.5V29.0057H113.5ZM113.5 89.2264H107.5C107.5 87.5692 108.843 86.2264 110.5 86.2264L110.5 92.2264L110.5 98.2264C115.47 98.2262 119.5 94.1971 119.5 89.2264H113.5ZM110.5 92.2264V86.2264H10.2062V92.2264V98.2264H110.5V92.2264ZM10.2062 92.2264L10.2065 86.2264C12.8739 86.2265 14.2146 89.4471 12.3355 91.34L8.07725 87.1131L3.819 82.8861C-1.81818 88.565 2.20379 98.2259 10.2059 98.2264L10.2062 92.2264ZM8.07725 87.1131L12.335 91.3406L72.1289 31.1199L67.8712 26.8924L63.6135 22.6648L3.81955 82.8855L8.07725 87.1131ZM67.8712 26.8924L72.1289 31.1199C70.2435 33.0187 67.0001 31.6855 67.0001 29.0057L73.0001 29.0057L79.0001 29.0056C79 20.9701 69.2724 16.9655 63.6135 22.6649L67.8712 26.8924ZM73.0001 29.0057H67.0001V62.5154H73.0001H79.0001V29.0057H73.0001ZM73.0001 62.5154L77.2578 66.743L112.629 31.1199L108.371 26.8924L104.114 22.6648L68.7424 58.2879L73.0001 62.5154Z"
              fill="#67B9E4"
              mask="url(#path-3-outside-2_4006_2)"
            />
            <path
              d="M108.371 26.8924L112.629 31.1199L112.629 31.1199L108.371 26.8924ZM113.5 29.0057H119.5V29.0056L113.5 29.0057ZM110.5 92.2264V98.2264H110.5L110.5 92.2264ZM10.2062 92.2264L10.2059 98.2264H10.2062V92.2264ZM8.07725 87.1131L3.81955 82.8855L3.819 82.8861L8.07725 87.1131ZM67.8712 26.8924L72.1289 31.1199L72.1289 31.1199L67.8712 26.8924ZM73.0001 29.0057H79.0001V29.0056L73.0001 29.0057ZM73.0001 62.5154H67.0001V77.0737L77.2578 66.743L73.0001 62.5154ZM108.371 26.8924L112.629 31.1199C110.744 33.0187 107.5 31.6855 107.5 29.0057L113.5 29.0057L119.5 29.0056C119.5 20.9701 109.772 16.9655 104.113 22.6649L108.371 26.8924ZM113.5 29.0057H107.5V89.2264H113.5H119.5V29.0057H113.5ZM113.5 89.2264H107.5C107.5 87.5692 108.843 86.2264 110.5 86.2264L110.5 92.2264L110.5 98.2264C115.47 98.2262 119.5 94.1971 119.5 89.2264H113.5ZM110.5 92.2264V86.2264H10.2062V92.2264V98.2264H110.5V92.2264ZM10.2062 92.2264L10.2065 86.2264C12.8739 86.2265 14.2146 89.4471 12.3355 91.34L8.07725 87.1131L3.819 82.8861C-1.81818 88.565 2.20379 98.2259 10.2059 98.2264L10.2062 92.2264ZM8.07725 87.1131L12.335 91.3406L72.1289 31.1199L67.8712 26.8924L63.6135 22.6648L3.81955 82.8855L8.07725 87.1131ZM67.8712 26.8924L72.1289 31.1199C70.2435 33.0187 67.0001 31.6855 67.0001 29.0057L73.0001 29.0057L79.0001 29.0056C79 20.9701 69.2724 16.9655 63.6135 22.6649L67.8712 26.8924ZM73.0001 29.0057H67.0001V62.5154H73.0001H79.0001V29.0057H73.0001ZM73.0001 62.5154L77.2578 66.743L112.629 31.1199L108.371 26.8924L104.114 22.6648L68.7424 58.2879L73.0001 62.5154Z"
              fill="white"
              mask="url(#path-3-outside-2_4006_2)"
            />
            <path d="M73 89.5V29.2792C73 26.6014 69.7579 25.2652 67.8711 27.1655L8.07749 87.3862C6.19796 89.2792 7.53877 92.5 10.2063 92.5H70C71.6569 92.5 73 91.1569 73 89.5Z" fill="#0388D2" />
            <path d="M113.5 89.5V29.2792C113.5 26.6014 110.258 25.2652 108.371 27.1655L48.5775 87.3862C46.698 89.2792 48.0388 92.5 50.7063 92.5H110.5C112.157 92.5 113.5 91.1569 113.5 89.5Z" fill="#67B9E4" />
          </svg>
          <span>KanTan Marp Editor</span>
        </h1>
        <div className={styles.editorActions}>
          <Button onClick={onBackToPresentation}>
            プレゼン表示 (Esc)
          </Button>
          <Button onClick={onDownloadLite}>
            保存 (Ctrl+S)
          </Button>
        </div>
      </header>

      {errorMessage ? (
        <p className={`${styles.errorBox} error-box`}>{errorMessage}</p>
      ) : null}

      <section className={styles.editorGrid}>
        <article className={`${styles.panel} ${styles.editorPanel} panel`}>
          <div className={styles.editorPanelHeader}>
            <div className={styles.editorTabs}>
              <Button
                className={`${styles.tabButton}${editorTab === 'markdown' ? ' is-active' : ''}`}
                active={editorTab === 'markdown'}
                onClick={() => onSelectEditorTab('markdown')}
              >
                Markdown
              </Button>
              <Button
                className={`${styles.tabButton}${editorTab === 'css' ? ' is-active' : ''}`}
                active={editorTab === 'css'}
                onClick={() => onSelectEditorTab('css')}
              >
                CSS
              </Button>
            </div>
            <Button
              className={styles.attachmentToggleButton}
              onClick={onToggleAttachmentPane}
            >
              {showAttachmentPane
                ? '画像添付フォームを閉じる'
                : '画像添付フォームを表示'}
            </Button>
          </div>

          {editorTab === 'markdown' ? (
            <div className={styles.markdownEditorLayer}>
              <pre
                className={styles.markdownHighlight}
              >
                <code
                  ref={markdownHighlightContentRef}
                  className="hljs language-markdown"
                  // biome-ignore lint/security/noDangerouslySetInnerHtml: highlight.js returns escaped HTML for user input.
                  dangerouslySetInnerHTML={{
                    __html: highlightedMarkdown,
                  }}
                />
              </pre>
              <textarea
                ref={markdownTextareaRef}
                className={`${styles.editorMainTextarea} ${styles.markdownEditorTextarea} editor-main-textarea`}
                spellCheck={false}
                value={markdown}
                onChange={(event) => onChangeMarkdown(event.target.value)}
                onScroll={handleMarkdownScroll}
                onPaste={onPasteImage}
              />
            </div>
          ) : (
            <div className={styles.markdownEditorLayer}>
              <pre className={`${styles.markdownHighlight} ${styles.cssHighlight}`}>
                <code
                  ref={cssHighlightContentRef}
                  className="hljs language-css"
                  // biome-ignore lint/security/noDangerouslySetInnerHtml: highlight.js returns escaped HTML for user input.
                  dangerouslySetInnerHTML={{
                    __html: highlightedCss,
                  }}
                />
              </pre>
              <textarea
                className={`${styles.editorMainTextarea} ${styles.markdownEditorTextarea} editor-main-textarea`}
                spellCheck={false}
                value={userCss}
                onChange={(event) => onChangeUserCss(event.target.value)}
                onScroll={handleCssScroll}
              />
            </div>
          )}

          {showAttachmentPane ? (
            <section className={styles.attachmentDrawer}>
              <h2 className={styles.panelHeading}>画像添付フォーム</h2>
              <label className={styles.fileInput}>
                画像を選択
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  onChange={onAttachInputChange}
                />
              </label>
              <textarea
                className={`${styles.pasteZone} paste-zone`}
                spellCheck={false}
                readOnly
                value="ここをフォーカスして Ctrl+V で画像を貼り付け"
                onPaste={onPasteImage}
              />
              {attachments.length > 0 ? (
                <ul className={styles.attachmentList}>
                  {attachments.map((item) => (
                    <li key={item.id} className={styles.attachmentListItem}>
                      <span className={styles.attachmentName}>{item.name}</span>
                      <div className={styles.attachmentActions}>
                        <Button
                          size="small"
                          onClick={() => onInsertAttachmentToMarkdown(item.id)}
                        >
                          MDに挿入
                        </Button>
                        <Button
                          size="small"
                          onClick={() => onDownloadAttachment(item.id)}
                        >
                          ダウンロード
                        </Button>
                        <Button
                          size="small"
                          onClick={() => onDeleteAttachment(item.id)}
                        >
                          削除
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.attachmentEmpty}>
                  添付した画像名がここに表示されます
                </p>
              )}
            </section>
          ) : null}
        </article>

        <article className={`${styles.panel} ${styles.panelPreview} panel panel-preview`}>
          <h2 className={styles.panelHeading}>プレビュー</h2>
          <div
            className={`${styles.previewContent} preview-content marpit`}
            // biome-ignore lint/security/noDangerouslySetInnerHtml: Preview requires rendering Marp HTML string.
            dangerouslySetInnerHTML={{
              __html: previewSlidesHtml,
            }}
          />
        </article>
      </section>
    </main>
  );
};
