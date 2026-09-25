import type { Product, UserResponse, AuthUser } from './types';

export function formatImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;

  // If it's already a full external URL, return it
  if (url.startsWith('http') && !url.includes('localhost:8080')) {
    return url;
  }

  // If it contains the backend host, make it relative to use the proxy
  if (url.includes('localhost:8080')) {
    return url.replace(/https?:\/\/localhost:8080/, '');
  }

  // If it's already relative and starts with common image paths, keep it
  if (url.startsWith('/images') || url.startsWith('/brands') || url.startsWith('/api') || url.startsWith('/uploads')) {
    return url;
  }

  return url.startsWith('/') ? url : `/${url}`;
}

export function getProductPrice(product: Product): number {
  if (typeof product.price === 'number') {
    return product.price;
  }
  if (product.items && product.items.length > 0) {
    const activeItems = product.items.filter((i) => i.active !== false);
    const targetItems = activeItems.length > 0 ? activeItems : product.items;
    return Math.min(...targetItems.map((i) => i.price));
  }
  return 0;
}

export function getProductImageUrl(product: Product): string {
  if (product.imageUrl) {
    return formatImageUrl(product.imageUrl) || '';
  }
  if (product.images && product.images.length > 0) {
    const primary = product.images.find((img) => img.isPrimary);
    const selected = primary || product.images[0];
    return formatImageUrl(selected.imageUrl) || '';
  }
  return '';
}

export function getProductStock(product: Product): number {
  if (typeof product.stockQuantity === 'number') {
    return product.stockQuantity;
  }
  if (product.items && product.items.length > 0) {
    return product.items.reduce((acc, item) => acc + (item.stockQuantity || 0), 0);
  }
  return 0;
}

export function formatCurrency(amount: number, locale = 'pt-PT'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

export function toAuthUser(user: UserResponse): AuthUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone ?? undefined,
    huntingLicenseNumber: user.huntingLicenseNumber ?? undefined,
    fishingLicenseNumber: user.fishingLicenseNumber ?? undefined,
    role: user.role,
    addresses: user.addresses,
  };
}