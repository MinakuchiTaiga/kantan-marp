import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import App from './App';

vi.mock('@marp-team/marp-core', () => {
  class MockMarp {
    render() {
      return {
        html: ['<section><h1>Mock Slide</h1></section>'],
        css: 'section { color: #000; }',
      };
    }
  }

  return { Marp: MockMarp };
});

describe('App', () => {
  it('starts in presentation mode', () => {
    render(<App />);
    expect(screen.getByText(/Esc: 編集モード/i)).toBeInTheDocument();
    expect(screen.getByTestId('slide-host')).toBeInTheDocument();
  });

  it('toggles to editor mode by Escape', () => {
    render(<App />);
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(
      screen.getByRole('heading', { name: /KanTan Marp Editor/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /軽量版を保存/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /セキュア版を保存/i }),
    ).toBeInTheDocument();
  });
});
