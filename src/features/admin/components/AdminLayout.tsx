import { NavLink, Outlet, Link } from 'react-router';
import { useLanguage } from '../../../i18n/useLanguage';

export default function AdminLayout() {
  const { t } = useLanguage();

  const nav = [
    { to: '/admin', label: t('admin.dashboard'), end: true },
    { to: '/admin/products', label: t('admin.products') },
    { to: '/admin/categories', label: t('admin.categories') },
    { to: '/admin/brands', label: t('admin.brands') },
    { to: '/admin/stock', label: t('admin.stock') },
    { to: '/admin/orders', label: t('admin.orders') },
    { to: '/admin/coupons', label: t('admin.coupons') },
    { to: '/admin/promotions', label: t('admin.promotions') },
    { to: '/admin/newsletter', label: t('admin.newsletter') },
    { to: '/admin/users', label: t('admin.users') },
  ];

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `block rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
      isActive ? 'bg-ink text-white shadow-sm' : 'text-muted hover:bg-surface-hover hover:text-ink'
    }`;

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-10 sm:px-8 lg:flex-row lg:px-10">
        <aside className="lg:w-56 lg:shrink-0">
          <div className="flex items-center justify-between lg:block">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-accent-strong">{t('admin.title')}</p>
              <h1 className="mt-1 text-xl font-black tracking-tight text-ink">{t('admin.console')}</h1>
            </div>
            <Link
              to="/"
              className="text-xs font-bold uppercase tracking-wider text-muted hover:text-ink lg:mt-2 lg:block"
            >
              ← {t('admin.backToStore')}
            </Link>
          </div>

          <nav className="mt-6 flex flex-wrap gap-1 lg:mt-8 lg:flex-col lg:gap-0.5">
            {nav.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
