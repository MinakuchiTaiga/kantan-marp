export type Mode = 'editor' | 'presentation';

export type EditorTab = 'markdown' | 'css';

export type RenderedSlides = {
  slides: string[];
  css: string;
  error: string | null;
};
