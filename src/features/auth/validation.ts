import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  huntingLicenseNumber: z.string().optional(),
  fishingLicenseNumber: z.string().optional(),
});

export type RegisterFormData = z.infer<typeof registerSchema>;