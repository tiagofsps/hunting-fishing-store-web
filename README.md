# Wild Life — Hunting & Fishing Store (Web Frontend)

Storefront SPA for the Hunting & Fishing Store: React 19 + TypeScript + Vite, Tailwind CSS v4, feature-driven architecture. The backend is a separate Spring Boot REST service.

## Commands (pnpm only)

- `pnpm dev` — Vite dev server; proxies `/api`, `/images`, `/brands`, `/uploads`, `/static` to `http://localhost:8080`
- `pnpm build` — `tsc -b && vite build` (typecheck is part of build)
- `pnpm lint` — `eslint .`
- No test framework is configured; do not add or run tests.

## Backend requirement

The home page fetches `/api/v1/*` (products, categories, brands, promotions) on mount. Without a backend at `localhost:8080` the app renders an error state — a missing backend is not a frontend bug.

## Architecture

Follow `docs/architecture/frontend-structure.md` for structure and conventions.

- `src/features/<kebab-case>/` owns `types.ts`, `validation.ts`, `hooks.ts`, `utils.ts`, `api.ts`, and `components/`. Features never import each other; `src/architecture.test.ts` enforces this. Shared session and cart state lives in `src/providers/`.
- Shared UI lives in `src/components/`. Use PascalCase filenames (`CartDrawer.tsx`) for new files.
- Shared domain types live in `src/types.ts`; shared helpers in `src/utils.ts`; the authenticated fetch wrapper in `src/lib/apiClient.ts`.

## Conventions / gotchas

- `tsconfig.app.json` sets `verbatimModuleSyntax`: type-only imports must use `import type`. `erasableSyntaxOnly`: no enums or namespaces — use union types / const objects.
- All UI text goes through `useLanguage().t('feature.key')`. Each feature with UI text has a locale file `src/i18n/locales/<feature>.ts` exporting both `en` and `pt`, registered in `src/i18n/translations.ts`. No new hardcoded user-facing strings.
- Forms use react-hook-form + zod (v4) + @hookform/resolvers. Schemas live in the feature's `validation.ts`, exporting the schema and its `z.infer` type suffixed `FormData`.
- Tailwind v4 theme tokens are defined via `@theme` in `src/index.css`. Use the semantic tokens (`bg-surface`, `text-ink`, `border-accent-strong`, `text-sale`, …) instead of raw palette colors.

## Features

- **Home page** — catalog (products, categories, brands, promotions) fetched from `/api/v1`, search + category filtering, quick view modal, newsletter signup.
- **Auth** — login / register / forgot password against `/api/v1/auth`, session restored from the access token, refresh handled by `apiClient`.
- **Cart** — hybrid cart: localStorage for guests, best-effort server sync (`/api/v1/carts`) when logged in.
- **Checkout** — requires login; address selection/creation, license verification for regulated items, payment initiation (MB WAY / Multibanco / Credit Card / Klarna) against `/api/v1/orders` and `/api/v1/payments`.