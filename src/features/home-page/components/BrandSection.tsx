import type { Brand } from '../types';
import { formatImageUrl } from '../utils';
import { useLanguage } from '../../../i18n/LanguageContext';

interface BrandSectionProps {
  brands: Brand[];
}

export default function BrandSection({ brands }: BrandSectionProps) {
  const { t } = useLanguage();

  if (brands.length === 0) return null;

  return (
    <section id="brands" className="bg-surface-raised py-16 border-t border-border">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-accent-strong">
            {t('brand.subtitle')}
          </span>
          <h2 className="text-2xl font-black text-ink mt-1">{t('brand.title')}</h2>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
          {brands.map((brand) => (
            <div
              key={brand.id}
              className="flex items-center justify-center rounded-2xl border border-border bg-surface px-8 py-5 transition-all hover:border-accent-border hover:bg-surface-hover hover:scale-105 shadow-xs"
            >
              {brand.logoUrl && brand.logoUrl !== 'https://example.com/logo.png' ? (
                <img
                  src={formatImageUrl(brand.logoUrl)}
                  alt={brand.name}
                  className="h-8 w-auto object-contain max-w-[120px]"
                />
              ) : (
                <span className="text-lg font-black tracking-tight text-ink">{brand.name}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


