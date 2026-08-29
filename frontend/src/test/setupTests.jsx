import '@testing-library/jest-dom/vitest';
import { beforeEach, vi } from 'vitest';

let turnstileRenderCount = 0;

vi.mock('@marsidev/react-turnstile', () => ({
  Turnstile: ({ onSuccess }) => {
    turnstileRenderCount += 1;

    return (
    <button
      type="button"
      data-testid="turnstile"
      data-render-count={turnstileRenderCount}
      onClick={() => onSuccess?.('test-turnstile-token')}
    >
      Valider le captcha
    </button>
    );
  },
}));

beforeEach(() => {
  turnstileRenderCount = 0;
  localStorage.clear();
  vi.restoreAllMocks();
  window.gtag = vi.fn();
  window.matchMedia = vi.fn().mockReturnValue({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
  window.scrollTo = vi.fn();
  window.IntersectionObserver = vi.fn(function intersectionObserver() {
    return {
      observe: vi.fn(),
      disconnect: vi.fn(),
    };
  });
});
