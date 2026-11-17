import { describe, expect, it } from 'vitest';
import { accountAddressSchema, passwordSchema, profileSchema } from './validation';

describe('profileSchema', () => {
  const profile = {
    firstName: 'Ana',
    lastName: 'Silva',
    phone: '',
    huntingLicenseNumber: '',
    fishingLicenseNumber: '',
  };

  it('accepts a profile whose optional fields are blank', () => {
    expect(profileSchema.safeParse(profile).success).toBe(true);
  });

  it('requires both names', () => {
    expect(profileSchema.safeParse({ ...profile, firstName: '' }).success).toBe(false);
    expect(profileSchema.safeParse({ ...profile, lastName: '' }).success).toBe(false);
  });

  it('caps every field at the backend limit of 255 characters', () => {
    const long = 'x'.repeat(256);
    expect(profileSchema.safeParse({ ...profile, phone: long }).success).toBe(false);
    expect(profileSchema.safeParse({ ...profile, huntingLicenseNumber: long }).success).toBe(false);
    expect(profileSchema.safeParse({ ...profile, phone: 'x'.repeat(255) }).success).toBe(true);
  });
});

describe('accountAddressSchema', () => {
  const address = {
    recipientName: 'Ana Silva',
    recipientPhone: '912345678',
    street: 'Rua 1',
    city: 'Lisboa',
    postalCode: '1000-001',
    countryCode: 'PT',
    addressType: 'SHIPPING' as const,
  };

  it('accepts a complete shipping address', () => {
    expect(accountAddressSchema.safeParse(address).success).toBe(true);
  });

  it('requires a two-letter country code', () => {
    expect(accountAddressSchema.safeParse({ ...address, countryCode: 'PRT' }).success).toBe(false);
    expect(accountAddressSchema.safeParse({ ...address, countryCode: 'P' }).success).toBe(false);
  });

  it('accepts only the two address types the backend knows', () => {
    expect(accountAddressSchema.safeParse({ ...address, addressType: 'BILLING' }).success).toBe(true);
    expect(accountAddressSchema.safeParse({ ...address, addressType: 'HOME' }).success).toBe(false);
  });
});

describe('passwordSchema', () => {
  const change = { currentPassword: 'old-password', newPassword: 'new-password', confirmPassword: 'new-password' };

  it('accepts a matching new password of at least eight characters', () => {
    expect(passwordSchema.safeParse(change).success).toBe(true);
  });

  it('rejects a confirmation that does not match, pointing the error at the confirmation field', () => {
    const result = passwordSchema.safeParse({ ...change, confirmPassword: 'different-pass' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]).toMatchObject({ path: ['confirmPassword'], message: 'passwordsDoNotMatch' });
    }
  });

  it('rejects a new password shorter than eight characters even when it matches', () => {
    expect(passwordSchema.safeParse({ currentPassword: 'x', newPassword: 'short', confirmPassword: 'short' }).success).toBe(false);
  });

  it('requires the current password', () => {
    expect(passwordSchema.safeParse({ ...change, currentPassword: '' }).success).toBe(false);
  });
});
