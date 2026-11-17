import { useState, useEffect } from 'react';
import * as catalogApi from '../../lib/catalogApi';
import type { Product, Category, Brand, Promotion } from '../../types';
import { useLanguage } from '../../i18n/useLanguage';

export function useHomeData() {
  const { language } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [p, c, b, prom] = await Promise.all([
          // The landing page only surfaces a carousel of recent products.
          catalogApi.getProductsPage({ size: 8 }),
          catalogApi.getCategories(),
          catalogApi.getBrands(),
          catalogApi.getPromotions(),
        ]);
        setProducts(p.content);
        setCategories(c);
        setBrands(b);
        setPromotions(prom);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [language]);

  return { products, categories, brands, promotions, loading, error };
}