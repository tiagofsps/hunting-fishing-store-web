import { describe, expect, it } from 'vitest';
import { translations } from './translations';
import { accountTranslations } from './locales/account';
import { adminTranslations } from './locales/admin';
import { authTranslations } from './locales/auth';
import { cartTranslations } from './locales/cart';
import { checkoutTranslations } from './locales/checkout';
import { commonTranslations } from './locales/common';
import { homeTranslations } from './locales/home';
import { ordersTranslations } from './locales/orders';
import { productDetailTranslations } from './locales/product-detail';
import { shopTranslations } from './locales/shop';

const modules = {
  account: accountTranslations,
  admin: adminTranslations,
  auth: authTranslations,
  cart: cartTranslations,
  checkout: checkoutTranslations,
  common: commonTranslations,
  home: homeTranslations,
  orders: ordersTranslations,
  'product-detail': productDetailTranslations,
  shop: shopTranslations,
};

describe('translation tables', () => {
  it('give every key the same English and Portuguese text slot', () => {
    const en = new Set(Object.keys(translations.en));
    const pt = new Set(Object.keys(translations.pt));
    expect([...en].filter((key) => !pt.has(key))).toEqual([]);
    expect([...pt].filter((key) => !en.has(key))).toEqual([]);
  });

  it('never define the same key in two locale modules, which would silently override one', () => {
    const owner = new Map<string, string>();
    const duplicates: string[] = [];
    for (const [name, module] of Object.entries(modules)) {
      for (const key of Object.keys(module.en)) {
        if (owner.has(key)) duplicates.push(`${key} in ${owner.get(key)} and ${name}`);
        else owner.set(key, name);
      }
    }
    expect(duplicates).toEqual([]);
  });

  it('keep every locale module bilingual', () => {
    for (const [name, module] of Object.entries(modules)) {
      expect(Object.keys(module.pt).sort(), name).toEqual(Object.keys(module.en).sort());
    }
  });

  it('have no empty translation values', () => {
    const empty = Object.entries(translations).flatMap(([lang, table]) =>
      Object.entries(table)
        .filter(([, value]) => value.trim() === '')
        .map(([key]) => `${lang}:${key}`)
    );
    expect(empty).toEqual([]);
  });
});
