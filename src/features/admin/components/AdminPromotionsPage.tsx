import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  listPromotions,
  createPromotion,
  deletePromotion,
  type AdminPromotion,
  type PromotionTargetType,
} from '../api';
import { adminPromotionSchema, type AdminPromotionFormData } from '../validation';
import { formatCurrency } from '../../../utils';
import { useLanguage } from '../../../i18n/useLanguage';
import { useAdminError } from '../hooks';

const inputClass =
  'w-full rounded-xl bg-surface px-4 py-3 text-xs border border-border outline-none focus:border-accent-strong text-ink font-medium';

const fieldClass = 'mb-1 block text-xs font-bold text-ink';

const TARGET_KEYS: Record<PromotionTargetType, string> = {
  CATEGORY: 'admin.targetCategory',
  BRAND: 'admin.targetBrand',
  PRODUCT: 'admin.targetProduct',
};

export default function AdminPromotionsPage() {
  const { t } = useLanguage();
  const describeError = useAdminError();
  const [promotions, setPromotions] = useState<AdminPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  const form = useForm<AdminPromotionFormData>({
    resolver: zodResolver(adminPromotionSchema),
    defaultValues: {
      name: '',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      stackable: false,
      validFrom: '',
      validTo: '',
      rules: [],
    },
  });

  const rulesField = useFieldArray({ control: form.control, name: 'rules' });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const data = await listPromotions();
        if (!cancelled) setPromotions(data);
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
      await createPromotion({
        name: data.name,
        discountType: data.discountType,
        discountValue: data.discountValue,
        ...(data.priority !== undefined ? { priority: data.priority } : {}),
        stackable: data.stackable,
        validFrom: data.validFrom,
        validTo: data.validTo,
        rules: data.rules.map((rule) => ({ targetType: rule.targetType, targetId: rule.targetId })),
      });
      setNotice(t('admin.movementRecorded'));
      form.reset();
      rulesField.replace([]);
      setReloadToken((token) => token + 1);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setIsSaving(false);
    }
  });

  const handleDelete = async (promotion: AdminPromotion) => {
    if (!window.confirm(t('admin.deletePromotionConfirm'))) return;
    setError('');
    setNotice('');
    try {
      await deletePromotion(promotion.id);
      setReloadToken((token) => token + 1);
    } catch (err) {
      setError(describeError(err));
    }
  };

  return (
    <div>
      <header className="border-b border-border pb-6">
        <span className="text-xs font-bold uppercase tracking-widest text-accent-strong">{t('admin.promotions')}</span>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-ink">{t('admin.promotionsTitle')}</h2>
        <p className="mt-1 text-xs text-muted">{t('admin.promotionsSubtitle')}</p>
      </header>

      <p className="mt-6 rounded-xl border border-border bg-surface-raised p-3 text-xs text-muted">
        {t('admin.promotionsEditNote')}
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
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <label className={fieldClass}>{t('admin.promotionName')}</label>
            <input type="text" {...form.register('name')} className={inputClass} />
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

        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <label className={fieldClass}>{t('admin.priority')}</label>
            <input
              type="number"
              {...form.register('priority', { valueAsNumber: true })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={fieldClass}>{t('admin.validFrom')}</label>
            <input type="datetime-local" {...form.register('validFrom')} className={inputClass} />
          </div>
          <div>
            <label className={fieldClass}>{t('admin.validTo')}</label>
            <input type="datetime-local" {...form.register('validTo')} className={inputClass} />
            {form.formState.errors.validTo && (
              <p className="mt-1 text-[11px] font-bold text-sale">{t('admin.validRangeInvalid')}</p>
            )}
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 pb-3 text-xs font-bold text-ink">
              <input type="checkbox" {...form.register('stackable')} className="h-4 w-4 accent-accent-strong" />
              {t('admin.stackable')}
            </label>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
              {t('admin.promotionRules')}
            </span>
            <button
              type="button"
              onClick={() => rulesField.append({ targetType: 'PRODUCT', targetId: 0 })}
              className="rounded-lg border border-accent-border bg-accent/10 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-accent-strong"
            >
              {t('admin.addRule')}
            </button>
          </div>

          {rulesField.fields.length === 0 ? (
            <p className="text-[10px] font-bold text-muted">{t('admin.globalPromotion')}</p>
          ) : (
            <ul className="space-y-2">
              {rulesField.fields.map((field, index) => (
                <li key={field.id} className="grid gap-3 sm:grid-cols-3">
                  <select {...form.register(`rules.${index}.targetType`)} className={inputClass}>
                    <option value="CATEGORY">{t('admin.targetCategory')}</option>
                    <option value="BRAND">{t('admin.targetBrand')}</option>
                    <option value="PRODUCT">{t('admin.targetProduct')}</option>
                  </select>
                  <input
                    type="number"
                    {...form.register(`rules.${index}.targetId`, { valueAsNumber: true })}
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => rulesField.remove(index)}
                    className="rounded-lg border border-sale/40 bg-sale/10 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-sale"
                  >
                    {t('admin.removeRow')}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="rounded-xl bg-ink px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-ink/90 disabled:opacity-50"
        >
          {isSaving ? t('admin.saving') : t('admin.createPromotion')}
        </button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-surface-raised">
        <table className="w-full min-w-[720px] text-left text-xs">
          <thead className="border-b border-border text-[10px] uppercase tracking-widest text-muted">
            <tr>
              <th className="px-5 py-3 font-bold">{t('admin.promotionName')}</th>
              <th className="px-5 py-3 font-bold">{t('admin.discountValue')}</th>
              <th className="px-5 py-3 font-bold">{t('admin.promotionRules')}</th>
              <th className="px-5 py-3 font-bold">{t('admin.validTo')}</th>
              <th className="px-5 py-3 text-right font-bold">{t('admin.deletePromotion')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center font-bold text-muted">
                  {t('common.loading')}
                </td>
              </tr>
            ) : promotions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center font-bold text-muted">
                  {t('admin.noPromotions')}
                </td>
              </tr>
            ) : (
              promotions.map((promotion) => (
                <tr key={promotion.id} className="hover:bg-surface-hover">
                  <td className="px-5 py-3">
                    <p className="font-bold text-ink">{promotion.name}</p>
                    <p className="text-[10px] text-muted">
                      {promotion.discountType === 'PERCENTAGE'
                        ? t('admin.discountPercentage')
                        : t('admin.discountFixed')}
                      {promotion.stackable ? ` · ${t('admin.stackable')}` : ''}
                    </p>
                  </td>
                  <td className="px-5 py-3 font-bold text-ink">
                    {promotion.discountType === 'PERCENTAGE'
                      ? `${promotion.discountValue}%`
                      : formatCurrency(promotion.discountValue)}
                  </td>
                  <td className="px-5 py-3 text-muted">
                    {promotion.rules.length === 0
                      ? t('admin.globalPromotion')
                      : promotion.rules
                          .map((rule) => `${t(TARGET_KEYS[rule.targetType])} #${rule.targetId}`)
                          .join(', ')}
                  </td>
                  <td className="px-5 py-3 text-muted">{new Date(promotion.validTo).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => void handleDelete(promotion)}
                      className="rounded-lg border border-sale/40 bg-sale/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-sale hover:bg-sale/20"
                    >
                      {t('admin.deletePromotion')}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
