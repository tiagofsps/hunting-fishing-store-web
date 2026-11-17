import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useLanguage } from '../i18n/useLanguage';
import { useAuth } from '../providers/useAuth';

const itemClassName =
  'relative flex w-full cursor-pointer select-none items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold text-body outline-none transition-colors hover:bg-surface-hover hover:text-ink focus:bg-surface-hover focus:text-ink';

export default function UserMenu() {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!user) {
    return null;
  }

  const select = (action: () => void) => () => {
    setIsOpen(false);
    action();
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={t('nav.userMenu')}
        onClick={() => setIsOpen((open) => !open)}
        className="group flex h-10 cursor-pointer items-center gap-2 rounded-full border border-border bg-surface-raised pl-3 pr-2.5 text-xs text-ink transition-colors hover:bg-surface-hover"
      >
        <span className="flex items-center gap-1.5 font-black">
          <span
            className={`h-2 w-2 rounded-full ${user.role === 'ADMIN' ? 'bg-sale' : 'bg-accent-strong'}`}
            aria-hidden="true"
          />
          {user.firstName}
        </span>
        <svg
          className={`h-3.5 w-3.5 text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label={t('nav.userMenu')}
          className="absolute right-0 z-50 mt-2 min-w-56 rounded-2xl border border-border bg-surface-raised shadow-lg"
        >
          <div className="px-3 py-2">
            <span className="block text-sm font-black text-ink">
              {user.firstName} {user.lastName}
            </span>
            <span className="block truncate text-[11px] font-medium text-muted">{user.email}</span>
          </div>

          <div className="my-1 border-t border-border" />

          <div className="flex flex-col gap-0.5 p-1.5">
            <button type="button" role="menuitem" onClick={select(() => navigate('/account'))} className={itemClassName}>
              {t('nav.account')}
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={select(() => navigate('/account/orders'))}
              className={itemClassName}
            >
              {t('nav.myOrders')}
            </button>
            {user?.role === 'ADMIN' && (
              <button
                type="button"
                role="menuitem"
                onClick={select(() => navigate('/admin'))}
                className={itemClassName}
              >
                {t('nav.admin')}
              </button>
            )}
          </div>

          <div className="my-1 border-t border-border" />

          <div className="p-1.5 pt-0">
            <button
              type="button"
              role="menuitem"
              onClick={select(() => logout())}
              className={`${itemClassName} text-sale hover:bg-sale/10 hover:text-sale focus:bg-sale/10 focus:text-sale`}
            >
              {t('auth.logout')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
