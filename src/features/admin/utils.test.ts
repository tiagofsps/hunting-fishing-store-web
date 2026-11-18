import { describe, expect, it } from 'vitest';
import {
  formatAttributes,
  parseAttributes,
  toAdminBrandPayload,
  toAdminCategoryPayload,
  toOptionalNumber,
} from './utils';

describe('toOptionalNumber', () => {
  it('treats a blank input as absent so optional fields accept it', () => {
    expect(toOptionalNumber('')).toBeUndefined();
    expect(toOptionalNumber(undefined)).toBeUndefined();
    expect(toOptionalNumber(null)).toBeUndefined();
  });

  it('converts numeric text', () => {
    expect(toOptionalNumber('2.5')).toBe(2.5);
    expect(toOptionalNumber('0')).toBe(0);
  });

  it('keeps non-numeric text as NaN so validation rejects it', () => {
    expect(Number.isNaN(toOptionalNumber('abc'))).toBe(true);
  });
});

describe('parseAttributes', () => {
  it('returns undefined when there is nothing to parse', () => {
    expect(parseAttributes(undefined)).toBeUndefined();
    expect(parseAttributes('')).toBeUndefined();
    expect(parseAttributes(' , , ')).toBeUndefined();
  });

  it('parses comma-separated key=value pairs and trims whitespace', () => {
    expect(parseAttributes(' size = Medium , color=yellow ')).toEqual({ size: 'Medium', color: 'yellow' });
  });

  it('drops pairs with a missing key or value', () => {
    expect(parseAttributes('=orphan, size=, color=blue')).toEqual({ color: 'blue' });
  });

  it('keeps equals signs that belong to the value', () => {
    expect(parseAttributes('formula=a=b')).toEqual({ formula: 'a=b' });
  });
});

describe('formatAttributes', () => {
  it('renders an empty string for missing attributes', () => {
    expect(formatAttributes(undefined)).toBe('');
    expect(formatAttributes(null)).toBe('');
  });

  it('renders the stored map in the text-box format', () => {
    expect(formatAttributes({ size: 'Medium', weight: 2 })).toBe('size=Medium, weight=2');
  });

  it('round-trips through parseAttributes', () => {
    const original = { size: 'Large', color: 'blue' };
    expect(parseAttributes(formatAttributes(original))).toEqual(original);
  });
});

describe('admin category and brand payload mapping', () => {
  it('includes English canonical content and only includes Portuguese content when provided', () => {
    const category = toAdminCategoryPayload({
      name: 'Rods',
      namePt: '',
      slug: 'rods',
      description: 'Fishing rods',
      descriptionPt: '',
      parentCategoryId: undefined,
    });
    expect(category).toEqual({
      name: 'Rods',
      slug: 'rods',
      description: 'Fishing rods',
      translations: { en: { name: 'Rods', description: 'Fishing rods' } },
    });

    const bilingual = toAdminCategoryPayload({
      name: 'Rods',
      namePt: 'Canas',
      slug: 'rods',
      description: '',
      descriptionPt: 'Canas de pesca',
      parentCategoryId: 2,
    });
    expect(bilingual).toEqual({
      name: 'Rods',
      slug: 'rods',
      translations: {
        en: { name: 'Rods' },
        pt: { name: 'Canas', description: 'Canas de pesca' },
      },
      parentCategoryId: 2,
    });
  });

  it('omits an empty optional logo URL', () => {
    expect(toAdminBrandPayload({ name: 'Acme', slug: 'acme', logoUrl: '' })).toEqual({
      name: 'Acme',
      slug: 'acme',
    });
    expect(toAdminBrandPayload({ name: 'Acme', slug: 'acme', logoUrl: '/brands/acme.svg' })).toEqual({
      name: 'Acme',
      slug: 'acme',
      logoUrl: '/brands/acme.svg',
    });
  });
});
