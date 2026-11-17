import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../features/auth/hooks';
import { useOverlays } from './overlay-context';
import { useLanguage } from '../i18n/useLanguage';
import { Spinner } from './ui/Spinner';

export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, status } = useAuth();
  const { openAuth } = useOverlays();
  const { t } = useLanguage();
  const location = useLocation();

  useEffect(() => {
    if (status === 'guest') openAuth();
  }, [status, openAuth]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location.pathname }} replace />;
  }

  if (user.role !== 'ADMIN') {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-5 py-24 text-center">
        <h1 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">{t('admin.forbiddenTitle')}</h1>
        <p className="mt-2 text-sm text-muted">{t('admin.forbiddenDesc')}</p>
      </div>
    );
  }

  return <>{children}</>;
}
