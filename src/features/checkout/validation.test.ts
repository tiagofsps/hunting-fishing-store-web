import { describe, expect, it } from 'vitest';
import { addressSchema, mbwayPhoneSchema } from './validation';

const address = {
  recipientName: 'Ana Silva',
  recipientPhone: '912345678',
  street: 'Rua 1',
  city: 'Lisboa',
  postalCode: '1000-001',
  countryCode: 'PT',
  addressType: 'SHIPPING' as const,
};

describe('checkout addressSchema', () => {
  it('accepts a complete checkout address', () => {
    expect(addressSchema.safeParse(address).success).toBe(true);
  });

  it('requires every field to be present', () => {
    for (const field of ['recipientName', 'recipientPhone', 'street', 'city', 'postalCode'] as const) {
      expect(addressSchema.safeParse({ ...address, [field]: '' }).success, field).toBe(false);
    }
  });

  it('requires an exact two-letter country code', () => {
    expect(addressSchema.safeParse({ ...address, countryCode: 'ESP' }).success).toBe(false);
  });
});

describe('mbwayPhoneSchema', () => {
  it('needs at least nine digits', () => {
    expect(mbwayPhoneSchema.safeParse({ mbwayPhone: '91234567' }).success).toBe(false);
    expect(mbwayPhoneSchema.safeParse({ mbwayPhone: '912345678' }).success).toBe(true);
  });
});
