import { useEffect, useRef } from 'react';
import type { Mode } from '../types/presentation';

type UsePresentationShortcutsParams = {
  mode: Mode;
  onToggleMode: () => void;
  onToggleFullscreen: () => void;
  onNextSlide: () => void;
  onPreviousSlide: () => void;
  onFirstSlide: () => void;
  onLastSlide: () => void;
  onToggleLaser: () => void;
};

const NEXT_KEYS = new Set(['ArrowRight', 'ArrowDown', 'PageDown', ' ']);
const PREVIOUS_KEYS = new Set(['ArrowLeft', 'ArrowUp', 'PageUp']);
const WHEEL_TRIGGER_THRESHOLD = 80;
const WHEEL_COOLDOWN_MS = 280;

export const usePresentationShortcuts = ({
  mode,
  onToggleMode,
  onToggleFullscreen,
  onNextSlide,
  onPreviousSlide,
  onFirstSlide,
  onLastSlide,
  onToggleLaser,
}: UsePresentationShortcutsParams) => {
  const wheelDeltaRef = useRef(0);
  const wheelResetTimerRef = useRef<number | null>(null);
  const wheelLastTriggeredAtRef = useRef(0);
  const wheelLastDirectionRef = useRef<1 | -1 | 0>(0);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onToggleMode();
        return;
      }

      if (mode !== 'presentation') return;

      if (!event.repeat && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        onToggleFullscreen();
        return;
      }

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
    onToggleFullscreen,
    onToggleLaser,
    onToggleMode,
  ]);

  useEffect(() => {
    const resetWheelDelta = () => {
      wheelDeltaRef.current = 0;
      if (wheelResetTimerRef.current !== null) {
        window.clearTimeout(wheelResetTimerRef.current);
        wheelResetTimerRef.current = null;
      }
    };

    const onWheel = (event: WheelEvent) => {
      if (mode !== 'presentation') return;
      if (event.ctrlKey) return;

      const lineHeight = 16;
      const pageHeight = window.innerHeight || 1;
      const deltaMultiplier =
        event.deltaMode === 1 ? lineHeight : event.deltaMode === 2 ? pageHeight : 1;
      const deltaY = event.deltaY * deltaMultiplier;

      if (Math.abs(deltaY) < Math.abs(event.deltaX)) return;

      event.preventDefault();
      wheelDeltaRef.current += deltaY;

      if (wheelResetTimerRef.current !== null) {
        window.clearTimeout(wheelResetTimerRef.current);
      }
      wheelResetTimerRef.current = window.setTimeout(resetWheelDelta, 180);

      if (Math.abs(wheelDeltaRef.current) < WHEEL_TRIGGER_THRESHOLD) return;

      const nextDirection: 1 | -1 = wheelDeltaRef.current > 0 ? 1 : -1;

      const now = Date.now();
      if (
        now - wheelLastTriggeredAtRef.current < WHEEL_COOLDOWN_MS &&
        wheelLastDirectionRef.current === nextDirection
      ) {
        return;
      }

      if (nextDirection > 0) {
        onNextSlide();
      } else {
        onPreviousSlide();
      }

      wheelLastTriggeredAtRef.current = now;
      wheelLastDirectionRef.current = nextDirection;
      resetWheelDelta();
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      window.removeEventListener('wheel', onWheel);
      if (wheelResetTimerRef.current !== null) {
        window.clearTimeout(wheelResetTimerRef.current);
      }
    };
  }, [mode, onNextSlide, onPreviousSlide]);
};
