import { commonTranslations } from './locales/common';
import { homeTranslations } from './locales/home';
import { cartTranslations } from './locales/cart';
import { checkoutTranslations } from './locales/checkout';

export type Language = 'en' | 'pt';

export const translations: Record<Language, Record<string, string>> = {
  en: {
    ...commonTranslations.en,
    ...homeTranslations.en,
    ...cartTranslations.en,
    ...checkoutTranslations.en,
  },
  pt: {
    ...commonTranslations.pt,
    ...homeTranslations.pt,
    ...cartTranslations.pt,
    ...checkoutTranslations.pt,
  },
};
