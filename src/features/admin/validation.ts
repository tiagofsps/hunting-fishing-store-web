import { z } from 'zod';

// Mirrors ProductCreateRequest on the backend.
export const adminProductItemSchema = z.object({
  sku: z.string().min(1),
  price: z.number().min(0),
  stockQuantity: z.number().int().min(0),
  weight: z.number().min(0).optional(),
  active: z.boolean(),
  attributes: z.record(z.string(), z.string()).optional(),
});
export type AdminProductItemFormData = z.infer<typeof adminProductItemSchema>;

export const adminProductImageSchema = z.object({
  imageUrl: z.string().min(1),
  altText: z.string().optional(),
  isPrimary: z.boolean(),
  displayOrder: z.number().int().min(0),
});
export type AdminProductImageFormData = z.infer<typeof adminProductImageSchema>;

export const adminProductSchema = z
  .object({
    name: z.string().min(1).max(100),
    namePt: z.string().max(100).optional(),
    slug: z
      .string()
      .min(1)
      .max(100)
      .regex(/^[a-z0-9-]+$/, 'slugInvalid'),
    description: z.string().max(2000).optional(),
    descriptionPt: z.string().max(2000).optional(),
    requiresLicense: z.boolean(),
    licenseType: z.enum(['HUNTING', 'FISHING']).optional(),
    categoryId: z.number().int().positive(),
    brandId: z.number().int().positive(),
    items: z.array(adminProductItemSchema).min(1),
    images: z.array(adminProductImageSchema),
  })
  .refine((data) => !data.requiresLicense || data.licenseType !== undefined, {
    message: 'licenseTypeRequired',
    path: ['licenseType'],
  });
export type AdminProductFormData = z.infer<typeof adminProductSchema>;

// ---------------------------------------------------------------- categories

export const adminCategorySchema = z.object({
  name: z.string().min(1).max(100),
  namePt: z.string().max(100).optional(),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'slugInvalid'),
  description: z.string().max(500).optional(),
  descriptionPt: z.string().max(500).optional(),
  parentCategoryId: z.number().int().positive().optional(),
});
export type AdminCategoryFormData = z.infer<typeof adminCategorySchema>;

// ------------------------------------------------------------------- brands

export const adminBrandSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'slugInvalid'),
  logoUrl: z.string().max(500).optional(),
});
export type AdminBrandFormData = z.infer<typeof adminBrandSchema>;

// -------------------------------------------------------------------- stock

export const stockMovementSchema = z.object({
  productItemId: z.number().int().positive(),
  quantity: z.number().int().refine((value) => value !== 0, { message: 'quantityRequired' }),
  type: z.enum(['PURCHASE', 'SALE', 'RETURN', 'ADJUSTMENT']),
  notes: z.string().optional(),
});
export type StockMovementFormData = z.infer<typeof stockMovementSchema>;

// ------------------------------------------------------------------ coupons

export const adminCouponSchema = z.object({
  code: z.string().min(1),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
  discountValue: z.number().positive(),
  minOrderAmount: z.number().positive().optional(),
  usageLimit: z.number().int().positive().optional(),
  usageLimitPerUser: z.number().int().positive().optional(),
  validFrom: z.string().min(1),
  validTo: z.string().min(1),
});
export type AdminCouponFormData = z.infer<typeof adminCouponSchema>;

// --------------------------------------------------------------- promotions

export const adminPromotionSchema = z
  .object({
    name: z.string().min(1),
    discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
    discountValue: z.number().positive(),
    priority: z.number().int().optional(),
    stackable: z.boolean(),
    validFrom: z.string().min(1),
    validTo: z.string().min(1),
    rules: z.array(
      z.object({
        targetType: z.enum(['CATEGORY', 'BRAND', 'PRODUCT']),
        targetId: z.number().int().positive(),
      })
    ),
  })
  .refine((data) => new Date(data.validTo) > new Date(data.validFrom), {
    message: 'validRangeInvalid',
    path: ['validTo'],
  });
export type AdminPromotionFormData = z.infer<typeof adminPromotionSchema>;
