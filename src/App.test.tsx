import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import App from './App';

vi.mock('@marp-team/marpit', () => {
  class MockMarpit {
    render() {
      return {
        html: ['<section><h1>Mock Slide</h1></section>'],
        css: 'section { color: #000; }',
      };
    }
  }

  return { Marpit: MockMarpit, default: MockMarpit };
});

describe('App', () => {
  it('starts in presentation mode', () => {
    render(<App />);
    expect(
      screen.getByRole('button', { name: /編集モード \(Esc\)/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('slide-host')).toBeInTheDocument();
  });

  it('toggles to editor mode by Escape', async () => {
    render(<App />);
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(await screen.findByRole('heading', { name: /KanTan Marp Editor/i }))
      .toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /保存 \(Ctrl\+S\)/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /セキュア版を保存/i }),
    ).not.toBeInTheDocument();
  });
});
