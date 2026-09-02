import type { Product, Category, Brand, Promotion } from './types';

const BASE_URL = '/api/v1';

export async function getProducts(): Promise<Product[]> {
  const response = await fetch(`${BASE_URL}/products`);
  if (!response.ok) throw new Error('Failed to fetch products');
  return response.json();
}

export async function getCategories(): Promise<Category[]> {
  const response = await fetch(`${BASE_URL}/categories`);
  if (!response.ok) throw new Error('Failed to fetch categories');
  return response.json();
}

export async function getBrands(): Promise<Brand[]> {
  const response = await fetch(`${BASE_URL}/brands`);
  if (!response.ok) throw new Error('Failed to fetch brands');
  return response.json();
}

export async function getPromotions(): Promise<Promotion[]> {
  const response = await fetch(`${BASE_URL}/promotions`);
  if (!response.ok) throw new Error('Failed to fetch promotions');
  return response.json();
}
