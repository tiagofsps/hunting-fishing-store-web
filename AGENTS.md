# AGENTS.md

Storefront SPA: React 19 + TypeScript + Vite, Tailwind CSS v4, feature-driven. The backend is a separate REST service.

## Commands (pnpm only — `pnpm-lock.yaml` is committed)

- `pnpm dev` — Vite dev server; proxies `/api`, `/images`, `/brands`, `/uploads`, `/static` to `http://localhost:8080`
- `pnpm build` — `tsc -b && vite build` (typecheck is part of build)
- `pnpm lint` — `eslint .`
- No test framework is configured; do not add or run tests.

## Backend requirement

The home page fetches `/api/v1/*` (products, categories, brands, promotions) on mount. Without a backend at `localhost:8080` the app renders an error state — a missing backend is not a frontend bug.

## Architecture

Follow `docs/architecture/frontend-structure.md` for structure and conventions.

- `src/features/<kebab-case>/` owns `types.ts`, `validation.ts`, `hooks.ts`, `utils.ts`, `api.ts`, and `components/`. Features never import each other; `src/architecture.test.ts` fails the build if they do.
- Shared session and cart state lives in `src/providers/` (`AuthProvider`, `CartProvider`, `useAuth()`, `useCart()`). Features consume it from there. Providers may import a feature's `api`, `validation` and `types` modules only, never its components or hooks.
- Shared domain types live in `src/types.ts`; shared UI in `src/components/` (form atoms in `src/components/ui/`).
- Shared UI lives in `src/components/`. `navbar.tsx` and `footer.tsx` are legacy lowercase names; use PascalCase (`CartDrawer.tsx`) for new files.

## Conventions / gotchas

- `tsconfig.app.json` sets `verbatimModuleSyntax`: type-only imports must use `import type`. `erasableSyntaxOnly`: no enums or namespaces — use union types / const objects.
- All UI text goes through `useLanguage().t('feature.key')`. Each feature with UI text has a locale file `src/i18n/locales/<feature>.ts` exporting both `en` and `pt`, registered in `src/i18n/translations.ts`. No new hardcoded user-facing strings.
- Forms use react-hook-form + zod (v4) + @hookform/resolvers. Schemas live in the feature's `validation.ts`, exporting the schema and its `z.infer` type suffixed `FormData`.
- Tailwind v4 theme tokens are defined via `@theme` in `src/index.css`. Use the semantic tokens (`bg-surface`, `text-ink`, `border-accent-strong`, `text-sale`, …) instead of raw palette colors.