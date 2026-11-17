import { describe, expect, it } from 'vitest';
import { localizedText } from './localizedContent';

const product = {
  name: 'Canon',
  description: 'Base description',
  translations: {
    pt: { name: 'Cana', description: 'Descrição em português' },
    en: { name: 'Rod' },
  },
};

describe('localizedText', () => {
  it('returns the translation for the active language', () => {
    expect(localizedText(product, 'pt')).toEqual({ name: 'Cana', description: 'Descrição em português' });
  });

  it('falls back to the canonical description when the translation has none', () => {
    expect(localizedText(product, 'en')).toEqual({ name: 'Rod', description: 'Base description' });
  });

  it('falls back to the canonical name and description when no translations exist', () => {
    expect(localizedText({ name: 'Canon', description: 'Base' }, 'pt')).toEqual({
      name: 'Canon',
      description: 'Base',
    });
  });

  it('returns an undefined description when neither source has one', () => {
    expect(localizedText({ name: 'Canon', description: null }, 'en')).toEqual({
      name: 'Canon',
      description: undefined,
    });
  });
});
