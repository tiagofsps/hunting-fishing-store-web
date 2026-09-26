import { useState, useEffect } from 'react';
import * as catalogApi from '../../lib/catalogApi';
import type { Product, Category, Brand, Promotion } from '../../types';

export function useHomeData() {
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
          catalogApi.getProductsPage({ size: 20 }),
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
  }, []);

  return { products, categories, brands, promotions, loading, error };
}