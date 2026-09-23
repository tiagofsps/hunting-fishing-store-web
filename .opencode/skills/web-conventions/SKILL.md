---
name: web-conventions
description: Coding standards, feature organization, form validation, i18n and Tailwind conventions for the Hunting & Fishing Store web frontend
---

## Code Style & Formatting

- Prettier-free: follow the existing formatting in the codebase (2-space indent, single quotes).
- Component files use PascalCase (`CartDrawer.tsx`). `navbar.tsx` and `footer.tsx` are legacy lowercase names — do not rename them; use PascalCase for all new files.

## Architecture & Package Conventions

- Feature-driven layout under `src/features/<kebab-case>/` owning:
  - `types.ts` — shared domain types for the feature
  - `validation.ts` — zod v4 schemas + inferred `FormData` types
  - `hooks.ts` — data-fetching and state hooks
  - `utils.ts` — pure helper functions
  - `api.ts` — typed fetch wrappers against `/api/v1`
  - `components/` — React components for the feature
- Features must NOT import each other; wire them together via `App.tsx` props/callbacks. (Known exception: `src/features/checkout/types.ts` imports `CartItem` from `../home-page/types`.)
- Shared UI lives in `src/components/`.

## i18n Conventions

- All user-facing text goes through `useLanguage().t('feature.key')`.
- Each feature with UI text has a locale file `src/i18n/locales/<feature>.ts` exporting both `en` and `pt`, registered in `src/i18n/translations.ts`.
- No new hardcoded user-facing strings.

## Form Validation Conventions

- Forms use react-hook-form + zod (v4) + `@hookform/resolvers`.
- Schemas live in the feature's `validation.ts`, exporting the schema and its `z.infer` type suffixed `FormData`.

## TypeScript Conventions

- `tsconfig.app.json` sets `verbatimModuleSyntax`: type-only imports MUST use `import type`.
- `erasableSyntaxOnly`: no enums or namespaces — use union types / const objects.
- Avoid `any`; type API responses from the feature's `types.ts`.

## Styling Conventions

- Tailwind CSS v4. Theme tokens are defined via `@theme` in `src/index.css`.
- Use semantic tokens only (`bg-surface`, `bg-surface-raised`, `text-ink`, `text-body`, `text-muted`, `border-border`, `border-accent-strong`, `text-accent`, `text-accent-strong`, `text-sale`, `bg-ink`, `text-white`) — never raw palette hex values.

## Commands & Testing Rules

- pnpm only (never npm/yarn).
- `pnpm typecheck` runs `tsc -b` (type-only check, no bundle).
- `pnpm build` runs `tsc -b` (typecheck) plus the Vite bundle.
- `pnpm lint` runs eslint.
- No test framework is configured; do not add or run tests.