import { useState } from 'react';
import { Link } from 'react-router';
import ProfileSection from './ProfileSection';
import AddressesSection from './AddressesSection';
import PasswordSection from './PasswordSection';
import { useAccountMutations } from '../hooks';
import { useAuth } from '../../../providers/useAuth';
import { useLanguage } from '../../../i18n/useLanguage';

type Tab = 'profile' | 'addresses' | 'password';

export default function AccountPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const {
    isSavingProfile,
    isSavingAddress,
    isChangingPassword,
    error,
    saveProfile,
    createAddress,
    editAddress,
    removeAddress,
    updatePassword,
  } = useAccountMutations();

  if (!user) return null;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'profile', label: t('account.tabProfile') },
    { id: 'addresses', label: t('account.tabAddresses') },
    { id: 'password', label: t('account.tabPassword') },
  ];

  return (
    <div className="bg-surface py-10 sm:py-14">
      <div className="mx-auto max-w-4xl px-5 sm:px-8 lg:px-10">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-accent-strong">{t('account.subtitle')}</span>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-ink sm:text-4xl">{t('account.title')}</h1>
          </div>
          <Link
            to="/account/orders"
            className="rounded-xl border border-border bg-surface-raised px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-ink hover:bg-surface-hover"
          >
            {t('account.viewOrders')}
          </Link>
        </header>

        <nav className="mt-8 flex gap-6 border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`-mb-px border-b-2 pb-3 text-sm font-black uppercase tracking-wider transition-all ${
                activeTab === tab.id ? 'border-accent-strong text-ink' : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {error && (
          <p className="mt-6 rounded-xl border border-sale/30 bg-sale/10 p-3 text-xs font-bold text-sale">
            {t('account.errorTitle')} {error}
          </p>
        )}

        <div className="mt-8">
          {activeTab === 'profile' && <ProfileSection user={user} isSaving={isSavingProfile} onSave={saveProfile} />}
          {activeTab === 'addresses' && (
            <AddressesSection
              user={user}
              isSaving={isSavingAddress}
              onCreate={createAddress}
              onEdit={editAddress}
              onDelete={removeAddress}
            />
          )}
          {activeTab === 'password' && (
            <PasswordSection isSaving={isChangingPassword} onChangePassword={updatePassword} />
          )}
        </div>
      </div>
    </div>
  );
}
