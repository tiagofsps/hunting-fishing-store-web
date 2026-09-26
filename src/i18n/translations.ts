import { commonTranslations } from './locales/common';
import { homeTranslations } from './locales/home';
import { shopTranslations } from './locales/shop';
import { productDetailTranslations } from './locales/product-detail';
import { ordersTranslations } from './locales/orders';
import { accountTranslations } from './locales/account';
import { adminTranslations } from './locales/admin';
import { cartTranslations } from './locales/cart';
import { checkoutTranslations } from './locales/checkout';
import { authTranslations } from './locales/auth';

export type Language = 'en' | 'pt';

export const translations: Record<Language, Record<string, string>> = {
  en: {
    ...commonTranslations.en,
    ...homeTranslations.en,
    ...shopTranslations.en,
    ...productDetailTranslations.en,
    ...ordersTranslations.en,
    ...accountTranslations.en,
    ...adminTranslations.en,
    ...cartTranslations.en,
    ...checkoutTranslations.en,
    ...authTranslations.en,
  },
  pt: {
    ...commonTranslations.pt,
    ...homeTranslations.pt,
    ...shopTranslations.pt,
    ...productDetailTranslations.pt,
    ...ordersTranslations.pt,
    ...accountTranslations.pt,
    ...adminTranslations.pt,
    ...cartTranslations.pt,
    ...checkoutTranslations.pt,
    ...authTranslations.pt,
  },
};