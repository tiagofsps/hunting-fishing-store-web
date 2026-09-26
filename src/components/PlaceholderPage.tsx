import { Link } from 'react-router';
import { useLanguage } from '../i18n/useLanguage';

export default function PlaceholderPage({ titleKey }: { titleKey: string }) {
  const { t } = useLanguage();

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-5 py-24 text-center">
      <div className="rounded-3xl border border-border bg-surface-raised p-10">
        <h1 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">{t(titleKey)}</h1>
        <p className="mt-3 text-sm text-muted">{t('common.placeholderDesc')}</p>
        <Link
          to="/"
          className="mt-8 inline-block rounded-xl bg-ink px-6 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-ink/90"
        >
          {t('common.goHome')}
        </Link>
      </div>
    </div>
  );
}