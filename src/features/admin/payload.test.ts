import { describe, expect, it } from 'vitest';
import { toAdminProductPayload } from './api';
import type { AdminProductFormData } from './validation';

function form(overrides: Partial<AdminProductFormData> = {}): AdminProductFormData {
  return {
    name: 'Carbon Rod',
    namePt: '',
    slug: 'carbon-rod',
    description: '',
    descriptionPt: '',
    requiresLicense: false,
    categoryId: 3,
    brandId: 7,
    items: [{ sku: 'ROD-1', price: 129.9, stockQuantity: 4, active: true }],
    images: [],
    ...overrides,
  } as AdminProductFormData;
}

describe('toAdminProductPayload', () => {
  it('sends the English name as the canonical name and English translation', () => {
    const payload = toAdminProductPayload(form());
    expect(payload.name).toBe('Carbon Rod');
    expect(payload.translations).toEqual({ en: { name: 'Carbon Rod' } });
  });

  it('omits empty optional fields instead of sending blanks', () => {
    const payload = toAdminProductPayload(form());
    expect(payload).not.toHaveProperty('description');
    expect(payload).not.toHaveProperty('licenseType');
    expect(payload.translations).not.toHaveProperty('pt');
  });

  it('adds the Portuguese translation only when a Portuguese name is given', () => {
    const payload = toAdminProductPayload(form({ namePt: 'Cana', descriptionPt: 'Leve' }));
    expect(payload.translations).toEqual({ en: { name: 'Carbon Rod' }, pt: { name: 'Cana', description: 'Leve' } });
  });

  it('carries the licence type through when the product requires one', () => {
    const payload = toAdminProductPayload(form({ requiresLicense: true, licenseType: 'FISHING' }));
    expect(payload).toMatchObject({ requiresLicense: true, licenseType: 'FISHING' });
  });

  it('keeps variant prices and stock as numbers', () => {
    const payload = toAdminProductPayload(form());
    expect(payload.items[0]).toMatchObject({ sku: 'ROD-1', price: 129.9, stockQuantity: 4, active: true });
  });
});
