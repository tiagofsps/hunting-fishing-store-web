import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router';
import * as catalogApi from '../../lib/catalogApi';
import type { Product, Category, Brand, Promotion } from '../../types';
import { useLanguage } from '../../i18n/useLanguage';

export function useProductDetail() {
  const { language } = useLanguage();
  const { id } = useParams();
  const productId = Number(id);

  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  const isValidId = Number.isInteger(productId) && productId > 0;

  useEffect(() => {
    if (!isValidId) return;

    let cancelled = false;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const [p, c, b, prom] = await Promise.all([
          catalogApi.getProductById(productId),
          catalogApi.getCategories(),
          catalogApi.getBrands(),
          catalogApi.getPromotions(),
        ]);
        if (cancelled) return;
        setProduct(p);
        setCategories(c);
        setBrands(b);
        setPromotions(prom);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [isValidId, productId, language, reloadToken]);

  return {
    product: isValidId ? product : null,
    category: categories.find((c) => c.id === product?.categoryId) ?? null,
    brand: brands.find((b) => b.id === product?.brandId) ?? null,
    promotions,
    loading: isValidId ? loading : false,
    error: isValidId ? error : 'not_found',
    reload,
  };
}