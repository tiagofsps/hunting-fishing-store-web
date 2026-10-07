import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import type { Product, ProductItem, Promotion } from '../../../types';
import { useLanguage } from '../../../i18n/useLanguage';
import ProductCard from '../../../components/ProductCard';

/** How many products the landing page carousel surfaces before "View all". */
const FEATURED_LIMIT = 8;

interface ProductSectionProps {
  products: Product[];
  promotions?: Promotion[];
  onAddToCart: (product: Product, selectedItem?: ProductItem) => void;
  onQuickView: (product: Product) => void;
}

export default function ProductSection({
  products,
  promotions = [],
  onAddToCart,
  onQuickView,
}: ProductSectionProps) {
  const { t } = useLanguage();
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  const featured = products.slice(0, FEATURED_LIMIT);

  const updateArrows = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setAtStart(track.scrollLeft <= 4);
    setAtEnd(track.scrollLeft + track.clientWidth >= track.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    window.addEventListener('resize', updateArrows);
    return () => window.removeEventListener('resize', updateArrows);
  }, [updateArrows, featured.length]);

  const scrollByPage = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth, behavior: 'smooth' });
  };

  if (featured.length === 0) return null;

  return (
    <section id="featured" className="bg-surface py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        {/* Header */}
        <div className="flex flex-col gap-5 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-accent-strong">
              {t('prod.subtitle')}
            </span>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-ink sm:text-4xl">
              {t('prod.title')}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/shop"
              className="rounded-xl border border-border bg-surface-raised px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-ink transition-colors hover:border-accent-border hover:text-accent-strong"
            >
              {t('prod.viewAll')}
            </Link>
            <div className="hidden items-center gap-2 sm:flex">
              <button
                type="button"
                onClick={() => scrollByPage(-1)}
                disabled={atStart}
                aria-label={t('prod.previous')}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-raised text-ink transition-colors hover:border-accent-border hover:text-accent-strong disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => scrollByPage(1)}
                disabled={atEnd}
                aria-label={t('prod.next')}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-raised text-ink transition-colors hover:border-accent-border hover:text-accent-strong disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Carousel track: 4 cards per screen on desktop, one per swipe on mobile */}
        <div
          ref={trackRef}
          onScroll={updateArrows}
          className="scrollbar-hide mt-10 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-2"
        >
          {featured.map((product) => (
            <div
              key={product.id}
              className="w-[78%] shrink-0 snap-start sm:w-[48%] lg:w-[calc(25%-1.125rem)]"
            >
              <ProductCard
                product={product}
                promotions={promotions}
                onAddToCart={onAddToCart}
                onQuickView={onQuickView}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
