import { useEffect, useMemo, useState } from 'react';
import { localizedText } from '../i18n/localizedContent';
import { useLanguage } from '../i18n/useLanguage';
import * as catalogApi from '../lib/catalogApi';
import { formatImageUrl } from '../utils';
import type { NavLinkItem } from './NavDropdown';

/**
 * Loads the catalog taxonomies once for the navbar menus and shapes them into
 * link lists: categories grouped by hierarchy (children under their parent)
 * and brands as a flat list.
 */
export function useNavData() {
  const { language } = useLanguage();
  const [categories, setCategories] = useState<Awaited<ReturnType<typeof catalogApi.getCategories>>>([]);
  const [brands, setBrands] = useState<Awaited<ReturnType<typeof catalogApi.getBrands>>>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([catalogApi.getCategories(), catalogApi.getBrands()])
      .then(([categoryList, brandList]) => {
        if (cancelled) return;
        setCategories(categoryList);
        setBrands(brandList);
      })
      .catch(() => {
        // The menus are non-critical; the navbar still renders without them.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const categoryLinks = useMemo<NavLinkItem[]>(() => {
    const items = new Map<number, NavLinkItem>(
      categories.map((category) => [
        category.id,
        {
          id: category.id,
          label: localizedText(category, language).name,
          to: `/shop?categoryId=${category.id}`,
          meta: category.productCount !== undefined ? String(category.productCount) : undefined,
          children: [],
        },
      ])
    );

    const roots: NavLinkItem[] = [];
    for (const category of categories) {
      const item = items.get(category.id);
      if (!item) continue;
      const parent =
        category.parentCategoryId === null || category.parentCategoryId === undefined
          ? undefined
          : items.get(category.parentCategoryId);
      if (parent && parent !== item) parent.children?.push(item);
      else roots.push(item);
    }
    return roots;
  }, [categories, language]);

  const brandLinks = useMemo<NavLinkItem[]>(
    () =>
      brands.map((brand) => ({
        id: brand.id,
        label: brand.name,
        to: `/shop?brandId=${brand.id}`,
        image: formatImageUrl(brand.logoUrl),
      })),
    [brands]
  );

  return { categoryLinks, brandLinks };
}
