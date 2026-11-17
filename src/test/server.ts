import { setupServer } from 'msw/node';

/**
 * Mock Service Worker server for the Node test runner. It intercepts the real
 * `fetch` calls made by `apiClient`, so tests exercise the actual request and
 * error-handling code instead of a mocked `fetch`.
 *
 * Tests add handlers with `server.use(...)`; `setup.ts` resets them after each test.
 */
export const server = setupServer();
