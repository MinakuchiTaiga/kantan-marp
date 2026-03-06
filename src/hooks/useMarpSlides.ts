import { Marp } from '@marp-team/marp-core';
import { useMemo } from 'react';
import type { RenderedSlides } from '../types/presentation';

const marp = new Marp({
  html: false,
  script: false,
});

export const useMarpSlides = (markdown: string): RenderedSlides =>
  useMemo(() => {
    try {
      const { html, css } = marp.render(markdown, { htmlAsArray: true });
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
