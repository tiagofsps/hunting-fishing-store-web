import { useState } from 'react';
import AddressForm from './AddressForm';
import type { AccountAddressFormData } from '../validation';
import type { Address, AuthUser } from '../../../types';
import { useLanguage } from '../../../i18n/useLanguage';

interface AddressesSectionProps {
  user: AuthUser;
  isSaving: boolean;
  onCreate: (data: AccountAddressFormData) => Promise<unknown>;
  onEdit: (addressId: number, data: AccountAddressFormData) => Promise<unknown>;
  onDelete: (addressId: number) => Promise<unknown>;
}

export default function AddressesSection({ user, isSaving, onCreate, onEdit, onDelete }: AddressesSectionProps) {
  const { t } = useLanguage();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [notice, setNotice] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const typeLabel = (address: Address) =>
    address.addressType === 'SHIPPING' ? t('account.addressTypeShipping') : t('account.addressTypeBilling');

  const handleDelete = async (addressId: number) => {
    setNotice('');
    setDeletingId(addressId);
    try {
      await onDelete(addressId);
      setNotice(t('account.addressDeleted'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="rounded-3xl border border-border bg-surface-raised p-6 sm:p-8">
      <h2 className="text-lg font-black tracking-tight text-ink">{t('account.addressesHeading')}</h2>
      <p className="mt-1 text-xs text-muted">{t('account.addressesDesc')}</p>

      {notice && (
        <p className="mt-4 rounded-xl border border-accent-border bg-accent/10 p-3 text-xs font-bold text-accent-strong">
          {notice}
        </p>
      )}

      {user.addresses.length === 0 && !isAdding ? (
        <p className="mt-6 rounded-2xl border border-dashed border-border bg-surface p-6 text-center text-xs font-bold text-muted">
          {t('account.noAddresses')}
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {user.addresses.map((address) => (
            <li key={address.id} className="rounded-2xl border border-border bg-surface p-5">
              {editingId === address.id ? (
                <AddressForm
                  address={address}
                  isSaving={isSaving}
                  submitLabel={t('account.saveAddress')}
                  onCancel={() => setEditingId(null)}
                  onSubmit={async (data) => {
                    await onEdit(address.id, data);
                    setEditingId(null);
                    setNotice(t('account.addressUpdated'));
                  }}
                />
              ) : (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-ink">{address.recipientName}</p>
                        <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-accent-strong">
                          {typeLabel(address)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted">{address.recipientPhone}</p>
                      <p className="mt-1 text-xs text-muted">
                        {address.street}, {address.postalCode} {address.city}, {address.countryCode}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(address.id);
                          setNotice('');
                        }}
                        className="rounded-lg border border-border bg-surface-raised px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-ink hover:bg-surface-hover"
                      >
                        {t('account.editAddress')}
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === address.id}
                        onClick={() => {
                          if (window.confirm(t('account.deleteAddressConfirm'))) void handleDelete(address.id);
                        }}
                        className="rounded-lg border border-sale/40 bg-sale/10 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-sale hover:bg-sale/20 disabled:opacity-50"
                      >
                        {deletingId === address.id ? t('account.saving') : t('account.deleteAddress')}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {isAdding ? (
        <div className="mt-4">
          <AddressForm
            address={null}
            isSaving={isSaving}
            submitLabel={t('account.addAddress')}
            onCancel={() => setIsAdding(false)}
            onSubmit={async (data) => {
              await onCreate(data);
              setIsAdding(false);
              setNotice(t('account.addressAdded'));
            }}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setIsAdding(true);
            setNotice('');
          }}
          className="mt-5 rounded-xl border border-accent-border bg-accent/10 px-6 py-3 text-xs font-bold uppercase tracking-wider text-accent-strong transition-all hover:bg-accent/20"
        >
          {t('account.addAddress')}
        </button>
      )}
    </section>
  );
}
