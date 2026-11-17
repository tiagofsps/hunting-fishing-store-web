import { describe, expect, it } from 'vitest';
import {
  adminBrandSchema,
  adminCategorySchema,
  adminCouponSchema,
  adminProductSchema,
  adminPromotionSchema,
  stockMovementSchema,
} from './validation';

const product = {
  name: 'Carbon Rod',
  slug: 'carbon-rod',
  requiresLicense: false,
  categoryId: 3,
  brandId: 7,
  items: [{ sku: 'ROD-1', price: 129.9, stockQuantity: 4, active: true }],
  images: [],
};

describe('adminProductSchema', () => {
  it('accepts a complete product', () => {
    expect(adminProductSchema.safeParse(product).success).toBe(true);
  });

  it('requires at least one variant', () => {
    expect(adminProductSchema.safeParse({ ...product, items: [] }).success).toBe(false);
  });

  it('requires a licence type once the product needs a licence', () => {
    const result = adminProductSchema.safeParse({ ...product, requiresLicense: true });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]).toMatchObject({ path: ['licenseType'], message: 'licenseTypeRequired' });
    }
    expect(adminProductSchema.safeParse({ ...product, requiresLicense: true, licenseType: 'HUNTING' }).success).toBe(true);
  });

  it('accepts only lowercase kebab-case slugs and flags the rule by its key', () => {
    const result = adminProductSchema.safeParse({ ...product, slug: 'Carbon Rod' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toBe('slugInvalid');
  });

  it('rejects a negative price and a fractional stock count', () => {
    expect(adminProductSchema.safeParse({ ...product, items: [{ ...product.items[0], price: -1 }] }).success).toBe(false);
    expect(adminProductSchema.safeParse({ ...product, items: [{ ...product.items[0], stockQuantity: 1.5 }] }).success).toBe(false);
  });

  it('requires a category and a brand chosen from the list', () => {
    expect(adminProductSchema.safeParse({ ...product, categoryId: 0 }).success).toBe(false);
    expect(adminProductSchema.safeParse({ ...product, brandId: 0 }).success).toBe(false);
  });
});

describe('adminCategorySchema', () => {
  it('accepts a category with a valid slug and no parent', () => {
    expect(adminCategorySchema.safeParse({ name: 'Rods', slug: 'rods' }).success).toBe(true);
  });

  it('rejects an invalid slug', () => {
    expect(adminCategorySchema.safeParse({ name: 'Rods', slug: 'Rods_1' }).success).toBe(false);
  });
});

describe('adminBrandSchema', () => {
  it('accepts a brand and rejects an empty name', () => {
    expect(adminBrandSchema.safeParse({ name: 'Shimano', slug: 'shimano' }).success).toBe(true);
    expect(adminBrandSchema.safeParse({ name: '', slug: 'shimano' }).success).toBe(false);
  });
});

describe('stockMovementSchema', () => {
  it('rejects a zero quantity, since it moves nothing', () => {
    const result = stockMovementSchema.safeParse({ productItemId: 1, quantity: 0, type: 'ADJUSTMENT' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toBe('quantityRequired');
  });

  it('accepts a negative adjustment (stock removed)', () => {
    expect(stockMovementSchema.safeParse({ productItemId: 1, quantity: -2, type: 'ADJUSTMENT' }).success).toBe(true);
  });
});

describe('adminCouponSchema', () => {
  const coupon = {
    code: 'SPRING10',
    discountType: 'PERCENTAGE' as const,
    discountValue: 10,
    validFrom: '2026-03-01',
    validTo: '2026-06-01',
  };

  it('accepts a percentage coupon and rejects a non-positive discount', () => {
    expect(adminCouponSchema.safeParse(coupon).success).toBe(true);
    expect(adminCouponSchema.safeParse({ ...coupon, discountValue: 0 }).success).toBe(false);
  });

  it('accepts optional limits only when they are positive whole numbers', () => {
    expect(adminCouponSchema.safeParse({ ...coupon, usageLimit: 100 }).success).toBe(true);
    expect(adminCouponSchema.safeParse({ ...coupon, usageLimit: 0 }).success).toBe(false);
  });
});

describe('adminPromotionSchema', () => {
  const promotion = {
    name: 'Summer',
    discountType: 'FIXED_AMOUNT' as const,
    discountValue: 5,
    stackable: false,
    validFrom: '2026-06-01T00:00:00Z',
    validTo: '2026-08-31T23:59:59Z',
    rules: [{ targetType: 'CATEGORY' as const, targetId: 3 }],
  };

  it('accepts a window that ends after it starts', () => {
    expect(adminPromotionSchema.safeParse(promotion).success).toBe(true);
  });

  it('rejects a window that ends before or exactly when it starts', () => {
    const result = adminPromotionSchema.safeParse({ ...promotion, validTo: promotion.validFrom });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]).toMatchObject({ path: ['validTo'], message: 'validRangeInvalid' });
  });

  it('accepts only the three rule targets', () => {
    expect(adminPromotionSchema.safeParse({ ...promotion, rules: [{ targetType: 'SUPPLIER', targetId: 1 }] }).success).toBe(false);
  });
});
