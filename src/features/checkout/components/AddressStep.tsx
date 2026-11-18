import { useId } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useLanguage } from '../../../i18n/useLanguage';
import type { Address } from '../../../types';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Select } from '../../../components/ui/Select';
import type { AddressFormData } from '../validation';

interface AddressStepProps {
  addresses: Address[];
  selectedAddressId: number | null;
  onSelectAddress: (id: number) => void;
  showAddressForm: boolean;
  onShowAddressForm: (show: boolean) => void;
  addressForm: UseFormReturn<AddressFormData>;
  onSaveAddress: (data: AddressFormData) => Promise<void>;
  isSavingAddress: boolean;
  onContinue: () => void;
}

/** Step 1: pick a saved shipping address, or create a new one. */
export function AddressStep({
  addresses,
  selectedAddressId,
  onSelectAddress,
  showAddressForm,
  onShowAddressForm,
  addressForm,
  onSaveAddress,
  isSavingAddress,
  onContinue,
}: AddressStepProps) {
  const { t } = useLanguage();
  const id = useId();

  return (
    <div className="space-y-4">
      {addresses.length > 0 && !showAddressForm ? (
        <>
          <h3 className="text-sm font-bold text-ink">{t('checkout.selectAddress')}</h3>
          <div className="space-y-3" role="radiogroup" aria-label={t('checkout.selectAddress')}>
            {addresses.map((addr) => (
              <div
                key={addr.id}
                onClick={() => onSelectAddress(addr.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelectAddress(addr.id);
                  }
                }}
                role="radio"
                aria-checked={selectedAddressId === addr.id}
                tabIndex={0}
                className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                  selectedAddressId === addr.id
                    ? 'border-accent-strong bg-accent/15 ring-2 ring-accent-strong'
                    : 'border-border bg-surface hover:border-accent-border'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-ink">{addr.recipientName}</p>
                    <p className="mt-1 text-xs text-muted">
                      {addr.street}, {addr.postalCode} {addr.city}
                    </p>
                    <p className="text-xs text-muted">
                      {addr.countryCode} • {addr.recipientPhone}
                    </p>
                  </div>
                  <span className="flex h-3 w-3 shrink-0 items-center justify-center rounded-full border border-ink">
                    {selectedAddressId === addr.id && <span className="h-2 w-2 rounded-full bg-accent-strong" />}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onShowAddressForm(true)}
            className="text-xs font-bold text-accent-strong hover:underline"
          >
            + {t('checkout.addNewAddress')}
          </button>
          <div className="mt-8 flex justify-end border-t border-border pt-4">
            <button
              type="button"
              onClick={onContinue}
              disabled={selectedAddressId === null}
              className="rounded-xl bg-ink px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-ink/90 disabled:opacity-50"
            >
              {t('checkout.next')} →
            </button>
          </div>
        </>
      ) : (
        <form onSubmit={addressForm.handleSubmit(onSaveAddress)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor={`${id}-recipientName`}>{t('checkout.recipientName')} *</Label>
              <Input id={`${id}-recipientName`} type="text" {...addressForm.register('recipientName')} />
              {addressForm.formState.errors.recipientName && (
                <p className="mt-1 text-[11px] font-bold text-sale">{t('checkout.errorRequired')}</p>
              )}
            </div>
            <div>
              <Label htmlFor={`${id}-recipientPhone`}>{t('checkout.recipientPhone')} *</Label>
              <Input id={`${id}-recipientPhone`} type="tel" {...addressForm.register('recipientPhone')} />
              {addressForm.formState.errors.recipientPhone && (
                <p className="mt-1 text-[11px] font-bold text-sale">{t('checkout.errorRequired')}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor={`${id}-street`}>{t('checkout.address')} *</Label>
            <Input id={`${id}-street`} type="text" {...addressForm.register('street')} />
            {addressForm.formState.errors.street && (
              <p className="mt-1 text-[11px] font-bold text-sale">{t('checkout.errorRequired')}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor={`${id}-postalCode`}>{t('checkout.postalCode')} *</Label>
              <Input id={`${id}-postalCode`} type="text" placeholder="4000-000" {...addressForm.register('postalCode')} />
              {addressForm.formState.errors.postalCode && (
                <p className="mt-1 text-[11px] font-bold text-sale">{t('checkout.errorRequired')}</p>
              )}
            </div>
            <div>
              <Label htmlFor={`${id}-city`}>{t('checkout.city')} *</Label>
              <Input id={`${id}-city`} type="text" {...addressForm.register('city')} />
              {addressForm.formState.errors.city && (
                <p className="mt-1 text-[11px] font-bold text-sale">{t('checkout.errorRequired')}</p>
              )}
            </div>
            <div>
              <Label htmlFor={`${id}-countryCode`}>{t('checkout.countryCode')} *</Label>
              <Input id={`${id}-countryCode`} type="text" maxLength={2} placeholder="PT" {...addressForm.register('countryCode')} />
              {addressForm.formState.errors.countryCode && (
                <p className="mt-1 text-[11px] font-bold text-sale">{t('checkout.errorCountryCode')}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor={`${id}-addressType`}>{t('checkout.addressType')}</Label>
            <Select id={`${id}-addressType`} {...addressForm.register('addressType')}>
              <option value="SHIPPING">{t('checkout.shipping')}</option>
              <option value="BILLING">{t('checkout.billing')}</option>
            </Select>
          </div>

          <div className="mt-8 flex justify-between border-t border-border pt-4">
            {addresses.length > 0 && (
              <button
                type="button"
                onClick={() => onShowAddressForm(false)}
                className="rounded-xl border border-border bg-surface px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-ink hover:bg-surface-hover"
              >
                {t('checkout.cancel')}
              </button>
            )}
            <button
              type="submit"
              disabled={isSavingAddress}
              className="rounded-xl bg-ink px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-ink/90 disabled:opacity-50"
            >
              {isSavingAddress ? '...' : t('checkout.saveAddress')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
