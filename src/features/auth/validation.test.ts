import { describe, expect, it } from 'vitest';
import { loginSchema, registerSchema } from './validation';

const validRegistration = {
  email: 'ana@example.com',
  password: 'long-enough-1',
  firstName: 'Ana',
  lastName: 'Silva',
};

describe('loginSchema', () => {
  it('accepts an email and any non-empty password', () => {
    expect(loginSchema.safeParse({ email: 'ana@example.com', password: 'x' }).success).toBe(true);
  });

  it('rejects a malformed email', () => {
    expect(loginSchema.safeParse({ email: 'ana.example.com', password: 'x' }).success).toBe(false);
  });

  it('rejects an empty password', () => {
    expect(loginSchema.safeParse({ email: 'ana@example.com', password: '' }).success).toBe(false);
  });
});

describe('registerSchema', () => {
  it('accepts a minimal account with optional fields omitted', () => {
    expect(registerSchema.safeParse(validRegistration).success).toBe(true);
  });

  it('requires a password of at least eight characters, and accepts exactly eight', () => {
    expect(registerSchema.safeParse({ ...validRegistration, password: '1234567' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...validRegistration, password: '12345678' }).success).toBe(true);
  });

  it('requires both names', () => {
    expect(registerSchema.safeParse({ ...validRegistration, firstName: '' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...validRegistration, lastName: '' }).success).toBe(false);
  });

  it('keeps licence numbers and phone optional', () => {
    const result = registerSchema.safeParse({ ...validRegistration, phone: '', huntingLicenseNumber: '' });
    expect(result.success).toBe(true);
  });
});
