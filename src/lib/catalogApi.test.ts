import { describe, expect, it } from 'vitest';
import { mapProduct, type ProductResponse } from './catalogApi';

const response: ProductResponse = {
  id: 1,
  name: 'Carbon Rod',
  slug: 'carbon-rod',
  description: 'Light',
  translations: { pt: { name: 'Cana', description: 'Leve' } },
  requiresLicense: true,
  licenseType: 'HUNTING',
  categoryId: 3,
  brandId: 7,
  items: [
    { id: 11, sku: 'ROD-1', price: 129.9, stockQuantity: 4, weight: 0.5, active: true, attributes: { size: 'M' } },
  ],
  images: [{ id: 21, imageUrl: '/images/rod.jpg', altText: null, isPrimary: true, displayOrder: 0 }],
} as unknown as ProductResponse;

describe('mapProduct', () => {
  it('maps the product identity and licence fields', () => {
    expect(mapProduct(response)).toMatchObject({
      id: 1,
      name: 'Carbon Rod',
      slug: 'carbon-rod',
      requiresLicense: true,
      licenseType: 'HUNTING',
      categoryId: 3,
      brandId: 7,
    });
  });

  it('keeps translations as sent by the API', () => {
    expect(mapProduct(response).translations).toEqual({ pt: { name: 'Cana', description: 'Leve' } });
  });

  it('maps variants with their price, stock and attributes', () => {
    expect(mapProduct(response).items).toEqual([
      { id: 11, sku: 'ROD-1', price: 129.9, stockQuantity: 4, weight: 0.5, active: true, attributes: { size: 'M' } },
    ]);
  });

  it('turns a null image alt text into undefined, not null', () => {
    expect(mapProduct(response).images?.[0].altText).toBeUndefined();
  });

  it('treats a null licence type as absent', () => {
    expect(mapProduct({ ...response, licenseType: null } as unknown as ProductResponse).licenseType).toBeUndefined();
  });
});
