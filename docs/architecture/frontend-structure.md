# Frontend Architecture — Folder Structure Guide

This document describes the conventions, responsibilities, and rules for organising source code in the `src/` directory of the storefront.

---

## Overview

The project follows a **feature-driven architecture**. Code is separated into two layers:

1. **Global layer** — code shared across the entire application (layout, shared hooks, shared utilities).
2. **Feature layer** — self-contained modules under `src/features/<feature-name>/`, each owning its own types, logic, and UI.

```
src/
├── components/          ← Global UI components (Navbar, Footer, CartDrawer…)
├── config/              ← Application-wide constants (STORE_CONFIG)
├── features/            ← Feature modules (home-page, checkout, pdp, auth…)
│   └── <feature-name>/
│       ├── types.ts
│       ├── validation.ts
│       ├── hooks.ts
│       ├── utils.ts
│       └── components/
├── providers/           ← App-wide session and cart state (useAuth, useCart)
├── i18n/                ← Internationalisation (language context + locale files)
│   ├── LanguageContext.tsx
│   ├── translations.ts  ← Index aggregator
│   └── locales/         ← One file per feature (common.ts, home.ts, checkout.ts…)
├── types.ts             ← Global shared TypeScript types
├── hooks.ts             ← Global shared React hooks
├── validation.ts        ← Global shared Zod schemas
├── utils.ts             ← Global shared utility functions
├── App.tsx              ← Root component, wires features together
└── main.tsx             ← React entry point
```

---

## Global Layer

Global files are for code that is **used by more than one feature** and does not belong to any single feature domain.

### `src/providers/`

State that every feature needs and that no single feature owns: the signed-in
user (`AuthProvider`, `useAuth()`) and the hybrid guest/server cart
(`CartProvider`, `useCart()`). `Layout.tsx` composes them around the routes.

**Dependency rules (enforced by `src/architecture.test.ts`):**
- A provider may import a feature's `api.ts`, `validation.ts` and `types.ts`.
  It must not import a feature's components or hooks.
- Features import `useAuth` and `useCart` from here. A feature never imports
  another feature.

Before this layer existed, `checkout`, `account`, `orders`, `cart`, `catalog`,
`home-page` and `product-detail` imported the auth and cart hooks from each
other's directories. Moving them here removed all nine cross-feature imports.

### `src/components/`

Reusable UI components consumed across multiple features.

**Rules:**
- One component per file.
- No business logic tied to a single feature.
- May consume global hooks and global utilities.

**Examples:**

```
src/components/
├── Navbar.tsx       ← Top navigation bar, language toggle, cart button
├── Footer.tsx       ← Site footer with store info and social links
├── CartDrawer.tsx   ← Slide-out cart panel (used globally from App.tsx)
└── icons/
    └── CategoryIcon.tsx
```

---

### `src/types.ts`

Shared TypeScript interfaces and type aliases that are referenced by **more than one feature**.

**Rules:**
- Only define types here when two or more features depend on the same shape.
- Feature-specific types belong in `src/features/<feature-name>/types.ts`.

**Example contents:**

```ts
// Shared pagination envelope used by multiple API responses
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
}
```

---

### `src/hooks.ts`

Global React hooks consumed by more than one feature or by `App.tsx` directly.

**Rules:**
- Feature-specific hooks go in `src/features/<feature-name>/hooks.ts`.
- Only truly shared concerns (e.g. `useMediaQuery`, `useScrollLock`) belong here.

---

### `src/validation.ts`

Global Zod schemas for forms or data shapes shared across multiple features.

**Rules:**
- Feature-specific schemas (e.g. review form, shipping form) belong in the feature's `validation.ts`.
- Only schemas used in two or more features live here.

**Example contents:**

```ts
import { z } from 'zod';

// Reused by newsletter (home-page) and any future account settings form
export const emailSchema = z.string().email('Please enter a valid email address');
```

---

### `src/utils.ts`

Pure utility functions with no React or feature-specific dependencies.

**Rules:**
- Feature-specific utilities (e.g. `formatCurrency`, `getProductPrice`) go in the feature's `utils.ts`.
- Only generic helpers used in two or more features live here.

**Example contents:**

```ts
// Generic date formatter used by orders, reviews, and account pages
export function formatDate(isoString: string, locale = 'pt-PT'): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(isoString));
}
```

---

## Feature Layer

Each directory under `src/features/` is a **self-contained module** that owns its own types, validation, hooks, utilities, and components. Features communicate upward via props or callbacks defined in `App.tsx` — they do **not** import directly from each other.

```
src/features/<feature-name>/
├── types.ts        ← TypeScript interfaces specific to this feature
├── validation.ts   ← Zod schemas for this feature's forms
├── hooks.ts        ← React hooks specific to this feature
├── utils.ts        ← Pure helper functions for this feature
├── api.ts          ← API call functions (fetch wrappers) for this feature
└── components/     ← React components (one component per file)
```

---

### `types.ts`

All TypeScript interfaces, type aliases, and enums that are **only relevant to this feature**.

```ts
// src/features/pdp/types.ts
export interface ProductReview {
  id: string;
  author: string;
  rating: number; // 1–5
  date: string;   // ISO 8601
  title: string;
  comment: string;
  verifiedPurchase: boolean;
}

export type PDPTab = 'overview' | 'specs' | 'reviews';
```

---

### `validation.ts`

Zod schemas that validate forms **within this feature**. Always export both the schema and the inferred TypeScript type.

