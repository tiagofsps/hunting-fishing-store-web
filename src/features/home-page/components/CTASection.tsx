import { useState } from 'react';
import { useLanguage } from '../../../i18n/LanguageContext';

export default function CTASection() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
      setEmail('');
    }
  };

  return (
    <section id="newsletter" className="bg-ink py-24 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 -mr-20 -mt-20 h-80 w-80 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl px-5 text-center sm:px-8 lg:px-10 relative z-10">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
            {t('cta.title')}
          </h2>
          <p className="mt-4 text-base text-white/70">
            {t('cta.subtitle')}
          </p>

          {submitted ? (
            <div className="mt-8 rounded-2xl bg-accent/20 border border-accent/40 p-6 text-accent">
              <p className="font-bold text-lg">{t('cta.successTitle')}</p>
              <p className="text-xs text-white/80 mt-1">{t('cta.successSub')}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('cta.emailPlaceholder')}
                className="flex-1 rounded-xl bg-white/10 px-4 py-3.5 text-sm text-white placeholder:text-white/40 border border-white/20 outline-none focus:border-accent"
              />
              <button
                type="submit"
                className="rounded-xl bg-accent px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-ink transition-all hover:bg-accent/90 active:scale-95 shrink-0"
              >
                {t('cta.subscribe')}
              </button>
            </form>
          )}

          <p className="mt-4 text-[11px] text-white/40">
            {t('cta.disclaimer')}
          </p>
        </div>
      </div>
    </section>
  );
}
