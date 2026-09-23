---
name: web-commands
description: pnpm build wrapper commands, dev server setup, and lint workflows for the Hunting & Fishing Store web frontend
---

## Package Manager

- Use **pnpm** exclusively — `pnpm-lock.yaml` is committed. Never use npm or yarn.

## Build and Run

- `pnpm install` — Installs dependencies.
- `pnpm dev` — Vite dev server; proxies `/api`, `/images`, `/brands`, `/uploads`, `/static` to `http://localhost:8080`.
- `pnpm typecheck` — Runs `tsc -b` (type-only check, produces no bundle).
- `pnpm build` — Runs `tsc -b && vite build`. The TypeScript typecheck is part of the build.
- `pnpm lint` — Runs `eslint .`.
- `pnpm preview` — Previews the production build.

## Testing

- **No test framework is configured.** Do not add or run tests.

## Backend Requirement

The home page fetches `/api/v1/*` (products, categories, brands, promotions) on mount. Without the backend running at `localhost:8080` the app renders an error state — a missing backend is not a frontend bug.

## Project Setup Workflow

1. Install dependencies: `pnpm install`
2. Start the dev server: `pnpm dev`
3. Verify types: `pnpm typecheck`
4. Verify the production bundle: `pnpm build`
5. Verify linting: `pnpm lint`