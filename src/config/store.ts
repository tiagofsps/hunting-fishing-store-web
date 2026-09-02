export const STORE_CONFIG = {
  name: 'Wild Life',
  shortName: 'Wild Life',
  legalName: 'Wild Life, Lda.',
  shortDescription: 'Hunting & Fishing Shop',
  email: 'suporte@wild-life.pt',
  phone: '+351 220 000 000',
  address: {
    street: 'Rua Principal, nº 140',
    postalCode: '4000-000',
    city: 'Gavião',
    country: 'Portugal',
    formatted: 'Rua dos Caçadores e Pescadores, nº 140, 4000-000 Gavião, Portugal',
  },
  socials: {
    facebook: 'https://facebook.com',
    instagram: 'https://instagram.com',
    youtube: 'https://youtube.com',
  },
} as const;

export type StoreConfig = typeof STORE_CONFIG;
