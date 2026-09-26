import { Link } from 'react-router';
import { useLanguage } from '../i18n/useLanguage';

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-5 py-24 text-center">
      <p className="text-7xl font-black text-accent-strong">404</p>
      <h1 className="mt-4 text-2xl font-black tracking-tight text-ink sm:text-3xl">
        {t('common.notFoundTitle')}
      </h1>
      <p className="mt-2 text-sm text-muted">{t('common.notFoundDesc')}</p>
      <Link
        to="/"
        className="mt-8 rounded-xl bg-ink px-6 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-ink/90"
      >
        {t('common.goHome')}
      </Link>
    </div>
  );
}