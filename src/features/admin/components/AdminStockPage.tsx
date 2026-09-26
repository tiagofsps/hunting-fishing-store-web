import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getProductsPage } from '../../../lib/catalogApi';
import { createStockMovement, listStockMovements, type StockMovement } from '../api';
import { stockMovementSchema, type StockMovementFormData } from '../validation';
import { useLanguage } from '../../../i18n/useLanguage';

const inputClass =
  'w-full rounded-xl bg-surface px-4 py-3 text-xs border border-border outline-none focus:border-accent-strong text-ink font-medium';

const fieldClass = 'mb-1 block text-xs font-bold text-ink';

const MOVEMENT_LABELS: Record<StockMovementFormData['type'], string> = {
  PURCHASE: 'admin.movementPurchase',
  SALE: 'admin.movementSale',
  RETURN: 'admin.movementReturn',
  ADJUSTMENT: 'admin.movementAdjustment',
};

export default function AdminStockPage() {
  const { t } = useLanguage();
  const [items, setItems] = useState<{ id: number; sku: string; name: string; stock: number }[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const form = useForm<StockMovementFormData>({
    resolver: zodResolver(stockMovementSchema),
    defaultValues: { quantity: 1, type: 'PURCHASE', notes: '' },
  });

  // Flatten the first catalog page into selectable items.
  const itemOptions = useMemo(() => items, [items]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const data = await getProductsPage({ page: 0, size: 100 });
        if (cancelled) return;
        setItems(
          data.content.flatMap((product) =>
            (product.items ?? []).map((item) => ({
              id: item.id,
              sku: item.sku ?? '',
              name: product.name,
              stock: item.stockQuantity,
            }))
          )
        );
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : '');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (selectedItemId === null) return;
    let cancelled = false;

    const loadMovements = async () => {
      try {
        const data = await listStockMovements(selectedItemId);
        if (!cancelled) setMovements(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : '');
      }
    };

    loadMovements();
    return () => {
      cancelled = true;
    };
  }, [selectedItemId]);

  const handleSubmit = form.handleSubmit(async (data) => {
    if (selectedItemId === null) return;
    setError('');
    setNotice('');
    setIsSaving(true);
    try {
      await createStockMovement({
        productItemId: selectedItemId,
        quantity: data.quantity,
        type: data.type,
        ...(data.notes ? { notes: data.notes } : {}),
      });
      setNotice(t('admin.movementRecorded'));
      form.reset({ quantity: 1, type: 'PURCHASE', notes: '' });
      setMovements(await listStockMovements(selectedItemId));
    } catch (err) {
      setError(err instanceof Error ? err.message : '');
    } finally {
      setIsSaving(false);
    }
  });

  return (
    <div>
      <header className="border-b border-border pb-6">
        <span className="text-xs font-bold uppercase tracking-widest text-accent-strong">{t('admin.stock')}</span>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-ink">{t('admin.recordMovement')}</h2>
      </header>

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

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-surface-raised p-6">
          <div>
            <label className={fieldClass}>{t('admin.selectItem')}</label>
            <select
              value={selectedItemId ?? ''}
              onChange={(event) => {
                setSelectedItemId(event.target.value ? Number(event.target.value) : null);
                setNotice('');
                setMovements([]);
              }}
              className={inputClass}
            >
              <option value="">{t('admin.selectItem')}</option>
              {itemOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.sku} — {item.name} ({item.stock})
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={fieldClass}>{t('admin.quantity')}</label>
              <input
                type="number"
                {...form.register('quantity', { valueAsNumber: true })}
                className={inputClass}
              />
              {form.formState.errors.quantity && (
                <p className="mt-1 text-[11px] font-bold text-sale">{t('admin.quantityRequired')}</p>
              )}
            </div>
            <div>
              <label className={fieldClass}>{t('admin.movementType')}</label>
              <select {...form.register('type')} className={inputClass}>
                {Object.entries(MOVEMENT_LABELS).map(([value, key]) => (
                  <option key={value} value={value}>
                    {t(key)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={fieldClass}>{t('admin.notes')}</label>
            <input type="text" {...form.register('notes')} className={inputClass} />
          </div>

          <button
            type="submit"
            disabled={isSaving || selectedItemId === null || loading}
            className="rounded-xl bg-ink px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-ink/90 disabled:opacity-50"
          >
            {isSaving ? t('admin.saving') : t('admin.recordMovement')}
          </button>
        </form>

        <section className="rounded-2xl border border-border bg-surface-raised p-6">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted">{t('admin.stock')}</h3>
          {movements.length === 0 ? (
            <p className="mt-4 text-xs font-bold text-muted">{t('admin.noMovements')}</p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {movements.map((movement) => (
                <li key={movement.id} className="flex items-center justify-between gap-3 py-3 text-xs">
                  <div className="min-w-0">
                    <p className="font-bold text-ink">{t(MOVEMENT_LABELS[movement.type])}</p>
                    <p className="text-[10px] text-muted">{new Date(movement.createdAt).toLocaleString()}</p>
                    {movement.notes && <p className="text-[10px] text-muted">{movement.notes}</p>}
                  </div>
                  <p className="shrink-0 font-black text-ink">
                    {movement.quantity > 0 ? '+' : ''}
                    {movement.quantity}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
