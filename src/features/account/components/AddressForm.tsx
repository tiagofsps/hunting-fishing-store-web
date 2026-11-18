import { useId } from 'react';
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
  const id = useId();

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
          <Label htmlFor={`${id}-recipientName`}>{t('account.recipientName')}</Label>
          <Input id={`${id}-recipientName`} type="text" {...form.register('recipientName')} />
          {form.formState.errors.recipientName && required}
        </div>
        <div>
          <Label htmlFor={`${id}-recipientPhone`}>{t('account.recipientPhone')}</Label>
          <Input id={`${id}-recipientPhone`} type="tel" {...form.register('recipientPhone')} />
          {form.formState.errors.recipientPhone && required}
        </div>
      </div>

      <div>
        <Label htmlFor={`${id}-street`}>{t('account.street')}</Label>
        <Input id={`${id}-street`} type="text" {...form.register('street')} />
        {form.formState.errors.street && required}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-1">
          <Label htmlFor={`${id}-postalCode`}>{t('account.postalCode')}</Label>
          <Input id={`${id}-postalCode`} type="text" {...form.register('postalCode')} />
          {form.formState.errors.postalCode && required}
        </div>
        <div className="sm:col-span-1">
          <Label htmlFor={`${id}-city`}>{t('account.city')}</Label>
          <Input id={`${id}-city`} type="text" {...form.register('city')} />
          {form.formState.errors.city && required}
        </div>
        <div className="sm:col-span-1">
          <Label htmlFor={`${id}-countryCode`}>{t('account.countryCode')}</Label>
          <Input id={`${id}-countryCode`} type="text" maxLength={2} {...form.register('countryCode')} />
          {form.formState.errors.countryCode && required}
        </div>
      </div>

      <div>
        <Label htmlFor={`${id}-addressType`}>{t('account.addressType')}</Label>
        <Select id={`${id}-addressType`} {...form.register('addressType')}>
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
