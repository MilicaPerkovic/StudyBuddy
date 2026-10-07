import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Node 25+ has its own global `localStorage` (undefined without --localstorage-file)
// that shadows jsdom's. Use jsdom's implementation in tests.
if (globalThis.jsdom) {
  Object.defineProperty(globalThis, 'localStorage', {
    value: globalThis.jsdom.window.localStorage,
    configurable: true,
  });
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});
