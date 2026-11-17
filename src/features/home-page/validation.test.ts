import { describe, expect, it } from 'vitest';
import { newsletterSchema } from './validation';

describe('newsletterSchema', () => {
  it('accepts a well-formed email', () => {
    expect(newsletterSchema.safeParse({ email: 'fan@example.com' }).success).toBe(true);
  });

  it('rejects text that is not an email', () => {
    expect(newsletterSchema.safeParse({ email: 'not-an-email' }).success).toBe(false);
    expect(newsletterSchema.safeParse({ email: '' }).success).toBe(false);
  });
});
