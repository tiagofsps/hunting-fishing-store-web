---
name: web-patterns
description: Reference code patterns for feature folders, types, validation, API clients, hooks, utils, components, and i18n in the Hunting & Fishing Store web frontend
---

## Feature File Layout

A feature lives in `src/features/<kebab-case>/`:

```
src/features/<feature>/
├── types.ts        domain types
├── validation.ts   zod v4 schemas + FormData types
├── hooks.ts        data/state hooks
├── utils.ts        pure helpers
├── api.ts          typed fetch wrappers
└── components/     React components
```

Features must not import each other. Wire them via `App.tsx` props/callbacks.

## types.ts Pattern

File: `src/features/<feature>/types.ts`

```ts
export interface FeatureItem {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  active?: boolean;
}

export interface Feature {
  id: number;
  name: string;
  slug?: string;
  items?: FeatureItem[];
}

export type FeatureSort = 'default' | 'price-asc' | 'price-desc' | 'name';
```

No enums or namespaces (`erasableSyntaxOnly`) — use union types or `as const` objects.

## validation.ts Pattern

File: `src/features/<feature>/validation.ts`

```ts
import { z } from 'zod';

export const featureFormSchema = z.object({
  name: z.string().min(1, 'Campo obrigatório'),
  email: z.string().email('Por favor, insira um e-mail válido'),
});

export type FeatureFormData = z.infer<typeof featureFormSchema>;
```

Export the schema and its inferred type suffixed `FormData` — the exact name the component's `useForm` is typed with.

## api.ts Pattern

File: `src/features/<feature>/api.ts`

```ts
import type { Feature } from './types';

const BASE_URL = '/api/v1';

export async function getFeatures(): Promise<Feature[]> {
  const response = await fetch(`${BASE_URL}/features`);
  if (!response.ok) throw new Error('Failed to fetch features');
  return response.json();
}

export async function getFeatureById(id: number): Promise<Feature> {
  const response = await fetch(`${BASE_URL}/features/${id}`);
  if (!response.ok) throw new Error('Failed to fetch feature');
  return response.json();
}
```

All calls go through the `/api/v1` proxy base; functions are typed with the feature's `types.ts`; never `any`.

## hooks.ts Pattern

File: `src/features/<feature>/hooks.ts`

```ts
import { useState, useEffect } from 'react';
import * as api from './api';
import type { Feature } from './types';

export function useFeatures() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const data = await api.getFeatures();
        setFeatures(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return { features, loading, error };
}
```

## utils.ts Pattern

File: `src/features/<feature>/utils.ts`

```ts
import type { Feature } from './types';

export function getFeaturePrimaryName(feature: Feature): string {
  return feature.name ?? 'Unnamed';
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}
```

Pure functions only; no React, no side effects.

## Component Pattern

File: `src/features/<feature>/components/FeatureSection.tsx`

```tsx
import type { Feature } from '../types';
import { formatCurrency } from '../utils';
import { useLanguage } from '../../../i18n/LanguageContext';

interface FeatureSectionProps {
  features: Feature[];
  onSelect: (feature: Feature) => void;
}

export default function FeatureSection({ features, onSelect }: FeatureSectionProps) {
  const { t } = useLanguage();

  return (
    <section className="bg-surface py-20 sm:py-28">
      <h2 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">
        {t('feat.title')}
      </h2>
      {features.map((feature) => (
        <button
          key={feature.id}
          onClick={() => onSelect(feature)}
          className="rounded-xl bg-ink px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-ink/90"
        >
          {feature.name} — {formatCurrency(feature.items?.[0]?.price ?? 0)}
        </button>
      ))}
    </section>
  );
}
```

Component rules: PascalCase filename; `import type` for type-only imports; `useLanguage().t('feature.key')` for ALL text; Tailwind semantic tokens only; props typed and wired from the parent.

## i18n Pattern

File: `src/i18n/locales/<feature>.ts` — every feature with UI text exports both languages, keyed `feature.key`:

```ts
export const featureTranslations = {
  en: {
    'feat.title': 'Featured',
    'feat.subtitle': 'Handpicked gear',
    'feat.addToCart': 'Add to Cart',
  },
  pt: {
    'feat.title': 'Destaques',
    'feat.subtitle': 'Equipamento selecionado',
    'feat.addToCart': 'Adicionar ao Cesto',
  },
};
```

Registration in `src/i18n/translations.ts` — import the locale and spread it into both `en` and `pt`:

```ts
import { featureTranslations } from './locales/feature';

export const translations: Record<Language, Record<string, string>> = {
  en: {
    ...commonTranslations.en,
    ...featureTranslations.en,
  },
  pt: {
    ...commonTranslations.pt,
    ...featureTranslations.pt,
  },
};
```

Access in components via `const { t } = useLanguage();` then `t('feat.title')`. Fallback to `en` then the raw key is handled by `LanguageContext`.

## Feature Wiring in App.tsx

Features expose props/callbacks; `App.tsx` owns shared state and passes it down:

```tsx
import { useState } from 'react';
import FeatureSection from './features/<feature>/components/FeatureSection';

export default function App() {
  const [selected, setSelected] = useState<Feature | null>(null);

  return (
    <div className="min-h-screen bg-surface text-ink antialiased">
      <FeatureSection
        features={features}
        onSelect={setSelected}
      />
    </div>
  );
}
```