```ts
// src/features/pdp/validation.ts
import { z } from 'zod';

export const reviewSchema = z.object({
  author:  z.string().min(2, 'Name must be at least 2 characters'),
  rating:  z.number().int().min(1).max(5),
  title:   z.string().min(3, 'Title must be at least 3 characters'),
  comment: z.string().min(10, 'Comment must be at least 10 characters'),
});

export type ReviewFormData = z.infer<typeof reviewSchema>;
```

**Usage pattern inside a component:**

```ts
const result = reviewSchema.safeParse(formData);
if (!result.success) {
  const errors = result.error.flatten().fieldErrors;
  // errors.author, errors.rating, etc.
}
```

---

### `hooks.ts`

Custom React hooks that encapsulate stateful logic belonging to this feature. Each hook should have a single, clear responsibility.

```ts
// src/features/pdp/hooks.ts
export function useWishlist() { ... }
export function useProductReviews(productId: number) { ... }
export function useImageLightbox(images: string[]) { ... }
```

**Rules:**
- A hook may call other hooks.
- A hook may import from the same feature's `utils.ts`, `types.ts`, or `api.ts`.
- A hook must **not** import from another feature's files.

---

### `utils.ts`

Pure functions (no React, no hooks, no side effects) that compute or format data specific to this feature.

```ts
// src/features/pdp/utils.ts
export function calculateAverageRating(reviews: ProductReview[]): number { ... }
export function getRatingDistribution(reviews: ProductReview[]): Record<number, number> { ... }
```

---

### `api.ts`

Functions that call the backend REST API. Each function maps to one API endpoint.

```ts
// src/features/checkout/api.ts
export async function submitOrder(payload: OrderPayload, token?: string): Promise<OrderResult> {
  const res = await fetch('/api/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to submit order');
  return res.json();
}
```

---

### `components/ui/` — the shared design primitives

Form controls and loading indicators that every feature uses are in
`src/components/ui/`: `Input`, `Select`, `Textarea`, `Label`, `Spinner`. They are
atoms in the Atomic Design sense: they take props only, know nothing about the
app's data, and compose no other components. Their Tailwind classes live in
`ui/styles.ts`, so a change to the form look happens in one place.

Why a `ui/` layer and not full Atomic Design folders: features remain the
primary axis, because feature boundaries are what the rules above protect.
Atoms are split out only where the same markup was copied across features (the
same input class string appeared in about a dozen files). Molecules and
organisms stay in `src/components/` or inside their feature, and templates and
pages are not split into their own layers.

Feature code imports from `components/ui/` freely; that is shared UI, not
another feature, so the no-cross-feature rule does not apply.

### `components/`

UI components exclusively used by this feature. Each file contains **exactly one exported component**.

```
src/features/pdp/components/
├── ProductDetailsModal.tsx   ← Main modal container
├── ImageGallery.tsx          ← Thumbnail strip + main image
├── ImageLightbox.tsx         ← Full-screen image zoom overlay
├── SpecsTab.tsx              ← Technical specifications table
└── ReviewsTab.tsx            ← Reviews list + rating breakdown + submit form
```

**Rules:**
- One exported component per file (the filename matches the component name).
- The component may import from its own feature's hooks, utils, and types.
- The component must **not** import from another feature's components.
- Shared/dumb components with no feature-specific logic belong in `src/components/`.

---

## i18n — Locale Files

Translation strings follow the same feature-driven segmentation. Each feature has its own locale file.

```
src/i18n/
├── LanguageContext.tsx       ← React context providing t() and language toggle
├── translations.ts           ← Aggregator: imports and merges all locale files
└── locales/
    ├── common.ts             ← Navbar, footer, brand section, global UI strings
    ├── home.ts               ← Hero, categories, products, quick view, newsletter CTA
    ├── cart.ts               ← Cart drawer strings
    ├── checkout.ts           ← Checkout form, payment methods, confirmation
    └── pdp.ts                ← Product details tabs, reviews, specs, wishlist
```

When adding a new feature that contains UI text:
1. Create `src/i18n/locales/<feature-name>.ts`
2. Import and spread it into `translations.ts` under both `en` and `pt` keys.

---

## Naming Conventions

| Item | Convention | Example |
|---|---|---|
| React components | `PascalCase` | `ProductDetailsModal.tsx` |
| Hooks | `camelCase` prefixed with `use` | `useWishlist`, `useCheckout` |
| Utility functions | `camelCase` verbs | `formatCurrency`, `calculateAverageRating` |
| Zod schemas | `camelCase` suffixed with `Schema` | `reviewSchema`, `shippingSchema` |
| Inferred Zod types | `PascalCase` suffixed with `FormData` | `ReviewFormData`, `ShippingFormData` |
| API functions | `camelCase` verbs | `submitOrder`, `getProducts` |
| Feature directories | `kebab-case` | `home-page`, `catalog-filters` |
| Translation keys | `featureName.keyName` | `pdp.tabReviews`, `cart.total` |

---

## Example: Adding a New Feature

Suppose you are adding a **Customer Account** feature. Here is the exact checklist:

```
src/features/account/
├── types.ts          ← Define AccountProfile, OrderHistory, AddressBook
├── validation.ts     ← Define profileUpdateSchema with Zod
├── hooks.ts          ← Define useAccountProfile(), useOrderHistory()
├── utils.ts          ← Define formatOrderDate(), getOrderStatusLabel()
├── api.ts            ← Define getProfile(), updateProfile(), getOrders()
└── components/
    ├── AccountDashboard.tsx
    ├── ProfileForm.tsx
    ├── OrderHistoryList.tsx
    └── OrderHistoryItem.tsx
```

Then add `src/i18n/locales/account.ts` with `en` and `pt` keys, and import it in `translations.ts`.
