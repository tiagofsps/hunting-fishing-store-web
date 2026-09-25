import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLanguage } from '../../../i18n/useLanguage';
import { ApiError } from '../../../lib/apiClient';
import { newsletterSchema, type NewsletterFormData } from '../validation';
import { subscribeNewsletter } from '../api';

export default function CTASection() {
  const { t } = useLanguage();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewsletterFormData>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: NewsletterFormData) => {
    setError('');
    setIsSubmitting(true);
    try {
      await subscribeNewsletter(data.email);
      setSubmitted(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError(t('cta.errorAlreadySubscribed'));
      } else {
        setError(t('cta.errorGeneric'));
      }
    } finally {
      setIsSubmitting(false);
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
            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <div className="flex-1">
                <input
                  type="email"
                  {...register('email')}
                  placeholder={t('cta.emailPlaceholder')}
                  className="w-full rounded-xl bg-white/10 px-4 py-3.5 text-sm text-white placeholder:text-white/40 border border-white/20 outline-none focus:border-accent"
                />
                {errors.email && (
                  <p className="mt-1 text-[11px] font-bold text-sale text-left">{t('auth.errorInvalidEmail')}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-accent px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-ink transition-all hover:bg-accent/90 active:scale-95 shrink-0 disabled:opacity-50"
              >
                {isSubmitting ? t('cta.submitting') : t('cta.subscribe')}
              </button>
            </form>
          )}

          {error && (
            <p className="mt-3 text-xs font-bold text-sale">{error}</p>
          )}

          <p className="mt-4 text-[11px] text-white/40">
            {t('cta.disclaimer')}
          </p>
        </div>
      </div>
    </section>
  );
}