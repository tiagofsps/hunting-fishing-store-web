/**
 * Converts an optional numeric input for react-hook-form. A blank field becomes
 * `undefined` (so an optional schema field accepts it) instead of `NaN`, which
 * fails validation silently. Non-numeric text is kept as `NaN` so it is rejected.
 */
export function toOptionalNumber(value: unknown): number | undefined {
  if (value === '' || value === null || value === undefined) return undefined;
  return Number(value);
}

/**
 * Parses the admin "attributes" text box (`size=Medium, color=yellow`) into a
 * map. Pairs without a key or value are dropped; an empty result is `undefined`
 * so the field is omitted from the payload rather than sent as `{}`.
 */
export function parseAttributes(raw: string | undefined): Record<string, string> | undefined {
  if (!raw) return undefined;
  const entries = raw
    .split(',')
    .map((pair) => pair.trim())
    .filter(Boolean)
    .map((pair) => {
      const [key, ...rest] = pair.split('=');
      return [key.trim(), rest.join('=').trim()];
    })
    .filter(([key, value]) => key.length > 0 && value.length > 0);
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

/** Inverse of `parseAttributes`: renders a stored attribute map back to the text box format. */
export function formatAttributes(attributes: Record<string, unknown> | null | undefined): string {
  if (!attributes) return '';
  return Object.entries(attributes)
    .map(([key, value]) => `${key}=${value}`)
    .join(', ');
}

/** Maps the category form into canonical and optional translated API fields. */
export function toAdminCategoryPayload(data: AdminCategoryFormData): AdminCategoryPayload {
  return {
    name: data.name,
    slug: data.slug,
    ...(data.description ? { description: data.description } : {}),
    translations: {
      en: {
        name: data.name,
        ...(data.description ? { description: data.description } : {}),
      },
      ...(data.namePt
        ? {
            pt: {
              name: data.namePt,
              ...(data.descriptionPt ? { description: data.descriptionPt } : {}),
            },
          }
        : {}),
    },
    ...(data.parentCategoryId ? { parentCategoryId: data.parentCategoryId } : {}),
  };
}

/** Maps the brand form and omits an empty optional logo URL. */
export function toAdminBrandPayload(data: AdminBrandFormData): AdminBrandPayload {
  return {
    name: data.name,
    slug: data.slug,
    ...(data.logoUrl ? { logoUrl: data.logoUrl } : {}),
  };
}
import type { AdminBrandPayload, AdminCategoryPayload } from './api';
import type { AdminBrandFormData, AdminCategoryFormData } from './validation';
