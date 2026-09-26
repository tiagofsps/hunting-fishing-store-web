import { z } from 'zod';

// Mirrors the backend limits: every field is capped at 255 characters.
const max255 = z.string().max(255);

export const profileSchema = z.object({
  firstName: max255.min(1),
  lastName: max255.min(1),
  phone: max255,
  huntingLicenseNumber: max255,
  fishingLicenseNumber: max255,
});
export type ProfileFormData = z.infer<typeof profileSchema>;

export const accountAddressSchema = z.object({
  recipientName: z.string().min(1),
  recipientPhone: z.string().min(1),
  street: z.string().min(1),
  city: z.string().min(1),
  postalCode: z.string().min(1),
  countryCode: z.string().length(2),
  addressType: z.enum(['SHIPPING', 'BILLING']),
});
export type AccountAddressFormData = z.infer<typeof accountAddressSchema>;

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'passwordsDoNotMatch',
    path: ['confirmPassword'],
  });
export type PasswordFormData = z.infer<typeof passwordSchema>;
