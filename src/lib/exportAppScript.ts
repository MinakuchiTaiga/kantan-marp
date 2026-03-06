export const appScript = `(() => {
  const stateEl = document.getElementById('kantan-state');
  if (!stateEl || !stateEl.textContent) return;

  const state = JSON.parse(stateEl.textContent);
  const modeHintEl = document.getElementById('mode-hint');
  const presentationEl = document.getElementById('presentation');
  const slideHostEl = document.getElementById('slide-host');
  const pageEl = document.getElementById('page-number');
  const editorEl = document.getElementById('editor');
  const cssEditorEl = document.getElementById('css-editor');
  const userStyleEl = document.getElementById('user-style');
  const saveButtonEl = document.getElementById('save-html');

  let mode = 'presentation';
  let currentSlide = 0;

  const updateUserCss = () => {
    if (!cssEditorEl || !userStyleEl) return;
    userStyleEl.textContent = cssEditorEl.value;
  };

  const renderSlide = () => {
    if (!slideHostEl || !pageEl) return;

    const slides = Array.isArray(state.slides) ? state.slides : [];
    const total = Math.max(slides.length, 1);
    const index = Math.min(Math.max(currentSlide, 0), total - 1);
    currentSlide = index;

    slideHostEl.innerHTML = slides[index] || '';
    pageEl.textContent = String(index + 1) + ' / ' + String(total);
  };

  const setMode = (nextMode) => {
    mode = nextMode;
    const presenting = mode === 'presentation';

    if (presentationEl) presentationEl.hidden = !presenting;
    if (editorEl) editorEl.hidden = presenting;
    if (modeHintEl) {
      modeHintEl.textContent = presenting
        ? 'Esc: 編集モード'
        : 'Esc: プレゼンモード';
    }
  };

  if (cssEditorEl) {
    cssEditorEl.value = state.css || '';
    cssEditorEl.addEventListener('input', updateUserCss);
  }

  updateUserCss();
  renderSlide();
  setMode('presentation');

  const downloadText = (text, fileName) => {
    const blob = new Blob([text], { type: 'text/html;charset=utf-8' });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = fileName || 'kantan-marp-lite.html';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  };

  const inferFileName = () => {
    const pathname = window.location.pathname || '';
    const last = pathname.split('/').pop();
    return last && last.endsWith('.html') ? last : 'kantan-marp-lite.html';
  };

  const saveSelfHtml = async () => {
    try {
      const response = await fetch(window.location.href, { cache: 'no-store' });
      if (!response.ok) throw new Error('fetch failed');
      const text = await response.text();
      downloadText(text, inferFileName());
    } catch {
      const fallback = '<!doctype html>\\n' + document.documentElement.outerHTML;
      downloadText(fallback, inferFileName());
    }
  };

  if (saveButtonEl) {
    saveButtonEl.addEventListener('click', saveSelfHtml);
  }

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      setMode(mode === 'presentation' ? 'editor' : 'presentation');
      return;
    }

    if (mode !== 'presentation') return;

    const total = Math.max((state.slides || []).length, 1);
    const next = () => {
      currentSlide = Math.min(currentSlide + 1, total - 1);
      renderSlide();
    };
    const prev = () => {
      currentSlide = Math.max(currentSlide - 1, 0);
      renderSlide();
    };

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown' || event.key === 'PageDown' || event.key === ' ') {
      event.preventDefault();
      next();
      return;
    }

    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp' || event.key === 'PageUp') {
      event.preventDefault();
      prev();
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      currentSlide = 0;
      renderSlide();
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      currentSlide = total - 1;
      renderSlide();
    }
  });
})();`;
