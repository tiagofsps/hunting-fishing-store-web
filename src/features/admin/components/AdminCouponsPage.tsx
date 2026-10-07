import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { listCoupons, createCoupon, type AdminCoupon } from '../api';
import { adminCouponSchema, type AdminCouponFormData } from '../validation';
import { formatCurrency } from '../../../utils';
import { useLanguage } from '../../../i18n/useLanguage';
import { useAdminError } from '../hooks';

const inputClass =
  'w-full rounded-xl bg-surface px-4 py-3 text-xs border border-border outline-none focus:border-accent-strong text-ink font-medium';

const fieldClass = 'mb-1 block text-xs font-bold text-ink';

export default function AdminCouponsPage() {
  const { t } = useLanguage();
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
            <label className={fieldClass}>{t('admin.couponCode')}</label>
            <input type="text" {...form.register('code')} className={inputClass} />
          </div>
          <div>
            <label className={fieldClass}>{t('admin.discountType')}</label>
            <select {...form.register('discountType')} className={inputClass}>
              <option value="PERCENTAGE">{t('admin.discountPercentage')}</option>
              <option value="FIXED_AMOUNT">{t('admin.discountFixed')}</option>
            </select>
          </div>
          <div>
            <label className={fieldClass}>{t('admin.discountValue')}</label>
            <input
              type="number"
              step="0.01"
              {...form.register('discountValue', { valueAsNumber: true })}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={fieldClass}>{t('admin.minOrderAmount')}</label>
            <input
              type="number"
              step="0.01"
              {...form.register('minOrderAmount', { valueAsNumber: true })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={fieldClass}>{t('admin.usageLimit')}</label>
            <input
              type="number"
              {...form.register('usageLimit', { valueAsNumber: true })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={fieldClass}>{t('admin.usageLimitPerUser')}</label>
            <input
              type="number"
              {...form.register('usageLimitPerUser', { valueAsNumber: true })}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={fieldClass}>{t('admin.validFrom')}</label>
            <input type="datetime-local" {...form.register('validFrom')} className={inputClass} />
          </div>
          <div>
            <label className={fieldClass}>{t('admin.validTo')}</label>
            <input type="datetime-local" {...form.register('validTo')} className={inputClass} />
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
