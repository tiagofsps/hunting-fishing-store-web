import { useState, useEffect } from 'react';
import type { Promotion } from '../../../types';
import { useLanguage } from '../../../i18n/useLanguage';
import * as api from '../api';

export default function PromotionBanner() {
  const { t } = useLanguage();
  const [dismissed, setDismissed] = useState(false);
  const [promotions, setPromotions] = useState<Promotion[]>([]);

  useEffect(() => {
    let cancelled = false;
    api
      .getPromotions()
      .then((data) => {
        if (!cancelled) setPromotions(data);
      })
      .catch(() => {
        // banner is decorative; ignore fetch errors
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (dismissed) return null;

  const featured = promotions && promotions.length > 0 ? promotions[0] : null;

  return (
    <div className="bg-ink text-white py-2.5 px-5 text-center relative text-xs font-bold tracking-wide border-b border-border/20 shadow-xs">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2">
        <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-black uppercase text-ink">
          {t('promo.badge')}
        </span>
        {featured ? (
          <span>
            {featured.title}: {featured.description} — <strong className="text-accent">{featured.discountPercentage}% OFF!</strong>
          </span>
        ) : (
          <span>{t('promo.defaultMessage')}</span>
        )}
      </div>

      <button
        onClick={() => setDismissed(true)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors"
        aria-label={t('common.close')}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}