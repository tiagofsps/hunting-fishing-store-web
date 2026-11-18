# Testing Guide

How the Wild Life storefront test suite is organised, and how to add to it.

## Overview

- **Vitest** runs the tests, reusing `vite.config.ts` through `vitest.config.ts`.
- **jsdom** provides the DOM.
- **Testing Library** (`react`, `user-event`, `jest-dom`) drives the UI the way a
  user would.
- **MSW** intercepts `fetch` at the network layer, so tests exercise the real
  `apiClient`, hooks and providers instead of mocking them.

No live backend is needed: every request is answered by a handler.

## Commands

```bash
pnpm test            # run the suite once
pnpm test:watch      # watch mode while developing
pnpm test:coverage   # run with coverage and enforce the thresholds
pnpm typecheck       # tsc -b across app, test and node projects
pnpm lint            # eslint
```

## Layers

| Layer | What it covers | Example |
|---|---|---|
| Pure units | formatters, mappers, zod schemas, cart arithmetic | `src/utils.test.ts` |
| API contract | method, path, query and body of each request | `src/features/admin/api.test.ts` |
| Hooks and providers | loading, error, retry, session and cart behaviour | `src/providers/useCart.test.tsx` |
| Components | one screen or widget, driven by user events | `src/components/CartDrawer.test.tsx` |
| Routed flows | several screens through the real router and providers | `src/features/checkout/checkout-flow.test.tsx` |
| Architecture | dependency rules between folders | `src/architecture.test.ts` |

## Test harness

- `src/test/setup.ts` fails any request without a handler, resets handlers and
  clears storage between tests, and unmounts the React tree.
- `src/test/server.ts` is the shared MSW server.
- `src/test/recorder.ts` records requests and replies with a canned response, for
  contract assertions.
- `src/test/renderWithProviders.tsx` renders with the language provider, a memory
  router, an optional route pattern and an optional real auth provider.
- `src/test/storeProviders.tsx` adds the full app provider stack (auth, cart,
  overlays) for page-level tests.

## Conventions

- Query by role, label or accessible name; avoid CSS selectors and snapshots.
- Assert on behaviour the user can observe, and on the requests that leave the
  app. A contract test should fail if the method, path or body changes.
- Prefer MSW over mocking modules. Stub browser APIs only when jsdom lacks them
  (`URL.createObjectURL`, `window.confirm`, `scrollBy`).
- Set `app_lang` in `localStorage` when a test depends on copy; otherwise the
  suite may run in Portuguese from a previous test.
- Keep high-level flow tests few and stable; the fine-grained coverage belongs in
  the unit, API and component layers.

## Coverage

`pnpm test:coverage` enforces **90% lines and statements** and **80% branches**.
Entry points (`main.tsx`), type declarations and the test harness are excluded;
business components and hooks are not.

When adding a feature, cover the logic with units, the request with a contract
test, the hook with a provider test, and the screen with a component test. If a
large component becomes hard to test, extract a hook or a smaller component
rather than excluding it from coverage.

## Architecture test

`src/architecture.test.ts` scans relative imports and fails when:

- a feature imports another feature (shared state belongs in `src/providers/`);
- a provider imports a feature's components or hooks (only `api`, `validation`
  and `types` are allowed).
