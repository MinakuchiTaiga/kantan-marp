import type { RefObject } from 'react';
import { Button } from './ui/Button';
import styles from './PresentationMode.module.css';

type PresentationModeProps = {
  renderedCss: string;
  userCss: string;
  slideHtml: string;
  slideHostRef: RefObject<HTMLDivElement | null>;
  presentationRootRef: RefObject<HTMLElement | null>;
  laserEnabled: boolean;
  laserVisible: boolean;
  laserPoint: { x: number; y: number };
  slideZoomScale: number;
  slideZoomOrigin: { x: number; y: number };
  isFullscreen: boolean;
  slideIndex: number;
  totalSlides: number;
  canPrevious: boolean;
  canNext: boolean;
  title: string;
  onToggleFullscreen: () => void;
  onToggleMode: () => void;
  onToggleLaser: () => void;
  onDownloadLite: () => void;
  onNextSlide: () => void;
  onPreviousSlide: () => void;
  onSeekSlide: (ratio: number) => void;
  onLaserMove: (event: React.MouseEvent<HTMLDivElement>) => void;
  onLaserLeave: () => void;
};

export const PresentationMode = ({
  renderedCss,
  userCss,
  slideHtml,
  slideHostRef,
  presentationRootRef,
  laserEnabled,
  laserVisible,
  laserPoint,
  slideZoomScale,
  slideZoomOrigin,
  isFullscreen,
  slideIndex,
  totalSlides,
  canPrevious,
  canNext,
  title,
  onToggleFullscreen,
  onToggleMode,
  onToggleLaser,
  onDownloadLite,
  onNextSlide,
  onPreviousSlide,
  onSeekSlide,
  onLaserMove,
  onLaserLeave,
}: PresentationModeProps) => {
  const progress = ((slideIndex + 1) / totalSlides) * 100;

  return (
    <main
      className={`${styles.presentationRoot} presentation-root`}
      ref={presentationRootRef}
    >
      <style>{`${renderedCss}\n${userCss}`}</style>
      <header className={styles.presentationTitleBar}>
        <h1 className={styles.presentationTitle}>{title}</h1>
      </header>
      <section className={styles.presentationStage}>
        {/* biome-ignore lint/a11y/noStaticElementInteractions: Mouse tracking is required for laser pointer overlay. */}
        <div
          className={`${styles.slideFrame}${laserEnabled ? ` ${styles.laserActive} laser-active` : ''}`}
          role="presentation"
          onMouseMove={onLaserMove}
          onMouseLeave={onLaserLeave}
        >
          <button
            type="button"
            aria-label="前のスライドへ移動"
            className={styles.navZonePrev}
            disabled={!canPrevious}
            onMouseDown={(event) => event.preventDefault()}
            onClick={onPreviousSlide}
          />
          <button
            type="button"
            aria-label="次のスライドへ移動"
            className={styles.navZoneNext}
            disabled={!canNext}
            onMouseDown={(event) => event.preventDefault()}
            onClick={onNextSlide}
          />
          <div
            ref={slideHostRef}
            className={`${styles.slideHost} slide-host marpit`}
            data-testid="slide-host"
            style={{
              transform: `scale(${slideZoomScale})`,
              transformOrigin: `${slideZoomOrigin.x}% ${slideZoomOrigin.y}%`,
            }}
            // biome-ignore lint/security/noDangerouslySetInnerHtml: Marp render output must be applied as slide HTML.
            dangerouslySetInnerHTML={{
              __html: slideHtml,
            }}
          />
          {laserEnabled && laserVisible ? (
            <div
              className={styles.laserPointer}
              style={{
                left: `${laserPoint.x}%`,
                top: `${laserPoint.y}%`,
              }}
            />
          ) : null}
        </div>
      </section>
      <footer className={styles.presentationHud}>
        <span className={styles.presentationNavControls}>
          <Button
            className="presentation-fullscreen-button"
            onClick={onPreviousSlide}
            aria-label="前のスライドへ移動"
            title="前のスライドへ移動"
            disabled={!canPrevious}
          >
            <span className={styles.triangleLeft} aria-hidden="true" />
          </Button>
          <Button
            className="presentation-fullscreen-button"
            onClick={onNextSlide}
            aria-label="次のスライドへ移動"
            title="次のスライドへ移動"
            disabled={!canNext}
          >
            <span className={styles.triangleRight} aria-hidden="true" />
          </Button>
          {slideIndex + 1} / {totalSlides}
        </span>
        <span className={styles.presentationControls}>
          <Button className="presentation-fullscreen-button" onClick={onToggleMode}>
            編集モード (Esc)
          </Button>
          <Button
            className="presentation-fullscreen-button"
            onClick={onToggleLaser}
          >
            レーザー {laserEnabled ? 'OFF' : 'ON'} (Ctrl+L)
          </Button>
          <Button
            className="presentation-fullscreen-button"
            onClick={onDownloadLite}
          >
            保存 (Ctrl+S)
          </Button>
          <Button
            className="presentation-fullscreen-button"
            onClick={onToggleFullscreen}
          >
            {isFullscreen ? '全画面解除 (F)' : '全画面表示 (F)'}
          </Button>
        </span>
      </footer>
      {!isFullscreen ? (
        <div
          className={styles.presentationProgress}
          aria-hidden="true"
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            if (rect.width <= 0) return;

            const ratio = (event.clientX - rect.left) / rect.width;
            onSeekSlide(ratio);
          }}
        >
          <div
            className={`${styles.presentationProgressFill} presentation-progress-fill`}
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : null}
    </main>
  );
};
