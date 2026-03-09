import { Marpit } from '@marp-team/marpit';
import { useMemo } from 'react';
import { highlightCode } from '../lib/highlight';
import { applyLinkPolicy } from '../lib/linkPolicy';
import { minifyCss } from '../lib/minifyCss';
import type { RenderedSlides } from '../types/presentation';

const marpit = new Marpit({
  inlineSVG: true,
  looseYAML: true,
  markdown: {
    breaks: true,
    highlight: highlightCode,
  },
});

export const useMarpSlides = (markdown: string): RenderedSlides =>
  useMemo(() => {
    try {
      const { html, css } = marpit.render(markdown, { htmlAsArray: true });
      const slides = (Array.isArray(html) ? html : [html]).map(applyLinkPolicy);

      return {
        slides,
        css: minifyCss(css),
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
