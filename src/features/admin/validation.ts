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
    slug: z
      .string()
      .min(1)
      .max(100)
      .regex(/^[a-z0-9-]+$/, 'slugInvalid'),
    description: z.string().max(2000).optional(),
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
