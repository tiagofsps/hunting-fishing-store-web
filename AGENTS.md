# AGENTS.md

**Wild Life** storefront — *Hunting & Fishing Store*. React 19 + TypeScript +
Vite, Tailwind CSS v4, feature-driven. The backend is a separate Spring Boot REST
service.

## Commands (pnpm only — `pnpm-lock.yaml` is committed)

- `pnpm dev` — Vite dev server; proxies `/api`, `/images`, `/brands`, `/uploads`, `/static` to `http://localhost:8080`
- `pnpm build` — `tsc -b && vite build` (typecheck is part of build)
- `pnpm typecheck` — `tsc -b` across the app, test and node projects
- `pnpm lint` — `eslint .`
- `pnpm test` — Vitest once; `pnpm test:watch` while developing
- `pnpm test:coverage` — enforces 90% lines/statements and 80% branches

Tests use Testing Library and MSW. Never call a live backend from a test: add an
MSW handler instead. See [docs/testing.md](docs/testing.md).

## Backend requirement

The app fetches `/api/v1/*` (products, categories, brands, promotions, auth, cart,
orders, admin) from the Spring Boot API at `localhost:8080`. Without it the pages
render their error states — a missing backend is not a frontend bug.

## Architecture

Follow `docs/architecture/frontend-structure.md` for structure and conventions.

- `src/features/<kebab-case>/` owns `types.ts`, `validation.ts`, `hooks.ts`, `utils.ts`, `api.ts`, and `components/`. Features never import each other; `src/architecture.test.ts` fails the build if they do.
- Shared session and cart state lives in `src/providers/` (`AuthProvider`, `CartProvider`, `useAuth()`, `useCart()`). Providers may import a feature's `api`, `validation` and `types` modules only — never its components or hooks.
- Shared UI lives in `src/components/`; form atoms and the spinner are in `src/components/ui/` with their classes in `ui/styles.ts`.
- Shared domain types live in `src/types.ts`; shared helpers in `src/utils.ts`; the authenticated fetch wrapper in `src/lib/apiClient.ts`.

## Conventions / gotchas

- `tsconfig.app.json` sets `verbatimModuleSyntax`: type-only imports must use `import type`. `erasableSyntaxOnly`: no enums or namespaces — use union types / const objects.
- Test files are typechecked by `tsconfig.test.json` (it includes Node types for the architecture test); the app project excludes them.
- All UI text goes through `useLanguage().t('feature.key')`. Each feature with UI text has a locale file `src/i18n/locales/<feature>.ts` exporting both `en` and `pt`, registered in `src/i18n/translations.ts`. No new hardcoded user-facing strings; `src/i18n/translations.test.ts` checks that both languages stay in sync.
- Forms use react-hook-form + zod (v4) + @hookform/resolvers. Schemas live in the feature's `validation.ts`, exporting the schema and its `z.infer` type suffixed `FormData`.
- Optional numeric inputs must use `setValueAs: toOptionalNumber` (admin utils). A blank field otherwise becomes `NaN`, which fails the optional schema silently and blocks the submit.
- Every form label must be associated with its input (`htmlFor`/`id`); tests query fields by accessible name.
- Tailwind v4 theme tokens are defined via `@theme` in `src/index.css`. Use the semantic tokens (`bg-surface`, `text-ink`, `border-accent-strong`, `text-sale`, …) instead of raw palette colors.

## Features

- **Home page** — hero, featured carousel, brands, newsletter signup, quick view.
- **Catalog** — shop with URL-backed search, filters, sorting and pagination; product detail with variants and licence notices.
- **Auth** — login / register / forgot password; session restored from the stored token, refresh handled by `apiClient`.
- **Cart** — hybrid cart: localStorage for guests, server sync (`/api/v1/carts`) when signed in.
- **Checkout** — address selection, licence verification for regulated items, payment initiation (MB WAY / Multibanco / Credit Card / Klarna).
- **Account and orders** — profile, address book, password change, order history.
- **Admin** — dashboard, products, categories, brands, stock, orders, coupons, promotions, newsletter, users.
