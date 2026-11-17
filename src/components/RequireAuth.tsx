import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../features/auth/hooks';
import { useOverlays } from './overlay-context';
import { Spinner } from './ui/Spinner';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const { openAuth } = useOverlays();
  const location = useLocation();

  const isGuest = status === 'guest';

  useEffect(() => {
    if (isGuest) openAuth();
  }, [isGuest, openAuth]);

  if (status === 'loading') {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (isGuest) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}