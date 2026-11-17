import type { LocalizedText } from '../types';
import type { Language } from './translations';

interface TranslatableContent {
  name: string;
  description?: string | null;
  translations?: Partial<Record<Language, LocalizedText>>;
}

/**
 * Resolves display text for a category/product. The canonical `name` and
 * `description` are the fallback when a locale translation is missing.
 */
export function localizedText(
  content: TranslatableContent,
  language: Language
): { name: string; description: string | undefined } {
  const translation = content.translations?.[language];
  return {
    name: translation?.name ?? content.name,
    description: translation?.description ?? content.description ?? undefined,
  };
}
