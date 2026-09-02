import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { STORE_CONFIG } from '../config/store';

type NavbarProps = {
  cartCount: number;
  onOpenCart: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
};

export default function Navbar({
  cartCount,
  onOpenCart,
  searchQuery,
  onSearchChange,
}: NavbarProps) {
  const { language, setLanguage, t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigation = [
    { name: t('nav.home'), href: '#home' },
    { name: t('nav.categories'), href: '#categories' },
    { name: t('nav.featured'), href: '#featured' },
    { name: t('nav.brands'), href: '#brands' },
    { name: t('nav.advantages'), href: '#advantages' },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const productEl = document.getElementById('featured');
    if (productEl) {
      productEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-[100px] max-w-7xl items-center gap-6 px-5 sm:px-8 lg:px-10">
        {/* Brand Logo */}
        <a href="#home" className="flex shrink-0 items-center gap-3 text-ink group" aria-label={STORE_CONFIG.name}>
          <img src="/logo.png" alt={STORE_CONFIG.name} className="h-20 group-hover:scale-105 transition-transform" />
          <div className="flex flex-col">
            <span className="text-[15px] font-black uppercase tracking-[0.18em] text-ink leading-tight">{STORE_CONFIG.name}</span>
            <span className="text-[10px] font-bold tracking-widest text-accent-strong uppercase">{STORE_CONFIG.shortDescription}</span>
          </div>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-7 lg:flex ml-4" aria-label="Main navigation">
          {navigation.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="text-[13px] font-bold tracking-wide text-body transition-colors hover:text-accent-strong"
            >
              {item.name}
            </a>
          ))}
        </nav>

        {/* Search Bar & Actions */}
        <div className="ml-auto flex items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="hidden h-10 w-48 items-center gap-2 rounded-full border border-border bg-surface-raised px-4 text-muted transition-all focus-within:border-accent-border focus-within:w-64 md:flex">
            <svg className="h-4 w-4 shrink-0 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t('nav.searchPlaceholder')}
              className="min-w-0 flex-1 bg-transparent text-xs font-medium text-ink outline-none placeholder:text-placeholder"
            />
          </form>

          {/* Language Switcher */}
          <div className="flex items-center rounded-full border border-border bg-surface-raised p-1 text-[11px] font-extrabold">
            <button
              onClick={() => setLanguage('en')}
              className={`rounded-full px-2.5 py-1 transition-all ${language === 'en' ? 'bg-ink text-white shadow-xs' : 'text-muted hover:text-ink'
                }`}
              title="English"
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('pt')}
              className={`rounded-full px-2.5 py-1 transition-all ${language === 'pt' ? 'bg-ink text-white shadow-xs' : 'text-muted hover:text-ink'
                }`}
              title="Português"
            >
              PT
            </button>
          </div>

          {/* Cart Button */}
          <button
            type="button"
            onClick={onOpenCart}
            className="relative flex h-10 items-center gap-2.5 rounded-full bg-ink px-4 text-white shadow-sm transition-all hover:bg-ink/90 active:scale-95"
            aria-label={`${t('nav.cart')}, ${cartCount} ${t('cart.itemPlural')}`}
          >
            <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="text-xs font-bold">{t('nav.cart')}</span>
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-black text-ink">
              {cartCount}
            </span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-ink transition-colors hover:bg-surface-hover lg:hidden"
            aria-label={isMenuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <div className="border-t border-border bg-surface-raised px-5 pb-5 pt-4 lg:hidden shadow-lg animate-in slide-in-from-top-2">
          <form onSubmit={handleSearchSubmit} className="mb-4 flex h-11 items-center gap-2 rounded-full border border-border bg-surface px-4 text-muted focus-within:border-accent-border">
            <svg className="h-4 w-4 shrink-0 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t('nav.searchPlaceholder')}
              className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-placeholder"
            />
          </form>
          <nav className="grid gap-1" aria-label="Mobile navigation">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-bold text-body hover:bg-surface-hover hover:text-accent-strong transition-colors"
              >
                {item.name}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
