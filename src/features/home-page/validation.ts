import { z } from 'zod';

export const newsletterSchema = z.object({
  email: z.string().email('Por favor, insira um e-mail válido'),
});

export type NewsletterFormData = z.infer<typeof newsletterSchema>;
