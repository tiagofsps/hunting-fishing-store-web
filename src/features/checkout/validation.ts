import { z } from 'zod';

export const addressSchema = z.object({
  recipientName: z.string().min(1),
  recipientPhone: z.string().min(1),
  street: z.string().min(1),
  city: z.string().min(1),
  postalCode: z.string().min(1),
  countryCode: z.string().length(2),
  addressType: z.enum(['SHIPPING', 'BILLING']),
});
export type AddressFormData = z.infer<typeof addressSchema>;

export const mbwayPhoneSchema = z.object({
  mbwayPhone: z.string().min(9),
});
export type MbwayPhoneFormData = z.infer<typeof mbwayPhoneSchema>;