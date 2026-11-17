import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { accountAddressSchema, type AccountAddressFormData } from '../validation';
import type { Address } from '../../../types';
import { useLanguage } from '../../../i18n/useLanguage';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Select } from '../../../components/ui/Select';

interface AddressFormProps {
  address: Address | null;
  isSaving: boolean;
  submitLabel: string;
  onSubmit: (data: AccountAddressFormData) => Promise<unknown>;
  onCancel?: () => void;
}

export default function AddressForm({ address, isSaving, submitLabel, onSubmit, onCancel }: AddressFormProps) {
  const { t } = useLanguage();

  const form = useForm<AccountAddressFormData>({
    resolver: zodResolver(accountAddressSchema),
    defaultValues: {
      recipientName: address?.recipientName ?? '',
      recipientPhone: address?.recipientPhone ?? '',
      street: address?.street ?? '',
      city: address?.city ?? '',
      postalCode: address?.postalCode ?? '',
      countryCode: address?.countryCode ?? 'PT',
      addressType: address?.addressType ?? 'SHIPPING',
    },
  });

  const required = <p className="mt-1 text-[11px] font-bold text-sale">{t('account.errorRequired')}</p>;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 rounded-2xl border border-border bg-surface p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>{t('account.recipientName')}</Label>
          <Input type="text" {...form.register('recipientName')} />
          {form.formState.errors.recipientName && required}
        </div>
        <div>
          <Label>{t('account.recipientPhone')}</Label>
          <Input type="tel" {...form.register('recipientPhone')} />
          {form.formState.errors.recipientPhone && required}
        </div>
      </div>

      <div>
        <Label>{t('account.street')}</Label>
        <Input type="text" {...form.register('street')} />
        {form.formState.errors.street && required}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-1">
          <Label>{t('account.postalCode')}</Label>
          <Input type="text" {...form.register('postalCode')} />
          {form.formState.errors.postalCode && required}
        </div>
        <div className="sm:col-span-1">
          <Label>{t('account.city')}</Label>
          <Input type="text" {...form.register('city')} />
          {form.formState.errors.city && required}
        </div>
        <div className="sm:col-span-1">
          <Label>{t('account.countryCode')}</Label>
          <Input type="text" maxLength={2} {...form.register('countryCode')} />
          {form.formState.errors.countryCode && required}
        </div>
      </div>

      <div>
        <Label>{t('account.addressType')}</Label>
        <Select {...form.register('addressType')}>
          <option value="SHIPPING">{t('account.addressTypeShipping')}</option>
          <option value="BILLING">{t('account.addressTypeBilling')}</option>
        </Select>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-xl bg-ink px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-ink/90 disabled:opacity-50"
        >
          {isSaving ? t('account.saving') : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-border bg-surface-raised px-6 py-3 text-xs font-bold uppercase tracking-wider text-ink transition-all hover:bg-surface-hover"
          >
            {t('account.cancel')}
          </button>
        )}
      </div>
    </form>
  );
}
