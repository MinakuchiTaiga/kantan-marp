import { useEffect } from 'react';
import type { Mode } from '../types/presentation';

type UsePresentationShortcutsParams = {
  mode: Mode;
  onToggleMode: () => void;
  onNextSlide: () => void;
  onPreviousSlide: () => void;
  onFirstSlide: () => void;
  onLastSlide: () => void;
  onToggleLaser: () => void;
};

const NEXT_KEYS = new Set(['ArrowRight', 'ArrowDown', 'PageDown', ' ']);
const PREVIOUS_KEYS = new Set(['ArrowLeft', 'ArrowUp', 'PageUp']);

export const usePresentationShortcuts = ({
  mode,
  onToggleMode,
  onNextSlide,
  onPreviousSlide,
  onFirstSlide,
  onLastSlide,
  onToggleLaser,
}: UsePresentationShortcutsParams) => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onToggleMode();
        return;
      }

      if (mode !== 'presentation') return;

      if (event.ctrlKey && event.key.toLowerCase() === 'l') {
        event.preventDefault();
        onToggleLaser();
        return;
      }

      if (NEXT_KEYS.has(event.key)) {
        event.preventDefault();
        onNextSlide();
        return;
      }

      if (PREVIOUS_KEYS.has(event.key)) {
        event.preventDefault();
        onPreviousSlide();
        return;
      }

      if (event.key === 'Home') {
        event.preventDefault();
        onFirstSlide();
        return;
      }

      if (event.key === 'End') {
        event.preventDefault();
        onLastSlide();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    mode,
    onFirstSlide,
    onLastSlide,
    onNextSlide,
    onPreviousSlide,
    onToggleLaser,
    onToggleMode,
  ]);
};
