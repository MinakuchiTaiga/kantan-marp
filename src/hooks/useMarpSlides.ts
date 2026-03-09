import { Marpit } from '@marp-team/marpit';
import { useMemo } from 'react';
import type { RenderedSlides } from '../types/presentation';

const marpit = new Marpit({
  inlineSVG: true,
  looseYAML: true,
  markdown: {
    breaks: true,
  },
});

export const useMarpSlides = (markdown: string): RenderedSlides =>
  useMemo(() => {
    try {
      const { html, css } = marpit.render(markdown, { htmlAsArray: true });
      const slides = Array.isArray(html) ? html : [html];

      return {
        slides,
        css,
        error: null,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';

      return {
        slides: [],
        css: '',
        error: `Marp render error: ${message}`,
      };
    }
  }, [markdown]);
