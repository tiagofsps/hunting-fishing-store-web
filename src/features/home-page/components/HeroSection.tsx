import { useLanguage } from '../../../i18n/useLanguage';
import { STORE_CONFIG } from '../../../config/store';

export default function HeroSection() {
  const { t } = useLanguage();

  return (
    <section id="home" className="relative overflow-hidden bg-surface py-16 sm:py-24 lg:py-32">
      {/* Background Graphic Accents */}
      <div className="absolute top-1/4 -left-48 h-96 w-96 rounded-full bg-accent/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-0 h-96 w-96 rounded-full bg-accent-strong/10 blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          {/* Main Text Content */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent-border/50 bg-accent/15 px-4 py-1.5 text-xs font-bold text-accent-strong mb-6 shadow-xs">
              <span className="flex h-2 w-2 rounded-full bg-accent-strong animate-ping"></span>
              {t('hero.badge')}
            </div>

            <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-ink sm:text-6xl lg:text-7xl">
              {t('hero.titlePart1')}
              <span className="underline decoration-accent decoration-wavy underline-offset-8">
                {t('hero.titleHighlight')}
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-body sm:text-lg">
              {t('hero.subtitle')}
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#featured"
                className="group flex items-center gap-3 rounded-full bg-ink px-8 py-4 text-sm font-bold uppercase tracking-widest text-white shadow-lg transition-all hover:bg-ink/90 active:scale-95"
              >
                {t('hero.ctaPrimary')}
                <svg className="h-4 w-4 text-accent transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>

            {/* Quick Stats Badges */}
            <div className="mt-12 grid grid-cols-3 gap-4 border-t border-border/80 pt-8 max-w-lg">
              <div>
                <span className="text-2xl font-black text-ink sm:text-3xl">{t('hero.stat1Number')}</span>
                <p className="text-xs font-medium text-muted mt-1">{t('hero.stat1Label')}</p>
              </div>
              <div>
                <span className="text-2xl font-black text-ink sm:text-3xl">{t('hero.stat2Number')}</span>
                <p className="text-xs font-medium text-muted mt-1">{t('hero.stat2Label')}</p>
              </div>
              <div>
                <span className="text-2xl font-black text-ink sm:text-3xl">{t('hero.stat3Number')}</span>
                <p className="text-xs font-medium text-muted mt-1">{t('hero.stat3Label')}</p>
              </div>
            </div>
          </div>

          {/* Feature Highlight Graphic / Visual Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md rounded-3xl border border-border bg-surface-raised p-4 shadow-xl">
              <div className="relative aspect-4/5 overflow-hidden rounded-2xl bg-surface">
                <img
                  src="/images/hero/outdoor.svg"
                  alt={`Equipamento ${STORE_CONFIG.name}`}
                  className="h-full w-full object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />

                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <span className="rounded-full bg-accent px-3 py-1 text-[10px] font-black uppercase text-ink">
                    {t('hero.cardBadge')}
                  </span>
                  <h3 className="mt-2 text-xl font-bold leading-tight">
                    {t('hero.cardTitle')}
                  </h3>
                  <p className="mt-1 text-xs text-white/80">
                    {t('hero.cardSubtitle')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


