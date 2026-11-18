import { useEffect, useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { listCoupons, createCoupon, type AdminCoupon } from '../api';
import { adminCouponSchema, type AdminCouponFormData } from '../validation';
import { toOptionalNumber } from '../utils';
import { formatCurrency } from '../../../utils';
import { useLanguage } from '../../../i18n/useLanguage';
import { useAdminError } from '../hooks';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Select } from '../../../components/ui/Select';

export default function AdminCouponsPage() {
  const { t } = useLanguage();
  const id = useId();
  const describeError = useAdminError();
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  const form = useForm<AdminCouponFormData>({
    resolver: zodResolver(adminCouponSchema),
    defaultValues: {
      code: '',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      validFrom: '',
      validTo: '',
    },
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const data = await listCoupons();
        if (!cancelled) setCoupons(data);
      } catch (err) {
        if (!cancelled) setError(describeError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [reloadToken, describeError]);

  const handleSubmit = form.handleSubmit(async (data) => {
    setError('');
    setNotice('');
    setIsSaving(true);
    try {
      await createCoupon({
        code: data.code,
        discountType: data.discountType,
        discountValue: data.discountValue,
        ...(data.minOrderAmount ? { minOrderAmount: data.minOrderAmount } : {}),
        ...(data.usageLimit ? { usageLimit: data.usageLimit } : {}),
        ...(data.usageLimitPerUser ? { usageLimitPerUser: data.usageLimitPerUser } : {}),
        validFrom: data.validFrom,
        validTo: data.validTo,
      });
      setNotice(t('admin.movementRecorded'));
      form.reset();
      setReloadToken((token) => token + 1);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setIsSaving(false);
    }
  });

  return (
    <div>
      <header className="border-b border-border pb-6">
        <span className="text-xs font-bold uppercase tracking-widest text-accent-strong">{t('admin.coupons')}</span>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-ink">{t('admin.couponsTitle')}</h2>
        <p className="mt-1 text-xs text-muted">{t('admin.couponsSubtitle')}</p>
      </header>

      <p className="mt-6 rounded-xl border border-border bg-surface-raised p-3 text-xs text-muted">
        {t('admin.couponsReadOnlyNote')}
      </p>

      {error && (
        <p className="mt-6 rounded-xl border border-sale/30 bg-sale/10 p-3 text-xs font-bold text-sale">
          {t('admin.errorTitle')} {error}
        </p>
      )}
      {notice && (
        <p className="mt-6 rounded-xl border border-accent-border bg-accent/10 p-3 text-xs font-bold text-accent-strong">
          {notice}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-2xl border border-border bg-surface-raised p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor={`${id}-code`}>{t('admin.couponCode')}</Label>
            <Input id={`${id}-code`} type="text" {...form.register('code')} />
          </div>
          <div>
            <Label htmlFor={`${id}-discountType`}>{t('admin.discountType')}</Label>
            <Select id={`${id}-discountType`} {...form.register('discountType')}>
              <option value="PERCENTAGE">{t('admin.discountPercentage')}</option>
              <option value="FIXED_AMOUNT">{t('admin.discountFixed')}</option>
            </Select>
          </div>
          <div>
            <Label htmlFor={`${id}-discountValue`}>{t('admin.discountValue')}</Label>
            <Input
              id={`${id}-discountValue`}
              type="number"
              step="0.01"
              {...form.register('discountValue', { valueAsNumber: true })}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor={`${id}-minOrderAmount`}>{t('admin.minOrderAmount')}</Label>
            <Input
              id={`${id}-minOrderAmount`}
              type="number"
              step="0.01"
              {...form.register('minOrderAmount', { setValueAs: toOptionalNumber })}
            />
          </div>
          <div>
            <Label htmlFor={`${id}-usageLimit`}>{t('admin.usageLimit')}</Label>
            <Input
              id={`${id}-usageLimit`}
              type="number"
              {...form.register('usageLimit', { setValueAs: toOptionalNumber })}
            />
          </div>
          <div>
            <Label htmlFor={`${id}-usageLimitPerUser`}>{t('admin.usageLimitPerUser')}</Label>
            <Input
              id={`${id}-usageLimitPerUser`}
              type="number"
              {...form.register('usageLimitPerUser', { setValueAs: toOptionalNumber })}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor={`${id}-validFrom`}>{t('admin.validFrom')}</Label>
            <Input id={`${id}-validFrom`} type="datetime-local" {...form.register('validFrom')} />
          </div>
          <div>
            <Label htmlFor={`${id}-validTo`}>{t('admin.validTo')}</Label>
            <Input id={`${id}-validTo`} type="datetime-local" {...form.register('validTo')} />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="rounded-xl bg-ink px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-ink/90 disabled:opacity-50"
        >
          {isSaving ? t('admin.saving') : t('admin.createCoupon')}
        </button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-surface-raised">
        <table className="w-full min-w-[720px] text-left text-xs">
          <thead className="border-b border-border text-[10px] uppercase tracking-widest text-muted">
            <tr>
              <th className="px-5 py-3 font-bold">{t('admin.couponCode')}</th>
              <th className="px-5 py-3 font-bold">{t('admin.discountType')}</th>
              <th className="px-5 py-3 font-bold">{t('admin.discountValue')}</th>
              <th className="px-5 py-3 font-bold">{t('admin.minOrderAmount')}</th>
              <th className="px-5 py-3 font-bold">{t('admin.usageLimit')}</th>
              <th className="px-5 py-3 font-bold">{t('admin.validTo')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center font-bold text-muted">
                  {t('common.loading')}
                </td>
              </tr>
            ) : coupons.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center font-bold text-muted">
                  {t('admin.noCoupons')}
                </td>
              </tr>
            ) : (
              coupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-surface-hover">
                  <td className="px-5 py-3 font-black text-ink">{coupon.code}</td>
                  <td className="px-5 py-3 text-muted">
                    {coupon.discountType === 'PERCENTAGE'
                      ? t('admin.discountPercentage')
                      : t('admin.discountFixed')}
                  </td>
                  <td className="px-5 py-3 font-bold text-ink">
                    {coupon.discountType === 'PERCENTAGE'
                      ? `${coupon.discountValue}%`
                      : formatCurrency(coupon.discountValue)}
                  </td>
                  <td className="px-5 py-3 text-muted">
                    {coupon.minOrderAmount ? formatCurrency(coupon.minOrderAmount) : '—'}
                  </td>
                  <td className="px-5 py-3 text-muted">{coupon.usageLimit ?? '—'}</td>
                  <td className="px-5 py-3 text-muted">{new Date(coupon.validTo).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
