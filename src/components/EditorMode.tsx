import type { EditorView } from '@codemirror/view';
import type { ComponentProps } from 'react';
import { githubLight } from '@uiw/codemirror-theme-github';
import CodeMirror from '@uiw/react-codemirror';
import type { EditorTab } from '../types/presentation';
import { Button } from './ui/Button';
import styles from './EditorMode.module.css';

type CodeMirrorExtensions = NonNullable<
  ComponentProps<typeof CodeMirror>['extensions']
>;

type AttachmentItem = {
  id: number;
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
  markdownExtensions: CodeMirrorExtensions;
  cssExtensions: CodeMirrorExtensions;
  onBackToPresentation: () => void;
  onDownloadLite: () => void;
  onChangeMarkdown: (value: string) => void;
  onChangeUserCss: (value: string) => void;
  onCreateMarkdownEditor: (view: EditorView) => void;
  onToggleAttachmentPane: () => void;
  onSelectEditorTab: (tab: EditorTab) => void;
  onAttachInputChange: (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => Promise<void>;
  onPasteImage: (event: React.ClipboardEvent<HTMLElement>) => Promise<void>;
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
  markdownExtensions,
  cssExtensions,
  onBackToPresentation,
  onDownloadLite,
  onChangeMarkdown,
  onChangeUserCss,
  onCreateMarkdownEditor,
  onToggleAttachmentPane,
  onSelectEditorTab,
  onAttachInputChange,
  onPasteImage,
}: EditorModeProps) => (
  <main className={`${styles.editorRoot} editor-root`} onPaste={onPasteImage}>
    <style>{`${renderedCss}\n${userCss}`}</style>
    <header className={styles.editorHeader}>
      <h1>KanTan Marp Editor</h1>
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
          <CodeMirror
            className={`${styles.editorMainTextarea} editor-main-textarea`}
            value={markdown}
            onChange={onChangeMarkdown}
            extensions={markdownExtensions}
            theme={githubLight}
            onCreateEditor={onCreateMarkdownEditor}
          />
        ) : (
          <CodeMirror
            className={`${styles.editorMainTextarea} editor-main-textarea`}
            value={userCss}
            onChange={onChangeUserCss}
            extensions={cssExtensions}
            theme={githubLight}
          />
        )}
        {showAttachmentPane ? (
          <section className={styles.attachmentDrawer}>
            <h2>画像添付フォーム</h2>
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
                  <li key={item.id}>{item.name}</li>
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
        <h2>プレビュー</h2>
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
